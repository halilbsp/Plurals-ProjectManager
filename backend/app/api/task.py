from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.models.task import Task

router = APIRouter()

# 🛡️ Pydantic Şemaları: Frontend'den gelen verilerin doğru formatta olduğunu garanti ederiz.
class TaskCreate(BaseModel):
    title: str
    project_id: int
    status: str = "todo"
    priority: str = "Low"

class TaskUpdate(BaseModel):
    status: str

# 1. Görevleri Çekme (GET)
@router.get("")
def get_tasks(project_id: int = 1, db: Session = Depends(get_db)):
    # Belirli bir projeye ait tüm görevleri getir
    return db.query(Task).filter(Task.project_id == project_id).all()

# 2. Yeni Görev Ekleme (POST)
@router.post("")
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    new_task = Task(
        title=task.title,
        project_id=task.project_id,
        status=task.status,
        priority=task.priority,
        description="" # Şimdilik boş açıklama
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

# 3. Görev Statüsünü Güncelleme (Sürükle-Bırak için) (PUT)
@router.put("/{task_id}")
def update_task(task_id: int, task_data: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Görev bulunamadı!")
    
    task.status = task_data.status
    db.commit()
    db.refresh(task)
    return task