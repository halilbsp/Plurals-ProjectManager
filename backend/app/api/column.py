from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.column import BoardColumn  # 🌟 DÜZELTİLDİ: Column yerine BoardColumn
from app.schemas.column import ColumnCreate

router = APIRouter()

@router.post("/")
def create_column(
    data: ColumnCreate,
    db: Session = Depends(get_db)
):
    # Modelimizde kolon adını "title" olarak tanımlamıştık, ona göre atıyoruz
    new_column = BoardColumn(
        title=data.name,  
        project_id=data.project_id
    )

    db.add(new_column)
    db.commit()
    db.refresh(new_column)

    return new_column

@router.get("/")
def list_columns(
    db: Session = Depends(get_db)
):
    return db.query(BoardColumn).all()  # 🌟 DÜZELTİLDİ