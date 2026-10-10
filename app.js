// packages
import express from "express";
import path from "path";
import mongoose from "mongoose";
import cors from "cors";
import { fileURLToPath } from "url";
import { promisify } from "util";
import fs from "fs";
import dotenv from "dotenv";
import ngrok from "ngrok";

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
const port = parseInt(process.env.PORT, 10) || 3000;
const url = process.env.API_URL || "/api/v1";
const connectionString = process.env.CONNECTION_STRING;
const readdirAsync = promisify(fs.readdir);

// ensure upload & portfolio directories exist
const uploadsDir = path.join(__dirname, "images", "uploads");
const portfolioDir = path.join(__dirname, "images", "portfolio");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(portfolioDir)) fs.mkdirSync(portfolioDir, { recursive: true });

// middlewares
app.use(cors());
app.use(express.json());
app.use(
  `${url}/uploads`,
  express.static(uploadsDir)
);
app.use(
  `${url}/portfolio`,
  express.static(portfolioDir)
);
app.use(authJwt);

// routers
app.use(`${url}/auth`, authRouter);
app.use(`${url}/home`, homeRouter);
app.use(`${url}/testing`, testingRouter);
app.use(`${url}/community`, communityRouter);
app.use(`${url}/resource`, resourceRouter);
app.use(`${url}/portfolio`, portfolioRouter);

// file list endpoint
app.get(`${url}/data`, async (req, res) => {
  try {
    const pfiles = await readdirAsync(portfolioDir, { withFileTypes: true });
    const portfolioFiles = pfiles.map((file) => file.name);

    const ufiles = await readdirAsync(uploadsDir, { withFileTypes: true });
    const uploadsFiles = ufiles.map((file) => file.name);

    return res.status(200).json({
      portfolio: portfolioFiles,
      uploads: uploadsFiles,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  return res.status(404).json({
    status: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    status: false,
    message: err.message || "Internal Server Error",
  });
});

// database connection & server start
const startServer = async () => {
  try {
    if (connectionString) {
      await mongoose.connect(connectionString);
      console.log("MongoDB connected successfully");
    } else {
      console.warn("CONNECTION_STRING environment variable is not defined");
    }

    app.listen(port, async () => {
      console.log(`Autismo server running on http://localhost:${port}`);

      if (process.env.ENABLE_NGROK === "true" && process.env.NGROK_AUTHTOKEN) {
        try {
          const tunnelUrl = await ngrok.connect({
            addr: port,
            authtoken: process.env.NGROK_AUTHTOKEN,
          });
          console.log(`Ngrok tunnel established: ${tunnelUrl}`);
        } catch (ngrokErr) {
          console.error("Ngrok tunnel connection failed:", ngrokErr.message);
        }
      }
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();

