// packages
const express = require("express");

// imports
const { showAllWebsites } = require("../controllers/home/resource");

// init
const resourceRouter = express.Router();

// routers
resourceRouter.get("/showAllWebsites", showAllWebsites);

// exports
module.exports = resourceRouter;
