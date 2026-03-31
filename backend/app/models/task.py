from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    status = Column(String, default="todo", index=True)
    priority = Column(String, default="medium")
    due_date = Column(String, nullable=True)

    column_id = Column(Integer, ForeignKey("columns.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))

    column = relationship("BoardColumn")
    project = relationship("Project", back_populates="tasks")
    comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan")
    subtasks = relationship("Subtask", back_populates="task", cascade="all, delete-orphan")
    tags = relationship("Tag", back_populates="task", cascade="all, delete-orphan")