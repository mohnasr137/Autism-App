const express = require("express");
const core = require("cors");
const app = express();


app.use(bodyParser.json());

// init
const testRouter = express.Router();

// routers



let questions = [
  { id: 1, question: 'What is your favorite programming language?',
    answers: ['Java', 'JavaScript', 'Python', 'C#']
   },
  { id: 2, question: 'What is the capital of France?',
    answers: ['Paris', 'London', 'Berlin', 'Madrid']
  },
  { id: 2, question: 'What is the capital of France?',
    answers: ['Paris', 'London', 'Berlin', 'Madrid']
  }
]
 
testRouter.get("/getFormData", (req, res) => {
  res.json(questions);
});

testRouter.post("/postFormData", (req, res) => {
  const { answers } = req.body;

  // Basic validation
  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ message: 'Invalid data' });
  }

  const newQuestion = {
    id: questions.length + 1,
    answers
  };

  questions.push(newQuestion);
  console.log(newQuestion);
  res.status(201).json({ message: 'Data received', question: newQuestion });
});

module.exports = testRouter