from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class Column(Base):
    __tablename__ = "columns"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String)

    project_id = Column(
        Integer,
        ForeignKey("projects.id")
    )

    project = relationship("Project")