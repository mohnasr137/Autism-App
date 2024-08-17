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
  },
  {
    timestamps: true,
  }
);

const postComment = mongoose.model("post_comment", postCommentSchema);
export default postComment;
