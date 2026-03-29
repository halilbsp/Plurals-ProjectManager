from pydantic import BaseModel


class NotificationCreate(BaseModel):
    title: str
    message: str = ""
    type: str = "broadcast"
    project_id: int | None = None


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: int
    project_id: int | None
    created_at: str

    class Config:
        from_attributes = True


class UnreadCountOut(BaseModel):
    count: int