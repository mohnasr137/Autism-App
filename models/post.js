const mongoose = require("mongoose");

const postSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    method: {
      type: String,
      required: true,
      trim: true,
    },
    repostId: {
      type: String,
      trim: true,
    },
    text: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    postType: {
      type: String,
      trim: true,
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    comments: [
      {
        type: String,
        trim: true,
      },
    ],
    commentNumber: {
      type: Number,
      min: 0,
      default: 0,
    },
    repostNumber: {
      type: Number,
      min: 0,
      default: 0,
    },
    likeNumber: {
      type: Number,
      min: 0,
      default: 0,
    },
    loveNumber: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
