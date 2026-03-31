from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="")
    email = Column(String, unique=True, index=True)
    password = Column(String, default="")
    avatar = Column(String, default="")
    role = Column(String, default="Member")
    active_workspace_id = Column(Integer, nullable=True)

    owned_workspaces = relationship("Workspace", back_populates="owner", foreign_keys="[Workspace.owner_id]")
    workspace_memberships = relationship("WorkspaceMember", back_populates="user", cascade="all, delete-orphan")