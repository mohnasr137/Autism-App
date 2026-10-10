// packages
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import dotenv from "dotenv";
dotenv.config();

// init
const api_url = process.env.API_URL || "/api/v1";
const tokenRegex = new RegExp(`^${api_url}/auth/token/.+$`);

const publicRoutes = [
  { url: `${api_url}/auth/signUp`, method: "POST" },
  { url: `${api_url}/auth/signIn`, method: "POST" },
  { url: `${api_url}/auth/sendPassEmail`, method: "POST" },
  { url: `${api_url}/auth/activeResetPass`, method: "POST" },
  { url: `${api_url}/auth/resetPassword`, method: "POST" },
  { url: `${api_url}/resource/showAllWebsites`, method: "GET" },
  { url: `${api_url}/portfolio/aboutApp`, method: "GET" },
  { url: `${api_url}/portfolio/frequentQuestions`, method: "GET" },
  { url: `${api_url}/portfolio/legalInformation`, method: "GET" },
  { url: `${api_url}/data`, method: "GET" },
  { url: tokenRegex, method: "GET" },
];

// middleware
const authJwt = async (req, res, next) => {
  try {
    // Allow CORS preflight requests
    if (req.method === "OPTIONS") {
      return next();
    }

    const { url: reqUrl, method: reqMethod } = req;
    for (const element of publicRoutes) {
      if (element.method !== reqMethod) continue;

      if (typeof element.url === "string") {
        const baseUrl = reqUrl.split("?")[0];
        if (baseUrl === element.url) {
          return next();
        }
      } else if (element.url instanceof RegExp && element.url.test(reqUrl)) {
        return next();
      }
    }

    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ status: false, error: "No token provided" });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ status: false, error: "Invalid token format. Expected Bearer <token>" });
    }

    const token = parts[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET);
    } catch (jwtError) {
      return res.status(401).json({
        status: false,
        error: jwtError.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({ status: false, error: "Token verification failed" });
    }

    const existingUser = await User.findById(decoded.id);
    if (!existingUser) {
      return res.status(404).json({ status: false, error: "User not found" });
    }

    if (existingUser.verify === false) {
      return res.status(403).json({ status: false, error: "User email not verified" });
    }

    req.userId = decoded.id;
    req.user = existingUser;
    return next();
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

export default authJwt;
