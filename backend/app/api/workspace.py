from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.workspace import Workspace
from app.schemas.workspace import WorkspaceCreate

router = APIRouter()


@router.post("/")
def create_workspace(
    data: WorkspaceCreate,
    db: Session = Depends(get_db)
):

    workspace = Workspace(
        name=data.name,
        owner_id=1
    )

    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    return workspace


@router.get("/")
def list_workspace(
    db: Session = Depends(get_db)
):

    return db.query(Workspace).all()