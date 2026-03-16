from pydantic import BaseModel


class WorkspaceCreate(BaseModel):
    name: str


class WorkspaceOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True