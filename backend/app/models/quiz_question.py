from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    option_a = Column(String(500), nullable=False)
    option_b = Column(String(500), nullable=False)
    option_c = Column(String(500), nullable=False)
    option_d = Column(String(500), nullable=False)
    correct_answer = Column(String(1), nullable=False)  # A, B, C, or D
    explanation = Column(Text, nullable=True)
    user_answer = Column(String(1), nullable=True)  # null until answered

    # Relationships
    quiz = relationship("Quiz", back_populates="questions")

    def __repr__(self):
        return f"<QuizQuestion(id={self.id}, correct='{self.correct_answer}')>"
