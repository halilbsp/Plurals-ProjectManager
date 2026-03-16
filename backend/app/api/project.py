from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.project import Project
from app.schemas.project import ProjectCreate

router = APIRouter()


@router.post("/")
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db)
):

    project = Project(
        name=data.name,
        workspace_id=data.workspace_id
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


@router.get("/")
def list_projects(
    db: Session = Depends(get_db)
):

    return db.query(Project).all()