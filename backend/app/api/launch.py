from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.launch import Launch

router = APIRouter()


class LaunchCreate(BaseModel):
    title: str
    description: str = ""
    launch_date: str
    project_id: int | None = None


class LaunchOut(BaseModel):
    id: int
    title: str
    description: str
    launch_date: str
    project_id: int | None

    class Config:
        from_attributes = True


@router.get("", response_model=list[LaunchOut])
def get_launches(project_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Launch)
    if project_id is not None:
        query = query.filter(Launch.project_id == project_id)
    return query.order_by(Launch.launch_date.asc()).all()


@router.post("", response_model=LaunchOut)
def create_launch(data: LaunchCreate, db: Session = Depends(get_db)):
    launch = Launch(
        title=data.title,
        description=data.description,
        launch_date=data.launch_date,
        project_id=data.project_id,
    )
    db.add(launch)
    db.commit()
    db.refresh(launch)
    return launch


@router.delete("/{launch_id}")
def delete_launch(launch_id: int, db: Session = Depends(get_db)):
    launch = db.query(Launch).filter(Launch.id == launch_id).first()
    if not launch:
        raise HTTPException(status_code=404, detail="Launch not found.")
    db.delete(launch)
    db.commit()
    return {"detail": "Launch deleted."}