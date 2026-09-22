from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DocumentResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    created_at: datetime
    has_text: bool = False

    class Config:
        from_attributes = True


class DocumentDetailResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    extracted_text: Optional[str] = None
    summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SummaryRequest(BaseModel):
    summary_type: str = "detailed"  # short, detailed, key_points, concepts


class SummaryResponse(BaseModel):
    document_id: int
    summary_type: str
    content: str


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    document_id: int
    question: str
    answer: str
    conversation_id: int
