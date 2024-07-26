// packages
const axios = require("axios");

// init
const SERPAPI_KEY = process.env.SERPAPI_KEY;
const defaultSearch = "autism";

// routers
const seeAllWebsites = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    if (!page) {
      return res.status(200).json({ message: "please enter page number" });
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

    return res.status(200).json({ fullData });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ message: error.message });
  }
};

// exports
module.exports = {
  seeAllWebsites,
};
