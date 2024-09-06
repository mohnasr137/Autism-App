import axios from "axios";
import FormData from "form-data";

const testingUpload = async (req, res) => {
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

    return res.json({
      message: "Testing successfully",
      data: response.data.prediction,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export { testingUpload };

// const testingUpload = async (req, res) => {
//   try {
//     const files = req.files;
//     if (!files) {
//       return res.status(400).json({ error: "No files uploaded" });
//     }

//     const coloring = files[0];
//     const coloringForm = new FormData();
//     coloringForm.append("image", coloring.buffer, {
//       filename: coloring.originalname,
//       contentType: coloring.mimetype,
//     });
//     const coloringResponse = await axios.post(
//       "https://flask-coloring-api-main.onrender.com/coloring",
//       coloringForm,
//       {
//         headers: {
//           ...coloringForm.getHeaders(),
//         },
//       }
//     );

//     const handWriting = files[1];
//     const handWritingForm = new FormData();
//     handWritingForm.append("image", handWriting.buffer, {
//         filename: handWriting.originalname,
//         contentType: handWriting.mimetype,
//     });
//     const handWritingResponse = await axios.post(
//       "https://flask-handwriting-api-main.onrender.com/handWriting",
//       handWritingForm,
//       {
//         headers: {
//           ...handWritingForm.getHeaders(),
//         },
//       }
//     );

//     const response = {
//       q1: coloringResponse.data.prediction,
//       q2: handWritingResponse.data.prediction,
//     };

//     return res.json({ message: "Testing successfully", data: response });
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// };

// https://flask-coloring-api-main.onrender.com/coloring
// https://flask-handwriting-api-main.onrender.com/handWriting
