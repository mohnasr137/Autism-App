// packages
import axios from "axios";
import mongoose from "mongoose";

// imports
import User from "../../models/user.js";
import Website from "../../models/website.js";

// init
const SERPAPI_KEY = process.env.SERPAPI_KEY;
const defaultSearch = "autism";

// routers
const onlineWebsites = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    if (!page) {
      return res.status(200).json({ message: "Please enter page number" });
    }
    if (page == 0) {
      return res.status(200).json({ message: "Invalid page number" });
    }

    const start = (page - 1) * 10;
    const numResults = 10;
    const url = `https://serpapi.com/search?api_key=${SERPAPI_KEY}&q=${defaultSearch}&gl=us&hl=en&safe=active&start=${start}&num=${numResults}`;

    const response = await axios.get(url);
    const fullData = response.data.organic_results.map((item) => ({
      position: item.position,
      title: item.title,
      snippet: item.snippet,
      link: item.link,
      thumbnail: item.thumbnail,
      favicon: item.favicon,
      source: item.source,
    }));

    for (let website of fullData) {
      website = new Website({
        title: website.title,
        snippet: website.snippet,
        link: website.link,
        thumbnail: website.thumbnail,
        favicon: website.favicon,
        source: website.source,
      });
      await website.save();
    }

    return res.status(200).json({ fullData });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const offlineWebsites = async (req, res) => {
  try {
    const { number } = req.query;
    if (!number) {
      return res.status(200).json({ error: "Please enter number" });
    }
    if (number == 0) {
      return res.status(200).json({ error: "Invalid number" });
    }

    const fullData = await Website.aggregate([
      { $sample: { size: Number(number) } },
    ]);

    return res.status(200).json({ fullData });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const addWebsites = async (req, res) => {
  try {
    const { fullData } = req.body;

    for (let website of fullData) {
      website = new Website({
        title: website.title,
        snippet: website.snippet,
        link: website.link,
        thumbnail: website.thumbnail,
        favicon: website.favicon,
        source: website.source,
      });
      await website.save();
    }

    return res.status(200).json({ fullData });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const showFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const { favoriteSkip } = req.query;
    if (!favoriteSkip) {
      return res.status(400).json({ error: "favoriteSkip is required." });
    }

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

    const listDetails = await Promise.all(
      list.favoriteWebsites.map(async (element) => {
        const websiteData = await Website.findOne({ _id: element });
        return websiteData;
      })
    );
    return res.status(200).json({ message: listDetails });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const addFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const { websiteId } = req.query;
    if (!websiteId) {
      return res.status(400).json({ error: "Website ID is required." });
    }
    const existingWebsite = await Website.findOne(
      { _id: websiteId },
      { _id: 1 }
    );

    if (!existingWebsite) {
      return res.status(404).json({ error: "Website not found" });
    }

    await User.updateOne(
      { _id: userId },
      { $push: { favoriteWebsites: websiteId } }
    );

    return res.status(200).json({ message: "add favorite successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const { websiteId } = req.query;
    if (!websiteId) {
      return res.status(400).json({ error: "Website ID is required." });
    }

    const existingWebsite = await Website.findOne(
      { _id: websiteId },
      { _id: 1 }
    );
    if (!existingWebsite) {
      return res.status(404).json({ error: "Website not found" });
    }

    await User.updateOne(
      { _id: userId },
      { $pull: { favoriteWebsites: websiteId } }
    );

    return res.status(200).json({ message: "delete favorite successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
