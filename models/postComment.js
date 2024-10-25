import mongoose from "mongoose";

const postCommentSchema = mongoose.Schema(
  {
    postId: {
      required: true,
      type: String,
      trim: true,
    },
    userId: {
      required: true,
      type: String,
      trim: true,
    },
    comment: {
      required: true,
      type: String,
      trim: true,
    },
    comment: {
      required: true,
      type: String,
      trim: true,
    },
    subcomment: {
      type: Boolean,
      default: false,
    },
    parentCommentId: {
      type: String,
      trim: true,
    },
    subcomments: [
      {
        type: String,
        trim: true,
      },
    ],
    subcommentsNumber: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const postComment = mongoose.model("post_comment", postCommentSchema);
export default postComment;
