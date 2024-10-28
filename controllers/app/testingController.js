import axios from "axios";
import { google } from "googleapis";
import FormData from "form-data";
import PDFDocument from "pdfkit";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mongoose from "mongoose";

import testSample from "../../models/testSample.js";
import User from "../../models/user.js";

const genAI = new GoogleGenerativeAI(process.env.GENERATIVE_AI_API_KEY);
const GenerativeAI = async (buffer, type, prompt) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const imagePart = {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType: type,
    },
  };
  const result = await model.generateContent([prompt, imagePart]);
  const response = result.response;
  return response.text() == "1" ? true : false;
};

const youtube = google.youtube({
  version: "v3",
  auth: process.env.API_KEY,
});
const defaultRegionCode = "US";
const defaultRelevanceLanguage = "en";
const defaultVideoSyndicated = "true";
const defaultOrder = "relevance";

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
    if (!name || !autismRelation || !gender || !age || !location || !methods) {
      return res.status(400).json({
        error:
          "Name, autism relation, gender, age, location and methods are required.",
      });
    }

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

    const existingTest = await User.findOne({ _id: userId }, { activeTest: 1 });
    if (existingTest.activeTest != "no activeTest") {
      await testSample.deleteOne({ _id: existingTest.activeTest });
    }
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
    if (!q1 || !q2 || !q3 || !q4 || !q5 || !q6 || !q7 || !q8 || !q9 || !q10) {
      return res.status(400).json({
        error: "All questions are required.",
      });
    }
    const userTest = await User.findOne({ _id: userId }, { activeTest: 1 });
    if (userTest.activeTest == "no activeTest") {
      return res.status(404).json({ error: "Active test not found" });
    }

    let response;
    for (let i = 0; i < 3; i++) {
      try {
        const data = {
          data: [
            q1,
            q2,
            q3,
            q4,
            q5,
            q6,
            q7,
            q8,
            q9,
            q10,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
          ],
        };
        response = await axios.post(
          "https://flask-ml-28g3.onrender.com/predict",
          data,
          {
            headers: {
              "Content-Type": "application/json",
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
      { $set: { form: response.data.prediction } }
    );

    return res.json({
      message: "Form Test successfully",
      data: response.data.prediction,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// const postForm = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const { q1, q2, q3, q4, q5, q6, q7, q8, q9, q10 } = req.body;
//     let questions = [q1, q2, q3, q4, q5, q6, q7, q8, q9, q10];
//     const userTest = await User.findOne({ _id: userId }, { activeTest: 1 });
//     if (userTest.activeTest == "no activeTest") {
//       return res.status(404).json({ error: "Active test not found" });
//     }

//     let questionsArr = [];
//     for (let i = 0; i < questions.length; i++) {
//       if (questions[i] == "yes" || questions[i] == "Yes") {
//         questionsArr.push("Always");
//       } else {
//         questionsArr.push("Never");
//       }
//     }

//     let answersArr = [];
//     for (let i = 0; i < questionsAndAnswers.length; i++) {
//       answersArr.push(questionsAndAnswers[i].mapping[questionsArr[i]]);
//     }
//     let sum = 0;
//     for (let i of answersArr) {
//       sum += i;
//     }
//     sum > 3 ? (sum = 1) : (sum = 0);

//     await testSample.updateOne(
//       { _id: userTest.activeTest },
//       { $set: { form: sum } }
//     );

//     return res.json({
//       message: "Form Test successfully",
//       data: sum,
//     });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// };

const childFace = async (req, res) => {
  try {
    const userId = req.userId;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const prompt =
      "Does this image contain a child's face? Please respond with '1' for yes and '0' for no.";
    const genText = await GenerativeAI(file.buffer, file.mimetype, prompt);
    if (!genText) {
      return res
        .status(400)
        .json({ error: "The image does not contain a child's face." });
    }
    const userTest = await User.findOne({ _id: userId }, { activeTest: 1 });
    if (userTest.activeTest == "no activeTest") {
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
    const prompt =
      "Does this image contain a child's drawing? Please respond with '1' for yes and '0' for no.";
    const genText = await GenerativeAI(file.buffer, file.mimetype, prompt);
    if (!genText) {
      return res
        .status(400)
        .json({ error: "The image does not contain a child's drawing." });
    }
    const userTest = await User.findOne({ _id: userId }, { activeTest: 1 });
    if (userTest.activeTest == "no activeTest") {
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
    const prompt =
      "Does this image contain a child's coloring? Please respond with '1' for yes and '0' for no.";
    const genText = await GenerativeAI(file.buffer, file.mimetype, prompt);
    if (!genText) {
      return res
        .status(400)
        .json({ error: "The image does not contain a child's coloring." });
    }
    const userTest = await User.findOne({ _id: userId }, { activeTest: 1 });
    if (userTest.activeTest == "no activeTest") {
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
    const prompt =
      "Does this image contain a child's handwriting? Please respond with '1' for yes and '0' for no.";
    const genText = await GenerativeAI(file.buffer, file.mimetype, prompt);
    if (!genText) {
      return res
        .status(400)
        .json({ error: "The image does not contain a child's handwriting." });
    }
    const userTest = await User.findOne({ _id: userId }, { activeTest: 1 });
    if (userTest.activeTest == "no activeTest") {
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
    if (userTest.activeTest == "no activeTest") {
      return res.status(404).json({ error: "Active test not found" });
    }

    const test = await testSample.findOne(
      { _id: userTest.activeTest },
      { _id: 0, form: 1, childFace: 1, drawing: 1, coloring: 1, handWriting: 1 }
    );
    if (!test) {
      return res.status(404).json({ error: "Test sample not found" });
    }

    let testResult = 0;
    for (let [key, value] of Object.entries(test._doc)) {
      if (value == -1) {
        continue;
      } else if (value == 0) {
        testResult -= acc[key];
      } else {
        testResult += acc[key];
      }
    }
    testResult > 0 ? (testResult = 1) : (testResult = 0);

    await testSample.updateOne(
      { _id: userTest.activeTest },
      { result: testResult }
    );
    await User.updateOne(
      { _id: userId },
      { $push: { testHistory: userTest.activeTest } }
    );
    await User.updateOne(
      { _id: userId },
      { $set: { activeTest: "no activeTest" } }
    );

    return res.json({
      message: "Testing successfully",
      testResult,
      testId: userTest.activeTest,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const resultPdf = async (req, res) => {
  try {
    const { testId } = req.query;
    if (!testId) {
      return res.status(400).json({ error: "Test ID is required." });
    }
    const test = await testSample.findOne(
      { _id: testId },
      {
        form: 1,
        childFace: 1,
        drawing: 1,
        coloring: 1,
        handWriting: 1,
      }
    );
    if (!test) {
      return res.status(404).json({ error: "Test sample not found" });
    }

    const numberToString = (x) => {
      if (x == -1) {
        return "not used";
      } else {
        return x == 1 ? "autism" : "no autism";
      }
    };
    const testString = {
      form: numberToString(test.form),
      childFace: numberToString(test.childFace),
      drawing: numberToString(test.drawing),
      coloring: numberToString(test.coloring),
      handWriting: numberToString(test.handWriting),
    };

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=generated.pdf");
    doc.pipe(res);
    doc.moveDown(8);
    doc.fontSize(24).text("Testing Result", { align: "center" }).moveDown();
    doc.fontSize(18);

    const headers = ["Models", "Accuracy", "Result"];
    const data = [
      ["form", `${acc.form}%`, testString.form],
      ["child-face", `${acc.childFace}%`, testString.childFace],
      ["coloring", `${acc.coloring}%`, testString.coloring],
      ["handwriting", `${acc.handWriting}%`, testString.handWriting],
    ];

    const columnWidths = [160, 160, 160];
    const startX = 70;
    let startY = 260;
    const cellHeight = 40;

    const drawRow = (row, y) => {
      let x = startX;
      row.forEach((cell, index) => {
        const textWidth = doc.widthOfString(cell);
        const textX = x + (columnWidths[index] - textWidth) / 2;
        const textY = y + (cellHeight - doc.currentLineHeight()) / 2;

        doc.text(cell, textX, textY, { width: columnWidths[index] });
        x += columnWidths[index];
      });
    };
    drawRow(headers, startY);

    doc
      .moveTo(startX, startY + cellHeight)
      .lineTo(
        startX + columnWidths.reduce((a, b) => a + b, 0),
        startY + cellHeight
      )
      .stroke();

    data.forEach((row, rowIndex) => {
      const currentY = startY + (rowIndex + 1) * cellHeight;
      drawRow(row, currentY);
      doc
        .moveTo(startX, currentY + cellHeight)
        .lineTo(
          startX + columnWidths.reduce((a, b) => a + b, 0),
          currentY + cellHeight
        )
        .stroke();
    });

    doc
      .fontSize(12)
      .text(
        "Note: The accuracy of the system can be quite variable due to factors such as poor image quality or not following the provided guidelines. However, in most cases, the accuracy is generally around 90%.",
        85,
        480
      );

    doc.end();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const recommendVideos = async (req, res) => {
  try {
    const { testId } = req.query;
    if (!testId) {
      return res.status(400).json({ error: "Test ID is required." });
    }

    const existingTest = await testSample.findOne(
      { _id: testId },
      { result: 1 }
    );
    if (!existingTest) {
      return res.status(404).json({ error: "Test sample not found" });
    }

    let text = "";
    if (existingTest.result == 1) {
      text = "autism";
    } else {
      text = `"autism" && "Awareness"`;
    }
    let params = {
      part: "snippet",
      q: text,
      type: "video",
      maxResults: 10,
      regionCode: defaultRegionCode,
      relevanceLanguage: defaultRelevanceLanguage,
      videoSyndicated: defaultVideoSyndicated,
      order: defaultOrder,
    };

    const videos = await youtube.search.list(params);
    const fullData = await Promise.all(
      videos.data.items.map(async (item) => {
        const channel = await youtube.channels.list({
          part: "snippet",
          id: item.snippet.channelId,
        });
        return {
          vedio: {
            id: item.id,
            title: item.snippet.title,
            publishedAt: item.snippet.publishedAt,
            thumbnails: item.snippet.thumbnails,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          },
          channel: {
            id: channel.data.items[0].id,
            title: channel.data.items[0].snippet.title,
            thumbnails: channel.data.items[0].snippet.thumbnails,
            url: `https://www.youtube.com/${channel.data.items[0].snippet.customUrl}`,
          },
        };
      })
    );
    return res.status(200).json(fullData);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const showAllHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { historySkip } = req.query;
    if (!historySkip) {
      return res.status(400).json({ error: "historySkip is required." });
    }

    let list = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $project: {
          testHistory: {
            $slice: [{ $reverseArray: "$testHistory" }, historySkip * 10, 10],
          },
        },
      },
    ]);
    list = list[0];

    const listDetails = await Promise.all(
      list.videoHistory.map(async (element) => {
        const testData = await testSample.findOne(
          { _id: element },
          {
            form: 0,
            childFace: 0,
            drawing: 0,
            coloring: 0,
            handWriting: 0,
          }
        );
        return testData;
      })
    );
    return res.status(200).json({ message: listDetails });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { testId } = req.query;
    if (!testId) {
      return res.status(400).json({ error: "testId ID is required." });
    }

    const existingTest = await testSample.findOne({ testId }, { _id: 1 });
    if (!existingTest) {
      return res.status(404).json({ error: "test not found" });
    }

    await User.updateOne({ _id: userId }, { $pull: { testHistory: testId } });

    return res
      .status(200)
      .json({ message: "delete video history successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
  showAllHistory,
  deleteHistory,
};
