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

module.exports = homeRouter;

// Search List Parameters
// part: Specifies the resource parts to include in the response (e.g., snippet, contentDetails, statistics).
// q: The search query term. This is the main filter to specify what you are searching for.
// type: Specifies the type of resource to retrieve (e.g., video, channel, playlist).
// maxResults: The maximum number of results to return per page (default is 5, max is 50).
// pageToken: Token to retrieve the next or previous page of results.
// order: The order in which to return the results (e.g., date, rating, relevance, title, viewCount).
// regionCode: The region code to restrict the search to a specific country (e.g., US, GB).
// videoCategoryId: Restrict the search to a specific video category (e.g., 10 for Music).
// relevanceLanguage: Restrict the results to videos where the title and description are in a specified language.
// videoDuration: Restrict results by video duration (e.g., short, medium, long).
// videoSyndicated: Restrict results to videos that are syndicated (true or false).

// videoType: Restrict results by video type (e.g., movie, episode).
// videoDefinition: Restrict results by video definition (e.g., high, standard).
// publishedAfter: Restrict the results to videos published after a specific date (ISO 8601 format).
// publishedBefore: Restrict the results to videos published before a specific date (ISO 8601 format).
// videoEmbeddable: Restrict results to videos that can be embedded (true or false).
// videoLicense: Restrict results by video license (e.g., creativeCommon, youtube).
