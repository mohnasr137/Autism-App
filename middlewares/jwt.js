// packages
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import dotenv from "dotenv";
dotenv.config();

// init
const api_url = process.env.API_URL;
const arr = [
  { url: `${api_url}/auth/signUp`, method: "POST" },
  { url: `${api_url}/auth/signIn`, method: "POST" },
  { url: `${api_url}/auth/sendPassEmail`, method: "POST" },
  { url: `${api_url}/auth/activeResetPass`, method: "POST" },
  { url: `${api_url}/auth/resetPassword`, method: "POST" },
  { url: `${api_url}/resource/showAllWebsites`, method: "GET" },
  { url: /^\/api\/v1\/auth\/token\/.+$/, method: "GET" },
];

// routers
const authJwt = async (req, res, next) => {
  try {
    const { url: reqUrl, method: reqMethod } = req;
    for (const element of arr) {
      if (element.method != reqMethod) continue;

      if (typeof element.url == "string") {
        const baseUrl = reqUrl.split("?")[0];
        if (baseUrl == element.url) {
          return next();
        }
      } else if (element.url instanceof RegExp && element.url.test(reqUrl)) {
        return next();
      }
    }

    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const isVerify = jwt.verify(token, process.env.SECRET);
    if (!isVerify) {
      return res.status(401).json({ error: "Token verification failed" });
    }
    const existingUser = await User.findById(isVerify.id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }
    if (existingUser.verify == false) {
      return res.status(400).json({ error: "User email not verified" });
    }

    req.userId = isVerify.id;
    return next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default authJwt;
