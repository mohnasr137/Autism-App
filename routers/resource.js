// packages
const express = require("express");

// imports
const {seeAllWebsites} = require("../controllers/home/resource")

// init
const resourceRouter = express.Router();

// routers
resourceRouter.get("/seeAllWebsites", seeAllWebsites);

// exports
module.exports = resourceRouter;
