// packages
import nodemailer from "nodemailer";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

// imports
import User from "../../models/user.js";

// routers
const sendPassEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ status: false, error: "Email is required." });
    }

    const existingUser = await User.findOne({ email }, { verify: 1 });
    if (!existingUser) {
      return res.status(404).json({ status: false, error: "User not found" });
    }
    if (existingUser.verify === false) {
      return res.status(403).json({ status: false, error: "User email not verified" });
    }

    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    await User.updateOne({ email }, { $set: { code } });

    if (!process.env.USER || !process.env.PASSWORD) {
      console.warn("Email credentials (USER/PASSWORD) not set; code generated but email not sent.");
      return res.status(200).json({
        status: true,
        message: "Reset code generated (check server logs in dev mode)",
        devCode: process.env.NODE_ENV === "development" ? code : undefined,
      });
    }

    let transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.USER,
        pass: process.env.PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Autismo Team" <${process.env.USER}>`,
      to: email,
      subject: "Reset Your Password - Autismo",
      text: `Your Autismo password reset code is: ${code}`,
      html: `
      <div style="text-align: center; min-width: 100%; padding: 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F4F7FB;">
        <div style="max-width: 480px; padding: 30px; border-radius: 12px; margin: 20px auto; border: 1px solid #E2E8F0; background-color: #FFFFFF; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #1E293B; margin-bottom: 12px;">Reset Your Password</h2>
          <p style="font-size: 15px; color: #475569; line-height: 1.6;">We received a request to reset your Autismo password. Use the verification code below:</p>
          <div style="margin: 25px 0;">
            <span style="font-weight: 700; letter-spacing: 6px; font-size: 28px; display: inline-block; padding: 12px 24px; background-color: #2563EB; color: #FFFFFF; border-radius: 8px;">${code}</span>
          </div>
          <p style="font-size: 13px; color: #94A3B8; line-height: 1.5;">This code will expire shortly. If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      </div>
      `,
    });

    return res.status(200).json({
      status: true,
      message: "Reset password email sent successfully",
    });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const activeResetPass = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ status: false, error: "Email and code are required." });
    }

    const existingUser = await User.findOne({ email }, { verify: 1, code: 1 });
    if (!existingUser) {
      return res.status(404).json({ status: false, error: "User not found" });
    }
    if (existingUser.verify === false) {
      return res.status(403).json({ status: false, error: "User email not verified" });
    }

    if (existingUser.code && existingUser.code === String(code).trim()) {
      await User.updateOne({ email }, { $set: { resetPass: true } });
      return res.status(200).json({
        status: true,
        message: "Code verified. You can now reset your password",
      });
    } else {
      return res.status(400).json({ status: false, error: "Invalid reset code" });
    }
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        status: false,
        error: "Email, password and confirm password are required.",
      });
    }

    const passwordMatch =
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

    const existingUser = await User.findOne(
      { email },
      { resetPass: 1, verify: 1 }
    );
    if (!existingUser) {
      return res.status(404).json({ status: false, error: "User not found" });
    }
    if (existingUser.verify === false) {
      return res.status(403).json({ status: false, error: "User email not verified" });
    }
    if (existingUser.resetPass !== true) {
      return res.status(403).json({ status: false, error: "Password reset permission not granted. Please verify reset code first." });
    }
    if (!passwordMatch.test(password)) {
      return res.status(400).json({
        status: false,
        error: "Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, one number, and one special character.",
      });
    }
    if (confirmPassword !== password) {
      return res.status(400).json({
        status: false,
        error: "Password and confirm password do not match",
      });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    await User.updateOne(
      { email },
      { $set: { password: hashedPassword, resetPass: false, code: null } }
    );

    return res.status(200).json({
      status: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

// exports
export { sendPassEmail, activeResetPass, resetPassword };
