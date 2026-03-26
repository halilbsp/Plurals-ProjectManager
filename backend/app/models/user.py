from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)

    # Bir kullanıcının birden fazla çalışma alanı (workspace) olabilir
    workspaces = relationship("Workspace", back_populates="owner")