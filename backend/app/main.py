from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import create_tables
from app.api import auth, documents, ai, quizzes, dashboard

# Create FastAPI application
app = FastAPI(
    title="AI Study Assistant",
    description="An AI-powered study platform for students to upload study materials, generate summaries, take quizzes, and get AI-powered explanations.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(ai.router)
app.include_router(quizzes.router)
app.include_router(dashboard.router)


@app.on_event("startup")
async def startup_event():
    """Create database tables on startup."""
    create_tables()
    print("[INFO] Database tables created successfully")
    print("[INFO] AI Study Assistant API is running")


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": "AI Study Assistant",
        "version": "1.0.0",
    }
