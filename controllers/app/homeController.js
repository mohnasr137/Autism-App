// packages
import { google } from "googleapis";
import mongoose from "mongoose";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// imports
import User from "../../models/user.js";
import Video from "../../models/video.js";
import videoComment from "../../models/videoComment.js";
import videoReaction from "../../models/videoReaction.js";

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

// routers
const showAllVideos = async (req, res) => {
  try {
    let filters = { ...req.query };
    const search = req.query.search;
    delete filters["search"];

    let text = "autism";
    if (search) {
      if (process.env.MODERATION_KEY) {
        try {
          const url = "https://moderationapi.com/api/v1/moderate/text";
          const analysis = await axios.post(
            url,
            { value: search },
            {
              headers: {
                Authorization: `Bearer ${process.env.MODERATION_KEY}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (analysis.data && analysis.data.flagged) {
            return res
              .status(400)
              .json({ status: false, error: "Search contains restricted content." });
          }
        } catch (modErr) {
          console.warn("Text moderation service unavailable, proceeding:", modErr.message);
        }
      }
      text = `"autism" && "${search}"`;
    }

    let params = {
      part: "snippet",
      q: text,
      type: "video",
      maxResults: 10,
      regionCode: defaultRegionCode,
      relevanceLanguage: defaultRelevanceLanguage,
      videoSyndicated: defaultVideoSyndicated,
      order: defaultOrder,
      ...filters,
    };
    if ("videoCategoryId" in params) {
      params.videoCategoryId = defaultVideoCategoryIds[params.videoCategoryId] || params.videoCategoryId;
    }

    const videos = await youtube.search.list(params);
    const fullData = await Promise.all(
      (videos.data.items || []).map(async (item) => {
        let channelSnippet = {};
        try {
          const channelRes = await youtube.channels.list({
            part: "snippet",
            id: item.snippet.channelId,
          });
          if (channelRes.data.items && channelRes.data.items.length > 0) {
            channelSnippet = channelRes.data.items[0];
          }
        } catch (chErr) {
          console.warn("Channel lookup error:", chErr.message);
        }

        const videoData = {
          id: item.id,
          title: item.snippet.title,
          publishedAt: item.snippet.publishedAt,
          thumbnails: item.snippet.thumbnails,
          url: `https://www.youtube.com/watch?v=${item.id.videoId || item.id}`,
        };

        const channelData = {
          id: channelSnippet.id || item.snippet.channelId,
          title: channelSnippet.snippet ? channelSnippet.snippet.title : item.snippet.channelTitle,
          thumbnails: channelSnippet.snippet ? channelSnippet.snippet.thumbnails : null,
          url: channelSnippet.snippet?.customUrl
            ? `https://www.youtube.com/${channelSnippet.snippet.customUrl}`
            : `https://www.youtube.com/channel/${item.snippet.channelId}`,
        };

        return {
          video: videoData,
          vedio: videoData,
          channel: channelData,
        };
      })
    );

    return res.status(200).json({
      status: true,
      nextPageToken: videos.data.nextPageToken || null,
      prevPageToken: videos.data.prevPageToken || null,
      fullData,
    });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const showAllChannels = async (req, res) => {
  try {
    let filters = { ...req.query };
    const search = req.query.search;
    delete filters["search"];

    let text = "autism";
    if (search) {
      if (process.env.MODERATION_KEY) {
        try {
          const url = "https://moderationapi.com/api/v1/moderate/text";
          const analysis = await axios.post(
            url,
            { value: search },
            {
              headers: {
                Authorization: `Bearer ${process.env.MODERATION_KEY}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (analysis.data && analysis.data.flagged) {
            return res
              .status(400)
              .json({ status: false, error: "Search contains restricted content." });
          }
        } catch (modErr) {
          console.warn("Text moderation service unavailable, proceeding:", modErr.message);
        }
      }
      text = `"autism" && "${search}"`;
    }

    let params = {
      part: "snippet",
      q: text,
      type: "channel",
      maxResults: 10,
      regionCode: defaultRegionCode,
      relevanceLanguage: defaultRelevanceLanguage,
      order: defaultOrder,
      ...filters,
    };

    const channels = await youtube.search.list(params);
    const fullData = await Promise.all(
      (channels.data.items || []).map(async (item) => {
        let channelItem = {};
        try {
          const channelRes = await youtube.channels.list({
            part: "snippet,contentDetails,statistics",
            id: item.id.channelId || item.id,
          });
          if (channelRes.data.items && channelRes.data.items.length > 0) {
            channelItem = channelRes.data.items[0];
          }
        } catch (chErr) {
          console.warn("Channel lookup error:", chErr.message);
        }

        const snippet = channelItem.snippet || item.snippet;
        const stats = channelItem.statistics || {};
        return {
          id: channelItem.id || item.id.channelId || item.id,
          title: snippet ? snippet.title : "",
          customUrl: snippet ? snippet.customUrl : "",
          thumbnails: snippet ? snippet.thumbnails : null,
          subscriberCount: stats.subscriberCount || "0",
          videoCount: stats.videoCount || "0",
          url: snippet?.customUrl
            ? `https://www.youtube.com/${snippet.customUrl}`
            : `https://www.youtube.com/channel/${channelItem.id || item.id.channelId}`,
        };
      })
    );

    return res.status(200).json({
      status: true,
      nextPageToken: channels.data.nextPageToken || null,
      prevPageToken: channels.data.prevPageToken || null,
      fullData,
    });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const showAllHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const historySkip = Math.max(0, parseInt(req.query.historySkip || 0, 10));

    let existingUser = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $project: {
          videoHistory: {
            $slice: [{ $reverseArray: "$videoHistory" }, historySkip * 10, 10],
          },
        },
      },
    ]);
    existingUser = existingUser[0];
    if (!existingUser?.videoHistory?.length) {
      return res.status(200).json({ status: true, message: "Nothing yet.", fullData: { videos: [], channels: [] } });
    }

    const videosList = existingUser.videoHistory;
    let videos = await youtube.videos.list({
      part: "snippet,contentDetails,statistics",
      id: videosList.join(","),
    });

    const channelsList = (videos.data.items || []).map((item) => {
      return item.snippet.channelId;
    });
    let channels = { data: { items: [] } };
    if (channelsList.length > 0) {
      channels = await youtube.channels.list({
        part: "snippet,contentDetails,statistics",
        id: channelsList.join(","),
      });
    }

    const videosMapped = (videos.data.items || []).map((item) => {
      return {
        id: item.id,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
        thumbnails: item.snippet.thumbnails,
        url: `https://www.youtube.com/watch?v=${item.id}`,
      };
    });
    const channelsMapped = (channels.data.items || []).map((item) => {
      return {
        id: item.id,
        title: item.snippet.title,
        thumbnails: item.snippet.thumbnails,
        url: item.snippet.customUrl
          ? `https://www.youtube.com/${item.snippet.customUrl}`
          : `https://www.youtube.com/channel/${item.id}`,
      };
    });
    const fullData = { videos: videosMapped, channels: channelsMapped };
    return res.status(200).json({ status: true, fullData });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const deleteAllHistory = async (req, res) => {
  try {
    const userId = req.userId;
    await User.updateOne({ _id: userId }, { $set: { videoHistory: [] } });
    return res
      .status(200)
      .json({ message: "video history deleted successfuly" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const channel = async (req, res) => {
  try {
    const channelId = req.query.channelId;
    if (!channelId) {
      return res.status(400).json({ error: "Channel ID is required." });
    }

    const channel = await youtube.channels.list({
      part: "snippet,contentDetails,statistics",
      id: channelId,
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
    return res.status(500).json({ error: error.message });
  }
};

const video = async (req, res) => {
  try {
    const userId = req.userId;
    const { videoId } = req.query;
    if (!videoId) {
      return res.status(400).json({ status: false, error: "Video ID is required." });
    }

    const videoRes = await youtube.videos.list({
      part: "snippet,contentDetails,statistics",
      id: videoId,
    });
    if (!videoRes.data.items || videoRes.data.items.length === 0) {
      return res.status(404).json({ status: false, error: "Video not found on YouTube" });
    }
    const ytVideo = videoRes.data.items[0];

    let ytChannel = { snippet: {}, statistics: {} };
    try {
      const channelRes = await youtube.channels.list({
        part: "snippet,contentDetails,statistics",
        id: ytVideo.snippet.channelId,
      });
      if (channelRes.data.items && channelRes.data.items.length > 0) {
        ytChannel = channelRes.data.items[0];
      }
    } catch (chErr) {
      console.warn("Channel lookup error:", chErr.message);
    }

    let existingVideo = await Video.findOne({ videoId });
    if (!existingVideo) {
      existingVideo = new Video({
        videoId,
        likeCount: 0,
        dislikeCount: 0,
        viewCount: 0,
        commentsCount: 0,
        reactionsCount: 0,
        comments: [],
        reactions: [],
      });
      existingVideo = await existingVideo.save();
    }

    const videoObj = {
      id: ytVideo.id,
      title: ytVideo.snippet.title,
      description: ytVideo.snippet.description,
      publishedAt: ytVideo.snippet.publishedAt,
      thumbnails: ytVideo.snippet.thumbnails,
      likeCount: existingVideo.likeCount,
      dislikeCount: existingVideo.dislikeCount,
      viewCount: existingVideo.viewCount + 1,
      commentsCount: existingVideo.commentsCount,
      reactionsCount: existingVideo.reactionsCount,
      comments: existingVideo.comments,
      reactions: existingVideo.reactions,
      url: `https://www.youtube.com/watch?v=${ytVideo.id}`,
    };

    const channelObj = {
      id: ytChannel.id || ytVideo.snippet.channelId,
      title: ytChannel.snippet ? ytChannel.snippet.title : ytVideo.snippet.channelTitle,
      customUrl: ytChannel.snippet ? ytChannel.snippet.customUrl : "",
      thumbnails: ytChannel.snippet ? ytChannel.snippet.thumbnails : null,
      subscriberCount: ytChannel.statistics?.subscriberCount || "0",
      videoCount: ytChannel.statistics?.videoCount || "0",
      url: ytChannel.snippet?.customUrl
        ? `https://www.youtube.com/${ytChannel.snippet.customUrl}`
        : `https://www.youtube.com/channel/${ytVideo.snippet.channelId}`,
    };

    const fullData = {
      video: videoObj,
      vedio: videoObj,
      channel: channelObj,
    };

    await Video.updateOne(
      { videoId },
      { $inc: { viewCount: 1 } }
    );

    // Add to user history if not already most recent
    await User.updateOne(
      { _id: userId },
      {
        $pull: { videoHistory: videoId },
      }
    );
    await User.updateOne(
      { _id: userId },
      {
        $push: {
          videoHistory: {
            $each: [videoId],
            $slice: -20,
          },
        },
      }
    );

    return res.status(200).json({ status: true, fullData, message: "add to video history successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const showVideoComments = async (req, res) => {
  try {
    const { videoId } = req.query;
    const commentsSkip = Math.max(0, parseInt(req.query.commentsSkip || 0, 10));

    if (!videoId) {
      return res.status(400).json({ status: false, error: "Video ID is required." });
    }

    let existingVideo = await Video.findOne({ videoId });
    if (!existingVideo) {
      return res.status(200).json({ status: true, fullData: [] });
    }

    const commentIdsSlice = (existingVideo.comments || []).slice(
      commentsSkip * 10,
      commentsSkip * 10 + 10
    );

    let fullData = [];
    for (let commentId of commentIdsSlice) {
      let comment = await videoComment.findById(commentId);
      if (comment) {
        fullData.push(comment);
      }
    }

    return res.status(200).json({ status: true, fullData });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const userId = req.userId;
    const { videoId } = req.query;
    const { comment, method, parentCommentId } = req.body;
    if (!videoId) {
      return res.status(400).json({ status: false, error: "Video ID is required." });
    }
    if (!method) {
      return res.status(400).json({ status: false, error: "Method is required." });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ status: false, error: "Comment is required." });
    }

    let existingVideo = await Video.findOne({ videoId });
    if (!existingVideo) {
      existingVideo = new Video({ videoId });
      await existingVideo.save();
    }

    if (process.env.MODERATION_KEY) {
      try {
        const url = "https://moderationapi.com/api/v1/moderate/text";
        const analysis = await axios.post(
          url,
          { value: comment },
          {
            headers: {
              Authorization: `Bearer ${process.env.MODERATION_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (analysis.data?.flagged) {
          return res.status(400).json({ status: false, error: "Comment contains restricted content." });
        }
      } catch (modErr) {
        console.warn("Text moderation unavailable, proceeding:", modErr.message);
      }
    }

    if (method === "Comment") {
      let newComment = new videoComment({
        userId,
        videoId,
        comment,
      });
      newComment = await newComment.save();

      await Video.updateOne(
        { videoId },
        {
          $push: { comments: newComment._id },
          $inc: { commentsCount: 1 },
        }
      );
    } else {
      if (!parentCommentId) {
        return res.status(400).json({ status: false, error: "Parent comment ID is required." });
      }
      let parent = await videoComment.findById(parentCommentId);
      if (!parent) {
        return res.status(404).json({ status: false, error: "Parent comment not found" });
      }

      const targetParentId = parent.subcomment ? parent.parentCommentId : parent._id;
      let newComment = new videoComment({
        userId,
        videoId,
        comment,
        parentCommentId: targetParentId,
        subcomment: true,
      });
      newComment = await newComment.save();

      await videoComment.updateOne(
        { _id: targetParentId },
        {
          $push: { subcomments: newComment._id },
          $inc: { subcommentsNumber: 1 },
        }
      );

      await Video.updateOne(
        { videoId },
        { $inc: { commentsCount: 1 } }
      );
    }

    return res.status(200).json({ status: true, message: "Add comment successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const editComment = async (req, res) => {
  try {
    const { videoId, commentId } = req.query;
    const { newComment } = req.body;
    if (!videoId) {
      return res.status(400).json({ status: false, error: "Video ID is required." });
    }
    if (!commentId) {
      return res.status(400).json({ status: false, error: "Comment ID is required." });
    }
    if (!newComment || !newComment.trim()) {
      return res.status(400).json({ status: false, error: "New Comment is required." });
    }

    const existingVideo = await Video.findOne({ videoId }, { _id: 1 });
    if (!existingVideo) {
      return res.status(404).json({ status: false, error: "Video not found" });
    }

    if (process.env.MODERATION_KEY) {
      try {
        const url = "https://moderationapi.com/api/v1/moderate/text";
        const analysis = await axios.post(
          url,
          { value: newComment },
          {
            headers: {
              Authorization: `Bearer ${process.env.MODERATION_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (analysis.data?.flagged) {
          return res.status(400).json({ status: false, error: "New Comment contains restricted content." });
        }
      } catch (modErr) {
        console.warn("Text moderation unavailable, proceeding:", modErr.message);
      }
    }

    await videoComment.updateOne(
      { _id: commentId },
      { $set: { comment: newComment } }
    );

    return res.status(200).json({ status: true, message: "edit comment successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { videoId, commentId } = req.query;
    if (!videoId) {
      return res.status(400).json({ error: "Video ID is required." });
    }
    if (!commentId) {
      return res.status(400).json({ error: "Comment ID is required." });
    }

    const existingVideo = await Video.findOne(
      { videoId },
      { commentsCount: 1 }
    );
    if (!existingVideo) {
      return res.status(404).json({ error: "Video not found" });
    }

    const comment = await videoComment.findOne(
      { _id: commentId },
      { subcomment: 1, parentCommentId: 1 }
    );
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    if (!comment.subcomment) {
      await videoComment.deleteOne({ _id: commentId });
      await Video.updateOne(
        { videoId },
        {
          $pull: { comments: commentId },
          $inc: { commentsCount: -1 },
        }
      );
    } else {
      await videoComment.deleteOne({ _id: commentId });
      await videoComment.updateOne(
        { _id: comment.parentCommentId },
        {
          $pull: { subcomments: commentId },
          $inc: { subcommentsNumber: -1 },
        }
      );
      await Video.updateOne(
        { videoId },
        {
          $inc: { commentsCount: -1 },
        }
      );
    }

    return res.status(200).json({ message: "Delete comment successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// const showVideoReactions = async (req, res) => {
//   try {
//     const { reactionsSkip, videoId } = req.query;
//     if (!videoId) {
//       return res.status(400).json({ error: "Video ID is required." });
//     }
//       console.log("hi");

//     let existingVideo;
//     if (reactionsSkip > 0) {
//       existingVideo = await Video.aggregate([
//         { $match: { videoId: new mongoose.Types.ObjectId(videoId) } },
//         {
//           $project: {
//             reactions: { $slice: ["$reactions", reactionsSkip * 10, 10] },
//           },
//         },
//       ]);
//       existingVideo = existingVideo[0];
//             console.log("hi");

//     } else {
//       existingVideo = await Video.aggregate([
//         { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
//         { $addFields: { reactions: { $slice: ["$reactions", 0, 10] } } },
//       ]);
//       existingVideo = existingVideo[0];
//     }

//     if (!existingVideo || existingVideo.length == 0) {
//       return res.status(400).json({ error: "Video not found" });
//     }

//     let fullData = [];
//     for (let i = 0; i < existingVideo.reactions.length; i++) {
//       let reaction = await videoReaction.findById(existingVideo.reactions[i]);
//       if (reaction) {
//         fullData.push(reaction);
//       }
//     }

//     return res.status(200).json({ fullData });
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// };

const showVideoReactions = async (req, res) => {
  try {
    const { videoId } = req.query;
    const reactionsSkip = Math.max(0, parseInt(req.query.reactionsSkip || 0, 10));
    if (!videoId) {
      return res.status(400).json({ status: false, error: "Video ID is required." });
    }

    const existingVideo = await Video.findOne({ videoId });
    if (!existingVideo) {
      return res.status(200).json({ status: true, fullData: [] });
    }

    const reactionIdsSlice = (existingVideo.reactions || []).slice(
      reactionsSkip * 10,
      reactionsSkip * 10 + 10
    );

    const fullData = await videoReaction.find({
      _id: { $in: reactionIdsSlice },
    });

    return res.status(200).json({ status: true, fullData });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const addReaction = async (req, res) => {
  try {
    const userId = req.userId;
    const { videoId } = req.query;
    const { reaction } = req.body;
    if (!videoId) {
      return res.status(400).json({ status: false, error: "Video ID is required." });
    }
    if (!reaction || !reaction.trim()) {
      return res.status(400).json({ status: false, error: "Reaction is required." });
    }

    let existingVideo = await Video.findOne({ videoId });
    if (!existingVideo) {
      existingVideo = new Video({ videoId });
      await existingVideo.save();
    }

    // Check if user already reacted
    const previousReaction = await videoReaction.findOne({ videoId, userId });
    if (previousReaction) {
      // update reaction type
      await videoReaction.updateOne(
        { _id: previousReaction._id },
        { $set: { reaction } }
      );
      return res.status(200).json({ status: true, message: "reaction updated successfully" });
    }

    const newReaction = new videoReaction({
      userId,
      videoId,
      reaction,
    });
    await newReaction.save();

    await Video.updateOne(
      { videoId },
      {
        $push: { reactions: newReaction._id },
        $inc: { reactionsCount: 1 },
      }
    );
    return res.status(200).json({ status: true, message: "add reaction successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const deleteReaction = async (req, res) => {
  try {
    const { videoId, reactionId } = req.query;
    if (!videoId) {
      return res.status(400).json({ status: false, error: "Video ID is required." });
    }
    if (!reactionId) {
      return res.status(400).json({ status: false, error: "Reaction ID is required." });
    }

    await videoReaction.deleteOne({ _id: reactionId });

    await Video.updateOne(
      { videoId },
      {
        $pull: { reactions: reactionId },
        $inc: { reactionsCount: -1 },
      }
    );

    return res.status(200).json({ status: true, message: "delete reaction successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const showFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const favoriteSkip = Math.max(0, parseInt(req.query.favoriteSkip || 0, 10));

    let list = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $project: {
          favoriteVideos: {
            $slice: [
              { $reverseArray: "$favoriteVideos" },
              favoriteSkip * 10,
              10,
            ],
          },
        },
      },
    ]);
    list = list[0];
    if (!list?.favoriteVideos?.length) {
      return res.status(200).json({ status: true, message: "Nothing yet.", fullData: { videos: [], channels: [] } });
    }

    const videosList = list.favoriteVideos;
    let videos = await youtube.videos.list({
      part: "snippet,contentDetails,statistics",
      id: videosList.join(","),
    });

    const channelsList = (videos.data.items || []).map((item) => {
      return item.snippet.channelId;
    });
    let channels = { data: { items: [] } };
    if (channelsList.length > 0) {
      channels = await youtube.channels.list({
        part: "snippet,contentDetails,statistics",
        id: channelsList.join(","),
      });
    }

    const videosMapped = (videos.data.items || []).map((item) => {
      return {
        id: item.id,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
        thumbnails: item.snippet.thumbnails,
        url: `https://www.youtube.com/watch?v=${item.id}`,
      };
    });
    const channelsMapped = (channels.data.items || []).map((item) => {
      return {
        id: item.id,
        title: item.snippet.title,
        thumbnails: item.snippet.thumbnails,
        url: item.snippet.customUrl
          ? `https://www.youtube.com/${item.snippet.customUrl}`
          : `https://www.youtube.com/channel/${item.id}`,
      };
    });
    const fullData = { videos: videosMapped, channels: channelsMapped };
    return res.status(200).json({ status: true, fullData });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const addFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const { videoId } = req.query;
    if (!videoId) {
      return res.status(400).json({ status: false, error: "Video ID is required." });
    }

    let existingVideo = await Video.findOne({ videoId });
    if (!existingVideo) {
      existingVideo = new Video({ videoId });
      await existingVideo.save();
    }

    await User.updateOne(
      { _id: userId },
      { $addToSet: { favoriteVideos: videoId } }
    );

    return res.status(200).json({ status: true, message: "add favorite successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const deleteFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const { videoId } = req.query;
    if (!videoId) {
      return res.status(400).json({ error: "Video ID is required." });
    }

    const existingVideo = await Video.findOne({ videoId }, { _id: 1 });
    if (!existingVideo) {
      return res.status(404).json({ error: "Video not found" });
    }

    await User.updateOne(
      { _id: userId },
      { $pull: { favoriteVideos: videoId } }
    );

    return res.status(200).json({ message: "delete favorite successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteAllFavorite = async (req, res) => {
  try {
    const userId = req.userId;

    await User.updateOne({ _id: userId }, { $set: { favoriteVideos: [] } });

    return res.status(200).json({ message: "delete all favorite successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export {
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
  showFavorite,
  addFavorite,
  deleteFavorite,
  deleteAllFavorite,
};
