from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    workspace_id: int | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None


class ProjectOut(BaseModel):
    id: int
    name: str
    workspace_id: int | None

    class Config:
        from_attributes = True