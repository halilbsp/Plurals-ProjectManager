from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.comment import Comment
from app.models.subtask import Subtask
from app.models.tag import Tag

router = APIRouter()


# ───── Schemas ─────

class CommentCreate(BaseModel):
    content: str
    user_id: int | None = None


class CommentOut(BaseModel):
    id: int
    task_id: int
    user_id: int | None
    content: str
    created_at: str
    user_name: str = ""
    user_avatar: str = ""

    class Config:
        from_attributes = True


class SubtaskCreate(BaseModel):
    title: str


class SubtaskOut(BaseModel):
    id: int
    task_id: int
    title: str
    is_done: int

    class Config:
        from_attributes = True


class TagCreate(BaseModel):
    label: str
    color: str = "#34247A"


class TagOut(BaseModel):
    id: int
    task_id: int
    label: str
    color: str

    class Config:
        from_attributes = True


# ───── Comments ─────

@router.get("/{task_id}/comments")
def get_comments(task_id: int, db: Session = Depends(get_db)):
    comments = (
        db.query(Comment)
        .filter(Comment.task_id == task_id)
        .order_by(Comment.id.asc())
        .all()
    )
    result = []
    for c in comments:
        data = {
            "id": c.id,
            "task_id": c.task_id,
            "user_id": c.user_id,
            "content": c.content,
            "created_at": c.created_at,
            "user_name": c.user.name if c.user else "Unknown",
            "user_avatar": c.user.avatar if c.user else "",
        }
        result.append(data)
    return result


@router.post("/{task_id}/comments")
def add_comment(task_id: int, data: CommentCreate, db: Session = Depends(get_db)):
    comment = Comment(
        task_id=task_id,
        user_id=data.user_id,
        content=data.content,
        created_at=datetime.now().isoformat(),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return {
        "id": comment.id,
        "task_id": comment.task_id,
        "user_id": comment.user_id,
        "content": comment.content,
        "created_at": comment.created_at,
        "user_name": comment.user.name if comment.user else "Unknown",
        "user_avatar": comment.user.avatar if comment.user else "",
    }


@router.delete("/comments/{comment_id}")
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found.")
    db.delete(comment)
    db.commit()
    return {"detail": "Comment deleted."}


# ───── Subtasks ─────

@router.get("/{task_id}/subtasks", response_model=list[SubtaskOut])
def get_subtasks(task_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Subtask)
        .filter(Subtask.task_id == task_id)
        .order_by(Subtask.id.asc())
        .all()
    )


@router.post("/{task_id}/subtasks", response_model=SubtaskOut)
def add_subtask(task_id: int, data: SubtaskCreate, db: Session = Depends(get_db)):
    subtask = Subtask(
        task_id=task_id,
        title=data.title,
        is_done=0,
    )
    db.add(subtask)
    db.commit()
    db.refresh(subtask)
    return subtask


@router.put("/subtasks/{subtask_id}/toggle", response_model=SubtaskOut)
def toggle_subtask(subtask_id: int, db: Session = Depends(get_db)):
    subtask = db.query(Subtask).filter(Subtask.id == subtask_id).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found.")
    subtask.is_done = 0 if subtask.is_done == 1 else 1
    db.commit()
    db.refresh(subtask)
    return subtask


@router.delete("/subtasks/{subtask_id}")
def delete_subtask(subtask_id: int, db: Session = Depends(get_db)):
    subtask = db.query(Subtask).filter(Subtask.id == subtask_id).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found.")
    db.delete(subtask)
    db.commit()
    return {"detail": "Subtask deleted."}


# ───── Tags ─────

@router.get("/{task_id}/tags", response_model=list[TagOut])
def get_tags(task_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Tag)
        .filter(Tag.task_id == task_id)
        .order_by(Tag.id.asc())
        .all()
    )


@router.post("/{task_id}/tags", response_model=TagOut)
def add_tag(task_id: int, data: TagCreate, db: Session = Depends(get_db)):
    tag = Tag(
        task_id=task_id,
        label=data.label,
        color=data.color,
    )
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/tags/{tag_id}")
def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found.")
    db.delete(tag)
    db.commit()
    return {"detail": "Tag deleted."}