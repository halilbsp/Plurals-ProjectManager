from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.comment import Comment
from app.models.task import Task
from app.models.user import User

router = APIRouter()


@router.get("/latest")
def get_latest_activity(project_id: int = 1, db: Session = Depends(get_db)):
    # Get recent comments for this project's tasks
    task_ids = [
        t.id
        for t in db.query(Task).filter(Task.project_id == project_id).all()
    ]

    recent_comments = (
        db.query(Comment)
        .filter(Comment.task_id.in_(task_ids) if task_ids else False)
        .order_by(Comment.id.desc())
        .limit(5)
        .all()
    )

    # Get task stats
    total_tasks = len(task_ids)
    doing_tasks = (
        db.query(Task)
        .filter(Task.project_id == project_id, Task.status == "doing")
        .count()
    )
    done_tasks = (
        db.query(Task)
        .filter(Task.project_id == project_id, Task.status == "done")
        .count()
    )

    # Get latest active user on this project
    latest_user = None
    if recent_comments:
        user = recent_comments[0].user
        if user:
            latest_user = {
                "name": user.name,
                "avatar": user.avatar,
                "role": user.role,
            }

    if not latest_user:
        # Fallback: grab first user
        first_user = db.query(User).order_by(User.id.asc()).first()
        if first_user:
            latest_user = {
                "name": first_user.name,
                "avatar": first_user.avatar,
                "role": first_user.role,
            }
        else:
            latest_user = {
                "name": "Team",
                "avatar": "",
                "role": "Member",
            }

    # Count files as a fun stat (simulated: based on done tasks)
    file_count = max(1, done_tasks)

    return {
        "user": latest_user,
        "comment_count": len(recent_comments),
        "file_count": file_count,
        "total_tasks": total_tasks,
        "doing_tasks": doing_tasks,
        "done_tasks": done_tasks,
        "latest_comments": [
            {
                "id": c.id,
                "content": c.content,
                "user_name": c.user.name if c.user else "Unknown",
                "created_at": c.created_at,
            }
            for c in recent_comments[:3]
        ],
    }