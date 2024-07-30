// packages
const express = require("express");
const multer = require("multer");

// imports
const {
  createPost,
  showAllPosts,
  showPost,
} = require("../controllers/home/community");

// init
const communityRouter = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// routers
communityRouter.post("/createPost", upload.array("files", 5), createPost);
communityRouter.get("/showAllPosts", showAllPosts);
communityRouter.get("/showPost", showPost);

// exports
module.exports = communityRouter;
