import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

// Load env vars
dotenv.config({ path: path.join(process.cwd(), ".env") });

const testEmail = async () => {
  console.log("--- STARTING EMAIL TEST ---");
  console.log(`User: ${process.env.EMAIL_USER}`);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    debug: true, // Enable verbose debug output
    logger: true, // Log to console
  });

  try {
    const verify = await transporter.verify();
    console.log("✅ SMTP Connection Verified:", verify);

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "bushrasketch6345@gmail.com", // Using the email found in logs
      subject: "Test Email - Priority High",
      text: "This is a test email to verify delivery. If you see this, the system is working.",
      html: "<h1>Test Email</h1><p>This is a test to verify notification delivery.</p>",
    });

    console.log("✅ Message sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
  } catch (error) {
    console.error("❌ FATAL ERROR:", error);
  }
};

testEmail();
