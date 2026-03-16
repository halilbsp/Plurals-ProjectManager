from pydantic import BaseModel


class TaskCreate(BaseModel):

    title: str
    description: str
    project_id: int


class TaskUpdate(BaseModel):

    title: str
    description: str
    status: str


class TaskOut(BaseModel):

    id: int
    title: str
    status: str

    class Config:
        from_attributes = True