import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentResponse, DocumentDetailResponse
from app.utils.auth import get_current_user
from app.utils.document_processor import (
    validate_file, generate_unique_filename, extract_text, clean_text
)
from app.config import settings

router = APIRouter(prefix="/api/documents", tags=["Documents"])


def _ensure_upload_dir():
    """Ensure upload directory exists."""
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a study document (PDF, DOCX, or TXT)."""
    _ensure_upload_dir()

    # Read file content to get size
    content = await file.read()
    file_size = len(content)

    # Validate file
    is_valid, message = validate_file(file.filename, file_size)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    # Generate unique filename and save
    file_ext = os.path.splitext(file.filename)[1].lower()
    unique_filename = generate_unique_filename(file.filename)
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

    # Extract and clean text
    try:
        raw_text = extract_text(file_path, file_ext)
        cleaned_text = clean_text(raw_text)
    except ValueError as e:
        # Clean up the saved file on extraction failure
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if not cleaned_text or len(cleaned_text.strip()) < 10:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract meaningful text from the document. The file may be empty or contain only images."
        )

    # Create database record
    document = Document(
        user_id=current_user.id,
        filename=unique_filename,
        original_filename=file.filename,
        file_type=file_ext,
        file_size=file_size,
        extracted_text=cleaned_text,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    return DocumentResponse(
        id=document.id,
        user_id=document.user_id,
        filename=document.filename,
        original_filename=document.original_filename,
        file_type=document.file_type,
        file_size=document.file_size,
        created_at=document.created_at,
        has_text=bool(document.extracted_text),
    )


@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all documents for the current user."""
    documents = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return [
        DocumentResponse(
            id=doc.id,
            user_id=doc.user_id,
            filename=doc.filename,
            original_filename=doc.original_filename,
            file_type=doc.file_type,
            file_size=doc.file_size,
            created_at=doc.created_at,
            has_text=bool(doc.extracted_text),
        )
        for doc in documents
    ]


@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get document details including extracted text."""
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a document and its associated file."""
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Delete file from disk
    file_path = os.path.join(settings.UPLOAD_DIR, document.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    # Delete from database (cascades to conversations and quizzes)
    db.delete(document)
    db.commit()
