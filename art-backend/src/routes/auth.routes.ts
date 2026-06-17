import express from "express";
import { upload } from "../lib/upload.js";
import {
  sendOtp,
  verifyOtpHandler,
  verifySignup,
  loginOtp,
  loginPassword,
  forgotPassword,
  resetPassword,
  toggleWishlist,
  getAdminContact,
  updateProfile,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/admin-contact", getAdminContact);

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtpHandler);
router.post(
  "/verify-signup",
  upload.fields([
    { name: "portfolio", maxCount: 3 },
    { name: "profilePhoto", maxCount: 1 },
    { name: "idProof", maxCount: 1 },
  ]),
  verifySignup,
);
router.post("/login-otp", loginOtp);
router.post("/login-password", loginPassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/toggle-wishlist", toggleWishlist);
router.post("/update-profile", updateProfile);

export default router;
