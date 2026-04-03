from pydantic import BaseModel


class NotificationCreate(BaseModel):
    title: str
    message: str = ""
    type: str = "broadcast"
    project_id: int | None = None
    target_user_id: int | None = None
    sender_id: int | None = None
    sender_name: str = ""
    sender_avatar: str = ""


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: int
    project_id: int | None
    target_user_id: int | None
    sender_id: int | None
    sender_name: str
    sender_avatar: str
    created_at: str

    class Config:
        from_attributes = True


class UnreadCountOut(BaseModel):
    count: int