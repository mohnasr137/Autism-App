// packages
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// imports
import User from "../../models/user.js";
import Post from "../../models/post.js";
import postComment from "../../models/postComment.js";
import postReaction from "../../models/postReaction.js";

// init
const url = process.env.API_URL;

// routers
const imageUpload = async (req, res) => {
  try {
    const userId = req.userId;
    if (!req.file) {
      return res.status(400).json({ error: "File is required." });
    }
    const imagesPath =
      req.protocol +
      "://" +
      req.get("host") +
      `${url}/` +
      req.file.path.replace("images\\", "");

    await User.updateOne({ _id: userId }, { $set: { image: imagesPath } });

    return res
      .status(200)
      .json({ newPost, message: "Image uploaded successfuly.." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const userData = async (req, res) => {
  try {
    const userId = req.userId;
    if (!req.file) {
      return res.status(400).json({ error: "File is required." });
    }
    const imagesPath =
      req.protocol +
      "://" +
      req.get("host") +
      `${url}/` +
      req.file.path.replace("images\\", "");

    await User.updateOne({ _id: userId }, { $set: { image: imagesPath } });

    return res
      .status(200)
      .json({ newPost, message: "Image uploaded successfuly.." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export { imageUpload, userData };
