from sqlalchemy import Column, Integer, String

from app.db.database import Base


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, nullable=True)
    user_name = Column(String, default="")
    user_avatar = Column(String, default="")
    action = Column(String, default="")
    target = Column(String, default="")
    detail = Column(String, default="")
    created_at = Column(String, default="")