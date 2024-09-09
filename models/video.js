import mongoose from "mongoose";

const videoSchema = mongoose.Schema({
  videoId: {
    required: true,
    type: String,
    trim: true,
  },
  likeCount: {
    required: true,
    type: Number,
    min: 0,
    default: 0,
  },
  dislikeCount: {
    required: true,
    type: Number,
    min: 0,
    default: 0,
  },
  viewCount: {
    required: true,
    type: Number,
    min: 0,
    default: 0,
  },
  commentsCount: {
    required: true,
    type: Number,
    min: 0,
    default: 0,
  },
  reactionsCount: {
    required: true,
    type: Number,
    min: 0,
    default: 0,
  },
  comments: [
    {
      required: true,
      type: String,
      trim: true,
    },
  ],
  reactions: [
    {
      required: true,
      type: String,
      trim: true,
    },
  ],
});

const Video = mongoose.model("Video", videoSchema);
export default Video;

