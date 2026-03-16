from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.column import Column
from app.schemas.column import ColumnCreate

router = APIRouter()


@router.post("/")
def create_column(
    data: ColumnCreate,
    db: Session = Depends(get_db)
):

    column = Column(
        name=data.name,
        project_id=data.project_id
    )

    db.add(column)
    db.commit()
    db.refresh(column)

    return column


@router.get("/")
def list_columns(
    db: Session = Depends(get_db)
):

    return db.query(Column).all()