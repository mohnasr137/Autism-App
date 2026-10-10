// packages
import mongoose from "mongoose";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

// imports
import User from "../../models/user.js";
import Post from "../../models/post.js";
import postComment from "../../models/postComment.js";
import postReaction from "../../models/postReaction.js";

// init
const genAI = new GoogleGenerativeAI(process.env.GENERATIVE_AI_API_KEY || "");
const GenerativeAI = async ({ buffer = "", type = "", prompt }) => {
  try {
    if (!process.env.GENERATIVE_AI_API_KEY) {
      console.warn("GENERATIVE_AI_API_KEY is not set; using fallback categorization.");
      return "0,0";
    }
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    let result;
    if (buffer !== "") {
      const imagePart = {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: type,
        },
      };
      result = await model.generateContent([prompt, imagePart]);
    } else {
      result = await model.generateContent([prompt]);
    }
    const response = result.response;
    return response.text();
  } catch (err) {
    console.warn("GenerativeAI call failed, using default categorization:", err.message);
    return "0,0";
  }
};

const url = process.env.API_URL || "/api/v1";
const PostTypes = ["Advice", "Question"];
const Categories = [
  "Education",
  "Documentary",
  "People & Blogs",
  "Non profits & Autism",
  "Science & Technology",
];
const Reactions = ["like", "love", "special", "idea", "celebrate", "insightful", "funny"];

// routers
const search = async (req, res) => {
  try {
    const userId = req.userId;
    const { search, category, postType } = req.query;
    const skip = Math.max(0, parseInt(req.query.skip || 0, 10));
    const query = {};
    const userSearch = {};
    if (category) {
      if (!Categories.includes(category)) {
        return res.status(404).json({ status: false, error: "Category not found" });
      }
      query.category = category;
    }
    if (postType) {
      if (!PostTypes.includes(postType)) {
        return res.status(404).json({ status: false, error: "Post type not found" });
      }
      query.postType = postType;
    }
    if (search) {
      query.$or = [{ text: { $regex: search, $options: "i" } }];
      userSearch.$or = [{ name: { $regex: search, $options: "i" } }];
    }

    let postsList;
    if (Object.keys(query).length === 0) {
      postsList = await Post.aggregate([
        { $sample: { size: 10 } },
        { $addFields: { comments: { $slice: ["$comments", 2] } } },
        { $addFields: { reactions: { $slice: ["$reactions", 2] } } },
      ]);
    } else {
      postsList = await Post.aggregate([
        { $match: query },
        { $skip: skip * 10 },
        { $limit: 10 },
        { $addFields: { comments: { $slice: ["$comments", 2] } } },
        { $addFields: { reactions: { $slice: ["$reactions", 2] } } },
      ]);
    }

    let data = [];
    for (let post of postsList) {
      await Post.updateOne({ _id: post._id }, { $inc: { outerViewCount: 1 } });
      const user = await User.findOne(
        { _id: post.userId },
        { name: 1, email: 1, gender: 1, dateOfBirth: 1, image: 1, type: 1 }
      );
      if (user) {
        data.push({ post, user });
      } else {
        await Post.deleteOne({ _id: post._id });
      }
    }

    let usersList;
    if (Object.keys(userSearch).length === 0) {
      usersList = await User.aggregate([
        { $sample: { size: 10 } },
        {
          $project: {
            name: 1,
            email: 1,
            gender: 1,
            dateOfBirth: 1,
            image: 1,
            type: 1,
          },
        },
      ]);
    } else {
      usersList = await User.aggregate([
        { $match: userSearch },
        { $skip: skip * 10 },
        { $limit: 10 },
        {
          $project: {
            name: 1,
            email: 1,
            gender: 1,
            dateOfBirth: 1,
            image: 1,
            type: 1,
          },
        },
      ]);
      await User.updateOne(
        { _id: userId },
        { $push: { searchHistory: search } }
      );
    }
    return res.status(200).json({ status: true, usersList, data });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const searchHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const searchSkip = Math.max(0, parseInt(req.query.searchSkip || 0, 10));

    let list = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $project: {
          searchHistory: {
            $slice: ["$searchHistory", searchSkip * 20, 20],
          },
        },
      },
    ]);
    list = list[0];
    if (!list?.searchHistory?.length) {
      return res.status(200).json({ status: true, message: "Nothing yet.", list: [] });
    }

    return res.status(200).json({ status: true, list });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const showAllPosts = async (req, res) => {
  try {
    const randomPosts = await Post.aggregate([
      { $sample: { size: 10 } },
      { $addFields: { comments: { $slice: ["$comments", 2] } } },
      { $addFields: { reactions: { $slice: ["$reactions", 2] } } },
    ]);
    if (randomPosts.length === 0) {
      return res.status(200).json({ status: true, data: [] });
    }

    let data = [];
    for (let post of randomPosts) {
      await Post.updateOne({ _id: post._id }, { $inc: { outerViewCount: 1 } });
      const user = await User.findOne(
        { _id: post.userId },
        { name: 1, email: 1, gender: 1, dateOfBirth: 1, image: 1, type: 1 }
      );
      if (user) {
        data.push({ post, user });
      } else {
        await Post.deleteOne({ _id: post._id });
      }
    }

    return res.status(200).json({ status: true, data });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const showMyPosts = async (req, res) => {
  try {
    const userId = req.userId;
    const postSkip = Math.max(0, parseInt(req.query.postSkip || 0, 10));

    let list = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $project: {
          posts: {
            $slice: [{ $reverseArray: "$posts" }, postSkip * 20, 20],
          },
        },
      },
    ]);
    list = list[0];
    if (!list?.posts?.length) {
      return res.status(200).json({ status: true, message: "Nothing yet.", myPosts: { listDetails: [], user: null } });
    }

    const listDetails = await Promise.all(
      list.posts.map(async (element) => {
        const postData = await Post.findOne({ _id: element });
        return postData;
      })
    );
    const user = await User.findOne(
      { _id: userId },
      { name: 1, email: 1, gender: 1, dateOfBirth: 1, image: 1, type: 1 }
    );

    const data = { listDetails: listDetails.filter(Boolean), user };
    return res.status(200).json({ status: true, myPosts: data });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const post = async (req, res) => {
  try {
    const { postId } = req.query;
    const skip = Math.max(0, parseInt(req.query.skip || 0, 10));
    if (!postId) {
      return res.status(400).json({ status: false, error: "postId is required." });
    }

    let existingPost = await Post.findById(postId);
    if (!existingPost) {
      return res.status(404).json({ status: false, error: "Post not found." });
    }

    let list = await Post.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(postId) } },
      {
        $addFields: {
          comments: {
            $slice: [{ $reverseArray: "$comments" }, skip * 10, 10],
          },
          reactions: {
            $slice: [{ $reverseArray: "$reactions" }, skip * 10, 10],
          },
        },
      },
    ]);
    list = list[0] || existingPost;

    let existingUser = await User.findOne(
      { _id: list.userId },
      {
        name: 1,
        email: 1,
        gender: 1,
        image: 1,
        type: 1,
        dateOfBirth: 1,
      }
    );
    list.userData = existingUser;

    await Post.updateOne({ _id: list._id }, { $inc: { innerViewCount: 1 } });
    return res.status(200).json({ status: true, data: list });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
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
    if (method === "Post") {
      const { text } = req.body;
      if (req.files && req.files.length) {
        const file = req.files[0];
        const prompt = `this is my text in my post it: "${text || ""}", and i give you the image in my post, please give me only the post type as index from ["Advice", "Question"] and category as index from ["Education", "Documentary", "People & Blogs", "Non profits & Autism", "Science & Technology"] for this post in this format: "index,index"`;
        const buffer = fs.readFileSync(file.path);
        const genText = await GenerativeAI({
          buffer,
          type: file.mimetype,
          prompt,
        });
        const genTextArray = (genText || "0,0").split(",");
        let postTypeIndex = Number(genTextArray[0]);
        let categoryIndex = Number(genTextArray[1]);
        if (isNaN(postTypeIndex) || postTypeIndex < 0 || postTypeIndex >= PostTypes.length) {
          postTypeIndex = 0;
        }
        if (isNaN(categoryIndex) || categoryIndex < 0 || categoryIndex >= Categories.length) {
          categoryIndex = 0;
        }

        const imagesPath = req.files.map(
          (obj) =>
            `${req.protocol}://${req.get("host")}${url}/uploads/${path.basename(obj.path)}`
        );

        newPost = new Post({
          userId,
          method,
          text: text || "",
          category: Categories[categoryIndex],
          postType: PostTypes[postTypeIndex],
          images: imagesPath,
        });
        await newPost.save();
      } else {
        const prompt = `this is my text in my post it: "${text || ""}", please give me only the post type as index from ["Advice", "Question"] and category as index from ["Education", "Documentary", "People & Blogs", "Non profits & Autism", "Science & Technology"] for this post in this format only : "index,index"`;
        const genText = await GenerativeAI({ prompt });
        const genTextArray = (genText || "0,0").split(",");
        let postTypeIndex = Number(genTextArray[0]);
        let categoryIndex = Number(genTextArray[1]);
        if (isNaN(postTypeIndex) || postTypeIndex < 0 || postTypeIndex >= PostTypes.length) {
          postTypeIndex = 0;
        }
        if (isNaN(categoryIndex) || categoryIndex < 0 || categoryIndex >= Categories.length) {
          categoryIndex = 0;
        }
        newPost = new Post({
          userId,
          method,
          text: text || "",
          category: Categories[categoryIndex],
          postType: PostTypes[postTypeIndex],
        });
        await newPost.save();
      }
    } else {
      const { text, parentId } = req.body;
      if (!parentId) {
        return res.status(400).json({ status: false, error: "Parent ID is required." });
      }

      const existingPost = await Post.findOne({ _id: parentId });
      if (!existingPost) {
        return res.status(404).json({ status: false, error: "Post not found" });
      }
      await Post.updateOne(
        { _id: parentId },
        { $inc: { repostsNumber: 1 } }
      );
      newPost = new Post({
        userId,
        method,
        parentId,
        text: text || "",
        category: existingPost.category,
        postType: existingPost.postType,
      });
      await newPost.save();
    }

    await User.updateOne(
      { _id: userId },
      {
        $push: { posts: newPost._id },
        $inc: { postsCount: 1 },
      }
    );

    return res
      .status(201)
      .json({ status: true, newPost, message: "Post created successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const editPost = async (req, res) => {
  try {
    const { method, postId } = req.body;
    if (!method) {
      return res.status(400).json({ status: false, error: "Method is required." });
    }
    if (!postId) {
      return res.status(400).json({ status: false, error: "Post ID is required." });
    }
    const existingPost = await Post.findOne({ _id: postId });
    if (!existingPost) {
      return res.status(404).json({ status: false, error: "Post not found" });
    }

    let query = {};
    if (method === "Post") {
      const { text, category, postType } = req.body;
      if (category && !Categories.includes(category)) {
        return res.status(404).json({ status: false, error: "Category not found" });
      }
      if (category) {
        query.category = category;
      }
      if (postType && !PostTypes.includes(postType)) {
        return res.status(404).json({ status: false, error: "Post type not found" });
      }
      if (postType) {
        query.postType = postType;
      }
      if (text !== undefined) {
        query.text = text;
      }

      if (req.files && req.files.length) {
        const imagesPath = req.files.map(
          (obj) =>
            `${req.protocol}://${req.get("host")}${url}/uploads/${path.basename(obj.path)}`
        );
        query.images = imagesPath;
      }
      await Post.updateOne({ _id: postId }, { $set: query });
    } else {
      const { text } = req.body;
      if (text !== undefined) {
        query.text = text;
      }
      await Post.updateOne({ _id: postId }, { $set: query });
    }
    return res.status(200).json({ status: true, message: "Post updated successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const { postId } = req.query;
    if (!postId) {
      return res.status(400).json({ status: false, error: "Post ID is required." });
    }

    const existingPost = await Post.findOne({ _id: postId });
    if (!existingPost) {
      return res.status(404).json({ status: false, error: "Post not found" });
    }

    await postComment.deleteMany({ postId });
    await postReaction.deleteMany({ postId });
    await Post.deleteOne({ _id: postId });

    await User.updateOne(
      { _id: existingPost.userId },
      {
        $pull: { posts: postId },
        $inc: { postsCount: -1 },
      }
    );

    return res.status(200).json({ status: true, message: "Post deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const showPostComments = async (req, res) => {
  try {
    const { postId } = req.query;
    const commentsSkip = Math.max(0, parseInt(req.query.commentsSkip || 0, 10));
    const subcommentsSkip = Math.max(0, parseInt(req.query.subcommentsSkip || 0, 10));

    if (!postId) {
      return res.status(400).json({ status: false, error: "Post ID is required." });
    }

    let existingPost = await Post.findById(postId);
    if (!existingPost) {
      return res.status(404).json({ status: false, error: "Post not found" });
    }

    const commentIdsSlice = (existingPost.comments || []).slice(
      commentsSkip * 10,
      commentsSkip * 10 + 10
    );

    let comments = [];
    for (let commentId of commentIdsSlice) {
      let comment = await postComment.findById(commentId);
      if (!comment) continue;

      let commentObj = comment.toObject();
      let existingUser = await User.findById(comment.userId, {
        name: 1,
        email: 1,
        gender: 1,
        image: 1,
        type: 1,
        dateOfBirth: 1,
      });
      commentObj.userData = existingUser;

      const subcommentIdsSlice = (comment.subcomments || []).slice(
        subcommentsSkip * 10,
        subcommentsSkip * 10 + 10
      );

      let subcomments = [];
      for (let subcommentId of subcommentIdsSlice) {
        let subcomment = await postComment.findById(subcommentId);
        if (subcomment) {
          let subcommentObj = subcomment.toObject();
          let subUser = await User.findById(subcomment.userId, {
            name: 1,
            email: 1,
            gender: 1,
            image: 1,
            type: 1,
            dateOfBirth: 1,
          });
          subcommentObj.userData = subUser;
          subcomments.push(subcommentObj);
        }
      }
      commentObj.subcomments = subcomments;
      comments.push(commentObj);
    }

    return res.status(200).json({ status: true, comments });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.query;
    const { comment, method, parentCommentId } = req.body;
    if (!postId) {
      return res.status(400).json({ status: false, error: "Post ID is required." });
    }
    if (!method) {
      return res.status(400).json({ status: false, error: "Method is required." });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ status: false, error: "Comment is required." });
    }

    const existingPost = await Post.findById(postId);
    if (!existingPost) {
      return res.status(404).json({ status: false, error: "Post not found" });
    }

    if (process.env.MODERATION_KEY) {
      try {
        const url = "https://moderationapi.com/api/v1/moderate/text";
        const analysis = await axios.post(
          url,
          { value: comment },
          {
            headers: {
              Authorization: `Bearer ${process.env.MODERATION_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (analysis.data?.flagged) {
          return res.status(400).json({ status: false, error: "Comment contains restricted content." });
        }
      } catch (modErr) {
        console.warn("Text moderation unavailable, proceeding:", modErr.message);
      }
    }

    if (method === "Comment") {
      let newComment = new postComment({
        userId,
        postId,
        comment,
      });
      newComment = await newComment.save();

      await Post.updateOne(
        { _id: postId },
        {
          $push: { comments: newComment._id },
          $inc: { commentsCount: 1 },
        }
      );
    } else {
      if (!parentCommentId) {
        return res.status(400).json({ status: false, error: "Parent comment ID is required." });
      }
      let parent = await postComment.findById(parentCommentId);
      if (!parent) {
        return res.status(404).json({ status: false, error: "Parent comment not found" });
      }

      const targetParentId = parent.subcomment ? parent.parentCommentId : parent._id;
      let newComment = new postComment({
        userId,
        postId,
        comment,
        parentCommentId: targetParentId,
        subcomment: true,
      });
      newComment = await newComment.save();

      await postComment.updateOne(
        { _id: targetParentId },
        {
          $push: { subcomments: newComment._id },
          $inc: { subcommentsNumber: 1 },
        }
      );

      await Post.updateOne(
        { _id: postId },
        { $inc: { commentsCount: 1 } }
      );
    }
    return res.status(200).json({ status: true, message: "Add comment successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const editComment = async (req, res) => {
  try {
    const { postId, commentId } = req.query;
    const { newComment } = req.body;
    if (!postId) {
      return res.status(400).json({ status: false, error: "Post ID is required." });
    }
    if (!commentId) {
      return res.status(400).json({ status: false, error: "Comment ID is required." });
    }
    if (!newComment || !newComment.trim()) {
      return res.status(400).json({ status: false, error: "New Comment is required." });
    }

    const existingPost = await Post.findById(postId);
    if (!existingPost) {
      return res.status(404).json({ status: false, error: "Post not found" });
    }

    if (process.env.MODERATION_KEY) {
      try {
        const url = "https://moderationapi.com/api/v1/moderate/text";
        const analysis = await axios.post(
          url,
          { value: newComment },
          {
            headers: {
              Authorization: `Bearer ${process.env.MODERATION_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (analysis.data?.flagged) {
          return res.status(400).json({ status: false, error: "New Comment contains restricted content." });
        }
      } catch (modErr) {
        console.warn("Text moderation unavailable, proceeding:", modErr.message);
      }
    }

    await postComment.updateOne(
      { _id: commentId },
      { $set: { comment: newComment } }
    );

    return res.status(200).json({ status: true, message: "edit comment successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.query;
    if (!postId) {
      return res.status(400).json({ status: false, error: "Post ID is required." });
    }
    if (!commentId) {
      return res.status(400).json({ status: false, error: "Comment ID is required." });
    }

    const existingPost = await Post.findById(postId);
    if (!existingPost) {
      return res.status(404).json({ status: false, error: "Post not found" });
    }

    const comment = await postComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ status: false, error: "Comment not found" });
    }

    if (!comment.subcomment) {
      await postComment.deleteOne({ _id: commentId });
      // Delete any children subcomments as well
      await postComment.deleteMany({ parentCommentId: commentId });
      await Post.updateOne(
        { _id: postId },
        {
          $pull: { comments: commentId },
          $inc: { commentsCount: -1 },
        }
      );
    } else {
      await postComment.deleteOne({ _id: commentId });
      await postComment.updateOne(
        { _id: comment.parentCommentId },
        {
          $pull: { subcomments: commentId },
          $inc: { subcommentsNumber: -1 },
        }
      );
      await Post.updateOne(
        { _id: postId },
        { $inc: { commentsCount: -1 } }
      );
    }

    return res.status(200).json({ status: true, message: "Delete comment successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const showPostReactions = async (req, res) => {
  try {
    const { postId } = req.query;
    const reactionsSkip = Math.max(0, parseInt(req.query.reactionsSkip || 0, 10));
    if (!postId) {
      return res.status(400).json({ status: false, error: "Post ID is required." });
    }

    const existingPost = await Post.findById(postId);
    if (!existingPost) {
      return res.status(404).json({ status: false, error: "Post not found" });
    }

    const reactionIdsSlice = (existingPost.reactions || []).slice(
      reactionsSkip * 10,
      reactionsSkip * 10 + 10
    );

    const fullData = await postReaction.find({
      _id: { $in: reactionIdsSlice },
    });

    return res.status(200).json({ status: true, fullData });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const addReaction = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.query;
    const { reaction } = req.body;
    if (!postId) {
      return res.status(400).json({ status: false, error: "Post ID is required." });
    }
    if (!reaction) {
      return res.status(400).json({ status: false, error: "Reaction is required." });
    }
    if (!Reactions.includes(reaction.toLowerCase())) {
      return res.status(400).json({ status: false, error: `Invalid reaction. Allowed: ${Reactions.join(", ")}` });
    }

    const existingPost = await Post.findById(postId);
    if (!existingPost) {
      return res.status(404).json({ status: false, error: "Post not found" });
    }

    const normalizedReaction = reaction.toLowerCase();

    // Check if user already reacted to this post
    const prevReaction = await postReaction.findOne({ postId, userId });
    if (prevReaction) {
      await postReaction.updateOne(
        { _id: prevReaction._id },
        { $set: { reaction: normalizedReaction } }
      );
      return res.status(200).json({ status: true, message: "Reaction updated successfully" });
    }

    let newReaction = new postReaction({
      userId,
      postId,
      reaction: normalizedReaction,
    });
    newReaction = await newReaction.save();

    await Post.updateOne(
      { _id: postId },
      {
        $push: { reactions: newReaction._id },
        $inc: { reactionsCount: 1 },
      }
    );
    return res.status(200).json({ status: true, message: "add reaction successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const deleteReaction = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.query;
    if (!postId) {
      return res.status(400).json({ status: false, error: "Post ID is required." });
    }

    const existingPost = await Post.findById(postId);
    if (!existingPost) {
      return res.status(404).json({ status: false, error: "Post not found" });
    }

    const reaction = await postReaction.findOne({ postId, userId });
    if (!reaction) {
      return res.status(404).json({ status: false, error: "Reaction not found" });
    }
    await reaction.deleteOne();

    await Post.updateOne(
      { _id: postId },
      {
        $pull: { reactions: reaction._id },
        $inc: { reactionsCount: -1 },
      }
    );

    return res.status(200).json({ status: true, message: "delete reaction successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

export {
  search,
  searchHistory,
  showAllPosts,
  showMyPosts,
  post,
  createPost,
  editPost,
  deletePost,
  showPostComments,
  addComment,
  editComment,
  deleteComment,
  showPostReactions,
  addReaction,
  deleteReaction,
};
