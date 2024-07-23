// packages
const nodemailer = require("nodemailer");
const bcryptjs = require("bcryptjs");

// imports
const User = require("../../models/user");

// routers
const sendPassEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const byGmail = true;
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(400)
        .json({ message: "the user with this email not found!" });
    }
    if (existingUser.verify === false) {
      return res
        .status(400)
        .json({ message: "the user with this email not verifyed!" });
    }
    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    await User.updateOne({ email }, { $set: { code } });
    if (byGmail) {
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
        subject: `Account resetPassword`,
        text: "Welcome",
        html: `
      <dev>
      <h3>resetPassword Code: </h3>
      <h1 style="color:blue;">${code}</h1>
      </dev>
      `,
      });
      return res
        .status(200)
        .json({ message: "reset password email send successfully" });
    } else {
      phoneCode(existingUser.phone, code);
      return res.status(200).json({ message: "phone code send successfully" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const activeResetPass = async (req, res) => {
  try {
    const { email, code } = req.body;
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(400)
        .json({ message: "the user with this email not found!" });
    }
    if (existingUser.verify === false) {
      return res
        .status(400)
        .json({ message: "the user with this email not verifyed!" });
    }
    if (existingUser.code === code) {
      await User.updateOne({ email }, { $set: { resetPass: true } });
      return res.status(200).json({ message: "you can reset password" });
    } else {
      return res.status(400).json({ message: "wrong code" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    const passwordMatch =
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(400)
        .json({ message: "the user with this email not found!" });
    }
    if (existingUser.verify === false) {
      return res
        .status(400)
        .json({ message: "the user with this email not verifyed!" });
    }
    if (existingUser.resetPass === false) {
      return res
        .status(400)
        .json({ message: "this email not activated to reset password!" });
    }
    if (!password.match(passwordMatch)) {
      return res.status(400).json({ message: "please enter a valid password" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "password and confirm password are not the same",
      });
    }
    const hashedPassword = await bcryptjs.hash(password, 8);
    await User.updateOne(
      { email },
      { $set: { password: hashedPassword, resetPass: false } }
    );
    return res.status(200).json({ message: "password reset successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendPassEmail,
  activeResetPass,
  resetPassword,
};

// const sendPassEmail = async (email, code) => {
//   try {
//     let transporter = nodemailer.createTransport({
//       service: "Gmail",
//       auth: {
//         user: process.env.USER,
//         pass: process.env.PASSWORD,
//       },
//     });
//     let info = await transporter.sendMail({
//       from: process.env.USER,
//       to: email,
//       subject: `Account resetPassword`,
//       text: "Welcome",
//       html: `
//       <dev>
//       <h3>resetPassword Code: </h3>
//       <h1 style="color:blue;">${code}</h1>
//       </dev>
//       `,
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };

// const resetPassCode = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const existingUser = await User.findOne({ email });
//     if (!existingUser) {
//       return res
//         .status(400)
//         .json({ message: "the user with this email not found!" });
//     }
//     if (existingUser.verify === false) {
//       return res
//         .status(400)
//         .json({ message: "the user with this email not verifyed!" });
//     }
//     const code = `${Math.floor(100000 + Math.random() * 900000)}`;
//     await User.updateOne({ email }, { $set: { code } });
//     verifyEmail(email, code);
//     return res
//       .status(200)
//       .json({ message: "password code reset successfully" });
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// };
