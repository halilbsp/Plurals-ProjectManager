from pydantic import BaseModel


class TaskCreate(BaseModel):

    title: str

    description: str | None = None

    priority: str | None = "medium"

    due_date: str | None = None

    project_id: int


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