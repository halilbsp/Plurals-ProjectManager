from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskOut, TaskUpdate

router = APIRouter()


@router.get("", response_model=list[TaskOut])
def get_tasks(project_id: int = 1, db: Session = Depends(get_db)):
    return (
        db.query(Task)
        .filter(Task.project_id == project_id)
        .order_by(Task.id.desc())
        .all()
    )


@router.post("", response_model=TaskOut)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    new_task = Task(
        title=task.title,
        description=task.description or "",
        project_id=task.project_id,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date,
        assigned_to=task.assigned_to,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


@router.put("/{task_id}", response_model=TaskOut)
def update_task(task_id: int, task_data: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    payload = task_data.model_dump(exclude_unset=True)
    for field, value in payload.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    db.delete(task)
    db.commit()
    return {"detail": "Task deleted successfully."}