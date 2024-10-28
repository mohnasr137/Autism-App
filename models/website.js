import mongoose from "mongoose";

const websiteSchema = mongoose.Schema({
  title: {
    required: true,
    type: String,
    trim: true,
  },
  snippet: {
    type: String,
    trim: true,
  },
  link: {
    required: true,
    type: String,
    trim: true,
  },
  thumbnail: {
    type: String,
    trim: true,
  },
  favicon: {
    type: String,
    trim: true,
  },
  source: {
    type: String,
    trim: true,
  },
});

const Website = mongoose.model("website", websiteSchema);
export default Website;
