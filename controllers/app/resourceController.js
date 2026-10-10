// packages
import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// imports
import User from "../../models/user.js";
import Website from "../../models/website.js";

// init
const SERPAPI_KEY = process.env.SERPAPI_KEY;
const defaultSearch = "autism";

// routers
const onlineWebsites = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || 1, 10));
    const start = (page - 1) * 10;
    const numResults = 10;

    if (!SERPAPI_KEY) {
      console.warn("SERPAPI_KEY is not configured; falling back to offline stored websites.");
      const fullData = await Website.aggregate([{ $sample: { size: numResults } }]);
      return res.status(200).json({ status: true, fullData });
    }

    const url = `https://serpapi.com/search?api_key=${SERPAPI_KEY}&q=${encodeURIComponent(defaultSearch)}&gl=us&hl=en&safe=active&start=${start}&num=${numResults}`;
    const response = await axios.get(url);

    const fullData = (response.data.organic_results || []).map((item) => ({
      position: item.position,
      title: item.title,
      snippet: item.snippet,
      link: item.link,
      thumbnail: item.thumbnail,
      favicon: item.favicon,
      source: item.source,
    }));

    for (const website of fullData) {
      if (website.link) {
        await Website.updateOne(
          { link: website.link },
          { $set: website },
          { upsert: true }
        );
      }
    }

    return res.status(200).json({ status: true, fullData });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const offlineWebsites = async (req, res) => {
  try {
    const size = Math.max(1, parseInt(req.query.number || 10, 10));
    const totalCount = await Website.countDocuments();

    if (totalCount === 0) {
      return res.status(200).json({ status: true, fullData: [] });
    }

    const sampleSize = Math.min(size, totalCount);
    const fullData = await Website.aggregate([{ $sample: { size: sampleSize } }]);

    return res.status(200).json({ status: true, fullData });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const addWebsites = async (req, res) => {
  try {
    const { fullData } = req.body;
    if (!fullData || !Array.isArray(fullData)) {
      return res.status(400).json({ status: false, error: "fullData array is required" });
    }

    for (const website of fullData) {
      if (website.link) {
        await Website.updateOne(
          { link: website.link },
          { $set: website },
          { upsert: true }
        );
      }
    }

    return res.status(200).json({ status: true, fullData });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
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
          favoriteWebsites: {
            $slice: [
              { $reverseArray: "$favoriteWebsites" },
              favoriteSkip * 20,
              20,
            ],
          },
        },
      },
    ]);
    list = list[0];

    if (!list || !list.favoriteWebsites || list.favoriteWebsites.length === 0) {
      return res.status(200).json({ status: true, message: [] });
    }

    const listDetails = await Promise.all(
      list.favoriteWebsites.map(async (element) => {
        const websiteData = await Website.findOne({ _id: element });
        return websiteData;
      })
    );
    return res.status(200).json({ status: true, message: listDetails.filter(Boolean) });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const addFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const { websiteId } = req.query;
    if (!websiteId) {
      return res.status(400).json({ status: false, error: "Website ID is required." });
    }
    const existingWebsite = await Website.findOne(
      { _id: websiteId },
      { _id: 1 }
    );

    if (!existingWebsite) {
      return res.status(404).json({ status: false, error: "Website not found" });
    }

    await User.updateOne(
      { _id: userId },
      { $addToSet: { favoriteWebsites: websiteId } }
    );

    return res.status(200).json({ status: true, message: "add favorite successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const deleteFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const { websiteId } = req.query;
    if (!websiteId) {
      return res.status(400).json({ status: false, error: "Website ID is required." });
    }

    const existingWebsite = await Website.findOne(
      { _id: websiteId },
      { _id: 1 }
    );
    if (!existingWebsite) {
      return res.status(404).json({ status: false, error: "Website not found" });
    }

    await User.updateOne(
      { _id: userId },
      { $pull: { favoriteWebsites: websiteId } }
    );

    return res.status(200).json({ status: true, message: "delete favorite successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

export {
  onlineWebsites,
  offlineWebsites,
  addWebsites,
  showFavorite,
  addFavorite,
  deleteFavorite,
};
