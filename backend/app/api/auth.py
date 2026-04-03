from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.schemas.user import UserCreate, UserLogin
from app.core.security import hash_password, verify_password, create_token

router = APIRouter()


class ChangePasswordRequest(BaseModel):
    user_id: int
    current_password: str
    new_password: str


def _build_user_response(user: User, token: str, db: Session) -> dict:
    """Build a consistent auth response with workspace info."""
    active_workspace = None
    if user.active_workspace_id:
        ws = db.query(Workspace).filter(Workspace.id == user.active_workspace_id).first()
        if ws:
            active_workspace = {
                "id": ws.id,
                "name": ws.name,
                "owner_id": ws.owner_id,
            }

    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "avatar": user.avatar,
            "role": user.role,
            "active_workspace_id": user.active_workspace_id,
        },
        "workspace": active_workspace,
    }


@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()

    if existing:
        raise HTTPException(status_code=400, detail="Email already exists.")

    new_user = User(
        name=user.name or user.email.split("@")[0],
        email=user.email,
        password=hash_password(user.password),
        avatar=f"https://i.pravatar.cc/150?u={user.email}",
        role="Member",
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create a default workspace for the new user
    ws = Workspace(name=f"{new_user.name}'s Workspace", owner_id=new_user.id)
    db.add(ws)
    db.commit()
    db.refresh(ws)

    # Add user as workspace owner
    member = WorkspaceMember(workspace_id=ws.id, user_id=new_user.id, role="owner")
    db.add(member)

    # Set active workspace
    new_user.active_workspace_id = ws.id
    db.commit()
    db.refresh(new_user)

    token = create_token({"user_id": new_user.id})

    return _build_user_response(new_user, token, db)


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or password.")

    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid email or password.")

    # Ensure user has an active workspace
    if not db_user.active_workspace_id:
        membership = (
            db.query(WorkspaceMember)
            .filter(WorkspaceMember.user_id == db_user.id)
            .first()
        )
        if membership:
            db_user.active_workspace_id = membership.workspace_id
            db.commit()

    token = create_token({"user_id": db_user.id})

    return _build_user_response(db_user, token, db)


@router.post("/change-password")
def change_password(data: ChangePasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Verify current password
    if not verify_password(data.current_password, user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    # Validate new password
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    if data.current_password == data.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password.")

    # Update password
    user.password = hash_password(data.new_password)
    db.commit()

    return {"detail": "Password updated successfully."}


@router.get("/me")
def get_me(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    active_workspace = None
    if user.active_workspace_id:
        ws = db.query(Workspace).filter(Workspace.id == user.active_workspace_id).first()
        if ws:
            active_workspace = {
                "id": ws.id,
                "name": ws.name,
                "owner_id": ws.owner_id,
            }

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "avatar": user.avatar,
        "role": user.role,
        "active_workspace_id": user.active_workspace_id,
        "workspace": active_workspace,
    }