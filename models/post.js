import mongoose from "mongoose";

const postSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    postType: {
      type: String,
      required: true,
      trim: true,
    },
    method: {
      type: String,
      required: true,
      trim: true,
    },
    parentId: {
      type: String,
      trim: true,
    },
    text: {
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
    reactions: [
      {
        type: String,
        trim: true,
      },
    ],
    outerViewCount: {
      required: true,
      type: Number,
      min: 0,
      default: 0,
    },
    innerViewCount: {
      required: true,
      type: Number,
      min: 0,
      default: 0,
    },
    commentsCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    reactionsNumber: {
      type: Number,
      min: 0,
      default: 0,
    },
    repostsNumber: {
      type: Number,
      min: 0,
      default: 0,
    },
    likesNumber: {
      type: Number,
      min: 0,
      default: 0,
    },
    lovesNumber: {
      type: Number,
      min: 0,
      default: 0,
    },
    celebratesNumber: {
      type: Number,
      min: 0,
      default: 0,
    },
    insightfulsNumber: {
      type: Number,
      min: 0,
      default: 0,
    },
    funnysNumber: {
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
export default Post;
