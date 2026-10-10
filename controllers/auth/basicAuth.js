// packages
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// imports
import User from "../../models/user.js";
import { sendVerifyEmail } from "./verifyEmail.js";

// init
const url = process.env.API_URL || "/api/v1";

// routers
const signUp = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        status: false,
        error: "Name, email, password and confirm password are required.",
      });
    }

    if (confirmPassword !== password) {
      return res.status(400).json({
        status: false,
        error: "Password and confirm password do not match",
      });
    }

    const host = req.get("host");
    const protocol = req.protocol;
    const defaultImage = `${protocol}://${host}${url}/portfolio/simple.jpg`;

    const existingUser = await User.findOne({ email }, { verify: 1 });
    if (existingUser && existingUser.verify === true) {
      return res.status(409).json({
        status: false,
        error: "A user with this email already exists",
      });
    }

    const code = `${Math.floor(100000 + Math.random() * 900000)}`;

    if (existingUser && existingUser.verify === false) {
      await User.updateOne({ email }, { $set: { code } });
      const token = jwt.sign(
        { id: existingUser._id, code },
        process.env.SECRET,
        { expiresIn: "24h" }
      );
      const link = `${protocol}://${host}${url}/auth/token/${token}`;
      await sendVerifyEmail(email, link);
      return res.status(202).json({
        status: true,
        message: "Account exists but is not verified. Verification email resent successfully",
      });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      code,
      image: defaultImage,
    });
    await user.save();

    const token = jwt.sign({ id: user._id, code }, process.env.SECRET, {
      expiresIn: "24h",
    });
    const link = `${protocol}://${host}${url}/auth/token/${token}`;
    await sendVerifyEmail(email, link);

    return res.status(201).json({
      status: true,
      message: "User created and verification email sent successfully",
    });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: false,
        error: "Email and password are required.",
      });
    }

    const existingUser = await User.findOne(
      { email },
      { name: 1, email: 1, password: 1, verify: 1, image: 1, type: 1, gender: 1, dateOfBirth: 1 }
    );
    if (!existingUser) {
      return res.status(401).json({ status: false, error: "Email or password is incorrect" });
    }

    const isMatch = await bcryptjs.compare(password, existingUser.password);
    if (!isMatch) {
      return res.status(401).json({ status: false, error: "Email or password is incorrect" });
    }

    if (existingUser.verify === false) {
      return res.status(403).json({ status: false, error: "User email not verified" });
    }

    const token = jwt.sign({ id: existingUser._id }, process.env.SECRET, {
      expiresIn: "30d",
    });

    return res.status(200).json({
      status: true,
      message: "login successfully",
      token,
      user: {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        image: existingUser.image,
        type: existingUser.type,
        gender: existingUser.gender,
        dateOfBirth: existingUser.dateOfBirth,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

// exports
export { signUp, signIn };
