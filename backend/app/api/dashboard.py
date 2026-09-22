from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.conversation import Conversation
from app.models.quiz import Quiz
from app.schemas.common import DashboardStats
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get dashboard statistics for the current user."""
    # Total documents
    total_documents = (
        db.query(func.count(Document.id))
        .filter(Document.user_id == current_user.id)
        .scalar() or 0
    )

    # Total quizzes
    total_quizzes = (
        db.query(func.count(Quiz.id))
        .filter(Quiz.user_id == current_user.id, Quiz.status == "completed")
        .scalar() or 0
    )

    # Total questions answered
    total_questions_answered = (
        db.query(func.count(Conversation.id))
        .filter(Conversation.user_id == current_user.id)
        .scalar() or 0
    )

    # Average quiz score (percentage)
    completed_quizzes = (
        db.query(Quiz)
        .filter(Quiz.user_id == current_user.id, Quiz.status == "completed")
        .all()
    )

    average_score = 0.0
    best_score = 0.0
    if completed_quizzes:
        scores = [
            (q.score / q.total_questions * 100) if q.total_questions > 0 else 0
            for q in completed_quizzes
        ]
        average_score = round(sum(scores) / len(scores), 1)
        best_score = round(max(scores), 1)

    # Recent activity (last 10 items)
    recent_quizzes = (
        db.query(Quiz)
        .filter(Quiz.user_id == current_user.id)
        .order_by(Quiz.created_at.desc())
        .limit(5)
        .all()
    )
    recent_conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.created_at.desc())
        .limit(5)
        .all()
    )

    recent_activity = []
    for quiz in recent_quizzes:
        doc = db.query(Document).filter(Document.id == quiz.document_id).first()
        recent_activity.append({
            "type": "quiz",
            "title": quiz.title,
            "description": f"Score: {quiz.score}/{quiz.total_questions}" if quiz.status == "completed" else "In Progress",
            "date": quiz.created_at.isoformat(),
            "document": doc.original_filename if doc else "Unknown",
        })

    for conv in recent_conversations:
        doc = db.query(Document).filter(Document.id == conv.document_id).first()
        recent_activity.append({
            "type": "question",
            "title": conv.question[:80] + "..." if len(conv.question) > 80 else conv.question,
            "description": "Q&A",
            "date": conv.created_at.isoformat(),
            "document": doc.original_filename if doc else "Unknown",
        })

    # Sort by date
    recent_activity.sort(key=lambda x: x["date"], reverse=True)
    recent_activity = recent_activity[:10]

    return DashboardStats(
        total_documents=total_documents,
        total_quizzes=total_quizzes,
        total_questions_answered=total_questions_answered,
        average_score=average_score,
        best_score=best_score,
        recent_activity=recent_activity,
    )
