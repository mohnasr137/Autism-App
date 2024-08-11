// packages
import express from "express";

// imports
import {
  showAllVideos,
  showAllChannels,
  showAllHistory,
  deleteAllHistory,
  channel,
  video,
  showVideoComments,
  addComment,
  editComment,
  deleteComment,
  showVideoReactions,
  addReaction,
  deleteReaction,
} from "../controllers/home/homeController.js";

// init
const homeRouter = express.Router();

// routers
homeRouter.get("/showAllVideos", showAllVideos);
homeRouter.get("/showAllChannels", showAllChannels);
homeRouter.get("/showAllHistory", showAllHistory);
homeRouter.delete("/deleteAllHistory", deleteAllHistory);
homeRouter.get("/channel", channel);
homeRouter.get("/video", video);
homeRouter.get("/video/comments", showVideoComments);
homeRouter.post("/video/add/comment", addComment);
homeRouter.patch("/video/edit/comment", editComment);
homeRouter.delete("/video/delete/comment", deleteComment);
homeRouter.get("/video/reactions", showVideoReactions);
homeRouter.post("/video/add/reaction", addReaction);
homeRouter.delete("/video/delete/reaction", deleteReaction);

// exports
export default homeRouter;
