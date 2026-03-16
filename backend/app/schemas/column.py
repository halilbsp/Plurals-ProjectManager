from pydantic import BaseModel


class ColumnCreate(BaseModel):

    name: str
    project_id: int