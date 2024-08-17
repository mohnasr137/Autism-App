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
const PostTypes = ["Advice", "Question"];
const Categories = [
  "Education",
  "Documentary",
  "People & Blogs",
  "Non profits & Autism",
  "Science & Technology",
];

// routers
const showAllPosts = async (req, res) => {
  try {
    const randomPosts = await Post.aggregate([
      { $sample: { size: 10 } },
      { $addFields: { comments: { $slice: ["$comments", 2] } } },
    ]);

    if (randomPosts.length == 0) {
      return res.status(404).json({ error: "Posts not found" });
    }
    return res.status(200).json({ randomPosts });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const post = async (req, res) => {
  try {
    const { postId, commentSkip } = req.query;
    if (!postId) {
      return res.status(200).json({ message: "Please enter post id" });
    }
    let existingPost;
    if (commentSkip == 0) {
      existingPost = await Post.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(postId) } },
        { $addFields: { comments: { $slice: ["$comments", 0, 10] } } },
      ]);
    } else if (commentSkip > 0) {
      existingPost = await Post.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(postId) } },
        {
          $project: {
            comments: { $slice: ["$comments", commentSkip * 10, 10] },
          },
        },
      ]);
    }
    if (!existingPost) {
      return res.status(200).json({ message: "Invalid post ID" });
    }
    return res.status(200).json({ post: existingPost[0] });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createPost = async (req, res) => {
  try {
    const userId = req.userId;
    const { method } = req.body;
    if (!method) {
      return res.status(400).json({ error: "Method is required." });
    }

    let newPost;
    if (method == "Post") {
      const { text, category, postType } = req.body;
      if (!category) {
        return res.status(400).json({ error: "Category is required." });
      }
      if (!Categories.includes(category)) {
        return res.status(404).json({ error: "Category not found" });
      }
      if (!postType) {
        return res.status(400).json({ error: "Post type is required." });
      }
      if (!PostTypes.includes(postType)) {
        return res.status(404).json({ error: "Post type not found" });
      }

      if (req.files) {
        const imagesPath = req.files.map(
          (obj) =>
            req.protocol +
            "://" +
            req.get("host") +
            `${url}/` +
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
        newPost = new Post({
          userId,
          method,
          text,
          category,
          postType,
        });
        await newPost.save();
      }
    } else {
      const { text, parentId } = req.body;
      if (!parentId) {
        return res.status(400).json({ error: "Parent ID is required." });
      }

      const existingPost = await Post.findOne({ _id: parentId });
      if (!existingPost) {
        return res.status(404).json({ error: "Post not found" });
      }
      await Post.updateOne(
        { _id: parentId },
        { $set: { repostNumber: existingPost.repostNumber + 1 } }
      );
      newPost = new Post({
        userId,
        method,
        parentId,
        text,
        category: existingPost.category,
        postType: existingPost.postType,
      });
      await newPost.save();
    }
    return res
      .status(200)
      .json({ newPost, message: "Post created successfuly.." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const editPost = async (req, res) => {
  try {
    const { method, postId } = req.body;
    if (!method) {
      return res.status(400).json({ error: "Method is required." });
    }
    if (!postId) {
      return res.status(400).json({ error: "Post ID is required." });
    }
    const existingPost = await Post.findOne({ _id: postId });
    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    let query = {};
    if (method == "Post") {
      const { text, category, postType } = req.body;
      if (!Categories.includes(category)) {
        return res.status(404).json({ error: "Category not found" });
      }
      if (category) {
        query.category = category;
      }
      if (!PostTypes.includes(postType)) {
        return res.status(404).json({ error: "Post type not found" });
      }
      if (postType) {
        query.postType = postType;
      }
      if (text) {
        query.text = text;
      }

      if (req.files) {
        const imagesPath = req.files.map(
          (obj) =>
            req.protocol +
            "://" +
            req.get("host") +
            `${url}/` +
            obj.path.replace("images\\", "")
        );
        query.images = imagesPath;
        await Post.updateOne({ _id: postId }, { $set: query });
      } else {
        await Post.updateOne({ _id: postId }, { $set: query });
      }
    } else {
      const { text } = req.body;
      if (text) {
        query.text = text;
      }
      await Post.updateOne({ _id: postId }, { $set: query });
    }
    return res
      .status(200)
      .json({ newPost, message: "Post updated successfuly.." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const { postId } = req.body;
    if (!postId) {
      return res.status(400).json({ error: "Post ID is required." });
    }

    const existingPost = await Post.findOne(
      { _id: postId },
      { comments: 1, reactions: 1 }
    );
    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    for (let commentId in existingPost.comments) {
      await postComment.deleteOne({ _id: commentId });
    }

    for (let reactionId in existingPost.reactions) {
      await postReaction.deleteOne({ _id: reactionId });
    }

    await Post.deleteOne({ _id: postId });

    return res.status(200).json({ message: "Post deleted successfuly.." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export { showAllPosts, post, createPost, editPost, deletePost };
