from pydantic import BaseModel
from typing import Optional


class UserCreate(BaseModel):
    name: str = ""
    email: str
    password: str = ""


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    avatar: str
    role: str
    active_workspace_id: Optional[int] = None

    class Config:
        from_attributes = True


class ProjectMemberOut(BaseModel):
    id: int
    user_id: int
    project_id: int
    role: str
    user: UserOut

    class Config:
        from_attributes = True