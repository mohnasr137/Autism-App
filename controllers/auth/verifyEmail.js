// // packages
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// imports
import User from "../../models/user.js";

//routers
const sendVerifyEmail = async (email, link) => {
  try {
    let transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.USER,
        pass: process.env.PASSWORD,
      },
    });
    await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject: "Verify Your Email Address",
      text: "Welcome",
      html: `
      <div style="text-align: center; min-width: 100vh; height: 100vh;padding: 40px; font-family: sans-serif;">
        <div style="width: 400px; padding: 5px 30px; border-radius: 10px; margin: 60px auto; border: 2px solid #e0e0e0; background-color: #F9F9F9;">
          <h2 style="padding: 20px 0px 5px 0px;">Verify Your Email Address</h2>
          <p style="font-size: 16px; color: #555555; line-height: 1.5;">Thank you for signing up. Please verify your email address by clicking the button below:</p>
          <div style="margin: 20px 0;">
            <a href=${link} style="font-weight: bold;display: inline-block; padding: 10px 20px; background-color: #2B7FFD; color: #ffffff; text-decoration: none; border-radius: 5px;">Verify Email</a>
          </div>
          <p style="font-size: 16px; color: #555555; line-height: 1.5;">If you did not sign up for this account, you can ignore this email.</p>
        </div>
      </div>
      `,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const activeEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    const isVerify = jwt.verify(token, process.env.SECRET);
    if (!isVerify) {
      return res.status(401).json({ error: "Token verification failed" });
    }
    const existingUser = await User.findById(isVerify.id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const code = isVerify.code;
    const id = isVerify.id;
    if (existingUser.verify == false) {
      if (existingUser.code == code) {
        await User.updateOne({ _id: id }, { $set: { verify: true } });
        return res.status(200).json({ message: "Email verified successfully" });
      } else {
        return res.status(400).json({ error: "Wrong verification code" });
      }
    } else {
      return res.status(409).json({ error: "This email is already verified" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export { sendVerifyEmail, activeEmail };
