const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
    require: true,
    type: String,
    trim: true,
  },
  phone: {
    require: true,
    type: String,
    trim: true,
  },
  email: {
    require: true,
    type: String,
    trim: true,
  },
  password: {
    require: true,
    type: String,
  },
  type: {
    type: String,
    default: "user",
  },
  verify: {
    type: Boolean,
    default: false,
  },
  resetPass: {
    type: Boolean,
    default: false,
  },
  image: {
    require: true,
    type: String,
    trim: true,
  },
  code: {
    type: String,
  },
  history: [
    {
      type: String,
      trim: true,
    },
  ],
});

const User = mongoose.model("User", userSchema);
module.exports = User;
