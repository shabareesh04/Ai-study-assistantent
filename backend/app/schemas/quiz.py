from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class QuizQuestionResponse(BaseModel):
    id: int
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: Optional[str] = None  # hidden during quiz, shown after
    explanation: Optional[str] = None
    user_answer: Optional[str] = None

    class Config:
        from_attributes = True


class QuizResponse(BaseModel):
    id: int
    user_id: int
    document_id: int
    title: str
    score: Optional[int] = None
    total_questions: int
    difficulty: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    questions: List[QuizQuestionResponse] = []
    document_name: Optional[str] = None

    class Config:
        from_attributes = True


class GenerateMCQRequest(BaseModel):
    num_questions: int = 5  # 5, 10, or 20
    difficulty: str = "medium"  # easy, medium, hard


class GenerateShortQuestionsRequest(BaseModel):
    num_questions: int = 5


class ShortQuestion(BaseModel):
    question: str
    answer: str


class ShortQuestionsResponse(BaseModel):
    document_id: int
    questions: List[ShortQuestion]


class QuizSubmitRequest(BaseModel):
    answers: dict  # {question_id: "A"|"B"|"C"|"D"}


class QuizResultResponse(BaseModel):
    quiz_id: int
    score: int
    total_questions: int
    percentage: float
    correct: int
    incorrect: int
    questions: List[QuizQuestionResponse]


class ConversationResponse(BaseModel):
    id: int
    document_id: int
    question: str
    answer: str
    created_at: datetime

    class Config:
        from_attributes = True
