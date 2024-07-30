// packages
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// imports
const Post = require("../../models/post");

// init
const url = process.env.API_URL;

// routers
const createPost = async (req, res) => {
  try {
    const { method } = req.body;
    const authHeader = req.headers["authorization"];
    const token = authHeader.split(" ")[1];
    const userId = jwt.decode(token).id;
    let newPost;
    if (method == "post") {
      const { text, category, postType } = req.body;
      const imagesPath = req.files.map(
        (obj) =>
          `https://autism-app.up.railway.app${url}/` +
          obj.path.replace("images\\", "")
      );
      newPost = new Post({
        userId,
        method,
        text,
        category,
        postType,
        images: imagesPath,
      });
      await newPost.save();
    } else {
      const { text, repostId } = req.body;
      if (!repostId) {
        return res.status(500).json({ message: "please enter repostId" });
      }
      const existingPost = await Post.findOne({ _id: repostId });
      if (!existingPost) {
        return res.status(500).json({ message: "repostId not vaild" });
      }
      await Post.updateOne(
        { _id: repostId },
        { $set: { repostNumber: existingPost.repostNumber + 1 } }
      );
      newPost = new Post({
        userId,
        method,
        repostId,
        text,
        category: existingPost.category,
        postType: existingPost.postType,
      });
      await newPost.save();
    }
    return res
      .status(200)
      .json({ newPost, message: "new post created successfuly.." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const showAllPosts = async (req, res) => {
  try {
    const randomPosts = await Post.aggregate([
      { $sample: { size: 10 } },
      { $addFields: { comments: { $slice: ["$comments", 2] } } },
    ]);
    return res.status(200).json({ randomPosts });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const showPost = async (req, res) => {
  try {
    const { postId, skip } = req.query;
    if (!postId) {
      return res.status(200).json({ message: "please enter post id" });
    }
    let existingPost;
    if (skip == 0) {
      existingPost = await Post.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(postId) } },
        { $addFields: { comments: { $slice: ["$comments", 0, 10] } } },
      ]);
    } else if (skip > 0) {
      existingPost = await Post.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(postId) } },
        { $project: { comments: { $slice: ["$comments", skip * 10, 10] } } },
      ]);
    }
    if (!existingPost) {
      return res.status(200).json({ message: "post id not valid" });
    }
    return res.status(200).json({ post: existingPost[0] });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// exports
module.exports = {
  createPost,
  showAllPosts,
  showPost,
};
