// packages
import express from "express";

// imports
import { showAllWebsites } from "../controllers/home/resourceController.js"

// init
const resourceRouter = express.Router();

// routers
resourceRouter.get("/showAllWebsites", showAllWebsites);

// exports
export default resourceRouter;
