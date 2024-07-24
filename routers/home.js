// packages
const express = require("express");
const { google } = require("googleapis");

// imports

// init
const homeRouter = express.Router();
const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUR_API_KEY,
});
const defaultSearch = "autism";
const defaultVideoCategoryIds = {
  "People & Blogs": "22",
  Education: "27",
  "Science & Technology": "28",
  "Nonprofits & Activism": "29",
  Documentary: "35",
};
const defaultRegionCode = "US";
const defaultRelevanceLanguage = "en";
const defaultVideoSyndicated = "true";
const defaultOrder = "relevance";

// routers
homeRouter.get("/seeAllVideos", async (req, res) => {
  try {
    let filters = req.query;
    delete filters["search"];
    let params = {
      part: "snippet",
      q: req.query.search || defaultSearch,
      type: "video",
      maxResults: 10,
      regionCode: defaultRegionCode,
      relevanceLanguage: defaultRelevanceLanguage,
      videoSyndicated: defaultVideoSyndicated,
      order: defaultOrder,
      ...filters,
    };
    if ("videoCategoryId" in params) {
      params.videoCategoryId = defaultVideoCategoryIds[params.videoCategoryId];
    }
    console.log(filters);
    console.log(params);
    const videos = await youtube.search.list(params);
    res.json(videos.data);
    // res.json({
    //   videos: videos.data.items,
    //   nextPageToken: videos.data.nextPageToken || null,
    // });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

homeRouter.get("/seeAllChannels", async (req, res) => {
  try {
    let filters = req.query;
    delete filters["search"];
    let params = {
      part: "snippet",
      q: req.query.search || defaultSearch,
      type: "channel",
      maxResults: 10,
      regionCode: defaultRegionCode,
      relevanceLanguage: defaultRelevanceLanguage,
      order: defaultOrder,
      ...filters,
    };
    console.log(filters);
    console.log(params);
    const channels = await youtube.search.list(params);
    res.json(channels.data);
    // res.json({
    //   videos: videos.data.items,
    //   nextPageToken: videos.data.nextPageToken || null,
    // });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

homeRouter.get("/video", async (req, res) => {
  try {
    const video = await youtube.videos.list({
      part: "snippet,contentDetails,statistics",
      id: req.query.videoId,
    });
    res.json({
      data: video.data,
      url: `https://www.youtube.com/watch?v=${video.data.items[0].id}`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

homeRouter.get("/channel", async (req, res) => {
  try {
    const channel = await youtube.channels.list({
      part: "snippet,contentDetails,statistics",
      id: req.query.channelId,
    });
    res.json({
      data: channel.data,
      url: `https://www.youtube.com/${channel.data.items[0].snippet.customUrl}`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

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
