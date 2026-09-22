from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="conversations")
    document = relationship("Document", back_populates="conversations")

    def __repr__(self):
        return f"<Conversation(id={self.id}, question='{self.question[:50]}...')>"
