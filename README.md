# Autismo

<div align="center">

![Autismo Logo](images/portfolio/simple.jpg)

**An AI-Powered Autism Spectrum Disorder Screening, Educational Hub & Community Platform**

[![Node.js Version](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.19+-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://mongoosejs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📖 Overview

**Autismo** is a modern, comprehensive backend platform designed to assist parents, educators, and clinicians in the early screening, tracking, and understanding of Autism Spectrum Disorder (ASD). 

The platform combines multi-modal AI screening algorithms (questionnaire assessments, facial expression analysis, drawing tests, coloring tests, and handwriting analysis) with an educational video library, an AI-moderated community forum, and curated resource directories.

---

## ✨ Features

### 1. 🔐 Authentication & Profile Management
- **Secure Registration & Login**: Password hashing with `bcrypt` and token-based authentication with `jsonwebtoken` (JWT).
- **Email Verification**: Automated HTML verification emails sent via Nodemailer.
- **Password Recovery**: Secure 6-digit verification code with expiration and tokenized password reset.
- **Profile Customization**: Avatar image uploads, personal details, contact info, and medical metadata.

### 2. 🧪 Multi-Modal Autism Screening & Diagnostic Reports
- **Clinical Questionnaire (`/testing/form`)**: Standardized screening questions evaluated against clinical scoring criteria.
- **Facial Feature Analysis (`/testing/childFace`)**: Vision-based screening assessing facial symmetry and micro-expressions.
- **Motor & Cognitive Tests**:
  - **Drawing Assessment (`/testing/drawing`)**: Evaluates geometric drawing patterns and motor control.
  - **Coloring Assessment (`/testing/coloring`)**: Analyzes stroke control, boundary awareness, and pressure.
  - **Handwriting Assessment (`/testing/handWriting`)**: Evaluates letter formation, spacing, and stroke consistency.
- **Overall Assessment Aggregation (`/testing/testResult`)**: Aggregates all completed modality tests into a unified autism likelihood score with detailed breakdown.
- **Automated PDF Report Generation (`/testing/resultPdf`)**: Generates professional clinical assessment reports via `pdfkit` including scores, visual progress tables, and medical disclaimers.
- **Personalized Recommendations (`/testing/recommendVideos`)**: Suggests educational videos tailored to test results.

### 3. 📹 Educational Media & Video Hub
- **Curated Content**: Integration with YouTube Data API v3 to stream educational videos and channels on autism care, therapies, and early intervention.
- **Interactions**: Like, dislike, comment, reply to subcomments, and add to user favorites.
- **Watch History**: Automatic history logging with one-click clear options.

### 4. 👥 Community Forum
- **Rich Post Creation**: Create discussion posts with markdown text and up to 5 attachments.
- **AI Categorization**: Automatically categorizes and tags posts using **Google Gemini Generative AI**.
- **Social Reactions**: Multi-reaction support (Like, Love, Celebrate, Insightful, Funny) and threaded comments.
- **Search & Discovery**: Query posts by keywords, tags, or categories with search history tracking.
- **Automated Cascade Deletion**: Deleting a post safely removes all associated comments, reactions, and user links.

### 5. 📚 Resource Directory
- Search and discover vetted articles, research papers, and external autism support websites powered by **SerpAPI**.
- Bookmark favorite resources for quick reference.

### 6. ℹ️ App Information & Portfolio
- Dynamic platform information: FAQs, Terms of Service, Legal disclaimers, and team bios.

---

## 🏗️ Architecture & Technology Stack

- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Web Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **AI & External APIs**:
  - **Google Gemini API (`@google/genai`)**: Content categorization and generation
  - **Machine Learning Microservice**: Integrated vision & handwriting screening endpoints
  - **YouTube Data API v3**: Video and channel feeds
  - **SerpAPI**: Real-time web resources scraping
  - **APILayer Text Moderation**: Inappropriate language filtering on user discussions
- **Document Generation**: [PDFKit](https://pdfkit.org/)
- **File Uploads**: [Multer](https://github.com/expressjs/multer) with MIME-type validation
- **Email Delivery**: [Nodemailer](https://nodemailer.com/)

---

## 📁 Project Directory Structure

```
Autismo/
├── app.js                          # Server entry point & middleware configuration
├── package.json                    # Project metadata & dependencies
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignored files & patterns
├── controllers/
│   ├── app/
│   │   ├── communityController.js  # Forum posts, reactions, comments, AI tagging
│   │   ├── homeController.js       # Video feeds, channel stats, favorites, history
│   │   ├── portfolioController.js  # App info, FAQs, user profiles, team data
│   │   ├── resourceController.js   # External autism websites & bookmarks
│   │   └── testingController.js    # Multi-modal ASD tests, PDF generation
│   └── auth/
│       ├── basicAuth.js            # Sign up, Sign in, token verification
│       ├── resetPassword.js        # Forgot password, code validation, reset
│       └── verifyEmail.js          # Email confirmation flow
├── middlewares/
│   └── jwt.js                      # JWT authentication & route protection
├── models/
│   ├── post.js                     # Forum post schema
│   ├── postComment.js              # Forum comment & nested reply schema
│   ├── postReaction.js             # Post reactions schema
│   ├── testSample.js               # User screening assessment schema
│   ├── user.js                     # User account & profile schema
│   ├── video.js                    # Video engagement & analytics schema
│   ├── videoComment.js             # Video comments schema
│   ├── videoReaction.js            # Video reactions schema
│   └── website.js                  # External resource bookmarks schema
├── routers/
│   ├── auth.js                     # Authentication routes
│   ├── community.js                # Community forum routes
│   ├── home.js                     # Video and home routes
│   ├── portfolio.js                # Profile & portfolio routes
│   ├── resource.js                 # Resource routes
│   └── testing.js                  # Diagnostic testing routes
└── images/
    ├── portfolio/                  # Team & static portfolio assets
    └── uploads/                    # User uploaded images & media
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [MongoDB](https://www.mongodb.com/) instance (local or MongoDB Atlas)
- Python ML Service (optional, for image/drawing screening endpoints)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Mohamed-Nasr1/Autismo.git
   cd Autismo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your configuration keys:
   ```env
   PORT=3000
   API_URL=/api/v1
   CONNECTION_STRING=mongodb+srv://<username>:<password>@cluster.mongodb.net/Autismo
   SECRET=your_super_secret_jwt_key
   USER=your_email@gmail.com
   PASSWORD=your_gmail_app_password
   API_KEY=your_youtube_api_key
   SERPAPI_KEY=your_serpapi_key
   GENERATIVE_AI_API_KEY=your_gemini_api_key
   MODERATION_KEY=your_apilayer_moderation_key
   ML_API_URL=http://localhost:5000
   ```

4. **Start the application:**
   - **Production / Standard:**
     ```bash
     npm start
     ```
   - **Development (with auto-reload):**
     ```bash
     node --watch app.js
     ```

The API will be accessible at `http://localhost:3000/api/v1`.

---

## 📡 API Reference

Base URL: `http://localhost:3000/api/v1`

### 🔑 Authentication (`/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/signUp` | Register new user account | No |
| `POST` | `/auth/signIn` | Sign in & receive JWT token | No |
| `GET` | `/auth/token/:token` | Confirm email address via token link | No |
| `POST` | `/auth/sendPassEmail` | Send 6-digit password reset code | No |
| `POST` | `/auth/activeResetPass` | Verify reset code & receive reset token | No |
| `POST` | `/auth/resetPassword` | Set new account password | No |

---

### 🧪 Screening & Testing (`/testing`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/testing/userData` | Initialize or update screening participant info | Yes |
| `GET` | `/testing/form` | Fetch clinical screening questionnaire | Yes |
| `POST` | `/testing/form` | Submit questionnaire answers | Yes |
| `POST` | `/testing/childFace` | Submit child photo for facial feature analysis | Yes |
| `POST` | `/testing/drawing` | Submit drawing test image | Yes |
| `POST` | `/testing/coloring` | Submit coloring test image | Yes |
| `POST` | `/testing/handWriting` | Submit handwriting test image | Yes |
| `GET` | `/testing/testResult` | Get aggregate autism likelihood score | Yes |
| `GET` | `/testing/resultPdf` | Download clinical PDF assessment report | Yes |
| `GET` | `/testing/recommendVideos` | Get curated video recommendations based on results | Yes |
| `GET` | `/testing/history/showAll` | View test history records (paginated) | Yes |
| `DELETE` | `/testing/history/delete` | Delete a specific test record | Yes |

---

### 📹 Videos & Channels (`/home`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/home/showAllVideos` | Fetch curated autism videos | Yes |
| `GET` | `/home/showAllChannels` | Fetch featured autism support channels | Yes |
| `GET` | `/home/video?videoId=:id` | Get video details, engagement & view metrics | Yes |
| `GET` | `/home/channel?channelId=:id` | Get channel details and published videos | Yes |
| `GET` | `/home/video/comments?videoId=:id` | Fetch comments for a video | Yes |
| `POST` | `/home/video/add/comment` | Add comment or reply to video | Yes |
| `PATCH` | `/home/video/edit/comment` | Edit an existing video comment | Yes |
| `DELETE` | `/home/video/delete/comment` | Delete a video comment and its replies | Yes |
| `GET` | `/home/video/reactions?videoId=:id` | Get video like/dislike counts & user status | Yes |
| `POST` | `/home/video/add/reaction` | Add or update video reaction (like / dislike) | Yes |
| `DELETE` | `/home/video/delete/reaction` | Remove video reaction | Yes |
| `GET` | `/home/favorite/show` | List user bookmarked favorite videos | Yes |
| `POST` | `/home/favorite/add` | Bookmark video to favorites | Yes |
| `DELETE` | `/home/favorite/delete` | Remove video from favorites | Yes |
| `DELETE` | `/home/favorite/deleteAll` | Clear all favorite videos | Yes |
| `GET` | `/home/showAllHistory` | Get user video watch history | Yes |
| `DELETE` | `/home/deleteAllHistory` | Clear video watch history | Yes |

---

### 👥 Community Forum (`/community`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/community/showAllPosts` | Browse community feed (paginated) | Yes |
| `GET` | `/community/showMyPosts` | View posts authored by logged-in user | Yes |
| `GET` | `/community/post?postId=:id` | Get single post details and outer/inner views | Yes |
| `POST` | `/community/createPost` | Create new post (up to 5 images, AI auto-tagged) | Yes |
| `PATCH` | `/community/editPost` | Edit post content and images | Yes |
| `DELETE` | `/community/deletePost` | Cascade delete post, comments, and reactions | Yes |
| `GET` | `/community/post/show/comments` | List comments for a post | Yes |
| `POST` | `/community/post/add/comment` | Comment on a post | Yes |
| `PATCH` | `/community/post/edit/comment` | Edit a comment | Yes |
| `DELETE` | `/community/post/delete/comment` | Delete a comment | Yes |
| `GET` | `/community/post/show/reactions` | Get post reaction counts & user status | Yes |
| `POST` | `/community/post/add/reaction` | React to post (`like`, `love`, `celebrate`, etc.) | Yes |
| `DELETE` | `/community/post/delete/reaction` | Remove post reaction | Yes |
| `GET` | `/community/search?query=:q` | Search posts by keyword | Yes |
| `GET` | `/community/searchHistory` | View recent search queries | Yes |

---

### 📚 Resources (`/resource`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/resource/showAllWebsites` | Fetch curated autism web resources | Yes |
| `POST` | `/resource/addWebsites` | Search online via SerpAPI & cache resources | Yes |
| `GET` | `/resource/favorite/show` | View bookmarked website resources | Yes |
| `POST` | `/resource/favorite/add` | Bookmark a resource | Yes |
| `DELETE` | `/resource/favorite/delete` | Remove bookmarked resource | Yes |

---

### 👤 Profile & App Info (`/portfolio`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/portfolio/userData` | Get current user profile details | Yes |
| `POST` | `/portfolio/editUserData` | Update user profile information | Yes |
| `GET` | `/portfolio/contactInfo` | Get user contact details | Yes |
| `POST` | `/portfolio/editContactInfo` | Update user contact details | Yes |
| `POST` | `/portfolio/imageUpload` | Upload profile avatar picture | Yes |
| `GET` | `/portfolio/aboutApp` | App description and developer team info | No |
| `GET` | `/portfolio/frequentQuestions` | Frequently Asked Questions (FAQ) | No |
| `GET` | `/portfolio/legalInformation` | Legal notice, terms & privacy policy | No |

---

## 🔒 Security & Best Practices

- **Password Encryption**: All passwords salted and hashed with `bcrypt` before storage.
- **JWT Authorization**: Enforced across private endpoints with bearer token authorization headers.
- **File Upload Protection**: Restricts uploads by MIME-type and enforces size limits (5 MB max per image).
- **Sanitized Deletions**: Deleting posts, videos, comments, or users automatically performs cascading cleanups to prevent orphaned database records.
- **Defensive Error Handling**: External service failures (YouTube API, SerpAPI, Gemini AI, APILayer, ML Server) are intercepted gracefully with fallbacks to guarantee uninterrupted uptime.

---

## 👥 Contributors & Team

Developed with ❤️ by the **Autismo** Development Team:
- **Mohamed Nasr**
- **Mohamed Abdelaleem**
- **Mohamed Mahmoud**
- **Mohaned Adel**
- **Lamia Fekry**
- **Nourhan Mahmoud**

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
