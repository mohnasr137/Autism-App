// packages

// imports
import User from "../../models/user.js";

// init
const url = process.env.API_URL;

// routers
const imageUpload = async (req, res) => {
  try {
    const userId = req.userId;
    if (!req.file) {
      return res.status(400).json({ error: "File is required." });
    }
    const imagesPath =
      req.protocol +
      "://" +
      req.get("host") +
      `${url}/` +
      req.file.path.replace("images\\", "");

    await User.updateOne({ _id: userId }, { $set: { image: imagesPath } });

    return res.status(200).json({ message: "Image uploaded successfuly" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const userData = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findOne(
      { _id: userId },
      { name: 1, email: 1, gender: 1, dateOfBirth: 1, image: 1, type: 1 }
    );

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const editUserData = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, gender, dateOfBirth } = req.body;
    let query = {};

    if (name) {
      query.name = name;
    }
    if (gender) {
      query.gender = gender;
    }
    if (dateOfBirth) {
      const [year, month, day] = dateOfBirth.split("-").map(Number);
      query.dateOfBirth = new Date(Date.UTC(year, month - 1, day));
    }
    await User.updateOne({ _id: userId }, { $set: query });

    return res.status(200).json({ message: "User data updated successfuly" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const contactInfo = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findOne(
      { _id: userId },
      { address: 1, phone: 1, facebookLink: 1, linkedinLink: 1 }
    );

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const editContactInfo = async (req, res) => {
  try {
    const userId = req.userId;
    const { address, phone, facebookLink, linkedinLink } = req.body;
    let query = {};

    if (address) {
      query.address = address;
    }
    if (phone) {
      query.phone = phone;
    }
    if (facebookLink) {
      query.facebookLink = facebookLink;
    }
    if (linkedinLink) {
      query.linkedinLink = linkedinLink;
    }
    await User.updateOne({ _id: userId }, { $set: query });

    return res
      .status(200)
      .json({ message: "Contact Info updated successfuly" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export { imageUpload, userData, editUserData, contactInfo, editContactInfo };
