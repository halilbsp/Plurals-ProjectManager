from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.project import Project
from app.models.task import Task

router = APIRouter()


PROJECT_DESCRIPTIONS = {
    "ARS - Design Team": (
        "This project is focused on shipping an ambitious product with a fast-moving "
        "design team and a premium visual direction."
    ),
    "Nova Mobile Launch": (
        "Cross-functional mobile launch planning, design reviews, and growth loops."
    ),
    "Horizon Web Revamp": (
        "Website refresh focused on conversion, performance, and premium storytelling."
    ),
}

STATUS_LABELS = {
    "todo": "Planned",
    "doing": "In Progress",
    "done": "Completed",
}

WEEKLY_TEMPLATES = {
    1: [28, 34, 42, 55, 63, 72, 79],
    2: [22, 26, 33, 47, 58, 64, 71],
    3: [18, 24, 31, 44, 57, 66, 74],
}

CREATED_RATE_TEMPLATES = {
    1: [38, 45, 55, 50, 62, 58, 65],
    2: [35, 42, 48, 55, 60, 56, 62],
    3: [40, 48, 52, 58, 65, 62, 70],
}


def get_project_hours(tasks: list[Task]) -> int:
    priority_weight = {
        "low": 6,
        "medium": 10,
        "high": 14,
    }
    status_bonus = {
        "todo": 2,
        "doing": 6,
        "done": 10,
    }

    total = 0
    for task in tasks:
        total += priority_weight.get(task.priority, 8)
        total += status_bonus.get(task.status, 4)

    return total or 24


def resolve_selected_project(project_id: int, db: Session) -> Project | None:
    project = db.query(Project).filter(Project.id == project_id).first()
    if project:
        return project

    return db.query(Project).order_by(Project.id.asc()).first()


def get_main_task(tasks: list[Task]) -> Task | None:
    if not tasks:
        return None

    status_order = {
        "doing": 0,
        "todo": 1,
        "done": 2,
    }
    priority_order = {
        "high": 0,
        "medium": 1,
        "low": 2,
    }

    return sorted(
        tasks,
        key=lambda task: (
            status_order.get(task.status, 3),
            priority_order.get(task.priority, 3),
            task.id,
        ),
    )[0]


@router.get("/summary")
def get_dashboard_summary(project_id: int = 1, db: Session = Depends(get_db)):
    project = resolve_selected_project(project_id, db)
    if not project:
        return {
            "project_id": 1,
            "project_name": "ARS - Design Team",
            "project_description": PROJECT_DESCRIPTIONS["ARS - Design Team"],
            "main_task_title": "Design Project",
            "main_task_status": "In Progress",
            "tasks_count": 24,
            "logged_hours": 190,
        }

    tasks = (
        db.query(Task)
        .filter(Task.project_id == project.id)
        .order_by(Task.id.asc())
        .all()
    )
    main_task = get_main_task(tasks)

    return {
        "project_id": project.id,
        "project_name": project.name,
        "project_description": PROJECT_DESCRIPTIONS.get(
            project.name,
            f"{project.name} is moving forward with a premium delivery pace.",
        ),
        "main_task_title": main_task.title if main_task else "No Tasks Yet",
        "main_task_status": (
            STATUS_LABELS.get(main_task.status, "Planning")
            if main_task
            else "Planning"
        ),
        "tasks_count": len(tasks),
        "logged_hours": get_project_hours(tasks),
    }


@router.get("/analytics")
def get_dashboard_analytics(project_id: int = 1, db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.id.asc()).all()
    selected_project = resolve_selected_project(project_id, db)

    if not selected_project:
        return {
            "selected_project_id": 1,
            "selected_project_name": "ARS - Design Team",
            "weekly_activity": [],
            "project_hours": [],
        }

    selected_tasks = (
        db.query(Task)
        .filter(Task.project_id == selected_project.id)
        .order_by(Task.id.asc())
        .all()
    )
    done_count = len([task for task in selected_tasks if task.status == "done"])
    doing_count = len([task for task in selected_tasks if task.status == "doing"])

    template = WEEKLY_TEMPLATES.get(
        selected_project.id,
        WEEKLY_TEMPLATES[1],
    )
    created_rate_base = CREATED_RATE_TEMPLATES.get(
        selected_project.id,
        CREATED_RATE_TEMPLATES[1],
    )

    weekly_activity = []
    for index, day in enumerate(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]):
        completion_rate = min(
            100,
            template[index] + done_count * 3 + doing_count * 2,
        )
        creation_rate = min(
            100,
            created_rate_base[index] + done_count * 2 + doing_count,
        )
        weekly_activity.append(
            {
                "day": day,
                "completion_rate": completion_rate,
                "completed_tasks": max(1, round(completion_rate / 12)),
                "creation_rate": creation_rate,
                "created_tasks": max(2, round(creation_rate / 10)),
            }
        )

    project_hours = []
    for project in projects:
        project_tasks = (
            db.query(Task)
            .filter(Task.project_id == project.id)
            .order_by(Task.id.asc())
            .all()
        )
        project_hours.append(
            {
                "project_id": project.id,
                "name": project.name,
                "hours": get_project_hours(project_tasks),
            }
        )

    return {
        "selected_project_id": selected_project.id,
        "selected_project_name": selected_project.name,
        "weekly_activity": weekly_activity,
        "project_hours": project_hours,
    }