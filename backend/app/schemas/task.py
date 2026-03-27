from pydantic import BaseModel


class TaskCreate(BaseModel):
    title: str
    description: str | None = ""
    priority: str = "medium"
    due_date: str | None = None
    project_id: int
    status: str = "todo"


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    due_date: str | None = None


class TaskOut(BaseModel):
    id: int
    title: str
    description: str | None
    status: str
    priority: str
    due_date: str | None
    project_id: int

    class Config:
        from_attributes = True
