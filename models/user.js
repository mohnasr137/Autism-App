import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  name: {
    required: true,
    type: String,
    trim: true,
    match: /^[A-Za-z0-9]*$/,
  },
  email: {
    required: true,
    type: String,
    trim: true,
    match:
      /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
  },
  password: {
    required: true,
    type: String,
    trim: true,
    match: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
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
    required: true,
    type: String,
    trim: true,
  },
  code: {
    type: String,
  },
  postsCount: {
    type: Number,
    min: 0,
    default: 0,
  },
  posts: [
    {
      type: String,
      trim: true,
    },
  ],
  history: [
    {
      type: String,
      trim: true,
    },
  ],
});

const User = mongoose.model("User", userSchema);
export default User;
