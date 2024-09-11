import axios from "axios";
import FormData from "form-data";

import testSample from "../../models/testSample.js";
import User from "../../models/user.js";

const acc = {
  form: 80,
  childFace: 80,
  drawing: 80,
  coloring: 80,
  handWriting: 80,
};

const userData = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, autismRelation, gender, age, location, methods } = req.body;

    let test = new testSample({
      userId,
      name,
      autismRelation,
      gender,
      age,
      location,
      methods,
    });
    test = await test.save();

    await User.updateOne({ _id: userId }, { $set: { activeTest: test._id } });

    return res.json({ message: "Test sample created successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getForm = async (req, res) => {
  try {
    const userId = req.userId;
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const postForm = async (req, res) => {
  try {
    const userId = req.userId;
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const coloring = async (req, res) => {
  try {
    const userId = req.userId;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const userTest = await User.findOne({ _id: userId }, { activeTest: 1 });
    if (userTest.activeTest == "") {
      return res.status(404).json({ error: "Active test not found" });
    }

    let response;
    for (let i = 0; i < 3; i++) {
      try {
        const form = new FormData();
        form.append("image", file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
        response = await axios.post(
          "https://flask-coloring-api-main.onrender.com/coloring",
          form,
          {
            headers: {
              ...form.getHeaders(),
            },
          }
        );
        break;
      } catch (error) {
        if (i == 2) {
          return res.status(500).json({ error: error.message });
        }
        continue;
      }
    }

    await testSample.updateOne(
      { _id: userTest.activeTest },
      { $set: { coloring: response.data.prediction } }
    );

    return res.json({
      message: "Coloring Test successfully",
      data: response.data.prediction,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const drawing = async (req, res) => {
  try {
    const userId = req.userId;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const userTest = await User.findOne({ _id: userId }, { activeTest: 1 });
    if (userTest.activeTest == "") {
      return res.status(404).json({ error: "Active test not found" });
    }

    let response;
    for (let i = 0; i < 3; i++) {
      try {
        const form = new FormData();
        form.append("image", file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
        response = await axios.post(
          "https://flask-coloring-api-main.onrender.com/coloring",
          form,
          {
            headers: {
              ...form.getHeaders(),
            },
          }
        );
        break;
      } catch (error) {
        if (i == 2) {
          return res.status(500).json({ error: error.message });
        }
        continue;
      }
    }

    await testSample.updateOne(
      { _id: userTest.activeTest },
      { $set: { drawing: response.data.prediction } }
    );

    return res.json({
      message: "drawing Test successfully",
      data: response.data.prediction,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const handWriting = async (req, res) => {
  try {
    const userId = req.userId;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const userTest = await User.findOne({ _id: userId }, { activeTest: 1 });
    if (userTest.activeTest == "") {
      return res.status(404).json({ error: "Active test not found" });
    }

    let response;
    for (let i = 0; i < 3; i++) {
      try {
        const form = new FormData();
        form.append("image", file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
        response = await axios.post(
          "https://flask-handwriting-api-main.onrender.com/handWriting",
          form,
          {
            headers: {
              ...form.getHeaders(),
            },
          }
        );
        break;
      } catch (error) {
        if (i == 2) {
          return res.status(500).json({ error: error.message });
        }
        continue;
      }
    }

    await testSample.updateOne(
      { _id: userTest.activeTest },
      { $set: { handWriting: response.data.prediction } }
    );

    return res.json({
      message: "HandWriting Test successfully",
      data: response.data.prediction,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const childFace = async (req, res) => {
  try {
    const userId = req.userId;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const userTest = await User.findOne({ _id: userId }, { activeTest: 1 });
    if (userTest.activeTest == "") {
      return res.status(404).json({ error: "Active test not found" });
    }

    let response;
    for (let i = 0; i < 3; i++) {
      try {
        const form = new FormData();
        form.append("image", file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
        response = await axios.post(
          "https://flask-childface-api-main.onrender.com/childFace",
          form,
          {
            headers: {
              ...form.getHeaders(),
            },
          }
        );
        break;
      } catch (error) {
        if (i == 2) {
          return res.status(500).json({ error: error.message });
        }
        continue;
      }
    }

    await testSample.updateOne(
      { _id: userTest.activeTest },
      { $set: { childFace: response.data.prediction } }
    );

    return res.json({
      message: "ChildFace Test successfully",
      data: response.data.prediction,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const testResult = async (req, res) => {
  try {
    const userId = req.userId;
    const userTest = await User.findOne({ _id: userId }, { activeTest: 1 });
    if (userTest.activeTest == "") {
      return res.status(404).json({ error: "Active test not found" });
    }

    let test = await testSample.findOne(
      { _id: userTest.activeTest },
      { _id: 0, form: 1, childFace: 1, drawing: 1, coloring: 1, handWriting: 1 }
    );
    
    let result = 0;
    for (let [key, value] of Object.entries(test._doc)) {
      if (value == -1) {
        continue;
      }
      if (value == 0) {
        result -= acc[key];
      } else {
        result += acc[key];
      }
    }

    if (result > 0) {
      result = 1;
    } else {
      result = 0;
    }

    return res.json({
      message: "Testing successfully",
      result,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export {
  userData,
  getForm,
  postForm,
  childFace,
  drawing,
  coloring,
  handWriting,
  testResult,
};
