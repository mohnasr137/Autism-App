// packages
import { google } from "googleapis";
import mongoose from "mongoose";
import axios from "axios";

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

    let text;
    if (search) {
      const data = { value: search };
      const url = "https://moderationapi.com/api/v1/moderate/text";
      const analysis = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${process.env.MODERATION_KEY}`,
          "Content-Type": "application/json",
        },
      });
      if (analysis.data.flagged) {
        return res
          .status(400)
          .json({ error: "Search contains restricted content." });
      }
      text = `"autism" && "${search}"`;
    } else {
      text = "autism";
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
    return res.status(500).json({ error: error.message });
  }
};

const showAllChannels = async (req, res) => {
  try {
    let filters = { ...req.query };
    const search = req.query.search;
    delete filters["search"];

    let text;
    if (search) {
      const data = { value: search };
      const url = "https://moderationapi.com/api/v1/moderate/text";
      const analysis = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${process.env.MODERATION_KEY}`,
          "Content-Type": "application/json",
        },
      });
      if (analysis.data.flagged) {
        return res
          .status(400)
          .json({ error: "Search contains restricted content." });
      }
      text = `"autism" && "${search}"`;
    } else {
      text = "autism";
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
    return res.status(500).json({ error: error.message });
  }
};

const showAllHistory = async (req, res) => {
  try {
    const userId = req.userId;
    let { historySkip } = req.query;

    let existingUser;
    if (historySkip > 0) {
      existingUser = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(userId) } },
        {
          $project: {
            history: { $slice: ["$history", historySkip * 10, 10] },
          },
        },
      ]);
      existingUser = existingUser[0];
    } else {
      const existingUser = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(userId) } },
        { $addFields: { history: { $slice: ["$history", 0, 10] } } },
      ]);
      existingUser = existingUser[0];
    }

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
    return res.status(500).json({ error: error.message });
  }
};

const deleteAllHistory = async (req, res) => {
  try {
    const userId = req.userId;
    await User.updateOne({ _id: userId }, { $set: { history: [] } });
    return res.status(200).json({ message: "history deleted successfuly" });
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
      return res.status(400).json({ error: "Video ID is required." });
    }

    const video = await youtube.videos.list({
      part: "snippet,contentDetails,statistics",
      id: videoId,
    });
    const channel = await youtube.channels.list({
      part: "snippet,contentDetails,statistics",
      id: video.data.items[0].snippet.channelId,
    });

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

    const fullData = {
      vedio: {
        id: video.data.items[0].id,
        title: video.data.items[0].snippet.title,
        description: video.data.items[0].snippet.description,
        publishedAt: video.data.items[0].snippet.publishedAt,
        thumbnails: video.data.items[0].snippet.thumbnails,
        likeCount: existingVideo.likeCount,
        dislikeCount: existingVideo.dislikeCount,
        viewCount: existingVideo.viewCount,
        commentsCount: existingVideo.commentsCount,
        reactionsCount: existingVideo.reactionsCount,
        comments: existingVideo.comments,
        reactions: existingVideo.reactions,
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

    await Video.updateOne(
      { videoId },
      { $set: { viewCount: existingVideo.viewCount + 1 } }
    );

    let list = [];
    const existingUser = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $addFields: { history: { $slice: ["$history", 0, 10] } } },
    ]);

    list = existingUser[0].history;
    let p = true;
    for (let i = 0; i < list.length; i++) {
      if (list[i] == videoId) {
        p = false;
        break;
      }
    }
    if (p) {
      await User.updateOne({ _id: userId }, { $push: { history: videoId } });
      return res
        .status(200)
        .json({ fullData, message: "add to history successfuly" });
    }

    return res.status(200).json({ fullData });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const showVideoComments = async (req, res) => {
  try {
    const { commentsSkip, videoId } = req.query;
    if (!videoId) {
      return res.status(400).json({ error: "Video ID is required." });
    }

    let existingVideo = await Video.aggregate([
      { $match: { videoId } },
      {
        $project: {
          comments: { $slice: ["$comments", commentsSkip * 10, 10] },
        },
      },
    ]);
    existingVideo = existingVideo[0];

    if (!existingVideo || existingVideo.length == 0) {
      return res.status(400).json({ error: "Video not found" });
    }

    let fullData = [];
    for (let commentId in existingVideo.comments) {
      let comment = await Video.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(commentId) } },
        { $addFields: { subcomments: { $slice: ["$subcomments", 0, 2] } } },
      ]);
      comment = comment[0];
      if (comment) {
        fullData.push(comment);
      }
    }

    return res.status(200).json({ fullData });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// const showVideoComments = async (req, res) => {
//   try {
//     const { commentsSkip, videoId } = req.query;
//     if (!videoId) {
//       return res.status(400).json({ error: "Video ID is required." });
//     }

//     let existingVideo;
//     if (commentsSkip > 0) {
//       existingVideo = await Video.aggregate([
//         { $match: { videoId } },
//         {
//           $project: {
//             comments: { $slice: ["$comments", commentsSkip * 10, 10] },
//           },
//         },
//       ]);
//       existingVideo = existingVideo[0];
//     } else {
//       existingVideo = await Video.aggregate([
//         { $match: { videoId } },
//         { $addFields: { comments: { $slice: ["$comments", 0, 10] } } },
//       ]);
//       existingVideo = existingVideo[0];
//     }
//     if (!existingVideo || existingVideo.length == 0) {
//       return res.status(400).json({ error: "Video not found" });
//     }

//     let fullData = [];
//     for (let i = 0; i < existingVideo.comments.length; i++) {
//       let comment = await videoComment.findById(existingVideo.comments[i]);
//       if (comment) {
//         fullData.push(comment);
//       }
//     }

//     return res.status(200).json({ fullData });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// };

const addComment = async (req, res) => {
  try {
    const userId = req.userId;
    const { videoId } = req.query;
    const { comment, method, parentCommentId } = req.body;
    if (!videoId) {
      return res.status(400).json({ error: "Video ID is required." });
    }
    if (!method) {
      return res.status(400).json({ error: "Method is required." });
    }
    if (!comment || comment.length == 0) {
      return res.status(400).json({ error: "Comment is required." });
    }

    const existingVideo = await Video.findOne(
      { videoId },
      { commentsCount: 1 }
    );
    if (!existingVideo) {
      return res.status(404).json({ error: "Video not found" });
    }

    const data = { value: comment };
    const url = "https://moderationapi.com/api/v1/moderate/text";
    const analysis = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${process.env.MODERATION_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (analysis.data.flagged) {
      return res
        .status(400)
        .json({ error: "Comment contains restricted content." });
    }

    if (method == "Comment") {
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
        return res
          .status(400)
          .json({ error: "Parent comment ID is required." });
      }
      let parent = await videoComment.findOne(
        { _id: parentCommentId },
        { subcomment: 1, parentCommentId: 1 }
      );
      if (!parent) {
        return res.status(404).json({ error: "Parent comment not found" });
      }

      if (parent.subcomment) {
        let newComment = new videoComment({
          userId,
          videoId,
          comment,
          parentCommentId: parent.parentCommentId,
          subcomment: true,
        });
        newComment = await newComment.save();
        await videoComment.updateOne(
          { _id: parent.parentCommentId },
          {
            $push: { subcomments: newComment._id },
            $inc: { subcommentsNumber: 1 },
          }
        );
      } else {
        let newComment = new videoComment({
          userId,
          videoId,
          comment,
          parentCommentId: parent._id,
          subcomment: true,
        });
        newComment = await newComment.save();
        await videoComment.updateOne(
          { _id: parent._id },
          {
            $push: { subcomments: newComment._id },
            $inc: { subcommentsNumber: 1 },
          }
        );
      }
      await Video.updateOne(
        { videoId },
        {
          $inc: { commentsCount: 1 },
        }
      );
    }
    return res.status(200).json({ message: "Add comment successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// const addComment = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const { videoId } = req.query;
//     const { comment } = req.body;
//     if (!videoId) {
//       return res.status(400).json({ error: "Video ID is required." });
//     }
//     if (!comment || comment.length == 0) {
//       return res.status(400).json({ error: "Comment is required." });
//     }

//     const existingVideo = await Video.findOne(
//       { videoId },
//       { commentsCount: 1 }
//     );
//     if (!existingVideo) {
//       return res.status(404).json({ error: "Video not found" });
//     }

//     const data = { value: comment };
//     const url = "https://moderationapi.com/api/v1/moderate/text";
//     const analysis = await axios.post(url, data, {
//       headers: {
//         Authorization: `Bearer ${process.env.MODERATION_KEY}`,
//         "Content-Type": "application/json",
//       },
//     });
//     if (analysis.data.flagged) {
//       return res
//         .status(400)
//         .json({ error: "Comment contains restricted content." });
//     }

//     let newComment = new videoComment({
//       userId,
//       videoId,
//       comment,
//     });
//     newComment = await newComment.save();

//     await Video.updateOne(
//       { videoId },
//       {
//         $push: { comments: newComment._id },
//         $inc: { commentsCount: 1 },
//       }
//     );
//     return res.status(200).json({ message: "add comment successfully" });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// };

const editComment = async (req, res) => {
  try {
    const { videoId, commentId } = req.query;
    const { newComment } = req.body;
    if (!videoId) {
      return res.status(400).json({ error: "Video ID is required." });
    }
    if (!commentId) {
      return res.status(400).json({ error: "Comment ID is required." });
    }
    if (!newComment || newComment.length == 0) {
      return res.status(400).json({ error: "New Comment is required." });
    }

    const existingVideo = await Video.findOne({ videoId }, { _id: 1 });
    if (!existingVideo) {
      return res.status(404).json({ error: "Video not found" });
    }

    const data = { value: newComment };
    const url = "https://moderationapi.com/api/v1/moderate/text";
    const analysis = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${process.env.MODERATION_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (analysis.data.flagged) {
      return res
        .status(400)
        .json({ error: "New Comment contains restricted content." });
    }

    await videoComment.updateOne(
      { _id: commentId },
      { $set: { comment: newComment } }
    );

    return res.status(200).json({ message: "edit comment successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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

const showVideoReactions = async (req, res) => {
  try {
    const { reactionsSkip, videoId } = req.query;
    if (!videoId) {
      return res.status(400).json({ error: "Video ID is required." });
    }

    let existingVideo;
    if (reactionsSkip > 0) {
      existingVideo = await Video.aggregate([
        { $match: { videoId } },
        {
          $project: {
            reactions: { $slice: ["$reactions", reactionsSkip * 10, 10] },
          },
        },
      ]);
      existingVideo = existingVideo[0];
    } else {
      existingVideo = await Video.aggregate([
        { $match: { videoId } },
        { $addFields: { reactions: { $slice: ["$reactions", 0, 10] } } },
      ]);
      existingVideo = existingVideo[0];
    }
    if (!existingVideo || existingVideo.length == 0) {
      return res.status(400).json({ error: "Video not found" });
    }

    let fullData = [];
    for (let i = 0; i < existingVideo.reactions.length; i++) {
      let reaction = await videoReaction.findById(existingVideo.reactions[i]);
      if (reaction) {
        fullData.push(reaction);
      }
    }

    return res.status(200).json({ fullData });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const addReaction = async (req, res) => {
  try {
    const userId = req.userId;
    const { videoId } = req.query;
    const { reaction } = req.body;
    if (!videoId) {
      return res.status(400).json({ error: "Video ID is required." });
    }
    if (!reaction || reaction.length == 0) {
      return res.status(400).json({ error: "Reaction is required." });
    }

    const existingVideo = await Video.findOne(
      { videoId },
      { reactionsCount: 1 }
    );
    if (!existingVideo) {
      return res.status(400).json({ error: "Video not found" });
    }

    let newReaction = new videoReaction({
      userId,
      videoId,
      reaction,
    });
    newReaction = await newReaction.save();

    await Video.updateOne(
      { videoId },
      {
        $push: { reactions: newReaction._id },
        $inc: { reactionsCount: 1 },
      }
    );
    return res.status(200).json({ message: "add reaction successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteReaction = async (req, res) => {
  try {
    const { videoId, reactionId } = req.query;
    if (!videoId) {
      return res.status(400).json({ error: "Video ID is required." });
    }
    if (!reactionId) {
      return res.status(400).json({ error: "Reaction ID is required." });
    }

    const existingVideo = await Video.findOne(
      { videoId },
      { reactionsCount: 1 }
    );
    if (!existingVideo) {
      return res.status(404).json({ error: "Video not found" });
    }

    await videoReaction.deleteOne({ _id: reactionId });

    await Video.updateOne(
      { videoId },
      {
        $pull: { reactions: reactionId },
        $inc: { reactionsCount: -1 },
      }
    );

    return res.status(200).json({ message: "delete reaction successfully" });
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
};
