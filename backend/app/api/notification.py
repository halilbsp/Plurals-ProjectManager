from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.database import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationOut, UnreadCountOut

router = APIRouter()


@router.get("", response_model=list[NotificationOut])
def get_notifications(
    limit: int = 20,
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Notification)

    if user_id:
        query = query.filter(
            or_(
                Notification.target_user_id == user_id,
                Notification.target_user_id.is_(None),
            )
        )

    return query.order_by(Notification.id.desc()).limit(limit).all()


@router.get("/unread-count", response_model=UnreadCountOut)
def get_unread_count(
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Notification).filter(Notification.is_read == 0)

    if user_id:
        query = query.filter(
            or_(
                Notification.target_user_id == user_id,
                Notification.target_user_id.is_(None),
            )
        )

    count = query.count()
    return {"count": count}


@router.post("", response_model=NotificationOut)
def create_notification(data: NotificationCreate, db: Session = Depends(get_db)):
    notification = Notification(
        title=data.title,
        message=data.message,
        type=data.type,
        project_id=data.project_id,
        target_user_id=data.target_user_id,
        sender_id=data.sender_id,
        sender_name=data.sender_name,
        sender_avatar=data.sender_avatar,
        is_read=0,
        created_at=datetime.now().isoformat(),
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


@router.post("/bulk", response_model=list[NotificationOut])
def create_bulk_notifications(data: list[NotificationCreate], db: Session = Depends(get_db)):
    created = []
    for item in data:
        notification = Notification(
            title=item.title,
            message=item.message,
            type=item.type,
            project_id=item.project_id,
            target_user_id=item.target_user_id,
            sender_id=item.sender_id,
            sender_name=item.sender_name,
            sender_avatar=item.sender_avatar,
            is_read=0,
            created_at=datetime.now().isoformat(),
        )
        db.add(notification)
        created.append(notification)

    db.commit()
    for n in created:
        db.refresh(n)

    return created


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
def mark_all_as_read(
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Notification).filter(Notification.is_read == 0)

    if user_id:
        query = query.filter(
            or_(
                Notification.target_user_id == user_id,
                Notification.target_user_id.is_(None),
            )
        )

    query.update({"is_read": 1})
    db.commit()
    return {"detail": "All notifications marked as read."}