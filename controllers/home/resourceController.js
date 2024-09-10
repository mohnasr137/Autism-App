// packages
import axios from "axios";

// imports
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
      console.log(website);
      website = new Website({
        // position: website.position,
        pageNum: page,
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
    const page = parseInt(req.query.page);
    if (!page) {
      return res.status(200).json({ error: "Please enter page number" });
    }
    if (page == 0) {
      return res.status(200).json({ error: "Invalid page number" });
    }
    if (page > 20) {
      return res.status(404).json({ error: "page not found" });
    }

    const fullData = await Website.aggregate([{ $match: { pageNum: page } }]);

    return res.status(200).json({ fullData });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export { onlineWebsites, offlineWebsites };
