// packages
import express from "express";
import path from "path";
import mongoose from "mongoose";
import cors from "cors";
import { fileURLToPath } from "url";
import { promisify } from "util";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// imports
import authRouter from "./routers/auth.js";
import homeRouter from "./routers/home.js";
import testingRouter from "./routers/testing.js";
import communityRouter from "./routers/community.js";
import resourceRouter from "./routers/resource.js";
import portfolioRouter from "./routers/portfolio.js";
import authJwt from "./middlewares/jwt.js";

// init
const app = express();
const port = process.env.PORT;
const url = process.env.API_URL;
const connectionString = process.env.CONNECTION_STRING;
const readdirAsync = promisify(fs.readdir);

// middlewares
app.use(cors());
app.use(express.json());
app.use(
  `${url}/uploads`,
  express.static(path.join(__dirname, "images", "uploads"))
);
app.use(
  `${url}/portfolio`,
  express.static(path.join(__dirname, "images", "portfolio"))
);
app.use(authJwt);

// routers
app.use(`${url}/auth`, authRouter);
app.use(`${url}/home`, homeRouter);
app.use(`${url}/testing`, testingRouter);
app.use(`${url}/community`, communityRouter);
app.use(`${url}/resource`, resourceRouter);
app.use(`${url}/portfolio`, portfolioRouter);

app.use(`${url}/data`, async (req, res) => {
  try {
    const portfolio = path.join(__dirname, "images", "portfolio");
    const uploads = path.join(__dirname, "images", "uploads");

    const pfiles = await readdirAsync(portfolio, { withFileTypes: true });
    const portfolioFiles = pfiles.map((file) => file.name);

    const ufiles = await readdirAsync(uploads, { withFileTypes: true });
    const uploadsFiles = ufiles.map((file) => file.name);

    return res
      .status(200)
      .json({ portfolio: portfolioFiles, uploads: uploadsFiles });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.use(`/:error`, (req, res) => {
  const { error } = req.params;
  return res.send(
    `hi from error:- you write ( ${error} ) and there is no api like this`
  );
});

// connection
await mongoose
  .connect(connectionString)
  .then(() => {
    console.log("mongoose connection successfully");
  })
  .catch((err) => {
    console.log(err);
  });
app.listen(port, console.log(`server is listen on http://localhost:${port}`));
