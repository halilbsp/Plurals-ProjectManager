from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.project import Project
from app.models.task import Task
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate

router = APIRouter()


@router.get("", response_model=list[ProjectOut])
def get_projects(workspace_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Project)
    if workspace_id is not None:
        query = query.filter(Project.workspace_id == workspace_id)

    return query.order_by(Project.id.asc()).all()


@router.post("", response_model=ProjectOut)
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    # Eğer workspace_id verilmemişse ilk workspace'i ata
    workspace_id = data.workspace_id
    if workspace_id is None:
        from app.models.workspace import Workspace

        first_ws = db.query(Workspace).order_by(Workspace.id.asc()).first()
        if first_ws:
            workspace_id = first_ws.id

    new_project = Project(
        name=data.name,
        workspace_id=workspace_id,
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    payload = data.model_dump(exclude_unset=True)
    for field, value in payload.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    # Projeye ait task'ları da sil
    db.query(Task).filter(Task.project_id == project_id).delete()
    db.delete(project)
    db.commit()

    return {"detail": "Project deleted successfully."}