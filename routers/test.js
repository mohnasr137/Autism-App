const express = require("express");
const core = require("cors");
const app = express();


app.use(bodyParser.json());

// init
const testRouter = express.Router();


// routers

let questions = [
  { id: 1, question: 'I often notice small sounds when others do not?',
    autismAnswers: ['Definitely Agree', 'Slightly Agree'], 
    nonAutismAnsour: ['Slightly Agree', ' Definitely Disagree']
   },
  { id: 2, question: ' When I’m reading a story, I find it difficult to work out the characters’ intentions.?',
    autismAnswers: ['Definitely Agree', 'Slightly Agree'], 
    nonAutismAnsour: ['Slightly Agree', ' Definitely Disagree']
  },
  { id: 3, question: 'I find it easy to "read between the lines" when someone is talking to me?',
    autismAnswers: ['Definitely Agree', 'Slightly Agree'], 
    nonAutismAnsour: ['Slightly Agree', ' Definitely Disagree']
  },
  { id: 4, question: 'I usually concentrate more on the whole picture, rather than the small details?',
    autismAnswers: ['Definitely Agree', 'Slightly Agree'], 
    nonAutismAnsour: ['Slightly Agree', ' Definitely Disagree']
  },

  { id: 5, question: 'I know how to tell if someone listening to me is getting bored?',
    autismAnswers: ['Definitely Agree', 'Slightly Agree'], 
    nonAutismAnsour: ['Slightly Agree', ' Definitely Disagree']
  },

  { id: 6, question: 'I find it easy to do more than one thing at once?',
    autismAnswers: ['Definitely Agree', 'Slightly Agree'], 
    nonAutismAnsour: ['Slightly Agree', ' Definitely Disagree']
  }, 
  {
    id: 7, question: ' I find it easy to work out what someone is thinking or feeling just by looking at their face?',
    autismAnswers: ['Definitely Agree', 'Slightly Agree'], 
    nonAutismAnsour: ['Slightly Agree', ' Definitely Disagree']
  },
  {
    id: 8, question: 'If there is an interruption, I can switch back to what I was doing very quickly?',
    autismAnswers: ['Definitely Agree', 'Slightly Agree'], 
    nonAutismAnsour: ['Slightly Agree', ' Definitely Disagree']
  },
  {
    id: 9, question: 'I like to collect information about categories of things?',
    autismAnswers: ['Definitely Agree', 'Slightly Agree'], 
    nonAutismAnsour: ['Slightly Agree', ' Definitely Disagree']
  },
  {
    id: 10, question: 'I find it difficult to work out people’s intentions?',
    autismAnswers: ['Definitely Agree', 'Slightly Agree'], 
    nonAutismAnsour: ['Slightly Agree', ' Definitely Disagree']
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
  let n = [];
  for (let i = 0; i < questions.length; i++) {
    for (let j = 0; j < questions[i].autismAnswers.length; j++) {
      if (questions[i].autismAnswers[j] === answers[i]) {
        n.push(1);
        break;
      }
      if (questions[i].nonAutismAnsour[j] === answers[i]) {
        n.push(0);
        break;
      }
    }
  }

 
  res.status(201).json({ message: 'Data received', answers: n });
});

module.exports = testRouter