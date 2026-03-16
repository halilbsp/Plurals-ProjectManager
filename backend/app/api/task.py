from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate

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


@router.put("/{task_id}")
def update_task(
    task_id: int,
    data: TaskUpdate,
    db: Session = Depends(get_db)
):

    task = db.query(Task).get(task_id)

    task.title = data.title
    task.description = data.description
    task.status = data.status

    db.commit()

    return task