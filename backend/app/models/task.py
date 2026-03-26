from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)

    column_id = Column(
        Integer,
        ForeignKey("columns.id")
    )

    project_id = Column(
        Integer,
        ForeignKey("projects.id")
    )

    column = relationship("BoardColumn")
    
    # Task modeli de project'e bu şekilde bağlanmalı 👈
    project = relationship("Project", back_populates="tasks")