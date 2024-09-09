import axios from "axios";
import FormData from "form-data";

import testSample from "../../models/testSample.js";

const userData = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, autismRelation, gender, age, location, methods } = req.body;

    const test = new testSample({
      userId,
      name,
      autismRelation,
      gender,
      age,
      location,
      methods,
    });
    await test.save();

    return res.json({
      message: "Test sample created successfully",
      data: response.data.prediction,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const coloring = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const form = new FormData();
    form.append("image", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    const response = await axios.post(
      "https://flask-coloring-api-main.onrender.com/coloring",
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
      }
    );

    // await testSample.updateOne({ userId }, {});

    return res.json({
      message: "Coloring Test successfully",
      data: response.data.prediction,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const handWriting = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const form = new FormData();
    form.append("image", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    const response = await axios.post(
      "https://flask-handwriting-api-main.onrender.com/handWriting",
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
      }
    );

    return res.json({
      message: "HandWriting Test successfully",
      data: response.data.prediction,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const childFace = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const form = new FormData();
    form.append("image", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    const response = await axios.post(
      "https://flask-handwriting-api-main.onrender.com/handWriting",
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
      }
    );

    return res.json({
      message: "ChildFace Test successfully",
      data: response.data.prediction,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export { userData, coloring, handWriting, childFace };
