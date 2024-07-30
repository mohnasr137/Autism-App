// packages
const express = require("express");

// imports
const {
  showAllVideos,
  showAllChannels,
  showAllHistory,
  deleteAllHistory,
  video,
  channel,
} = require("../controllers/home/home");

// init
const homeRouter = express.Router();

// routers
homeRouter.get("/showAllVideos", showAllVideos);
homeRouter.get("/showAllChannels", showAllChannels);
homeRouter.get("/showAllHistory", showAllHistory);
homeRouter.get("/deleteAllHistory", deleteAllHistory);
homeRouter.get("/video", video);
homeRouter.get("/channel", channel);

// exports
module.exports = homeRouter;