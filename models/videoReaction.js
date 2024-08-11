import mongoose from "mongoose";

const videoReactionSchema = mongoose.Schema(
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
    reaction: {
      required: true,
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const videoReaction = mongoose.model("video_reaction", videoReactionSchema);
export default videoReaction;
