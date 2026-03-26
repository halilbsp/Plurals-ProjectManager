# backend/app/schemas/workspace.py
from pydantic import BaseModel
from typing import Optional

class WorkspaceBase(BaseModel):
    name: str

# image_1.png'de Workspaces Section: "Workspace" (aktif, siyah, kalın) 👇
class WorkspaceOut(WorkspaceBase):
    id: int
    # Bir çalışma alanının kimin (User) sahibi olduğunu bilmesi için owner_id alanı ekle 👈
    owner_id: int

    class Config:
        from_attributes = True

class WorkspaceCreate(WorkspaceBase):
    owner_id: int # Çalışma alanını kim oluşturuyor