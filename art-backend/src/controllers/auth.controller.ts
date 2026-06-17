import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { generateOtp, saveOtp, verifyOtp } from "../lib/otp.js";
import { getDatabase } from "../lib/mongo.js";
import {
  sendOtpEmail,
  sendOtpSms,
  sendArtistWelcomeEmail,
} from "../lib/email.js";
import { generateToken, verifyToken } from "../lib/jwt.js";
import { User } from "../models/User.js";

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { isLogin, isArtistRegistration } = req.body;
    const email = req.body.email?.trim().toLowerCase();
    const phone = req.body.phone?.trim();

    if (!email && !phone) {
      res
        .status(400)
        .json({ status: "error", message: "Email or phone is required" });
      return;
    }

    const identifier = email || phone;
    const isEmail = !!email;

    const existingUser = email ? await User.findByEmail(email) : null;

    // Check if user exists for Signup flow
    if (isLogin === false) {
      if (existingUser) {
        if (isArtistRegistration) {
          if (existingUser.role === "artist") {
            if (existingUser.artistStatus === "rejected") {
              const rejectionDate = existingUser.rejectionDate || new Date(0);
              const now = new Date();
              const diffInHours =
                Math.abs(now.getTime() - new Date(rejectionDate).getTime()) /
                36e5;
              if (diffInHours < 48) {
                const remainingHours = Math.ceil(48 - diffInHours);
                res
                  .status(400)
                  .json({
                    status: "error",
                    message: `Your application was rejected. You can re-apply in ${remainingHours} hours.`,
                  });
                return;
              }
            } else {
              res
                .status(400)
                .json({
                  status: "error",
                  message:
                    "An artist account with this email already exists. Please login.",
                });
              return;
            }
          }
        } else {
          res
            .status(400)
            .json({
              status: "error",
              message: "Email already exists. Please login.",
            });
          return;
        }
      }
    } else {
      // Login Flow: User must exist
      if (!existingUser && isEmail) {
        res
          .status(404)
          .json({
            status: "error",
            message: "User not found. Please sign up.",
          });
        return;
      }
    }

    const otp = generateOtp();
    await saveOtp(identifier, otp, isEmail);

    if (email) {
      try {
        await sendOtpEmail(email, otp);
      } catch (e: any) {
        console.error("Email delivery failed:", e.message);
        res
          .status(500)
          .json({
            status: "error",
            message: `Email delivery failed: ${e.message}. Please check if the sender email has App Password enabled.`,
          });
        return;
      }
    }

    if (phone) {
      try {
        await sendOtpSms(phone, otp);
      } catch (e) {
        console.error("SMS delivery failed");
        // If SMS fails but email was sent (or not applicable), we still proceed.
        // If email was the only option and failed, we would have returned already.
      }
    }

    let message = "OTP sent successfully";
    if (email) {
      message += " to your email";
    }
    if (phone) {
      message += (email ? " and" : "") + " to your phone";
    }

    res.json({
      status: "ok",
      message: message,
    });
  } catch (error: any) {
    console.error("Error in sendOtp controller:", error);
    res
      .status(500)
      .json({
        status: "error",
        message: error.message || "Failed to process OTP",
      });
  }
};

export const verifyOtpHandler = async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;
    const email = req.body.email?.trim().toLowerCase();
    const phone = req.body.phone?.trim();
    const identifier = email || phone;
    const isEmail = !!email;

    if (!identifier || !otp) {
      res
        .status(400)
        .json({ status: "error", message: "Email/Phone and OTP are required" });
      return;
    }

    const isValid = await verifyOtp(identifier, otp, isEmail);
    if (isValid) {
      res.json({ status: "ok", message: "OTP verified successfully" });
    } else {
      res
        .status(400)
        .json({ status: "error", message: "Invalid or expired OTP" });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ status: "error", message: "Failed to verify OTP" });
  }
};

export const verifySignup = async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;
    const email = req.body.email?.trim().toLowerCase();
    const phone = req.body.phone?.trim();

    // Check if files were uploaded
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const portfolioUrls = files?.portfolio
      ? files.portfolio.map((f) => `/uploads/portfolio/${f.filename}`)
      : [];
    const profilePhotoUrl = files?.profilePhoto?.[0]
      ? `/uploads/portfolio/${files.profilePhoto[0].filename}`
      : undefined;
    const idProofUrl = files?.idProof?.[0]
      ? `/uploads/portfolio/${files.idProof[0].filename}`
      : undefined;

    const identifier = email || phone;
    const isEmail = !!email;

    let isAuthorized = false;
    const isOtpPresent =
      otp !== undefined &&
      otp !== null &&
      String(otp).trim() !== "" &&
      String(otp) !== "undefined";

    if (isOtpPresent) {
      if (!identifier) {
        res
          .status(400)
          .json({ status: "error", message: "Email/Phone is required" });
        return;
      }
      const isValid = await verifyOtp(identifier, otp, isEmail);
      if (!isValid) {
        res
          .status(400)
          .json({ status: "error", message: "Invalid or expired OTP" });
        return;
      }
      isAuthorized = true;
    } else {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const tokenStr = authHeader.split(" ")[1];
          verifyToken(tokenStr);
          isAuthorized = true;
        } catch (e) {}
      }
    }

    if (!isAuthorized) {
      res
        .status(400)
        .json({ status: "error", message: "Email/Phone and OTP are required" });
      return;
    }

    // OTP Verified, now get/create user
    let user = await User.findByEmail(email || "");

    // Determine requested role (default to customer)
    const roleInput = req.body.role || "customer";
    const requestedRole =
      roleInput.toLowerCase() === "artist" ? "artist" : "customer";

    // Hash password if provided
    let hashedPassword = undefined;
    if (req.body.password) {
      if (req.body.password.length < 6) {
        res
          .status(400)
          .json({
            status: "error",
            message: "Password must be at least 6 characters long",
          });
        return;
      }
      hashedPassword = await bcrypt.hash(req.body.password, 10);
    }

    if (user) {
      // User exists - check for role upgrade
      const updates: any = {};

      // Upgrade to artist if requested and currently a customer
      if (requestedRole === "artist") {
        if (user.role === "customer") {
          updates.role = "artist";
          user.role = "artist"; // Update local object
          updates.isArtistVerified = false;
          updates.artistStatus = "pending";
        } else if (user.role === "artist") {
          // If already artist, check if we need to reset status (e.g. if rejected or incomplete)
          if (
            user.artistStatus === "rejected" ||
            (!user.artistStatus && !user.isArtistVerified)
          ) {
            updates.artistStatus = "pending";
            updates.isArtistVerified = false;
            updates.rejectionDate = null; // Clear rejection date
          }
        }
      }

      // Update portfolio if new files are uploaded
      if (portfolioUrls.length > 0) {
        updates.portfolio = portfolioUrls;
        user.portfolio = portfolioUrls;
      }

      // Update other profile fields if provided
      if (req.body.fullName) updates.name = req.body.fullName;
      if (req.body.phone) updates.phone = req.body.phone;

      // Only update artist fields if user is or becoming an artist
      if (user.role === "artist" || updates.role === "artist") {
        if (req.body.brandName) updates.brandName = req.body.brandName;
        if (req.body.bio) updates.bio = req.body.bio;
        if (req.body.category) updates.artStyles = [req.body.category]; // Mapping single cat to array
        if (req.body.experience) updates.experience = req.body.experience;
        if (idProofUrl) updates.idProof = idProofUrl;
      }

      if (profilePhotoUrl) updates.avatar = profilePhotoUrl;

      // Update password if provided
      if (hashedPassword) {
        updates.password = hashedPassword;
      }

      if (Object.keys(updates).length > 0) {
        await User.update(user._id, updates);
      }
    } else {
      // Create new user if not exists
      const baseUser: any = {
        email,
        name: req.body.fullName || email.split("@")[0],
        role: requestedRole,
        password: hashedPassword,
        phone: req.body.phone,
        createdAt: new Date(),
        wishlist: [],
        addresses: [],
      };

      // Add artist specific fields only if role is artist
      if (requestedRole === "artist") {
        baseUser.brandName = req.body.brandName;
        baseUser.bio = req.body.bio;
        baseUser.artStyles = req.body.category ? [req.body.category] : [];
        baseUser.experience = req.body.experience;
        baseUser.portfolio = portfolioUrls;
        baseUser.isArtistVerified = false;
        baseUser.artistStatus = "pending"; // Explicit status
        if (idProofUrl) baseUser.idProof = idProofUrl;
      }
      if (profilePhotoUrl) baseUser.avatar = profilePhotoUrl;

      const newUser = await User.create(baseUser);
      user = newUser;

      if (requestedRole === "artist") {
        // Send Welcome/Pending Email
        await sendArtistWelcomeEmail(email, user?.name || "Artist");
      }
    }

    // If it's a new artist registration, we now allow login so they can chat with admin
    /* 
        if (requestedRole === 'artist') {
            res.json({
                status: 'pending_approval',
                message: 'Artist account verified. Please wait for admin approval.',
                user
            })
            return
        }
        */

    const token = generateToken(user!._id.toString(), user!.role);

    res.json({
      status: "ok",
      message: "OTP verified successfully",
      user,
      token,
    });
  } catch (error) {
    console.error("Error verifying signup OTP:", error);
    res.status(500).json({ status: "error", message: "Failed to verify OTP" });
  }
};

export const loginOtp = async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    if (!email || !otp) {
      res
        .status(400)
        .json({ status: "error", message: "Email and OTP are required" });
      return;
    }

    const isValid = await verifyOtp(email, otp);
    if (!isValid) {
      res
        .status(400)
        .json({ status: "error", message: "Invalid or expired OTP" });
      return;
    }

    const user = await User.findByEmail(email);

    if (!user) {
      res
        .status(404)
        .json({ status: "error", message: "User not found. Please sign up." });
      return;
    }

    // Check Artist Approval Status
    if (user.role === "artist") {
      if (
        user.artistStatus === "pending" ||
        (user.isArtistVerified === false && !user.artistStatus)
      ) {
        // Allow login for pending status so they can chat with admin
        // res.status(403).json({ status: 'error', message: 'Your artist account is pending approval. Please wait for admin confirmation.' })
        // return
      }
      if (user.artistStatus === "rejected") {
        // res.status(403).json({ status: 'error', message: 'Your artist application was not approved.' })
        // return
      }
    }

    const token = generateToken(user._id.toString(), user.role);

    res.json({
      status: "ok",
      message: "Login successful",
      user,
      token,
    });
  } catch (error) {
    console.error("Error logging in with OTP:", error);
    res.status(500).json({ status: "error", message: "Failed to login" });
  }
};

export const loginPassword = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    if (!email || !password) {
      res
        .status(400)
        .json({ status: "error", message: "Email and password are required" });
      return;
    }

    const user = await User.findByEmail(email);

    if (!user) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }

    if (!user.password) {
      res
        .status(400)
        .json({
          status: "error",
          message: "Account created with OTP. Please use OTP login.",
        });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ status: "error", message: "Invalid password" });
      return;
    }

    // Check Artist Approval Status
    if (user.role === "artist") {
      if (
        user.artistStatus === "pending" ||
        (user.isArtistVerified === false && !user.artistStatus)
      ) {
        // Allow login for pending status so they can chat with admin
        // res.status(403).json({ status: 'error', message: 'Your artist account is pending approval. Please wait for admin confirmation.' })
        // return
      }
      if (user.artistStatus === "rejected") {
        // res.status(403).json({ status: 'error', message: 'Your artist application was not approved.' })
        // return
      }
    }

    const token = generateToken(user._id.toString(), user.role);

    res.json({
      status: "ok",
      message: "Login successful",
      user: { ...user, password: undefined },
      token,
    });
  } catch (error) {
    console.error("Error logging in with password:", error);
    res.status(500).json({ status: "error", message: "Failed to login" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) {
      res.status(400).json({ status: "error", message: "Email is required" });
      return;
    }

    const user = await User.findByEmail(email);
    if (!user) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }

    const otp = generateOtp();
    await saveOtp(email, otp);
    await sendOtpEmail(email, otp);

    res.json({ status: "ok", message: "OTP sent to email for password reset" });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    res.status(500).json({ status: "error", message: "Failed to send OTP" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { otp, newPassword } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    if (!email || !otp || !newPassword) {
      res
        .status(400)
        .json({
          status: "error",
          message: "Email, OTP and new password are required",
        });
      return;
    }

    if (newPassword.length < 6) {
      res
        .status(400)
        .json({
          status: "error",
          message: "Password must be at least 6 characters long",
        });
      return;
    }

    const isValid = await verifyOtp(email, otp);
    if (!isValid) {
      res
        .status(400)
        .json({ status: "error", message: "Invalid or expired OTP" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.updateByEmail(email, { password: hashedPassword });

    res.json({
      status: "ok",
      message:
        "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to reset password" });
  }
};

export const toggleWishlist = async (req: Request, res: Response) => {
  try {
    const { artId } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    if (!email || !artId) {
      res
        .status(400)
        .json({ status: "error", message: "Email and Artwork ID required" });
      return;
    }

    const user = await User.findByEmail(email);
    if (!user) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }

    const currentWishlist = user.wishlist || [];
    let newWishlist;

    if (currentWishlist.includes(artId)) {
      await User.removeFromWishlist(email, artId);
      newWishlist = currentWishlist.filter((id: string) => id !== artId);
    } else {
      await User.addToWishlist(email, artId);
      newWishlist = [...currentWishlist, artId];
    }

    res.json({ status: "ok", wishlist: newWishlist });
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to toggle wishlist" });
  }
};

export const getAdminContact = async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const admin = await db
      .collection("users")
      .findOne({ role: "admin" }, { projection: { password: 0 } });
    if (!admin) {
      res.status(404).json({ status: "error", message: "No admin found" });
      return;
    }
    res.json({ status: "ok", admin });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: (error as Error).message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { email, name, brandName, phone, bio, avatar } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      res.status(400).json({ status: "error", message: "Email is required" });
      return;
    }

    const user = await User.findByEmail(normalizedEmail);
    if (!user) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (brandName) updates.brandName = brandName;
    if (phone) updates.phone = phone;
    if (bio) updates.bio = bio;
    if (avatar) updates.avatar = avatar;

    if (Object.keys(updates).length > 0) {
      await User.updateByEmail(normalizedEmail, updates);
      const updatedUser = await User.findByEmail(normalizedEmail);
      res.json({
        status: "ok",
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } else {
      res.json({ status: "ok", message: "No changes made", user });
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to update profile" });
  }
};
