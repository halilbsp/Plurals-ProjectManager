from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.db.database import Base, SessionLocal, engine
from app.models.column import BoardColumn
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.models.workspace import Workspace

Base.metadata.create_all(bind=engine)


def ensure_task_columns() -> None:
    inspector = inspect(engine)
    if "tasks" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"]
        for column in inspector.get_columns("tasks")
    }
    column_updates = {
        "status": [
            "ALTER TABLE tasks ADD COLUMN status VARCHAR DEFAULT 'todo'",
            "UPDATE tasks SET status = 'todo' WHERE status IS NULL",
        ],
        "priority": [
            "ALTER TABLE tasks ADD COLUMN priority VARCHAR DEFAULT 'medium'",
            "UPDATE tasks SET priority = 'medium' WHERE priority IS NULL",
        ],
        "due_date": [
            "ALTER TABLE tasks ADD COLUMN due_date VARCHAR",
        ],
    }

    with engine.begin() as connection:
        for column_name, statements in column_updates.items():
            for index, statement in enumerate(statements):
                if index == 0 and column_name in existing_columns:
                    continue
                connection.execute(text(statement))


def ensure_demo_data() -> None:
    db = SessionLocal()
    try:
        workspace = db.query(Workspace).order_by(Workspace.id.asc()).first()
        if not workspace:
            workspace = Workspace(name="Plurals HQ", owner_id=None)
            db.add(workspace)
            db.commit()
            db.refresh(workspace)

        projects = db.query(Project).order_by(Project.id.asc()).all()
        if not projects:
            for name in [
                "ARS - Design Team",
                "Nova Mobile Launch",
                "Horizon Web Revamp",
            ]:
                db.add(Project(name=name, workspace_id=workspace.id))
            db.commit()
            projects = db.query(Project).order_by(Project.id.asc()).all()

        tasks = db.query(Task).order_by(Task.id.asc()).all()
        if not tasks:
            task_seed = {
                "ARS - Design Team": [
                    ("Design Project", "doing", "high", "2026-04-02"),
                    ("Logo Design", "done", "medium", "2026-03-18"),
                    ("User Interview Prep", "todo", "low", "2026-04-05"),
                    ("Landing Page Design", "done", "high", "2026-03-21"),
                    ("Social Media Kit", "doing", "medium", "2026-03-29"),
                    ("Design QA Checklist", "todo", "medium", "2026-04-07"),
                ],
                "Nova Mobile Launch": [
                    ("Launch Timeline", "doing", "high", "2026-04-01"),
                    ("App Store Assets", "done", "medium", "2026-03-20"),
                    ("Retention Experiments", "todo", "medium", "2026-04-08"),
                    ("Push Notification Copy", "done", "low", "2026-03-17"),
                    ("Beta Feedback Review", "doing", "high", "2026-03-30"),
                    ("Onboarding Polish", "todo", "medium", "2026-04-09"),
                ],
                "Horizon Web Revamp": [
                    ("Hero Refresh", "doing", "high", "2026-04-03"),
                    ("SEO Cleanup", "done", "medium", "2026-03-16"),
                    ("Pricing Page Draft", "todo", "medium", "2026-04-06"),
                    ("Case Study Layout", "doing", "medium", "2026-03-31"),
                    ("CMS Migration Notes", "done", "low", "2026-03-22"),
                    ("Performance Audit", "todo", "high", "2026-04-10"),
                ],
            }

            for project in projects:
                for title, status, priority, due_date in task_seed.get(project.name, []):
                    db.add(
                        Task(
                            title=title,
                            description="",
                            project_id=project.id,
                            status=status,
                            priority=priority,
                            due_date=due_date,
                            column_id=None,
                        )
                    )
            db.commit()
    finally:
        db.close()


ensure_task_columns()
ensure_demo_data()

from app.api.dashboard import router as dashboard_router
from app.api.project import router as project_router
from app.api.task import router as task_router
from app.api.workspace import router as workspace_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router, prefix="/dashboard")
app.include_router(workspace_router, prefix="/workspace")
app.include_router(project_router, prefix="/project")
app.include_router(task_router, prefix="/task")
