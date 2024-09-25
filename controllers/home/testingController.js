import axios from "axios";
import FormData from "form-data";
import PDFDocument from "pdfkit";
import { GoogleGenerativeAI } from "@google/generative-ai";

import testSample from "../../models/testSample.js";
import User from "../../models/user.js";

const genAI = new GoogleGenerativeAI(process.env.GENERATIVE_AI_API_KEY);

const GenerativeAI = async (buffer, type) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt =
    "Does this image contain a child's face? Please respond with '1' for yes and '0' for no.";
  const imagePart = {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType: type,
    },
  };
  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  return response.text() == "1" ? true : false;
};

const acc = {
  form: 80,
  childFace: 80,
  drawing: 80,
  coloring: 90,
  handWriting: 90,
};

const questionsAndAnswers = [
  {
    q: "Does your child look at you when you call his/her name?",
    answers: ["Always", "Usually", "Sometimes", "Rarely", "Never"],
    mapping: {
      Always: 0,
      Usually: 0,
      Sometimes: 1,
      Rarely: 1,
      Never: 1,
    },
  },
  {
    q: "How easy is it for you to get eye contact with your child?",
    answers: ["Always", "Usually", "Sometimes", "Rarely", "Never"],
    mapping: {
      Always: 0,
      Usually: 0,
      Sometimes: 1,
      Rarely: 1,
      Never: 1,
    },
  },
  {
    q: "Does your child point to indicate that s/he wants something? (e.g., a toy that is out of reach)?",
    answers: ["Always", "Usually", "Sometimes", "Rarely", "Never"],
    mapping: {
      Always: 0,
      Usually: 0,
      Sometimes: 1,
      Rarely: 1,
      Never: 1,
    },
  },
  {
    q: "Does your child point to share interest with you? (e.g., pointing at an interesting sight)?",
    answers: ["Always", "Usually", "Sometimes", "Rarely", "Never"],
    mapping: {
      Always: 0,
      Usually: 0,
      Sometimes: 1,
      Rarely: 1,
      Never: 1,
    },
  },
  {
    q: "Does your child pretend? (e.g., care for dolls, talk on a toy phone)?",
    answers: ["Always", "Usually", "Sometimes", "Rarely", "Never"],
    mapping: {
      Always: 0,
      Usually: 0,
      Sometimes: 1,
      Rarely: 1,
      Never: 1,
    },
  },
  {
    q: "Does your child follow where you’re looking?",
    answers: ["Always", "Usually", "Sometimes", "Rarely", "Never"],
    mapping: {
      Always: 0,
      Usually: 0,
      Sometimes: 1,
      Rarely: 1,
      Never: 1,
    },
  },
  {
    q: "If you or someone else in the family is visibly upset, does your child show signs of wanting to comfort them? (e.g., stroking hair, hugging them)?",
    answers: ["Always", "Usually", "Sometimes", "Rarely", "Never"],
    mapping: {
      Always: 0,
      Usually: 0,
      Sometimes: 1,
      Rarely: 1,
      Never: 1,
    },
  },
  {
    q: "Would you describe your child’s first words as:",
    answers: ["Always", "Usually", "Sometimes", "Rarely", "Never"],
    mapping: {
      Always: 0,
      Usually: 0,
      Sometimes: 1,
      Rarely: 1,
      Never: 1,
    },
  },
  {
    q: "Does your child use simple gestures? (e.g., wave goodbye)?",
    answers: ["Always", "Usually", "Sometimes", "Rarely", "Never"],
    mapping: {
      Always: 0,
      Usually: 0,
      Sometimes: 1,
      Rarely: 1,
      Never: 1,
    },
  },
  {
    q: "Does your child stare at nothing with no apparent purpose?",
    answers: ["Always", "Usually", "Sometimes", "Rarely", "Never"],
    mapping: {
      Always: 1,
      Usually: 1,
      Sometimes: 1,
      Rarely: 0,
      Never: 0,
    },
  },
];

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
    return res.json({ questionsAndAnswers });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const postForm = async (req, res) => {
  try {
    const userId = req.userId;
    const { q1, q2, q3, q4, q5, q6, q7, q8, q9, q10 } = req.body;
    let questions = [q1, q2, q3, q4, q5, q6, q7, q8, q9, q10];
    const userTest = await User.findOne({ _id: userId }, { activeTest: 1 });
    if (userTest.activeTest == "") {
      return res.status(404).json({ error: "Active test not found" });
    }

    let questionsArr = [];
    for (let i = 0; i < questions.length; i++) {
      if (questions[i] == "yes" || questions[i] == "Yes") {
        questionsArr.push("Always");
      } else {
        questionsArr.push("Never");
      }
    }

    let answersArr = [];
    for (let i = 0; i < questionsAndAnswers.length; i++) {
      answersArr.push(questionsAndAnswers[i].mapping[questionsArr[i]]);
    }
    let sum = 0;
    for (let i of answersArr) {
      sum += i;
    }
    sum > 3 ? (sum = 1) : (sum = 0);

    await testSample.updateOne(
      { _id: userTest.activeTest },
      { $set: { form: sum } }
    );

    return res.json({
      message: "Form Test successfully",
      data: sum,
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
    const genText = await GenerativeAI(file.buffer, file.mimetype);
    if (!genText) {
      return res
        .status(400)
        .json({ error: "The image does not contain a child's face." });
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

const drawing = async (req, res) => {
  try {
    const userId = req.userId;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const genText = await GenerativeAI(file.buffer, file.mimetype);
    if (!genText) {
      return res
        .status(400)
        .json({ error: "The image does not contain a child's face." });
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

const coloring = async (req, res) => {
  try {
    const userId = req.userId;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const genText = await GenerativeAI(file.buffer, file.mimetype);
    if (!genText) {
      return res
        .status(400)
        .json({ error: "The image does not contain a child's face." });
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

const handWriting = async (req, res) => {
  try {
    const userId = req.userId;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const genText = await GenerativeAI(file.buffer, file.mimetype);
    if (!genText) {
      return res
        .status(400)
        .json({ error: "The image does not contain a child's face." });
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

    let testResult = 0;
    for (let [key, value] of Object.entries(test._doc)) {
      if (value == -1) {
        continue;
      }
      if (value == 0) {
        testResult -= acc[key];
      } else {
        testResult += acc[key];
      }
    }
    await testSample.updateOne(
      { _id: userTest.activeTest },
      { result: testResult }
    );

    if (testResult > 0) {
      testResult = 1;
    } else {
      testResult = 0;
    }

    return res.json({
      message: "Testing successfully",
      testResult,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const resultPdf = async (req, res) => {
  try {
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=generated.pdf");
    doc.pipe(res);

    doc
      .fontSize(20)
      .text("This is a sample PDF document generated from an API.", {
        align: "center",
      });

    doc.text("Here is some more content!", {
      align: "center",
      lineGap: 10,
    });

    doc
      .moveDown()
      .fontSize(12)
      .text("Generated by: Your API", { align: "left" });

    doc.end();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const recommendVideos = async (req, res) => {
  try {
    const userId = req.userId;
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
  resultPdf,
  recommendVideos,
};
