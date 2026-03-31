from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.activity import Activity

router = APIRouter()


class ActivityOut(BaseModel):
    id: int
    project_id: int | None
    user_name: str
    user_avatar: str
    action: str
    target: str
    detail: str
    created_at: str

    class Config:
        from_attributes = True


class ActivityCreate(BaseModel):
    project_id: int | None = None
    user_name: str
    user_avatar: str = ""
    action: str
    target: str = ""
    detail: str = ""


@router.get("", response_model=list[ActivityOut])
def get_activities(
    project_id: int | None = None,
    limit: int = 30,
    db: Session = Depends(get_db),
):
    query = db.query(Activity)
    if project_id is not None:
        query = query.filter(Activity.project_id == project_id)
    return query.order_by(Activity.id.desc()).limit(limit).all()


@router.post("", response_model=ActivityOut)
def log_activity(data: ActivityCreate, db: Session = Depends(get_db)):
    activity = Activity(
        project_id=data.project_id,
        user_name=data.user_name,
        user_avatar=data.user_avatar,
        action=data.action,
        target=data.target,
        detail=data.detail,
        created_at=datetime.now().isoformat(),
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity