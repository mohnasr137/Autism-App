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
  },
  dislikeCount: {
    required: true,
    type: Number,
  },
  viewCount: {
    required: true,
    type: Number,
  },
  commentsCount: {
    required: true,
    type: Number,
  },
  reactionsCount: {
    required: true,
    type: Number,
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

