from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base

class BoardColumn(Base):
    __tablename__ = "columns"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    
    project_id = Column(Integer, ForeignKey("projects.id"))

    # İlişkiyi diğer taraftaki "columns" ismiyle açıkça bağlıyoruz 👈
    project = relationship("Project", back_populates="columns")