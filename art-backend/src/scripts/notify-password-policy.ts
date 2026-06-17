import { getDatabase, closeDatabase } from "../lib/mongo.js";
import dotenv from "dotenv";
import path from "path";
import nodemailer from "nodemailer";

// Load env vars
dotenv.config({ path: path.join(process.cwd(), ".env") });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendPolicyUpdateEmail = async (to: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Action Required: Security Policy Update - Reset Your Password",
    text: `Dear User,\n\nWe have updated our security policy. All passwords must now be exactly 6 characters long.\n\nPlease log out and use the "Forgot Password" feature to reset your password to a 6-character code.\n\nThank you,\nARTsFellow Team`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Security Policy Update</h2>
        <p>Dear User,</p>
        <p>To enhance the security and consistency of our platform, we have updated our password policy.</p>
        <div style="background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>New Requirement:</strong> Passwords must be <span style="text-decoration: underline;">exactly 6 characters</span> long.
        </div>
        <p>Please take a moment to update your password:</p>
        <ol>
            <li>Go to the Login screen.</li>
            <li>Click on <strong>"Forgot Password"</strong>.</li>
            <li>Follow the steps to set a new 6-character password.</li>
        </ol>
        <p>Thank you for being a part of ARTsFellow!</p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">This is an automated message, please do not reply.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to: ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
  }
};

const notifyAllUsers = async () => {
  try {
    console.log("Connecting to database...");
    const db = await getDatabase();

    console.log("Fetching all users...");
    const users = await db.collection("users").find({}).toArray();
    console.log(`Found ${users.length} users.`);

    console.log("Starting email notifications...");
    for (const user of users) {
      // Skip generic admin if you want, but good to notify everyone
      if (user.email) {
        await sendPolicyUpdateEmail(user.email);
        // Be gentle with the rate limit
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log("\n----------------------------------------");
    console.log("Notification Process Completed.");
    console.log("----------------------------------------\n");
  } catch (error) {
    console.error("Error in notification script:", error);
  } finally {
    await closeDatabase();
    process.exit(0);
  }
};

notifyAllUsers();
