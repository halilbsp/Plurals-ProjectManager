from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
# backend. prefixi kaldırıldı 👇
from app.db.database import Base

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="workspaces")