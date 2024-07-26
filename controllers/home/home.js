// packages
const { google } = require("googleapis");
const jwt = require("jsonwebtoken");

// imports
const User = require("../../models/user");

//init
const youtube = google.youtube({
  version: "v3",
  auth: process.env.API_KEY,
});
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
const defaultSearch = "autism";

// routers
const seeAllVideos = async (req, res) => {
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

    const videos = await youtube.search.list(params);
    const fullData = await Promise.all(
      videos.data.items.map(async (item) => {
        const channel = await youtube.channels.list({
          part: "snippet",
          id: item.snippet.channelId,
        });
        return {
          vedio: {
            id: item.id,
            title: item.snippet.title,
            publishedAt: item.snippet.publishedAt,
            thumbnails: item.snippet.thumbnails,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          },
          channel: {
            id: channel.data.items[0].id,
            title: channel.data.items[0].snippet.title,
            thumbnails: channel.data.items[0].snippet.thumbnails,
            url: `https://www.youtube.com/${channel.data.items[0].snippet.customUrl}`,
          },
        };
      })
    );

    return res.status(200).json({
      nextPageToken: videos.data.nextPageToken || null,
      prevPageToken: videos.data.prevPageToken || null,
      fullData,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const seeAllChannels = async (req, res) => {
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

    const channels = await youtube.search.list(params);
    const fullData = await Promise.all(
      channels.data.items.map(async (item) => {
        const channel = await youtube.channels.list({
          part: "snippet,contentDetails,statistics",
          id: item.id.channelId,
        });
        return {
          id: channel.data.items[0].id,
          title: channel.data.items[0].snippet.title,
          customUrl: channel.data.items[0].snippet.customUrl,
          thumbnails: channel.data.items[0].snippet.thumbnails,
          subscriberCount: channel.data.items[0].statistics.subscriberCount,
          videoCount: channel.data.items[0].statistics.videoCount,
          url: `https://www.youtube.com/${channel.data.items[0].snippet.customUrl}`,
        };
      })
    );

    return res.status(200).json({
      nextPageToken: channels.data.nextPageToken || null,
      prevPageToken: channels.data.prevPageToken || null,
      fullData,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const seeAllHistory = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenDecode = jwt.decode(token);
    const existingUser = await User.findById(tokenDecode.id);
    const videosList = existingUser.history;

    let videos = await youtube.videos.list({
      part: "snippet,contentDetails,statistics",
      id: videosList.join(","),
    });
    const channelsList = videos.data.items.map((item) => {
      return item.snippet.channelId;
    });
    let channels = await youtube.channels.list({
      part: "snippet,contentDetails,statistics",
      id: channelsList.join(","),
    });

    videos = videos.data.items.map((item) => {
      return {
        id: item.id,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
        thumbnails: item.snippet.thumbnails,
        url: `https://www.youtube.com/watch?v=${item.id}`,
      };
    });
    channels = channels.data.items.map((item) => {
      return {
        id: item.id,
        title: item.snippet.title,
        thumbnails: item.snippet.thumbnails,
        url: `https://www.youtube.com/watch?v=${item.snippet.customUrl}`,
      };
    });
    const fullData = { videos, channels };
    return res.status(200).json({ fullData });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteAllHistory = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenDecode = jwt.decode(token);
    await User.updateOne({ _id: tokenDecode.id }, { $set: { history: [] } });
    return res.status(200).json({ message: "history deleted successfuly" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const video = async (req, res) => {
  try {
    const video = await youtube.videos.list({
      part: "snippet,contentDetails,statistics",
      id: req.query.videoId,
    });
    const channel = await youtube.channels.list({
      part: "snippet,contentDetails,statistics",
      id: video.data.items[0].snippet.channelId,
    });

    const fullData = {
      vedio: {
        id: video.data.items[0].id,
        title: video.data.items[0].snippet.title,
        description: video.data.items[0].snippet.description,
        publishedAt: video.data.items[0].snippet.publishedAt,
        thumbnails: video.data.items[0].snippet.thumbnails,
        viewCount: video.data.items[0].statistics.viewCount,
        likeCount: video.data.items[0].statistics.likeCount,
        url: `https://www.youtube.com/watch?v=${video.data.items[0].id}`,
      },
      channel: {
        id: channel.data.items[0].id,
        title: channel.data.items[0].snippet.title,
        customUrl: channel.data.items[0].snippet.customUrl,
        thumbnails: channel.data.items[0].snippet.thumbnails,
        subscriberCount: channel.data.items[0].statistics.subscriberCount,
        videoCount: channel.data.items[0].statistics.videoCount,
        url: `https://www.youtube.com/${channel.data.items[0].snippet.customUrl}`,
      },
    };

    let list = [];
    const token = req.query.token;
    const tokenDecode = jwt.decode(token);
    const existingUser = await User.findById(tokenDecode.id);
    list = existingUser.history;
    let p = true;
    for (let i = 0; i < list.length; i++) {
      if (list[i] == req.query.videoId) {
        p = false;
      }
    }
    if (p) {
      list.push(req.query.videoId);
    }
    await User.updateOne({ _id: tokenDecode.id }, { $set: { history: list } });
    return res
      .status(200)
      .json({ fullData, message: "add to history successfuly" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const channel = async (req, res) => {
  try {
    const channel = await youtube.channels.list({
      part: "snippet,contentDetails,statistics",
      id: req.query.channelId,
    });
    const uploadsPlaylistId =
      channel.data.items[0].contentDetails.relatedPlaylists.uploads;
    let videoIds = await youtube.playlistItems.list({
      part: "snippet,contentDetails",
      playlistId: uploadsPlaylistId,
      maxResults: 10,
    });

    const videoIdsArray = videoIds.data.items.map(
      (item) => item.contentDetails.videoId
    );
    let videos = await youtube.videos.list({
      part: "snippet,contentDetails,statistics",
      id: videoIdsArray.join(","),
    });
    videos = videos.data.items.map((item) => {
      return {
        id: item.id,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
        thumbnails: item.snippet.thumbnails,
        viewCount: item.statistics.viewCount,
        url: `https://www.youtube.com/watch?v=${item.id}`,
      };
    });

    const fullData = {
      channel: {
        id: channel.data.items[0].id,
        title: channel.data.items[0].snippet.title,
        description: channel.data.items[0].snippet.description,
        customUrl: channel.data.items[0].snippet.customUrl,
        thumbnails: channel.data.items[0].snippet.thumbnails,
        subscriberCount: channel.data.items[0].statistics.subscriberCount,
        videoCount: channel.data.items[0].statistics.videoCount,
        url: `https://www.youtube.com/${channel.data.items[0].snippet.customUrl}`,
      },
      videos,
    };

    return res.status(200).json({
      nextPageToken: videoIds.data.nextPageToken || null,
      prevPageToken: videoIds.data.prevPageToken || null,
      fullData,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  seeAllVideos,
  seeAllChannels,
  seeAllHistory,
  deleteAllHistory,
  video,
  channel,
};
