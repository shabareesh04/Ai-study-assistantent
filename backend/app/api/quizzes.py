from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.quiz import Quiz
from app.models.quiz_question import QuizQuestion
from app.schemas.quiz import (
    QuizResponse, QuizQuestionResponse, GenerateMCQRequest,
    QuizSubmitRequest, QuizResultResponse,
)
from app.utils.auth import get_current_user
from app.utils.document_processor import get_text_for_ai
from app.services.ai_service import generate_mcq

router = APIRouter(prefix="/api", tags=["Quizzes"])


@router.post("/documents/{document_id}/generate-mcq", response_model=QuizResponse)
async def generate_quiz(
    document_id: int,
    request: GenerateMCQRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate MCQ quiz from a document."""
    # Validate document
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if not document.extracted_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document has no text")

    content = get_text_for_ai(document.extracted_text)

    # Validate num_questions
    if request.num_questions not in [5, 10, 20]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Number of questions must be 5, 10, or 20"
        )

    # Generate MCQs via AI
    try:
        mcq_data = await generate_mcq(content, request.num_questions, request.difficulty)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    # Create Quiz
    quiz = Quiz(
        user_id=current_user.id,
        document_id=document_id,
        title=f"Quiz - {document.original_filename}",
        total_questions=len(mcq_data),
        difficulty=request.difficulty,
        status="pending",
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    # Create QuizQuestions
    for q_data in mcq_data:
        question = QuizQuestion(
            quiz_id=quiz.id,
            question=q_data["question"],
            option_a=q_data["option_a"],
            option_b=q_data["option_b"],
            option_c=q_data["option_c"],
            option_d=q_data["option_d"],
            correct_answer=q_data["correct_answer"],
            explanation=q_data.get("explanation", ""),
        )
        db.add(question)

    db.commit()
    db.refresh(quiz)

    # Return quiz WITHOUT correct answers (for taking the quiz)
    questions = [
        QuizQuestionResponse(
            id=q.id,
            question=q.question,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            correct_answer=None,  # Hidden during quiz
            explanation=None,
            user_answer=None,
        )
        for q in quiz.questions
    ]

    return QuizResponse(
        id=quiz.id,
        user_id=quiz.user_id,
        document_id=quiz.document_id,
        title=quiz.title,
        score=None,
        total_questions=quiz.total_questions,
        difficulty=quiz.difficulty,
        status=quiz.status,
        created_at=quiz.created_at,
        questions=questions,
        document_name=document.original_filename,
    )


@router.get("/quizzes", response_model=List[QuizResponse])
async def list_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all quizzes for the current user."""
    quizzes = (
        db.query(Quiz)
        .filter(Quiz.user_id == current_user.id)
        .order_by(Quiz.created_at.desc())
        .all()
    )

    result = []
    for quiz in quizzes:
        doc = db.query(Document).filter(Document.id == quiz.document_id).first()
        result.append(
            QuizResponse(
                id=quiz.id,
                user_id=quiz.user_id,
                document_id=quiz.document_id,
                title=quiz.title,
                score=quiz.score,
                total_questions=quiz.total_questions,
                difficulty=quiz.difficulty,
                status=quiz.status,
                created_at=quiz.created_at,
                completed_at=quiz.completed_at,
                document_name=doc.original_filename if doc else "Deleted Document",
            )
        )
    return result


@router.get("/quizzes/{quiz_id}", response_model=QuizResponse)
async def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get quiz details."""
    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id)
        .first()
    )
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    doc = db.query(Document).filter(Document.id == quiz.document_id).first()

    # Show correct answers only if quiz is completed
    show_answers = quiz.status == "completed"
    questions = [
        QuizQuestionResponse(
            id=q.id,
            question=q.question,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            correct_answer=q.correct_answer if show_answers else None,
            explanation=q.explanation if show_answers else None,
            user_answer=q.user_answer,
        )
        for q in quiz.questions
    ]

    return QuizResponse(
        id=quiz.id,
        user_id=quiz.user_id,
        document_id=quiz.document_id,
        title=quiz.title,
        score=quiz.score,
        total_questions=quiz.total_questions,
        difficulty=quiz.difficulty,
        status=quiz.status,
        created_at=quiz.created_at,
        completed_at=quiz.completed_at,
        questions=questions,
        document_name=doc.original_filename if doc else "Deleted Document",
    )


@router.post("/quizzes/{quiz_id}/submit", response_model=QuizResultResponse)
async def submit_quiz(
    quiz_id: int,
    request: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit quiz answers and get results."""
    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id)
        .first()
    )
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    if quiz.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz has already been submitted"
        )

    # Grade the quiz
    correct = 0
    for question in quiz.questions:
        user_answer = request.answers.get(str(question.id))
        if user_answer:
            question.user_answer = user_answer.upper()
            if question.user_answer == question.correct_answer:
                correct += 1

    # Update quiz
    quiz.score = correct
    quiz.status = "completed"
    quiz.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(quiz)

    # Return results with all answers revealed
    questions = [
        QuizQuestionResponse(
            id=q.id,
            question=q.question,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            correct_answer=q.correct_answer,
            explanation=q.explanation,
            user_answer=q.user_answer,
        )
        for q in quiz.questions
    ]

    percentage = (correct / quiz.total_questions * 100) if quiz.total_questions > 0 else 0

    return QuizResultResponse(
        quiz_id=quiz.id,
        score=correct,
        total_questions=quiz.total_questions,
        percentage=round(percentage, 1),
        correct=correct,
        incorrect=quiz.total_questions - correct,
        questions=questions,
    )
