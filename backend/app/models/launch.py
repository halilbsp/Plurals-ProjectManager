from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class Launch(Base):
    __tablename__ = "launches"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="")
    description = Column(String, default="")
    launch_date = Column(String, default="")
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)

    project = relationship("Project")