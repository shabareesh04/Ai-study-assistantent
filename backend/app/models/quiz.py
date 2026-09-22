from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False, default="Untitled Quiz")
    score = Column(Integer, nullable=True)  # null until submitted
    total_questions = Column(Integer, nullable=False)
    difficulty = Column(String(20), nullable=False, default="medium")
    status = Column(String(20), nullable=False, default="pending")  # pending, completed
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="quizzes")
    document = relationship("Document", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Quiz(id={self.id}, score={self.score}/{self.total_questions})>"
