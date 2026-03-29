from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationOut, UnreadCountOut

router = APIRouter()


@router.get("", response_model=list[NotificationOut])
def get_notifications(limit: int = 20, db: Session = Depends(get_db)):
    return (
        db.query(Notification)
        .order_by(Notification.id.desc())
        .limit(limit)
        .all()
    )


@router.get("/unread-count", response_model=UnreadCountOut)
def get_unread_count(db: Session = Depends(get_db)):
    count = db.query(Notification).filter(Notification.is_read == 0).count()
    return {"count": count}


@router.post("", response_model=NotificationOut)
def create_notification(data: NotificationCreate, db: Session = Depends(get_db)):
    notification = Notification(
        title=data.title,
        message=data.message,
        type=data.type,
        project_id=data.project_id,
        is_read=0,
        created_at=datetime.now().isoformat(),
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


@router.put("/{notification_id}/read", response_model=NotificationOut)
def mark_as_read(notification_id: int, db: Session = Depends(get_db)):
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id)
        .first()
    )
    if notification:
        notification.is_read = 1
        db.commit()
        db.refresh(notification)
    return notification


@router.put("/read-all")
def mark_all_as_read(db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.is_read == 0).update(
        {"is_read": 1}
    )
    db.commit()
    return {"detail": "All notifications marked as read."}