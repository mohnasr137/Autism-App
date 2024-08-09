// // packages
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";

// imports
import User from "../../models/user.js";
import { sendVerifyEmail } from "./verifyEmail.js";

// routers
const signUp = async (req, res) => {
  try {
    const url = process.env.API_URL;
    const { name, email, password, confirmPassword } = req.body;
    const image = path.join(`${url}/images/portfoilo`, "simple.jpg");
    if (confirmPassword !== password) {
      return res
        .status(400)
        .json({ error: "Password and confirm password do not match" });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.verify === true) {
      return res
        .status(400)
        .json({ error: "A user with this email already exists" });
    }
    if (existingUser && existingUser.verify === false) {
      const code = `${Math.floor(100000 + Math.random() * 900000)}`;
      await User.updateOne({ email }, { $set: { code } });
      const token = jwt.sign(
        { id: existingUser._id, code: code },
        process.env.SECRET,
        {
          expiresIn: "24h",
        }
      );
      const link =
        req.protocol + "://" + req.get("host") + `/api/v1/auth/token/${token}`;
      sendVerifyEmail(email, link);
      return res.status(200).send({
        message:
          "Account exists but is not verified. Verification email resent.",
      });
    }

    const hashedPassword = await bcryptjs.hash(password, 8);
    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    const user = new User({
      name,
      email,
      password: hashedPassword,
      code,
      image,
    });
    await user.save();

    const token = jwt.sign({ id: user._id, code: code }, process.env.SECRET, {
      expiresIn: "24h",
    });
    const link =
      req.protocol + "://" + req.get("host") + `/api/v1/auth/token/${token}`;
    sendVerifyEmail(email, link);

    return res.status(200).json({
      message: "User created and verification email sent successfully",
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ error: "Email or password is incorrect" });
    }
    const isMatch = await bcryptjs.compare(password, existingUser.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Email or password is incorrect" });
    }
    if (existingUser.verify === false) {
      return res.status(400).json({ error: "User email not verified" });
    }

    const token = jwt.sign({ id: existingUser._id }, process.env.SECRET, {
      expiresIn: "24h",
    });
    const userData = {
      name: existingUser.name,
      email: existingUser.email,
      image: existingUser.image,
      type: existingUser.type,
    };

    return res.status(200).json({
      message: "login successfully",
      userData,
      token,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export { signUp, signIn };
