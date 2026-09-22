from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(10), nullable=False)  # pdf, docx, txt
    file_size = Column(Integer, nullable=False)  # size in bytes
    extracted_text = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="documents")
    conversations = relationship("Conversation", back_populates="document", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="document", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Document(id={self.id}, filename='{self.original_filename}', type='{self.file_type}')>"
