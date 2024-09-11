// packages
import express from "express";
import multer from "multer";

// imports
import {
  userData,
  getForm,
  postForm,
  childFace,
  drawing,
  coloring,
  handWriting,
  testResult,
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
testingRouter.get("/form", getForm);
testingRouter.post("/form", postForm);
testingRouter.post("/childFace", upload.single("file"), childFace);
testingRouter.post("/drawing", upload.single("file"), drawing);
testingRouter.post("/coloring", upload.single("file"), coloring);
testingRouter.post("/handWriting", upload.single("file"), handWriting);
testingRouter.get("/testResult", testResult);

export default testingRouter;
