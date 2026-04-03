import os
from datetime import datetime, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

from app.db.database import Base, SessionLocal, engine
from app.models.activity import Activity
from app.models.column import BoardColumn
from app.models.comment import Comment
from app.models.launch import Launch
from app.models.notification import Notification
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.subtask import Subtask
from app.models.tag import Tag
from app.models.task import Task
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember

Base.metadata.create_all(bind=engine)

# Ensure static directory exists
os.makedirs("static/avatars", exist_ok=True)


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
        "assigned_to": [
            "ALTER TABLE tasks ADD COLUMN assigned_to INTEGER",
        ],
    }

    with engine.begin() as connection:
        for column_name, statements in column_updates.items():
            if column_name in existing_columns:
                continue
            for statement in statements:
                connection.execute(text(statement))


def ensure_user_columns() -> None:
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"]
        for column in inspector.get_columns("users")
    }
    new_columns = {
        "name": "ALTER TABLE users ADD COLUMN name VARCHAR DEFAULT ''",
        "avatar": "ALTER TABLE users ADD COLUMN avatar VARCHAR DEFAULT ''",
        "role": "ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'Member'",
        "active_workspace_id": "ALTER TABLE users ADD COLUMN active_workspace_id INTEGER",
    }

    with engine.begin() as connection:
        for col_name, statement in new_columns.items():
            if col_name not in existing_columns:
                connection.execute(text(statement))


def ensure_notification_columns() -> None:
    inspector = inspect(engine)
    if "notifications" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"]
        for column in inspector.get_columns("notifications")
    }
    new_columns = {
        "target_user_id": "ALTER TABLE notifications ADD COLUMN target_user_id INTEGER",
        "sender_id": "ALTER TABLE notifications ADD COLUMN sender_id INTEGER",
        "sender_name": "ALTER TABLE notifications ADD COLUMN sender_name VARCHAR DEFAULT ''",
        "sender_avatar": "ALTER TABLE notifications ADD COLUMN sender_avatar VARCHAR DEFAULT ''",
    }

    with engine.begin() as connection:
        for col_name, statement in new_columns.items():
            if col_name not in existing_columns:
                try:
                    connection.execute(text(statement))
                except Exception:
                    pass


def ensure_demo_data() -> None:
    db = SessionLocal()
    try:
        # ── Workspace ──
        workspace = db.query(Workspace).order_by(Workspace.id.asc()).first()
        if not workspace:
            workspace = Workspace(name="Plurals HQ", owner_id=None)
            db.add(workspace)
            db.commit()
            db.refresh(workspace)

        # ── Users ──
        existing_users = db.query(User).order_by(User.id.asc()).all()
        if not existing_users:
            from app.core.security import hash_password

            hashed = hash_password("demo123")
            user_seed = [
                {
                    "name": "AR Shakir",
                    "email": "ar.shakir@plurals.com",
                    "password": hashed,
                    "avatar": "https://i.pravatar.cc/150?u=arshakir",
                    "role": "Project Manager",
                    "active_workspace_id": workspace.id,
                },
                {
                    "name": "Natalia Rose",
                    "email": "natalia@plurals.com",
                    "password": hashed,
                    "avatar": "https://i.pravatar.cc/150?img=43",
                    "role": "Designer",
                    "active_workspace_id": workspace.id,
                },
                {
                    "name": "Scott Wilson",
                    "email": "scott@plurals.com",
                    "password": hashed,
                    "avatar": "https://i.pravatar.cc/150?img=33",
                    "role": "Developer",
                    "active_workspace_id": workspace.id,
                },
                {
                    "name": "Jessica Park",
                    "email": "jessica@plurals.com",
                    "password": hashed,
                    "avatar": "https://i.pravatar.cc/150?img=44",
                    "role": "QA Lead",
                    "active_workspace_id": workspace.id,
                },
                {
                    "name": "Ryan Chen",
                    "email": "ryan@plurals.com",
                    "password": hashed,
                    "avatar": "https://i.pravatar.cc/150?img=60",
                    "role": "Backend Dev",
                    "active_workspace_id": workspace.id,
                },
                {
                    "name": "Emma Davis",
                    "email": "emma@plurals.com",
                    "password": hashed,
                    "avatar": "https://i.pravatar.cc/150?img=61",
                    "role": "Frontend Dev",
                    "active_workspace_id": workspace.id,
                },
            ]
            for u in user_seed:
                db.add(User(**u))
            db.commit()

            first_user = db.query(User).order_by(User.id.asc()).first()
            if first_user:
                workspace.owner_id = first_user.id
                db.commit()

            all_users = db.query(User).order_by(User.id.asc()).all()
            for u in all_users:
                existing_member = db.query(WorkspaceMember).filter_by(
                    workspace_id=workspace.id, user_id=u.id
                ).first()
                if not existing_member:
                    db.add(WorkspaceMember(
                        workspace_id=workspace.id,
                        user_id=u.id,
                        role="owner" if u.id == first_user.id else "member"
                    ))
            db.commit()

        all_users = db.query(User).order_by(User.id.asc()).all()
        for u in all_users:
            existing_member = db.query(WorkspaceMember).filter_by(
                workspace_id=workspace.id, user_id=u.id
            ).first()
            if not existing_member:
                db.add(WorkspaceMember(
                    workspace_id=workspace.id,
                    user_id=u.id,
                    role="member"
                ))
            if not u.active_workspace_id:
                u.active_workspace_id = workspace.id
        db.commit()

        # ── Projects ──
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

        # ── Project Members ──
        existing_members = db.query(ProjectMember).all()
        if not existing_members:
            all_users = db.query(User).order_by(User.id.asc()).all()
            if all_users and projects:
                member_assignments = {
                    1: [1, 2, 3, 4],
                    2: [1, 3, 5, 6],
                    3: [1, 2, 5, 6],
                }
                for project in projects:
                    user_ids = member_assignments.get(project.id, [1, 2])
                    for uid in user_ids:
                        if uid <= len(all_users):
                            db.add(
                                ProjectMember(
                                    project_id=project.id,
                                    user_id=uid,
                                    role="lead" if uid == 1 else "member",
                                )
                            )
                db.commit()

        # ── Tasks ──
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
                for title, status, priority, due_date in task_seed.get(
                    project.name, []
                ):
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

        # ── Notifications ──
        existing_notifications = (
            db.query(Notification).order_by(Notification.id.asc()).all()
        )
        if not existing_notifications:
            now = datetime.now()
            all_users = db.query(User).order_by(User.id.asc()).all()
            user_map = {u.id: u for u in all_users}

            notification_seed = [
                {
                    "title": "Welcome to Plurals",
                    "message": "Your workspace is ready. Start creating projects and tasks!",
                    "type": "system",
                    "is_read": 1,
                    "project_id": None,
                    "sender_id": None,
                    "sender_name": "System",
                    "sender_avatar": "",
                    "target_user_id": None,
                    "created_at": (now - timedelta(days=2)).isoformat(),
                },
                {
                    "title": "New task assigned",
                    "message": "You have been assigned to 'Design QA Checklist'. Please review the requirements and update your progress.",
                    "type": "task",
                    "is_read": 0,
                    "project_id": 1,
                    "sender_id": 1,
                    "sender_name": user_map[1].name if 1 in user_map else "AR Shakir",
                    "sender_avatar": user_map[1].avatar if 1 in user_map else "",
                    "target_user_id": None,
                    "created_at": (now - timedelta(hours=23)).isoformat(),
                },
                {
                    "title": "Broadcast from Scott",
                    "message": "Great work on the landing page! The client loved the new design direction. Let's keep this momentum going for the next sprint 🎉",
                    "type": "broadcast",
                    "is_read": 0,
                    "project_id": 1,
                    "sender_id": 3,
                    "sender_name": user_map[3].name if 3 in user_map else "Scott Wilson",
                    "sender_avatar": user_map[3].avatar if 3 in user_map else "",
                    "target_user_id": None,
                    "created_at": (now - timedelta(hours=20)).isoformat(),
                },
                {
                    "title": "Task completed",
                    "message": "Jessica marked 'Logo Design' as done",
                    "type": "task",
                    "is_read": 0,
                    "project_id": 1,
                    "sender_id": 4,
                    "sender_name": user_map[4].name if 4 in user_map else "Jessica Park",
                    "sender_avatar": user_map[4].avatar if 4 in user_map else "",
                    "target_user_id": None,
                    "created_at": (now - timedelta(hours=18)).isoformat(),
                },
                {
                    "title": "Sprint review reminder",
                    "message": "Weekly sprint review starts in 30 minutes. Please prepare your updates and join the meeting room.",
                    "type": "system",
                    "is_read": 0,
                    "project_id": None,
                    "sender_id": None,
                    "sender_name": "System",
                    "sender_avatar": "",
                    "target_user_id": None,
                    "created_at": (now - timedelta(hours=18)).isoformat(),
                },
                {
                    "title": "New Broadcast",
                    "message": "Hi! 💯",
                    "type": "broadcast",
                    "is_read": 1,
                    "project_id": 1,
                    "sender_id": 1,
                    "sender_name": user_map[1].name if 1 in user_map else "AR Shakir",
                    "sender_avatar": user_map[1].avatar if 1 in user_map else "",
                    "target_user_id": None,
                    "created_at": (now - timedelta(hours=14)).isoformat(),
                },
            ]

            for item in notification_seed:
                db.add(Notification(**item))
            db.commit()

        # ── Launches ──
        existing_launches = db.query(Launch).all()
        if not existing_launches:
            launch_seed = [
                {"title": "Design System v2.0", "description": "Visual.inc", "launch_date": "2026-04-21", "project_id": 1},
                {"title": "Mobile App Beta Release", "description": "Nova Labs", "launch_date": "2026-04-28", "project_id": 2},
                {"title": "Website Redesign Go-Live", "description": "Horizon Corp", "launch_date": "2026-05-05", "project_id": 3},
                {"title": "Brand Guidelines Handoff", "description": "Visual.inc", "launch_date": "2026-05-12", "project_id": 1},
                {"title": "Performance Optimization Sprint", "description": "Horizon Corp", "launch_date": "2026-05-19", "project_id": 3},
            ]
            for item in launch_seed:
                db.add(Launch(**item))
            db.commit()

        # ── Activity Feed ──
        existing_activities = db.query(Activity).all()
        if not existing_activities:
            now = datetime.now()
            users = db.query(User).order_by(User.id.asc()).all()
            user_map = {u.id: u for u in users}

            activity_seed = [
                {"uid": 1, "action": "created", "target": "project", "detail": "ARS - Design Team", "pid": 1, "ago": timedelta(days=3)},
                {"uid": 2, "action": "completed", "target": "task", "detail": "Logo Design", "pid": 1, "ago": timedelta(days=2, hours=18)},
                {"uid": 3, "action": "commented on", "target": "task", "detail": "Design Project", "pid": 1, "ago": timedelta(days=2, hours=12)},
                {"uid": 1, "action": "created", "target": "task", "detail": "Design QA Checklist", "pid": 1, "ago": timedelta(days=2, hours=6)},
                {"uid": 4, "action": "completed", "target": "task", "detail": "Landing Page Design", "pid": 1, "ago": timedelta(days=2)},
                {"uid": 2, "action": "moved", "target": "task", "detail": "Social Media Kit → In Progress", "pid": 1, "ago": timedelta(days=1, hours=20)},
                {"uid": 1, "action": "created", "target": "project", "detail": "Nova Mobile Launch", "pid": 2, "ago": timedelta(days=1, hours=16)},
                {"uid": 5, "action": "joined", "target": "project", "detail": "Nova Mobile Launch", "pid": 2, "ago": timedelta(days=1, hours=14)},
                {"uid": 6, "action": "joined", "target": "project", "detail": "Nova Mobile Launch", "pid": 2, "ago": timedelta(days=1, hours=14)},
                {"uid": 3, "action": "completed", "target": "task", "detail": "App Store Assets", "pid": 2, "ago": timedelta(days=1, hours=8)},
                {"uid": 1, "action": "created", "target": "project", "detail": "Horizon Web Revamp", "pid": 3, "ago": timedelta(days=1, hours=4)},
                {"uid": 5, "action": "started", "target": "task", "detail": "Hero Refresh", "pid": 3, "ago": timedelta(days=1)},
                {"uid": 6, "action": "completed", "target": "task", "detail": "SEO Cleanup", "pid": 3, "ago": timedelta(hours=20)},
                {"uid": 2, "action": "uploaded", "target": "file", "detail": "brand-assets.svg", "pid": 1, "ago": timedelta(hours=16)},
                {"uid": 4, "action": "commented on", "target": "task", "detail": "Design QA Checklist", "pid": 1, "ago": timedelta(hours=10)},
                {"uid": 1, "action": "scheduled", "target": "launch", "detail": "Design System v2.0", "pid": 1, "ago": timedelta(hours=6)},
                {"uid": 3, "action": "moved", "target": "task", "detail": "Beta Feedback Review → In Progress", "pid": 2, "ago": timedelta(hours=4)},
                {"uid": 5, "action": "commented on", "target": "task", "detail": "Hero Refresh", "pid": 3, "ago": timedelta(hours=2)},
                {"uid": 1, "action": "sent", "target": "broadcast", "detail": "Great progress this week team! 🎉", "pid": 1, "ago": timedelta(hours=1)},
                {"uid": 6, "action": "started", "target": "task", "detail": "Pricing Page Draft", "pid": 3, "ago": timedelta(minutes=30)},
            ]

            for item in activity_seed:
                u = user_map.get(item["uid"])
                if u:
                    db.add(
                        Activity(
                            project_id=item["pid"],
                            user_name=u.name,
                            user_avatar=u.avatar,
                            action=item["action"],
                            target=item["target"],
                            detail=item["detail"],
                            created_at=(now - item["ago"]).isoformat(),
                        )
                    )
            db.commit()
    finally:
        db.close()


ensure_task_columns()
ensure_user_columns()
ensure_notification_columns()
ensure_demo_data()

from app.api.activity import router as activity_router
from app.api.activity_log import router as activity_log_router
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.launch import router as launch_router
from app.api.notification import router as notification_router
from app.api.project import router as project_router
from app.api.search import router as search_router
from app.api.task import router as task_router
from app.api.task_detail import router as task_detail_router
from app.api.user import router as user_router
from app.api.workspace import router as workspace_router
from app.api.export import router as export_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files (avatars, etc.)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(activity_router, prefix="/activity")
app.include_router(activity_log_router, prefix="/activity-log")
app.include_router(auth_router, prefix="/auth")
app.include_router(dashboard_router, prefix="/dashboard")
app.include_router(launch_router, prefix="/launch")
app.include_router(notification_router, prefix="/notification")
app.include_router(project_router, prefix="/project")
app.include_router(search_router, prefix="/search")
app.include_router(task_router, prefix="/task")
app.include_router(task_detail_router, prefix="/task")
app.include_router(user_router, prefix="/user")
app.include_router(workspace_router, prefix="/workspace")
app.include_router(export_router, prefix="/export")