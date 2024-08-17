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
    subcomment: {
      type: Boolean,
      default: false,
    },
    parentCommentId: {
      required: true,
      type: String,
      trim: true,
    },
    subcomments: [
      {
        required: true,
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

const videoComment = mongoose.model("video_comment", videoCommentSchema);
export default videoComment;
