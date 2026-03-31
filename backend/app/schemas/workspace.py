from pydantic import BaseModel
from typing import Optional, List


class WorkspaceBase(BaseModel):
    name: str


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None


class WorkspaceOut(WorkspaceBase):
    id: int
    owner_id: int
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class WorkspaceMemberOut(BaseModel):
    id: int
    workspace_id: int
    user_id: int
    role: str
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None

    class Config:
        from_attributes = True


class WorkspaceDetailOut(WorkspaceOut):
    members: List[WorkspaceMemberOut] = []
    member_count: int = 0

    class Config:
        from_attributes = True


class WorkspaceSwitchRequest(BaseModel):
    workspace_id: int