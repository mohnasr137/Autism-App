// packages
import mongoose from "mongoose";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

// imports
import User from "../../models/user.js";
import Post from "../../models/post.js";
import postComment from "../../models/postComment.js";
import postReaction from "../../models/postReaction.js";

// init
const genAI = new GoogleGenerativeAI(process.env.GENERATIVE_AI_API_KEY);
const GenerativeAI = async ({ buffer = "", type = "", prompt }) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  let result;
  if (buffer != "") {
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
};

const url = process.env.API_URL;
const PostTypes = ["Advice", "Question"];
const Categories = [
  "Education",
  "Documentary",
  "People & Blogs",
  "Non profits & Autism",
  "Science & Technology",
];
const Reactions = ["like", "love", "special", "idea"];

// routers
const search = async (req, res) => {
  try {
    const userId = req.userId;
    const { skip, search, category, postType } = req.query;
    const query = {};
    const userSearch = {};
    if (category) {
      if (!Categories.includes(category)) {
        return res.status(404).json({ error: "Category not found" });
      }
      query.category = category;
    }
    if (postType) {
      if (!PostTypes.includes(postType)) {
        return res.status(404).json({ error: "Post type not found" });
      }
      query.postType = postType;
    }
    if (search) {
      query.$or = [{ text: { $regex: search, $options: "i" } }];
      userSearch.$or = [{ name: { $regex: search, $options: "i" } }];
    }

    let postsList;
    if (Object.keys(query).length == 0) {
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
    if (Object.keys(userSearch).length == 0) {
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
    return res.status(200).json({ usersList, data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const searchHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { searchSkip } = req.query;
    if (!searchSkip) {
      return res.status(400).json({ error: "searchSkip is required." });
    }

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
      return res.status(200).json({ message: "Nothing yet." });
    }

    return res.status(200).json({ list });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const showAllPosts = async (req, res) => {
  try {
    const randomPosts = await Post.aggregate([
      { $sample: { size: 10 } },
      { $addFields: { comments: { $slice: ["$comments", 2] } } },
      { $addFields: { reactions: { $slice: ["$reactions", 2] } } },
    ]);
    if (randomPosts.length == 0) {
      return res.status(404).json({ error: "Posts not found" });
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

    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const showMyPosts = async (req, res) => {
  try {
    const userId = req.userId;
    const { postSkip } = req.query;
    if (!postSkip) {
      return res.status(400).json({ error: "postSkip is required." });
    }

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
      return res.status(200).json({ message: "Nothing yet." });
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

    const data = { listDetails, user };
    return res.status(200).json({ myPosts: data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const post = async (req, res) => {
  try {
    const { postId, skip } = req.query;
    if (!postId) {
      return res.status(400).json({ error: "postId is required." });
    }
    if (!skip) {
      return res.status(400).json({ error: "skip is required." });
    }

    let list = await Post.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(postId) } },
      {
        $project: {
          comments: {
            $slice: [{ $reverseArray: "$comments" }, skip * 10, 10],
          },
          reactions: {
            $slice: [{ $reverseArray: "$reactions" }, skip * 10, 10],
          },
        },
      },
    ]);
    list = list[0];
    if (!list?.comments?.length && !list?.reactions?.length) {
      return res.status(200).json({ message: "Nothing yet." });
    }

    const post = await Post.findOne({ _id: list._id });
    await Post.updateOne({ _id: list._id }, { $inc: { innerViewCount: 1 } });
    const data = { post, list };
    return res.status(200).json({ post: data });
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
      const { text } = req.body;
      if (req.files.length) {
        const file = req.files[0];
        const prompt = `this is my text in my post it: "${text}", and i give you the image in my post, please give me only the post type as index from ["Advice", "Question"] and category as index from ["Education", "Documentary", "People & Blogs", "Non profits & Autism", "Science & Technology"] for this post in this format: "index,index"`;
        const buffer = fs.readFileSync(file.path);
        const genText = await GenerativeAI({
          buffer,
          type: file.mimetype,
          prompt,
        });
        if (!genText) {
          return res.status(400).json({ error: "Please try again later." });
        }
        const genTextArray = genText.split(",");
        let postTypeIndex = Number(genTextArray[0]);
        let categoryIndex = Number(genTextArray[1]);
        if (isNaN(postTypeIndex) || isNaN(categoryIndex)) {
          postTypeIndex = 0;
          categoryIndex = 0;
        }

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
          category: Categories[categoryIndex],
          postType: PostTypes[postTypeIndex],
          images: imagesPath,
        });
        await newPost.save();
      } else {
        const prompt = `this is my text in my post it: "${text}", please give me only the post type as index from ["Advice", "Question"] and category as index from ["Education", "Documentary", "People & Blogs", "Non profits & Autism", "Science & Technology"] for this post in this format only : "index,index"`;
        const genText = await GenerativeAI({ prompt });
        if (!genText) {
          return res.status(400).json({ error: "Please try again later." });
        }
        const genTextArray = genText.split(",");
        let postTypeIndex = Number(genTextArray[0]);
        let categoryIndex = Number(genTextArray[1]);
        if (isNaN(postTypeIndex) || isNaN(categoryIndex)) {
          postTypeIndex = 0;
          categoryIndex = 0;
        }
        newPost = new Post({
          userId,
          method,
          text,
          category: Categories[categoryIndex],
          postType: PostTypes[postTypeIndex],
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

    await User.updateOne(
      { _id: userId },
      {
        $push: { posts: newPost._id },
        $inc: { postsCount: 1 },
      }
    );

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
      if (category && !Categories.includes(category)) {
        return res.status(404).json({ error: "Category not found" });
      }
      if (category) {
        query.category = category;
      }
      if (postType && !PostTypes.includes(postType)) {
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
    return res.status(200).json({ message: "Post updated successfuly.." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const { postId } = req.query;
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

const showPostComments = async (req, res) => {
  try {
    const { postId, commentsSkip, subcommentsSkip } = req.query;
    if (!postId) {
      return res.status(400).json({ error: "Post ID is required." });
    }
    if (!commentsSkip) {
      return res.status(400).json({ error: "commentsSkip is required." });
    }
    if (!subcommentsSkip) {
      return res.status(400).json({ error: "subcommentsSkip is required." });
    }

    let existingPost = await Post.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(postId) } },
      {
        $project: {
          comments: {
            $slice: [{ $reverseArray: "$comments" }, commentsSkip * 10, 10],
          },
        },
      },
    ]);
    existingPost = existingPost[0];

    if (!existingPost || existingPost.length == 0) {
      return res.status(400).json({ error: "Post not found" });
    }

    let comments = [];
    for (let commentId of existingPost.comments) {
      let comment = await postComment.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(commentId) } },
        {
          $addFields: {
            subcomments: {
              $slice: [
                { $reverseArray: "$subcomments" },
                subcommentsSkip * 10,
                10,
              ],
            },
          },
        },
      ]);
      comment = comment[0];
      let subcomments = [];
      for (let subcommentId of comment.subcomments) {
        let subcomment = await postComment.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(subcommentId) } },
        ]);
        subcomment = subcomment[0];
        if (subcomment) {
          subcomments.push(subcomment);
        }
      }
      if (comment) {
        comment.subcomments = subcomments;
        comments.push(comment);
      }
    }

    return res.status(200).json({ comments });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.query;
    const { comment, method, parentCommentId } = req.body;
    if (!postId) {
      return res.status(400).json({ error: "Post ID is required." });
    }
    if (!method) {
      return res.status(400).json({ error: "Method is required." });
    }
    if (!comment || comment.length == 0) {
      return res.status(400).json({ error: "Comment is required." });
    }
    const existingPost = await Post.findOne(
      { _id: postId },
      { commentsCount: 1 }
    );
    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    const data = { value: comment };
    const url = "https://moderationapi.com/api/v1/moderate/text";
    const analysis = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${process.env.MODERATION_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (analysis.data.flagged) {
      return res
        .status(400)
        .json({ error: "Comment contains restricted content." });
    }

    if (method == "Comment") {
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
        return res
          .status(400)
          .json({ error: "Parent comment ID is required." });
      }
      let parent = await postComment.findOne(
        { _id: parentCommentId },
        { subcomment: 1, parentCommentId: 1 }
      );
      if (!parent) {
        return res.status(404).json({ error: "Parent comment not found" });
      }

      if (parent.subcomment) {
        let newComment = new postComment({
          userId,
          postId,
          comment,
          parentCommentId: parent.parentCommentId,
          subcomment: true,
        });
        newComment = await newComment.save();
        await postComment.updateOne(
          { _id: parent.parentCommentId },
          {
            $push: { subcomments: newComment._id },
            $inc: { subcommentsNumber: 1 },
          }
        );
      } else {
        let newComment = new postComment({
          userId,
          postId,
          comment,
          parentCommentId: parent._id,
          subcomment: true,
        });
        newComment = await newComment.save();
        await postComment.updateOne(
          { _id: parent._id },
          {
            $push: { subcomments: newComment._id },
            $inc: { subcommentsNumber: 1 },
          }
        );
      }
      await Post.updateOne(
        { _id: postId },
        {
          $inc: { commentsCount: 1 },
        }
      );
    }
    return res.status(200).json({ message: "Add comment successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const editComment = async (req, res) => {
  try {
    const { postId, commentId } = req.query;
    const { newComment } = req.body;
    if (!postId) {
      return res.status(400).json({ error: "Post ID is required." });
    }
    if (!commentId) {
      return res.status(400).json({ error: "Comment ID is required." });
    }
    if (!newComment || newComment.length == 0) {
      return res.status(400).json({ error: "New Comment is required." });
    }

    const existingPost = await Post.findOne({ _id: postId }, { _id: 1 });
    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    const data = { value: newComment };
    const url = "https://moderationapi.com/api/v1/moderate/text";
    const analysis = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${process.env.MODERATION_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (analysis.data.flagged) {
      return res
        .status(400)
        .json({ error: "New Comment contains restricted content." });
    }

    await postComment.updateOne(
      { _id: commentId },
      { $set: { comment: newComment } }
    );

    return res.status(200).json({ message: "edit comment successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.query;
    if (!postId) {
      return res.status(400).json({ error: "Post ID is required." });
    }
    if (!commentId) {
      return res.status(400).json({ error: "Comment ID is required." });
    }

    const existingPost = await Post.findOne(
      { _id: postId },
      { commentsCount: 1 }
    );
    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comment = await postComment.findOne(
      { _id: commentId },
      { subcomment: 1, parentCommentId: 1 }
    );
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    if (!comment.subcomment) {
      await postComment.deleteOne({ _id: commentId });
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
        {
          $inc: { commentsCount: -1 },
        }
      );
    }

    return res.status(200).json({ message: "Delete comment successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const showPostReactions = async (req, res) => {
  try {
    const { reactionsSkip, postId } = req.query;
    if (!postId) {
      return res.status(400).json({ error: "Post ID is required." });
    }

    let existingPost;
    if (reactionsSkip > 0) {
      existingPost = await Post.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(postId) } },
        {
          $project: {
            reactions: { $slice: ["$reactions", reactionsSkip * 10, 10] },
          },
        },
      ]);
      existingPost = existingPost[0];
    } else {
      existingPost = await Post.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(postId) } },
        { $addFields: { reactions: { $slice: ["$reactions", 0, 10] } } },
      ]);
      existingPost = existingPost[0];
    }
    if (!existingPost || existingPost.length == 0) {
      return res.status(400).json({ error: "Post not found" });
    }

    let fullData = [];
    for (let i = 0; i < existingPost.reactions.length; i++) {
      let reaction = await postReaction.findById(existingPost.reactions[i]);
      if (reaction) {
        fullData.push(reaction);
      }
    }

    return res.status(200).json({ fullData });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const addReaction = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.query;
    const { reaction } = req.body;
    if (!postId) {
      return res.status(400).json({ error: "Post ID is required." });
    }
    if (!reaction) {
      return res.status(400).json({ error: "Reaction is required." });
    }
    if (!Reactions.includes(reaction)) {
      return res.status(404).json({ error: "Reaction not found" });
    }

    const existingPost = await Post.findOne(
      { _id: postId },
      { reactionsCount: 1 }
    );
    if (!existingPost) {
      return res.status(400).json({ error: "Post not found" });
    }

    let newReaction = new postReaction({
      userId,
      postId,
      reaction,
    });
    newReaction = await newReaction.save();

    await Post.updateOne(
      { _id: postId },
      {
        $push: { reactions: newReaction._id },
        $inc: { reactionsCount: 1 },
      }
    );
    return res.status(200).json({ message: "add reaction successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteReaction = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.query;
    if (!postId) {
      return res.status(400).json({ error: "Post ID is required." });
    }

    const existingPost = await Post.findOne(
      { _id: postId },
      { reactionsCount: 1 }
    );
    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    const reaction = await postReaction.findOne({ postId, userId });
    if (!reaction) {
      return res.status(404).json({ error: "Reaction not found" });
    }
    await reaction.deleteOne();

    await Post.updateOne(
      { _id: postId },
      {
        $pull: { reactions: reaction._id },
        $inc: { reactionsCount: -1 },
      }
    );

    return res.status(200).json({ message: "delete reaction successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
