from pydantic import BaseModel


class ProjectOut(BaseModel):
    id: int
    name: str
    workspace_id: int | None

    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    name: str
    workspace_id: int | None = 1
