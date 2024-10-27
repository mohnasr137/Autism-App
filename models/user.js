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
    unique: true,
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
  dateOfBirth: {
    type: Date,
    default: Date.now,
  },
  gender: {
    type: String,
    enum: ["male", "female", "not determined"],
    default: "not determined",
  },
  address: {
    type: String,
    default: "not determined",
  },
  phone: {
    type: String,
    default: "not determined",
  },
  facebookLink: {
    type: String,
    default: "not determined",
  },
  linkedinLink: {
    type: String,
    default: "not determined",
  },
  image: {
    required: true,
    type: String,
    trim: true,
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
  code: {
    type: String,
  },
  activeTest: {
    type: String,
    default: "no activeTest",
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
  searchHistory: [
    {
      type: String,
      trim: true,
    },
  ],
  videoHistory: [
    {
      type: String,
      trim: true,
    },
  ],
  favoriteVideos: [
    {
      type: String,
      trim: true,
    },
  ],
  testHistory: [
    {
      type: String,
      trim: true,
    },
  ],
  favoriteWebsites: [
    {
      type: String,
      trim: true,
    },
  ],
});

const User = mongoose.model("User", userSchema);
export default User;
