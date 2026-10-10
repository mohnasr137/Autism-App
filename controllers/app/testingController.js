import axios from "axios";
import { google } from "googleapis";
import FormData from "form-data";
import PDFDocument from "pdfkit";
// import { GoogleGenerativeAI } from "@google/generative-ai";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import testSample from "../../models/testSample.js";
import User from "../../models/user.js";

// const genAI = new GoogleGenerativeAI(process.env.GENERATIVE_AI_API_KEY);
// const GenerativeAI = async (buffer, type, prompt) => {
//   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//   const imagePart = {
//     inlineData: {
//       data: buffer.toString("base64"),
//       mimeType: type,
//     },
//   };
//   const result = await model.generateContent([prompt, imagePart]);
//   const response = result.response;
//   return response.text() == "1" ? true : false;
// };

const youtube = google.youtube({
  version: "v3",
  auth: process.env.API_KEY,
});
const ML_API_URL = process.env.ML_API_URL || "http://localhost:5000";
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
    const questions = [q1, q2, q3, q4, q5, q6, q7, q8, q9, q10];

    for (let i = 0; i < questions.length; i++) {
      const allowedValues = {
        0: questionsAndAnswers[i].mapping["Never"],
        1: questionsAndAnswers[i].mapping["Always"],
        yes: questionsAndAnswers[i].mapping["Always"],
        no: questionsAndAnswers[i].mapping["Never"],
      };

      const q = questions[i];
      if (q == null) {
        return res.status(400).json({
          error: `Question ${
            i + 1
          } is required (must be 0, 1, "yes", or "no").`,
        });
      }

      const normalizedQ = typeof q === "string" ? q.toLowerCase() : q;

      if (!(normalizedQ in allowedValues)) {
        return res.status(400).json({
          error: `Question ${i + 1} must be 0, 1, "yes", or "no".`,
        });
      }

      questions[i] = allowedValues[normalizedQ];
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
            questions[0],
            questions[1],
            questions[2],
            questions[3],
            questions[4],
            questions[5],
            questions[6],
            questions[7],
            questions[8],
            questions[9],
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
        console.log(data);
        response = await axios.post(`${ML_API_URL}/predict`, data, {
          headers: {
            "Content-Type": "application/json",
          },
        });
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
    let hasAutism = response.data.prediction == 1 ? "ASD" : "Non-ASD";

    return res.json({
      message: "Form Test successfully",
      data: hasAutism,
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
        response = await axios.post(`${ML_API_URL}/childFace`, form, {
          headers: {
            ...form.getHeaders(),
          },
        });
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
    let hasAutism = response.data.prediction == 1 ? "ASD" : "Non-ASD";

    return res.json({
      message: "ChildFace Test successfully",
      data: hasAutism,
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
        response = await axios.post(`${ML_API_URL}/drawing`, form, {
          headers: {
            ...form.getHeaders(),
          },
        });
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
        response = await axios.post(`${ML_API_URL}/coloring`, form, {
          headers: {
            ...form.getHeaders(),
          },
        });
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
    let hasAutism = response.data.prediction == 0 ? "ASD" : "Non-ASD";

    return res.json({
      message: "Coloring Test successfully",
      data: hasAutism,
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
        response = await axios.post(`${ML_API_URL}/handWriting`, form, {
          headers: {
            ...form.getHeaders(),
          },
        });
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
    let hasAutism = response.data.prediction == 0 ? "ASD" : "Non-ASD";

    return res.json({
      message: "HandWriting Test successfully",
      data: hasAutism,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const testResult = async (req, res) => {
  try {
    const userId = req.userId;
    const userTest = await User.findOne({ _id: userId }, { activeTest: 1 });
    if (!userTest || userTest.activeTest === "no activeTest") {
      return res.status(404).json({ status: false, error: "Active test not found" });
    }

    const test = await testSample.findOne(
      { _id: userTest.activeTest },
      { form: 1, childFace: 1, drawing: 1, coloring: 1, handWriting: 1 }
    );
    if (!test) {
      return res.status(404).json({ status: false, error: "Test sample not found" });
    }

    const metricKeys = ["form", "childFace", "drawing", "coloring", "handWriting"];
    let testScore = 0;
    let completedMetrics = 0;

    for (const key of metricKeys) {
      const val = test[key];
      if (val === undefined || val === -1) {
        continue;
      }
      completedMetrics++;
      if (val === 0) {
        testScore -= (acc[key] || 80);
      } else {
        testScore += (acc[key] || 80);
      }
    }

    const calculatedResult = testScore > 0 ? 1 : 0;

    await testSample.updateOne(
      { _id: userTest.activeTest },
      { result: calculatedResult }
    );
    await User.updateOne(
      { _id: userId },
      { $push: { testHistory: userTest.activeTest } }
    );
    await User.updateOne(
      { _id: userId },
      { $set: { activeTest: "no activeTest" } }
    );

    return res.status(200).json({
      status: true,
      message: "Testing successfully",
      testResult: calculatedResult,
      testId: userTest.activeTest,
      completedMetrics,
    });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const resultPdf = async (req, res) => {
  try {
    const { testId } = req.query;
    if (!testId) {
      return res.status(400).json({ status: false, error: "Test ID is required." });
    }
    const test = await testSample.findOne(
      { _id: testId },
      {
        form: 1,
        childFace: 1,
        drawing: 1,
        coloring: 1,
        handWriting: 1,
        name: 1,
        age: 1,
        gender: 1,
        result: 1,
        createdAt: 1,
      }
    );
    if (!test) {
      return res.status(404).json({ status: false, error: "Test sample not found" });
    }

    const numberToString = (x) => {
      if (x === -1 || x === undefined) {
        return "Not Conducted";
      } else {
        return x === 1 ? "Positive (ASD)" : "Negative (Non-ASD)";
      }
    };
    const testString = {
      form: numberToString(test.form),
      childFace: numberToString(test.childFace),
      drawing: numberToString(test.drawing),
      coloring: numberToString(test.coloring),
      handWriting: numberToString(test.handWriting),
    };

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Autismo_Report_${testId}.pdf`
    );
    doc.pipe(res);

    // Header
    doc.fontSize(22).font("Helvetica-Bold").text("Autismo", { align: "center" });
    doc.fontSize(14).font("Helvetica").text("Diagnostic Screening Assessment Report", { align: "center" });
    doc.moveDown(1.5);

    // Subject Details
    doc.fontSize(11).font("Helvetica-Bold").text("Assessment Details:");
    doc.font("Helvetica").fontSize(10);
    doc.text(`Patient / Child Name: ${test.name || "N/A"}`);
    doc.text(`Age: ${test.age || "N/A"} | Gender: ${test.gender || "N/A"}`);
    doc.text(`Assessment Date: ${test.createdAt ? new Date(test.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}`);
    doc.text(`Overall Screening Verdict: ${test.result === 1 ? "Positive (ASD Indicated)" : test.result === 0 ? "Negative (Non-ASD Indicated)" : "Inconclusive"}`);
    doc.moveDown(1.5);

    // Table Data
    const headers = ["Test Modality", "Model Benchmark", "Evaluation Result"];
    const data = [
      ["Questionnaire (AQ-10)", `${acc.form}%`, testString.form],
      ["Facial Features", `${acc.childFace}%`, testString.childFace],
      ["Drawing Analysis", `${acc.drawing}%`, testString.drawing],
      ["Coloring Analysis", `${acc.coloring}%`, testString.coloring],
      ["Handwriting Analysis", `${acc.handWriting}%`, testString.handWriting],
    ];

    const columnWidths = [180, 140, 180];
    const startX = 50;
    let startY = 240;
    const cellHeight = 32;

    const drawRow = (row, y, isHeader = false) => {
      let x = startX;
      doc.font(isHeader ? "Helvetica-Bold" : "Helvetica").fontSize(10);
      row.forEach((cell, index) => {
        const textWidth = doc.widthOfString(cell);
        const textX = x + (columnWidths[index] - textWidth) / 2;
        const textY = y + (cellHeight - doc.currentLineHeight()) / 2;
        doc.text(cell, textX, textY, { width: columnWidths[index] });
        x += columnWidths[index];
      });
    };

    drawRow(headers, startY, true);

    doc
      .moveTo(startX, startY + cellHeight)
      .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), startY + cellHeight)
      .stroke();

    data.forEach((row, rowIndex) => {
      const currentY = startY + (rowIndex + 1) * cellHeight;
      drawRow(row, currentY, false);
      doc
        .moveTo(startX, currentY + cellHeight)
        .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), currentY + cellHeight)
        .stroke();
    });

    // Medical Disclaimer Footer
    const footerY = startY + (data.length + 2) * cellHeight;
    doc
      .fontSize(9)
      .font("Helvetica-Oblique")
      .text(
        "Important Notice: Autismo is an AI-powered supportive early-screening instrument. Findings in this report do not represent a definitive medical diagnosis. For clinical confirmation and therapeutic guidance, please consult a certified developmental pediatrician or neurologist.",
        50,
        footerY,
        { width: 500, align: "center" }
      );

    doc.end();
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const recommendVideos = async (req, res) => {
  try {
    const { testId } = req.query;
    if (!testId) {
      return res.status(400).json({ status: false, error: "Test ID is required." });
    }

    const existingTest = await testSample.findOne(
      { _id: testId },
      { result: 1 }
    );
    if (!existingTest) {
      return res.status(404).json({ status: false, error: "Test sample not found" });
    }

    let text = existingTest.result === 1 ? "autism therapy intervention" : `"autism" && "awareness"`;
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
      (videos.data.items || []).map(async (item) => {
        let channelSnippet = {};
        try {
          const channel = await youtube.channels.list({
            part: "snippet",
            id: item.snippet.channelId,
          });
          if (channel.data.items && channel.data.items.length > 0) {
            channelSnippet = channel.data.items[0];
          }
        } catch (chErr) {
          console.warn("Channel lookup error:", chErr.message);
        }

        const videoData = {
          id: item.id,
          title: item.snippet.title,
          publishedAt: item.snippet.publishedAt,
          thumbnails: item.snippet.thumbnails,
          url: `https://www.youtube.com/watch?v=${item.id.videoId || item.id}`,
        };

        const channelData = {
          id: channelSnippet.id || item.snippet.channelId,
          title: channelSnippet.snippet ? channelSnippet.snippet.title : item.snippet.channelTitle,
          thumbnails: channelSnippet.snippet ? channelSnippet.snippet.thumbnails : null,
          url: channelSnippet.snippet?.customUrl
            ? `https://www.youtube.com/${channelSnippet.snippet.customUrl}`
            : `https://www.youtube.com/channel/${item.snippet.channelId}`,
        };

        return {
          video: videoData,
          vedio: videoData,
          channel: channelData,
        };
      })
    );
    return res.status(200).json({ status: true, fullData });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const showAllHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const historySkip = Math.max(0, parseInt(req.query.historySkip || 0, 10));

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

    if (!list || !list.testHistory || list.testHistory.length === 0) {
      return res.status(200).json({ status: true, message: [] });
    }

    const listDetails = await Promise.all(
      list.testHistory.map(async (element) => {
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
    return res.status(200).json({ status: true, message: listDetails.filter(Boolean) });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const deleteHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { testId } = req.query;
    if (!testId) {
      return res.status(400).json({ status: false, error: "testId is required." });
    }

    const existingTest = await testSample.findOne({ _id: testId }, { _id: 1 });
    if (!existingTest) {
      return res.status(404).json({ status: false, error: "Test not found" });
    }

    await User.updateOne({ _id: userId }, { $pull: { testHistory: testId } });
    await testSample.deleteOne({ _id: testId });

    return res
      .status(200)
      .json({ status: true, message: "delete test history successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
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
