from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.task import Task

router = APIRouter()

@router.get("")
def get_tasks(project_id: int, db: Session = Depends(get_db)):
    """
    Belirli bir projeye (project_id) ait tüm görevleri veritabanından çeker.
    """
    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    return tasks

@router.post("")
def create_task(title: str, project_id: int, column_id: int, db: Session = Depends(get_db)):
    """
    Kanban tahtasında yeni bir görev oluşturur.
    """
    new_task = Task(
        title=title, 
        project_id=project_id, 
        column_id=column_id,
        description="" # Şimdilik boş açıklama atıyoruz
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task