import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Adding some reliable defaults
  tls: {
    rejectUnauthorized: false,
  },
});

// Log connection status promptly
transporter
  .verify()
  .then(() => {
    console.log("✅ SMTP Server Connection: SUCCESS");
  })
  .catch((err) => {
    console.error("❌ SMTP Server Connection: FAILED", err.message);
    if (err.message.includes("535-5.7.8")) {
      console.error(
        "HINT: Your Gmail App Password seems incorrect or expired.",
      );
    }
  });

export async function sendOtpEmail(to: string, otp: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      "Email credentials (EMAIL_USER or EMAIL_PASS) are not set in .env",
    );
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Your Verification Code - ArtsFellow",
    text: `Your verification code is: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #00e091;">Verification Code</h2>
        <p>Please use the following code to verify your account on <strong>ArtsFellow</strong>:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 12px; margin: 20px 0;">
            <h1 style="color: #00e091; letter-spacing: 10px; font-size: 40px; margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p style="font-size: 12px; color: #999;">If you did not request this code, please ignore this email.</p>
      </div>
    `,
  };

  try {
    console.log("--- ATTEMPTING TO SEND EMAIL ---");
    console.log(`| Target: ${to}`);
    console.log(`| OTP: ${otp}`);
    console.log("--------------------------------");
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.messageId);
    return info;
  } catch (error: any) {
    console.error("❌ FAILED TO SEND EMAIL:", error.message);
    if (error.code === "EAUTH") {
      console.error(
        "CRITICAL: Authentication failed. Please check EMAIL_USER and EMAIL_PASS (App Password).",
      );
    }
    throw error;
  }
}

export async function sendOtpSms(phone: string, otp: string) {
  console.log("--- SIMULATING SMS SEND ---");
  console.log(`| Phone: ${phone}`);
  console.log(`| Message: Your ArtsFellow verification code is: ${otp}`);
  console.log("---------------------------");
  // In production, you would use Twilio, Vonage, or another SMS gateway here.
  return { status: "simulated" };
}

export async function sendArtistWelcomeEmail(to: string, name: string) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Artist Application Received - Pending Approval",
    html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Welcome to ARTsFellow, ${name}!</h2>
            <p>Thank you for joining our community of artists.</p>
            <p>Your account is currently <strong>Pending Approval</strong>.</p>
            <p>Our team will review your profile and portfolio shortly. Please wait for the approval confirmation.</p>
            <p>You will receive an email once your account status is updated.</p>
            <br/>
            <p>Best Regards,<br/>ARTsFellow Team</p>
        </div>
        `,
  };
  await transporter.sendMail(mailOptions);
}

export async function sendArtistApprovedEmail(to: string, name: string) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "congratulations! Your Artist Account is Approved",
    html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4CAF50;">Congratulations, ${name}!</h2>
            <p>We are thrilled to inform you that your artist account has been <strong>APPROVED</strong>.</p>
            <p>You can now log in to your dashboard, manage your portfolio, and start selling your artwork.</p>
            <p><a href="http://localhost:5173/login" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Login to Dashboard</a></p>
            <br/>
            <p>Welcome aboard,<br/>ARTsFellow Team</p>
        </div>
        `,
  };
  await transporter.sendMail(mailOptions);
}

export async function sendArtistRejectedEmail(to: string, name: string) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Update on Your Artist Application",
    html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Hello ${name},</h2>
            <p>Thank you for your interest in joining ARTsFellow.</p>
            <p>After carefully reviewing your application/portfolio, we regret to inform you that your portfolio does not meet our current eligibility standards.</p>
            <p>Because of this, your current application has been removed from our system.</p>
            <p>We encourage you to refine your portfolio and you are welcome to <strong>register again after one week</strong>.</p>
            <br/>
            <p>Best Wishes,<br/>ARTsFellow Team</p>
        </div>
        `,
  };
  await transporter.sendMail(mailOptions);
}
