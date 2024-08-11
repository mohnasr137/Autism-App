import mongoose from "mongoose";

const videoCommentSchema = mongoose.Schema(
  {
    videoId: {
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

const videoComment = mongoose.model("video_comment", videoCommentSchema);
export default videoComment;
