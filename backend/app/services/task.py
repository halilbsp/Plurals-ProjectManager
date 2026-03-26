# backend/app/services/task.py (Örnek - Kodunuz buna benzer olmalı)
from sqlalchemy.orm import Session
from backend.app.models.task import Task
from backend.app.models.project import Project

# Наталья'nın altındaki görev Наталья bir User'dır 👇
def get_recently_completed_tasks(db: Session):
    # Bu query, son teslim tarihi geçmiş görevleri ve onların projelerinin müşteri adlarını getirmeli
    tasks = db.query(Task).join(Project).filter(Project.due_date < '2023-07-21').all()
    # image_1.png'ye göre müşteri adlarını da döndürmeliyiz
    results = []
    for task in tasks:
        results.append({
            "task_title": task.title,
            "client_name": task.project.client_name,
            "completed": True # Görsele göre Completed 👈
        })
    return results