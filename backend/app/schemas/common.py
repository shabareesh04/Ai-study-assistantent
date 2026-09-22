from pydantic import BaseModel
from typing import Optional


class ExplainRequest(BaseModel):
    topic: str
    mode: str = "simple"  # simple, detailed, beginner, interview
    document_id: Optional[int] = None  # optional document context


class ExplainResponse(BaseModel):
    topic: str
    mode: str
    explanation: str


class DashboardStats(BaseModel):
    total_documents: int = 0
    total_quizzes: int = 0
    total_questions_answered: int = 0
    average_score: float = 0.0
    best_score: float = 0.0
    recent_activity: list = []


class ErrorResponse(BaseModel):
    detail: str
    status_code: int = 400
