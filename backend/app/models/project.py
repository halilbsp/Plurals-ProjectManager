from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String)

    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id")
    )

    workspace = relationship("Workspace")