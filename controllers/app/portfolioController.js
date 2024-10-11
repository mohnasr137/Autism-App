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

const aboutApp = async (req, res) => {
  try {
    const about = {
      aboutApp:
        "AutismDetect is a free mobile app launched in 2024 for parents of children, focusing on early detection and management of autism. It analyzes children's facial images and drawings and uses questionnaires to identify symptoms. The app offers educational resources and a booking system for healthcare professionals. Additionally, it fosters a supportive community for parents to connect and share experiences.",
      teamName: "365-Developed",
      teamMembers: [
        {
          name: "Mohamed Nasr",
          role: "Back-End Developer & Deep Learning Engineer",
          link: "https://www.linkedin.com/in/mohamed-nasr-68b62b243/",
          image:
            "https://autism-app.onrender.com/api/v1/images/portfoilo/Mohamed-Nasr.jpg",
        },
        {
          name: "Mohaned Adel",
          role: "Flutter Developer & Machine Learning Engineer",
          link: "https://www.linkedin.com/in/mohand-adel-034013189/",
          image:
            "https://autism-app.onrender.com/api/v1/images/portfoilo/Mohaned-Adel.jpg",
        },
        {
          name: "Mohamed Mahmoud",
          role: "Machine Learning & Deep Learning Engineer",
          link: "https://www.linkedin.com/in/muhammadmahmoudfci/",
          image:
            "https://autism-app.onrender.com/api/v1/images/portfoilo/Mohamed-Mahmoud.jpg",
        },
        {
          name: "Mohamed Abdelaleem",
          role: "Machine Learning & Deep Learning Engineer",
          link: "https://www.linkedin.com/in/mohammed-abdelaleem-b100992a3/",
          image:
            "https://autism-app.onrender.com/api/v1/images/portfoilo/Mohamed-Abdelaleem.jpg",
        },
        {
          name: "Lamia Fekry",
          role: "Front-End Developer & Ui/Ux Designer",
          link: "https://www.linkedin.com/in/lamia-fekry-1a146826a/",
          image:
            "https://autism-app.onrender.com/api/v1/images/portfoilo/Lamia-Fekry.jpg",
        },
        {
          name: "Nourhan Mahmoud",
          role: "Front-End Developer & Ui/Ux Designer",
          link: "https://www.linkedin.com/in/nourhan-mahmoud-20323a299/",
          image:
            "https://autism-app.onrender.com/api/v1/images/portfoilo/Nourhan-Mahmoud.jpg",
        },
      ],
    };
    return res.status(200).json({ about });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const frequentQuestions = async (req, res) => {
  try {
    const FAQS = [
      {
        question: "What is the AutismDetect system?",
        answer:
          "AutismDetect is an innovative application designed to assist in the early detection of autism in children. Utilizing advanced AI technologies, the system analyzes information such as questionnaire responses, photos, and children's drawings to provide insights into potential signs of autism. This helps parents take appropriate follow-up actions if needed.",
      },
      {
        question: "How does the app work?",
        answer:
          "The app collects data through a customized questionnaire, a child’s photo, and artwork like drawings or coloring. This data is processed using AI-based algorithms to assess the likelihood of autism. The results offer valuable insights into whether further medical evaluation may be necessary.",
      },
      {
        question: "Can the results be trusted?",
        answer:
          "AutismDetect's results are based on scientifically validated algorithms and studies. While the app provides important indicators, it is intended to complement, not replace, professional medical advice. A consultation with a healthcare provider is recommended for a formal diagnosis.",
      },
      {
        question: "Can parents use the app without medical knowledge?",
        answer:
          "Absolutely. AutismDetect is designed with user-friendly features for parents with no medical background. The app guides users through each step, offering clear explanations and easy-to-understand results.",
      },
      {
        question: "Are children’s data stored securely?",
        answer:
          "Yes, we take data security and privacy seriously. All personal data, including photos and responses, are encrypted and stored securely. We adhere to strict data protection regulations to ensure user privacy.",
      },
      {
        question: "Does the app require an internet connection?",
        answer:
          "Yes, an internet connection is needed to upload data, perform AI analysis, and retrieve results. It is also required for accessing features like doctor communication and booking appointments.",
      },
      {
        question:
          "How can I get medical consultation after receiving the results?",
        answer:
          "After receiving your child’s results, you can connect with specialized doctors directly through the app. A list of available doctors, their specialties, and locations is provided, and you can easily book appointments from within the app.",
      },
      {
        question: "What age range is the app intended for?",
        answer:
          "AutismDetect is designed for children between 2 and 6 years of age. This period is critical for early detection, as signs of autism often become noticeable during these formative years.",
      },
      {
        question: "Does the app provide support after diagnosis?",
        answer:
          "Yes, the app offers a range of resources for parents after receiving a diagnosis. This includes educational videos, tips on managing autism, and direct communication with medical professionals and other parents via the community section.",
      },
      {
        question: "Can I use the app to assess autism in more than one child?",
        answer:
          "Yes, you can add multiple profiles to your account and perform tests for each child individually. The app allows you to manage and track results for all your children in one place.",
      },
      {
        question: "Is there a cost to using the app?",
        answer:
          "Many features of the app, including basic tests, are free. However, certain advanced features, such as personalized consultations with medical professionals, may require additional fees.",
      },
      {
        question: "Can I share the test results with external doctors?",
        answer:
          "Yes, AutismDetect allows you to share test results with external healthcare providers. You can send the results via email or download them as a PDF for easy sharing.",
      },
      {
        question: "Is the app based on scientific studies?",
        answer:
          "Yes, AutismDetect has been developed in collaboration with experts in psychology, artificial intelligence, and autism research. It is built upon the latest scientific findings in the field of autism detection.",
      },
      {
        question: "How can I download the app?",
        answer:
          "You can download the app from major app stores, such as Google Play and the Apple App Store. Links to these stores are also available on our official website.",
      },
      {
        question: "What is the Community section in the app?",
        answer:
          "The Community section is a platform for parents, caregivers, and doctors to interact, share experiences, and provide support. It’s a space for exchanging advice, asking questions, and discussing topics related to autism care and management.",
      },
      {
        question: "How can I join the Community?",
        answer:
          "To join the Community, you simply need to create an account in the app. Once registered, you can engage with other parents and professionals, participate in discussions, and share your experiences.",
      },
      {
        question:
          "Can I communicate directly with doctors within the Community?",
        answer:
          "Yes, AutismDetect allows you to communicate with specialized doctors within the Community. You can ask questions, follow discussions, or engage in one-on-one conversations with professionals who specialize in autism care.",
      },
    ];
    return res.status(200).json({ FAQS });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const LegalInformation = async (req, res) => {
  try {
    const LegalInfo = [
      {
        title: "Terms, Conditions & Disclaimer",
        content:
          'This application ("App"), designed for the early detection and management of autism, is developed and operated by [Your Company Name] ("Company", "we", "us", or "our"). The App provides services such as AI-based analysis of children’s drawings, educational resources, and access to consultations with specialists ("Services"). By accessing or using the App, you agree to comply with these Terms and Conditions, including the disclaimers outlined below. If you do not agree, you must discontinue using the App immediately.',
      },
      {
        title: "Disclaimer",
        content:
          "We strive to provide accurate and reliable information through the App. However, all content and services offered are provided on an “as-is” basis without any warranties, express or implied. We make no representations or guarantees regarding the accuracy, completeness, or results derived from the use of the Services.",
      },
      {
        title: "Medical Disclaimer",
        content:
          "The information and results generated by the App are intended solely for informational purposes. The AI analysis, educational content, and consultations should **not** be considered as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider for any medical concerns or before making decisions about your child's health. The App does not replace medical consultations or therapy prescribed by healthcare professionals.",
      },
      {
        title: "Legal Disclaimer",
        content:
          "Any legal information provided in the App is for general informational purposes only and should not be construed as legal advice. We recommend that you consult with a qualified attorney for legal matters that pertain to your specific situation. The use of any legal content in the App does not establish a lawyer-client relationship.",
      },
      {
        title: "Therapy and Behavioral Disclaimer",
        content:
          "The information provided in the App about autism, behavioral therapy, speech therapy, or other related topics is general in nature and not tailored to individual cases. This content is not intended to replace professional therapy provided by certified therapists. Outcomes may vary from person to person, and the Company does not guarantee specific results from the use of the information provided.",
      },
      {
        title: "Limitation of Liability",
        content:
          "We are not liable for any direct, indirect, incidental, special, or consequential damages, including but not limited to, loss of data, personal injury, or interruption of business, arising from the use of or inability to use the App or the Services. In no event shall our total liability exceed the amount paid by you, if any, for access to the Services.",
      },
      {
        title: "Indemnity",
        content:
          "You agree to indemnify and hold [Your Company Name] harmless from any claims, liabilities, damages, or legal fees that may arise from your use of the App, your violation of these Terms, or any infringement of third-party rights.",
      },
      {
        title: "Account Registration",
        content:
          "When registering for an account on the App, you agree to provide accurate and current information. You are responsible for maintaining the security and confidentiality of your account credentials. You must notify us immediately if you suspect any unauthorized use of your account. We are not responsible for any losses or damages resulting from unauthorized access to your account due to your failure to safeguard your credentials.",
      },
      {
        title: "Permitted Use of the App",
        content:
          "The App may only be used for lawful purposes. Any abuse, misuse, or illegal activity, including but not limited to hacking, fraud, or any actions that violate these Terms, will result in immediate termination of your access to the App and its Services.",
      },
      {
        title: "Privacy",
        content:
          "We respect your privacy and are committed to protecting your personal information. The collection and use of your data are governed by our Privacy Policy, which complies with applicable data protection laws. By using the App, you agree to the terms of our Privacy Policy, available within the App.",
      },
      {
        title: "Governing Law",
        content:
          "These Terms and any disputes related to them shall be governed by and construed in accordance with the laws of [Your State/Country]. Any legal actions arising from these Terms or your use of the App shall be brought exclusively in the courts of [Your Jurisdiction].",
      },
    ];
    return res.status(200).json({ LegalInfo });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
