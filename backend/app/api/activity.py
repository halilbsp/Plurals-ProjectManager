from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.models.activity import Activity
from app.models.comment import Comment
from app.models.task import Task
from app.models.user import User
from app.models.project_member import ProjectMember

router = APIRouter()


@router.get("/latest")
def get_latest_activity(project_id: int = 1, period: str = "today", db: Session = Depends(get_db)):
    # Get all tasks for this project
    project_tasks = db.query(Task).filter(Task.project_id == project_id).all()
    task_ids = [t.id for t in project_tasks]

    # Task statistics
    total_tasks = len(task_ids)
    todo_tasks = sum(1 for t in project_tasks if t.status == "todo")
    doing_tasks = sum(1 for t in project_tasks if t.status == "doing")
    done_tasks = sum(1 for t in project_tasks if t.status == "done")

    # Priority breakdown
    high_priority = sum(1 for t in project_tasks if t.priority == "high")
    medium_priority = sum(1 for t in project_tasks if t.priority == "medium")
    low_priority = sum(1 for t in project_tasks if t.priority == "low")

    # Comments for this project's tasks
    recent_comments = []
    if task_ids:
        recent_comments = (
            db.query(Comment)
            .filter(Comment.task_id.in_(task_ids))
            .order_by(Comment.id.desc())
            .limit(5)
            .all()
        )

    comment_count = len(recent_comments)

    # Count unique commenters
    unique_commenters = set()
    if task_ids:
        all_comments = (
            db.query(Comment)
            .filter(Comment.task_id.in_(task_ids))
            .all()
        )
        for c in all_comments:
            if c.user_id:
                unique_commenters.add(c.user_id)

    # Team members count
    member_count = (
        db.query(ProjectMember)
        .filter(ProjectMember.project_id == project_id)
        .count()
    )

    # Activity count from activity log
    activity_count = (
        db.query(Activity)
        .filter(Activity.project_id == project_id)
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
        # Fallback: get first project member
        first_member = (
            db.query(ProjectMember)
            .filter(ProjectMember.project_id == project_id)
            .first()
        )
        if first_member:
            member_user = db.query(User).filter(User.id == first_member.user_id).first()
            if member_user:
                latest_user = {
                    "name": member_user.name,
                    "avatar": member_user.avatar,
                    "role": member_user.role,
                }

    if not latest_user:
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

    # Completion percentage
    completion_percent = round((done_tasks / total_tasks) * 100) if total_tasks > 0 else 0

    return {
        "user": latest_user,
        "comment_count": comment_count,
        "total_tasks": total_tasks,
        "todo_tasks": todo_tasks,
        "doing_tasks": doing_tasks,
        "done_tasks": done_tasks,
        "completion_percent": completion_percent,
        "high_priority": high_priority,
        "medium_priority": medium_priority,
        "low_priority": low_priority,
        "member_count": member_count,
        "activity_count": activity_count,
        "unique_commenters": len(unique_commenters),
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