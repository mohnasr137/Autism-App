import mongoose from "mongoose";

const postReactionSchema = mongoose.Schema(
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

const postReaction = mongoose.model("post_reaction", postReactionSchema);
export default postReaction;
