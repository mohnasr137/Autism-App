// packages
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

// imports
const User = require("../../models/user");

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
    let info = await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject: `Account Verification`,
      text: "Welcome",
      html: `
      <dev>
      <h3>Click to Verification: <a href=${link}>Verify</a></h3>
      <h4>if it was not you please ignore this message</h4>
      </dev>
      `,
    });
  } catch (error) {
    console.log(error);
  }
};

const activeEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ message: "no token" });
    }
    console.log(token);
    const isVerify = jwt.verify(token, process.env.SECRET);
    if (!isVerify) {
      return res.status(400).json({ message: "not verify" });
    }
    const existingUser = await User.findById(isVerify.id);
    if (!existingUser) {
      return res
        .status(400)
        .json({ message: "the user with this email not found!" });
    }
    const code = isVerify.code;
    const id = isVerify.id;
    console.log(id);
    if (existingUser.verify === false) {
      if (existingUser.code === code) {
        await User.updateOne({ _id: id }, { $set: { verify: true } });
        return res.status(200).json({ message: "email verifyed" });
      } else {
        return res.status(400).json({ message: "wrong code" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "this email is already verifyed!" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendVerifyEmail,
  activeEmail,
};
