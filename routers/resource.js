// packages
import express from "express";

// imports
import {
  onlineWebsites,
  offlineWebsites,
  addWebsites,
  showFavorite,
  addFavorite,
  deleteFavorite,
} from "../controllers/app/resourceController.js";

// init
const resourceRouter = express.Router();

// routers
// resourceRouter.get("/showAllWebsites", onlineWebsites);
resourceRouter.get("/showAllWebsites", offlineWebsites);
resourceRouter.post("/addWebsites", addWebsites);
resourceRouter.get("/favorite/show", showFavorite);
resourceRouter.post("/favorite/add", addFavorite);
resourceRouter.delete("/favorite/delete", deleteFavorite);

// exports
export default resourceRouter;
