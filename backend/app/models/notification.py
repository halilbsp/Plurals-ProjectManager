from sqlalchemy import Column, Integer, String

from app.db.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="")
    message = Column(String, default="")
    type = Column(String, default="broadcast")
    is_read = Column(Integer, default=0)
    project_id = Column(Integer, nullable=True)
    created_at = Column(String, default="")