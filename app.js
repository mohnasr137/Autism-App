// packages
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// imports
const authRouter = require("./routers/auth");
const homeRouter = require("./routers/home");
const authJwt = require("./middlewares/jwt");

// init
const app = express();
const port = process.env.PORT;
const url = process.env.API_URL;

// middlewares
app.use(cors());
app.options("*", cors());
app.use(express.json());
// app.use(authJwt);
// app.use(`${url}/images`, express.static(path.join(__dirname, "images")));

// routers
app.use(`${url}/auth`, authRouter);
app.use(`${url}/home`, homeRouter);
app.use(`/:error`, (req, res) => {
  const { error } = req.params;
  res.send(
    `hi from error:- you write ( ${error} ) and there is no api like this`
  );
});

// connection
mongoose
  .connect(process.env.CONNECTION_STRING)
  .then(() => {
    console.log("mongoose connection successfully");
  })
  .catch((err) => {
    console.log(err);
  });
app.listen(port, console.log(`server is listen on http://localhost:${port}`));
