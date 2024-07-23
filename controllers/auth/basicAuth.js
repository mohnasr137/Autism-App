// packages
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

// imports
const User = require("../../models/user");
const { sendVerifyEmail } = require("./verifyEmail");

// init
const url = process.env.API_URL;

// routers
const signUp = async (req, res) => {
  try {
    const { name, phone, email, password, confirmPassword } = req.body;
    const image = path.join(`${url}/images/portfoilo`, "simple.jpg");
    const nameMatch = /^[A-Za-z0-9]*$/;
    const emailMatch =
      /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    const passwordMatch =
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
    if (!name.match(nameMatch)) {
      return res.status(400).json({ message: "please enter a valid name" });
    }
    if (!email.match(emailMatch)) {
      return res.status(400).json({ message: "please enter a valid email" });
    }
    if (!password.match(passwordMatch)) {
      return res.status(400).json({ message: "please enter a valid password" });
    }
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "password and confirm password are not the same" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.verify === true) {
      return res
        .status(400)
        .json({ message: "the user with same email already exists!" });
    }
    if (existingUser && existingUser.verify === false) {
      await User.deleteOne({ email });
    }
    const hashedPassword = await bcryptjs.hash(password, 8);
    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    const user = new User({
      name,
      phone,
      email,
      password: hashedPassword,
      code,
      image,
    });
    await user.save();
    const token = jwt.sign({ id: user._id, code: code }, process.env.SECRET);
    const link =
      req.protocol + "://" + req.get("host") + `/api/v1/auth/${token}`;
    sendVerifyEmail(email, link);
    return res
      .status(200)
      .json({ message: "user created and Verify email send successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "the user with this email not found!" });
    }
    if (user.verify === false) {
      return res
        .status(400)
        .json({ message: "the user with this email not verifyed!" });
    }
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password." });
    }
    const token = jwt.sign({ id: user._id }, process.env.SECRET);
    const name = user.name;
    res.json({
      message: "login successfully",
      token,
      name,
      statusCode: 200,
      status: true,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { signUp, signIn };
