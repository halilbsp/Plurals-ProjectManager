from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.project import Project
from app.models.task import Task

router = APIRouter()


@router.get("")
def search(q: str = "", db: Session = Depends(get_db)):
    if not q.strip():
        return {"projects": [], "tasks": []}

    query = f"%{q.strip().lower()}%"

    projects = (
        db.query(Project)
        .filter(Project.name.ilike(query))
        .order_by(Project.id.asc())
        .limit(5)
        .all()
    )

    tasks = (
        db.query(Task)
        .filter(
            (Task.title.ilike(query)) | (Task.description.ilike(query))
        )
        .order_by(Task.id.desc())
        .limit(10)
        .all()
    )

    return {
        "projects": [
            {"id": p.id, "name": p.name, "type": "project"}
            for p in projects
        ],
        "tasks": [
            {
                "id": t.id,
                "title": t.title,
                "status": t.status,
                "priority": t.priority,
                "project_id": t.project_id,
                "type": "task",
            }
            for t in tasks
        ],
    }