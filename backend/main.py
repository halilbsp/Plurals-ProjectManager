from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base

# --- DİKKAT: SİHİRLİ SATIRLAR BURASI ---
# SQLAlchemy'nin ilişkileri (relationship) çözebilmesi için 
# tüm modelleri Base.metadata.create_all'dan ÖNCE buraya import etmeliyiz! 🌟
from app.models.workspace import Workspace
from app.models.project import Project
from app.models.column import BoardColumn  # <-- Hatanın sebebi buydu, sisteme tanıtılmamıştı!
from app.models.task import Task
from app.models.user import User
# Eğer User modelin varsa onu da ekle: from app.models.user import User
# ---------------------------------------

# Şimdi veritabanı güvenle oluşturulabilir
Base.metadata.create_all(bind=engine)

# Router importların (Önceki adımdaki gibi kalacak)
from app.api.dashboard import router as dashboard_router
from app.api.workspace import router as workspace_router
from app.api.project import router as project_router
from app.api.task import router as task_router

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