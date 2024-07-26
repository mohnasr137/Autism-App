// packages
const express = require("express");

// imports
const {
  seeAllVideos,
  seeAllChannels,
  seeAllHistory,
  deleteAllHistory,
  video,
  channel,
} = require("../controllers/home/home");

// init
const homeRouter = express.Router();

// routers
homeRouter.get("/seeAllVideos", seeAllVideos);
homeRouter.get("/seeAllChannels", seeAllChannels);
homeRouter.get("/seeAllHistory", seeAllHistory);
homeRouter.get("/deleteAllHistory", deleteAllHistory);
homeRouter.get("/video", video);
homeRouter.get("/channel", channel);

// exports
module.exports = homeRouter;