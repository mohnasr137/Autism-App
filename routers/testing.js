// packages
import express from "express";
import multer from "multer";

// imports
import {
  userData,
  coloring,
  handWriting,
  childFace,
} from "../controllers/home/testingController.js";

// init
const testingRouter = express.Router();
const storage = multer.memoryStorage();
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
testingRouter.post("/userData", userData);
testingRouter.post("/coloring", upload.single("file"), coloring);
testingRouter.post("/handWriting", upload.single("file"), handWriting);
testingRouter.post("/childFace", upload.single("file"), childFace);

export default testingRouter;
