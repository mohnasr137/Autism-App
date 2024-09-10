// packages
import express from "express";

// imports
import { offlineWebsites } from "../controllers/home/resourceController.js";

// init
const resourceRouter = express.Router();

// routers
resourceRouter.get("/showAllWebsites", offlineWebsites);

// exports
export default resourceRouter;
