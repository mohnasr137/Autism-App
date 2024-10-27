// packages
import nodemailer from "nodemailer";
import bcryptjs from "bcryptjs";

// imports
import User from "../../models/user.js";

// routers
const sendPassEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const existingUser = await User.findOne({ email }, { verify: 1 });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }
    if (existingUser.verify == false) {
      return res.status(403).json({ error: "User email not verified" });
    }
    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    await User.updateOne({ email }, { $set: { code } });
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
      subject: "Reset Your Password",
      text: "Welcome",
      html: `
      <div style="text-align: center; min-width: 100vh; height: 100vh; padding: 40px; font-family: sans-serif;">
        <div style="width: 400px; padding: 5px 30px; border-radius: 10px; margin: 60px auto; border: 2px solid #e0e0e0; background-color: #F9F9F9;">
          <h2 style="padding: 20px 0px 5px 0px;">Reset Your Password</h2>
          <p style="font-size: 16px; color: #555555; line-height: 1.5;">We received a request to reset your password. Please use the code below to reset it:</p>
          <div style="margin: 20px 0;">
            <span style="font-weight: bold;letter-spacing: 4px; font-size: 25px; display: inline-block; padding: 10px 20px; background-color: #2B7FFD; color: #ffffff; text-decoration: none; border-radius: 5px;">${code}</span>
          </div>
          <p style="font-size: 16px; color: #555555; line-height: 1.5;">If you did not request a password reset, you can ignore this email.</p>
        </div>
      </div>
      `,
    });
    return res
      .status(200)
      .json({ message: "Reset password email sent successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const activeResetPass = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required." });
    }

    const existingUser = await User.findOne({ email }, { verify: 1, code: 1 });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }
    if (existingUser.verify == false) {
      return res.status(403).json({ error: "User email not verified" });
    }

    if (existingUser.code == code) {
      await User.updateOne({ email }, { $set: { resetPass: true } });
      return res
        .status(200)
        .json({ message: "Now, you can reset your password" });
    } else {
      return res.status(400).json({ error: "Invalid reset code" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
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
      return res.status(404).json({ error: "User not found" });
    }
    if (existingUser.verify == false) {
      return res.status(403).json({ error: "User email not verified" });
    }
    if (existingUser.resetPass == false) {
      return res.status(403).json({ error: "resetPassword not activated" });
    }
    if (!passwordMatch.test(password)) {
      return res.status(400).json({ error: "Please enter a valid password" });
    }
    if (confirmPassword != password) {
      return res.status(400).json({
        error: "Password and confirm password do not match",
      });
    }

    const hashedPassword = await bcryptjs.hash(password, 8);
    await User.updateOne(
      { email },
      { $set: { password: hashedPassword, resetPass: false } }
    );
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// exports
export { sendPassEmail, activeResetPass, resetPassword };
