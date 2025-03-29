// packages
import express from "express";
import multer from "multer";
import path from "path";

// imports
import {
  search,
  searchHistory,
  showAllPosts,
  showMyPosts,
  post,
  createPost,
  editPost,
  deletePost,
  showPostComments,
  addComment,
  editComment,
  deleteComment,
  showPostReactions,
  addReaction,
  deleteReaction,
} from "../controllers/app/communityController.js";

// init
const communityRouter = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/uploads/");
  },
  filename: (req, file, cb) => {
    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + code + ext);
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/gif" ||
      file.mimetype === "image/webp" ||
      file.mimetype === "image/svg+xml" ||
      file.mimetype === "image/bmp" ||
      file.mimetype === "image/tiff" ||
      file.mimetype === "image/x-icon" ||
      file.mimetype === "image/heic" ||
      file.mimetype === "image/heif"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// routers
communityRouter.get("/search", search);
communityRouter.get("/searchHistory", searchHistory);
communityRouter.get("/showAllPosts", showAllPosts);
communityRouter.get("/showMyPosts", showMyPosts);
communityRouter.get("/post", post);
communityRouter.post("/createPost", upload.array("files", 5), createPost);
communityRouter.patch("/editPost", upload.array("files", 5), editPost);
communityRouter.delete("/deletePost", deletePost);
communityRouter.get("/post/show/comments", showPostComments);
communityRouter.post("/post/add/comment", addComment);
communityRouter.patch("/post/edit/comment", editComment);
communityRouter.delete("/post/delete/comment", deleteComment);
communityRouter.get("/post/show/reactions", showPostReactions);
communityRouter.post("/post/add/reaction", addReaction);
communityRouter.delete("/post/delete/reaction", deleteReaction);

// exports
export default communityRouter;
