from fastapi import FastAPI

from app.db.database import Base, engine

from app.api.auth import router as auth_router
from app.api.routes import router as main_router
from app.api.workspace import router as workspace_router
from app.api.project import router as project_router
from app.api.task import router as task_router
from app.api.column import router as column_router

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.include_router(auth_router, prefix="/auth")
app.include_router(workspace_router, prefix="/workspace")
app.include_router(project_router, prefix="/project")
app.include_router(task_router, prefix="/task")
app.include_router(column_router, prefix="/column")
app.include_router(main_router)


@app.get("/")
def root():
    return {"msg": "API çalışıyor"}