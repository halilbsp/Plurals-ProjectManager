# backend/app/schemas/project.py
from pydantic import BaseModel
from typing import Optional
from datetime import date
from .workspace import WorkspaceOut # circular import sorunu olursa dikkat 👇
# Natalia bir User'dır, o yüzdenUser şemasını import etmeliyiz 👇
# from .user import UserOut #User schemas henüz oluşturulmadıysa yorum satırı yapın 👇

class ProjectBase(BaseModel):
    name: str

# image_1.png'ye göre, bir projenin durumu, son teslim tarihi ve saatleri olmalıdır 👈
class ProjectOut(ProjectBase):
    id: int
    hours_estimate: Optional[int]
    hours_logged: Optional[int]
    status: str
    client_name: Optional[str]
    due_date: Optional[date]
    workspace_id: int
    assigned_user_id: Optional[int]
    workspace: WorkspaceOut
    # Наталья bir User'dır, Assigned User olarak Natalia'yı eklemeliyim 👇
    # assigned_user: Optional[UserOut]

    class Config:
        from_attributes = True

class ProjectCreate(ProjectBase):
    workspace_id: int
    status: str # Görsele göre durum gerekli olabilir 👈
    client_name: Optional[str]
    hours_estimate: Optional[int]
    due_date: Optional[date]
    assigned_user_id: Optional[int] #Natalia atanacaksa