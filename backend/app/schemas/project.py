from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    workspace_id: int


class ProjectOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True