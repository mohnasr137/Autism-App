const jwt = require("jsonwebtoken");
const User = require("../models/user");
const url = process.env.API_URL;

const authJwt = async (req, res, next) => {
  try {
    const arr = [
      { url: `${url}/auth/signUp`, method: "POST" },
      { url: `${url}/auth/signIn`, method: "POST" },
      { url: `${url}/can`, method: "POST" },
    ];
    for (let i = 0; i < arr.length; i++) {
      if (req.url === arr[i].url && req.method === arr[i].method) {
        return next();
      }
    }
    let token = req.body.token;
    // if(token === undefined){
    //   token = req.url.replace(`${url}/auth/verify/`, "");;
    // }
    if (!token) {
      return res.status(500).json("no token");
    }
    const isVerify = jwt.verify(token, process.env.SECRET);
    if (!isVerify) {
      return res.status(500).json("not verify");
    }
    const user = await User.findById(isVerify.id);
    if(!user){
      return res.status(500).json("fake user");
    }
    // res.locals.id = isVerify.id;
    return next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = authJwt;
