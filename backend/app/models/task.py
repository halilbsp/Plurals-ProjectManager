from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String)

    description = Column(String)

    status = Column(String, default="todo")

    project_id = Column(
        Integer,
        ForeignKey("projects.id")
    )

    project = relationship("Project")