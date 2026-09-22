# 📚 AI Study Assistant

An intelligent, full-stack learning assistant platform designed to streamline student productivity and comprehension. Powered by **React (TypeScript)**, **FastAPI**, and **Google Gemini AI**, this platform allows users to upload study documents (PDFs, DOCX), interact with context-aware AI chat, generate interactive quizzes, summarize complex materials, and track learning progress.

---

## ✨ Features

- 📄 **Document Management & Parsing**: Upload and manage study materials (PDF, DOCX) with text extraction.
- 💬 **Document Chat (RAG/Q&A)**: Ask questions and interact directly with your uploaded documents using Google Gemini.
- 🧠 **Concept Explainer**: Simplifies difficult concepts with customizable explanations based on your learning level.
- 📝 **Smart Summarizer**: Generate quick, structured key takeaways and summaries from lengthy notes.
- 🎯 **Interactive Quiz Generator**: Auto-generate multiple-choice practice quizzes from documents or topics with instant grading and explanations.
- ❓ **Short Questions Practice**: Generate short-answer practice questions and model answers for self-assessment.
- 📊 **Dashboard & Analytics**: Track recent activities, completed quizzes, study statistics, and document usage.
- 🔐 **Authentication & Security**: Secure user signup, login, and JWT-based session management.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **HTTP Client**: Axios

### **Backend**
- **Framework**: FastAPI (Python 3.10+)
- **LLM / AI Engine**: Google Generative AI (`google-generativeai` / Gemini)
- **Database**: SQLite with SQLAlchemy ORM
- **Document Parsers**: PyPDF2, python-docx
- **Authentication**: JWT (`python-jose`), Passlib (`bcrypt`)
- **Server**: Uvicorn

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Google Gemini API Key

---

### 1. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Frontend will run at: `http://localhost:5173`

---

### 2. Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up Environment Variables:**
   Create a `.env` file in the `backend/` directory based on `.env.example`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   SECRET_KEY=your_jwt_secret_key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```

5. **Run the backend server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   API Documentation available at: `http://localhost:8000/api/docs`

---

## 📂 Project Structure

```text
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components (Sidebar, Navbar, AuthModal, etc.)
│   │   ├── context/     # Auth & App context state
│   │   ├── pages/       # Page views (Dashboard, Documents, Summarizer, DocumentChat, Quiz, Explainer, etc.)
│   │   ├── services/    # Axios API client
│   │   ├── types/       # TypeScript interface definitions
│   │   ├── App.tsx      # Main application router
│   │   └── main.tsx     # Application entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── api/         # FastAPI route controllers (auth, documents, ai, quizzes, dashboard)
│   │   ├── models/      # SQLAlchemy ORM models (user, document, conversation, quiz, quiz_question)
│   │   ├── schemas/     # Pydantic schemas (request & response models)
│   │   ├── services/    # Business logic & Gemini AI integration
│   │   ├── utils/       # Document processor & authentication utilities
│   │   ├── config.py    # Environment settings
│   │   ├── database.py  # Database connection and session management
│   │   └── main.py      # FastAPI application entry point
│   ├── requirements.txt
│   ├── .env.example
│   └── study_assistant.db
└── uploads/             # Document storage directory
```

---

## 🔒 License
This project is licensed under the MIT License.
