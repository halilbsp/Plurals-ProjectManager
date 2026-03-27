from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.project import Project
from app.schemas.project import ProjectOut

router = APIRouter()


@router.get("", response_model=list[ProjectOut])
def get_projects(workspace_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Project)
    if workspace_id is not None:
        query = query.filter(Project.workspace_id == workspace_id)

    return query.order_by(Project.id.asc()).all()
