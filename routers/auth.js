// packages
const express = require("express");

// imports
const { signUp, signIn } = require("../controllers/auth/basicAuth");
const { activeEmail } = require("../controllers/auth/verifyEmail");
const {
  sendPassEmail,
  activeResetPass,
  resetPassword,
} = require("../controllers/auth/resetPassword");

// init
const authRouter = express.Router();

// routers
authRouter.post("/signUp", signUp);
authRouter.post("/signIn", signIn);
authRouter.post("/sendPassEmail", sendPassEmail);
authRouter.post("/activeResetPass", activeResetPass);
authRouter.post("/resetPassword", resetPassword);
authRouter.get("/:token", activeEmail);

module.exports = authRouter;
