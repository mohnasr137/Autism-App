// packages
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// imports
import User from "../../models/user.js";

// send verification email helper
const sendVerifyEmail = async (email, link) => {
  try {
    if (!process.env.USER || !process.env.PASSWORD) {
      console.warn("Email credentials (USER/PASSWORD) not set; skipping email send.");
      return false;
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
      subject: "Verify Your Email Address - Autismo",
      text: `Welcome to Autismo. Please verify your email: ${link}`,
      html: `
      <div style="text-align: center; min-width: 100%; padding: 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F4F7FB;">
        <div style="max-width: 480px; padding: 30px; border-radius: 12px; margin: 20px auto; border: 1px solid #E2E8F0; background-color: #FFFFFF; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #1E293B; margin-bottom: 12px;">Welcome to Autismo</h2>
          <p style="font-size: 15px; color: #475569; line-height: 1.6;">Thank you for joining Autismo. Please verify your email address to activate your account:</p>
          <div style="margin: 30px 0;">
            <a href="${link}" style="font-weight: 600; display: inline-block; padding: 12px 28px; background-color: #2563EB; color: #FFFFFF; text-decoration: none; border-radius: 8px;">Verify Email</a>
          </div>
          <p style="font-size: 13px; color: #94A3B8; line-height: 1.5;">If you did not sign up for Autismo, you can safely ignore this email.</p>
        </div>
      </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("sendVerifyEmail error:", error.message);
    return false;
  }
};

const activeEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ status: false, error: "No token provided" });
    }

    let isVerify;
    try {
      isVerify = jwt.verify(token, process.env.SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        status: false,
        error: jwtErr.name === "TokenExpiredError" ? "Verification link expired" : "Invalid verification token",
      });
    }

    if (!isVerify || !isVerify.id) {
      return res.status(401).json({ status: false, error: "Token verification failed" });
    }

    const existingUser = await User.findById(isVerify.id);
    if (!existingUser) {
      return res.status(404).json({ status: false, error: "User not found" });
    }

    const { code, id } = isVerify;
    if (existingUser.verify === false) {
      if (existingUser.code === code) {
        await User.updateOne(
          { _id: id },
          { $set: { verify: true, code: null } }
        );
        return res.status(200).json({ status: true, message: "Email verified successfully" });
      } else {
        return res.status(400).json({ status: false, error: "Wrong or expired verification code" });
      }
    } else {
      return res.status(409).json({ status: false, error: "This email is already verified" });
    }
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

export { sendVerifyEmail, activeEmail };
