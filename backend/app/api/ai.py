from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.conversation import Conversation
from app.schemas.document import SummaryRequest, SummaryResponse, AskRequest, AskResponse
from app.schemas.common import ExplainRequest, ExplainResponse
from app.schemas.quiz import (
    GenerateMCQRequest, GenerateShortQuestionsRequest,
    ShortQuestion, ShortQuestionsResponse,
)
from app.utils.auth import get_current_user
from app.utils.document_processor import get_text_for_ai
from app.services.ai_service import (
    generate_summary, answer_question, generate_mcq,
    generate_short_questions, explain_topic,
)
from typing import List
from app.schemas.quiz import ConversationResponse

router = APIRouter(prefix="/api", tags=["AI Features"])


def _get_user_document(document_id: int, user_id: int, db: Session) -> Document:
    """Helper to get and validate a user's document."""
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == user_id)
        .first()
    )
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    if not document.extracted_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document has no extracted text"
        )
    return document


@router.post("/documents/{document_id}/summary", response_model=SummaryResponse)
async def get_summary(
    document_id: int,
    request: SummaryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate an AI summary of a document."""
    document = _get_user_document(document_id, current_user.id, db)
    content = get_text_for_ai(document.extracted_text)

    try:
        summary = await generate_summary(content, request.summary_type)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    return SummaryResponse(
        document_id=document_id,
        summary_type=request.summary_type,
        content=summary,
    )


@router.post("/documents/{document_id}/ask", response_model=AskResponse)
async def ask_document(
    document_id: int,
    request: AskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ask a question about a document."""
    document = _get_user_document(document_id, current_user.id, db)
    content = get_text_for_ai(document.extracted_text)

    if not request.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty"
        )

    try:
        answer = await answer_question(content, request.question)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    # Save conversation
    conversation = Conversation(
        user_id=current_user.id,
        document_id=document_id,
        question=request.question,
        answer=answer,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return AskResponse(
        document_id=document_id,
        question=request.question,
        answer=answer,
        conversation_id=conversation.id,
    )


@router.get("/documents/{document_id}/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get conversation history for a document."""
    conversations = (
        db.query(Conversation)
        .filter(
            Conversation.document_id == document_id,
            Conversation.user_id == current_user.id,
        )
        .order_by(Conversation.created_at.asc())
        .all()
    )
    return conversations


@router.post("/documents/{document_id}/generate-short-questions", response_model=ShortQuestionsResponse)
async def generate_short_questions_endpoint(
    document_id: int,
    request: GenerateShortQuestionsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate short-answer questions from a document."""
    document = _get_user_document(document_id, current_user.id, db)
    content = get_text_for_ai(document.extracted_text)

    try:
        questions = await generate_short_questions(content, request.num_questions)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    return ShortQuestionsResponse(
        document_id=document_id,
        questions=[ShortQuestion(**q) for q in questions],
    )


@router.post("/explain", response_model=ExplainResponse)
async def explain_topic_endpoint(
    request: ExplainRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Explain a topic with optional document context."""
    document_content = None
    if request.document_id:
        document = _get_user_document(request.document_id, current_user.id, db)
        document_content = get_text_for_ai(document.extracted_text, max_length=4000)

    try:
        explanation = await explain_topic(request.topic, request.mode, document_content)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    return ExplainResponse(
        topic=request.topic,
        mode=request.mode,
        explanation=explanation,
    )
