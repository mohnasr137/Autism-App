// imports
import User from "../../models/user.js";
import dotenv from "dotenv";
dotenv.config();

// init
const url = process.env.API_URL || "/api/v1";

// routers
const imageUpload = async (req, res) => {
  try {
    const userId = req.userId;
    if (!req.file) {
      return res.status(400).json({ status: false, error: "File is required." });
    }
    const host = req.get("host");
    const imagesPath = `${req.protocol}://${host}${url}/portfolio/${req.file.filename}`;

    await User.updateOne({ _id: userId }, { $set: { image: imagesPath } });

    return res
      .status(200)
      .json({ status: true, message: "Image uploaded successfully", image: imagesPath });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const userData = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findOne(
      { _id: userId },
      { name: 1, email: 1, gender: 1, dateOfBirth: 1, image: 1, type: 1 }
    );

    return res.status(200).json({ status: true, user });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
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
      const parts = dateOfBirth.split("-").map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        query.dateOfBirth = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      }
    }
    await User.updateOne({ _id: userId }, { $set: query });

    return res.status(200).json({ status: true, message: "User data updated successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const contactInfo = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findOne(
      { _id: userId },
      { address: 1, phone: 1, facebookLink: 1, linkedinLink: 1 }
    );

    return res.status(200).json({ status: true, user });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const editContactInfo = async (req, res) => {
  try {
    const userId = req.userId;
    const { address, phone, facebookLink, linkedinLink } = req.body;
    let query = {};

    if (address !== undefined) {
      query.address = address;
    }
    if (phone !== undefined) {
      query.phone = phone;
    }
    if (facebookLink !== undefined) {
      query.facebookLink = facebookLink;
    }
    if (linkedinLink !== undefined) {
      query.linkedinLink = linkedinLink;
    }
    await User.updateOne({ _id: userId }, { $set: query });

    return res
      .status(200)
      .json({ status: true, message: "Contact Info updated successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const aboutApp = async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get("host")}${url}/portfolio`;
    const about = {
      aboutApp:
        "Autismo is a comprehensive AI-powered platform for parents, educators, and clinicians, focusing on early screening and support for Autism Spectrum Disorder (ASD). It evaluates facial features, drawings, coloring, handwriting, and standardized questionnaires to screen for developmental indicators. The platform also offers curated educational resources, video guides, and a supportive community.",
      teamName: "365-Developed",
      teamMembers: [
        {
          name: "Mohamed Nasr",
          role: "Back-End Developer & Deep Learning Engineer",
          link: "https://www.linkedin.com/in/mohamed-nasr-68b62b243/",
          image: `${baseUrl}/Mohamed-Nasr.jpg`,
        },
        {
          name: "Mohaned Adel",
          role: "Flutter Developer & Machine Learning Engineer",
          link: "https://www.linkedin.com/in/mohand-adel-034013189/",
          image: `${baseUrl}/Mohaned-Adel.jpg`,
        },
        {
          name: "Mohamed Mahmoud",
          role: "Machine Learning & Deep Learning Engineer",
          link: "https://www.linkedin.com/in/muhammadmahmoudfci/",
          image: `${baseUrl}/Mohamed-Mahmoud.jpg`,
        },
        {
          name: "Mohamed Abdelaleem",
          role: "Machine Learning & Deep Learning Engineer",
          link: "https://www.linkedin.com/in/mohammed-abdelaleem-b100992a3/",
          image: `${baseUrl}/Mohamed-Abdelaleem.jpg`,
        },
        {
          name: "Lamia Fekry",
          role: "Front-End Developer & UI/UX Designer",
          link: "https://www.linkedin.com/in/lamia-fekry-1a146826a/",
          image: `${baseUrl}/Lamia-Fekry.jpg`,
        },
        {
          name: "Nourhan Mahmoud",
          role: "Front-End Developer & UI/UX Designer",
          link: "https://www.linkedin.com/in/nourhan-mahmoud-20323a299/",
          image: `${baseUrl}/Nourhan-Mahmoud.jpg`,
        },
      ],
    };
    return res.status(200).json({ status: true, about });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const frequentQuestions = async (req, res) => {
  try {
    const FAQS = [
      {
        question: "What is the Autismo platform?",
        answer:
          "Autismo is an innovative application designed to assist in the early screening and understanding of autism in children. Utilizing advanced AI technologies, the system analyzes information such as clinical questionnaire responses, photos, and children's drawings and handwriting to provide insights into potential signs of autism.",
      },
      {
        question: "How does the app work?",
        answer:
          "The app collects screening data through a validated questionnaire, child photos, and artwork (drawings, coloring, and handwriting). This data is processed through machine learning models to assess likelihood scores across modalities.",
      },
      {
        question: "Can the results be trusted?",
        answer:
          "Autismo's screening algorithms are benchmarked on scientifically validated datasets. While the app provides useful risk indicators, it is a supportive screening tool intended to complement, not replace, professional clinical evaluation.",
      },
      {
        question: "Can parents use the app without medical knowledge?",
        answer:
          "Yes. Autismo is built with an intuitive, friendly interface for parents and caregivers with clear step-by-step guidance and easy-to-understand results.",
      },
      {
        question: "Are children’s data stored securely?",
        answer:
          "Yes. All user records, uploads, and screening submissions are stored securely with encrypted access tokens and strict authorization checks.",
      },
      {
        question: "Does the app require an internet connection?",
        answer:
          "Yes, an internet connection is required to communicate with the API, run AI predictions, and stream educational content.",
      },
      {
        question: "What age range is the app intended for?",
        answer:
          "Autismo is primarily designed for toddlers and children between 2 and 6 years of age, the critical period for early developmental intervention.",
      },
      {
        question: "Does the app provide support after screening?",
        answer:
          "Yes, Autismo provides curated educational video libraries, therapy guidance articles, and a supportive community forum.",
      },
      {
        question: "Can I export test results?",
        answer:
          "Yes, Autismo allows you to download comprehensive clinical assessment reports in PDF format to share with developmental pediatricians and healthcare providers.",
      },
      {
        question: "What is the Community section in the app?",
        answer:
          "The Community section provides a safe, AI-moderated forum for parents, caregivers, and specialists to share experiences, ask questions, and offer peer support.",
      },
    ];
    return res.status(200).json({ status: true, FAQS });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const LegalInformation = async (req, res) => {
  try {
    const LegalInfo = [
      {
        title: "Terms, Conditions & Disclaimer",
        content:
          'This application ("Autismo"), designed for early screening and management of autism, provides AI-based multimodal assessments, educational resources, and a community platform. By using Autismo, you agree to comply with these Terms and Conditions. If you do not agree, please discontinue using the service.',
      },
      {
        title: "Medical Disclaimer",
        content:
          "The information and reports generated by Autismo are intended solely for informational and early-screening purposes. They do NOT constitute medical diagnoses, prescriptions, or treatments. Always consult a qualified medical professional for clinical diagnosis and medical advice.",
      },
      {
        title: "Data Privacy & Security",
        content:
          "Autismo respects your family's privacy. Assessment submissions and account details are protected in accordance with standard data privacy regulations.",
      },
      {
        title: "Limitation of Liability",
        content:
          "Autismo and its development team shall not be held liable for any damages resulting from the use or inability to use the platform or reliance on automated assessment scores.",
      },
    ];
    return res.status(200).json({ status: true, LegalInfo });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

export {
  imageUpload,
  userData,
  editUserData,
  contactInfo,
  editContactInfo,
  aboutApp,
  frequentQuestions,
  LegalInformation,
};
