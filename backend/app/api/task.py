from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.task import Task
from app.schemas.task import TaskCreate

router = APIRouter()


@router.post("/")
def create_task(
    data: TaskCreate,
    db: Session = Depends(get_db)
):

    task = Task(
        title=data.title,
        description=data.description,
        project_id=data.project_id,
        column_id=data.column_id
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


@router.get("/")
def list_tasks(
    db: Session = Depends(get_db)
):

    return db.query(Task).all()