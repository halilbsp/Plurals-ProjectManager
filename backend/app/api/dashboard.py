from fastapi import APIRouter

router = APIRouter()

# SADECE "/summary" yazıyoruz. (Başına dashboard eklemiyoruz!) ✂️
@router.get("/summary")
def get_dashboard_summary():
    return {
        "project_name": "ARS - Design Team",
        "project_description": "This project will be create awesome product.",
        "main_task_title": "Design Project",
        "main_task_status": "In Progress",
        "tasks_count": 24,
        "logged_hours": 190
    }