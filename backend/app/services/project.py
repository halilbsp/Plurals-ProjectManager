# backend/app/services/project.py (Örnek - Kodunuz buna benzer olmalı)
from sqlalchemy.orm import Session
from backend.app.models.project import Project

# Наталья'nın altındaki görev Natalia bir User'dır 👇
def get_Natalia_Design_Task(db: Session, project_id: int):
    return db.query(Project).filter(Project.assigned_user.has(email="natalia@plurals.com")).first()

def get_Design_Projects(db: Session):
    return db.query(Project).all()