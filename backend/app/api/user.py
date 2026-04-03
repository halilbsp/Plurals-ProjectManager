import os
import time

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.project_member import ProjectMember
from app.schemas.user import UserOut, ProjectMemberOut

router = APIRouter()

UPLOAD_DIR = "static/avatars"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/svg+xml", "image/webp"}
MAX_SIZE = 2 * 1024 * 1024  # 2MB


class UserProfileUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    role: str | None = None
    avatar: str | None = None


@router.get("", response_model=list[UserOut])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.id.asc()).all()


@router.put("/{user_id}", response_model=UserOut)
def update_user_profile(user_id: int, data: UserProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if data.name is not None:
        user.name = data.name
    if data.email is not None:
        user.email = data.email
    if data.role is not None:
        user.role = data.role
    if data.avatar is not None:
        user.avatar = data.avatar

    db.commit()
    db.refresh(user)
    return user


@router.post("/{user_id}/avatar")
def upload_avatar(
    user_id: int,
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Allowed: JPG, PNG, SVG, WebP.",
        )

    contents = file.file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 2MB.")

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "jpg"
    filename = f"{user_id}_{int(time.time())}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    # Remove old local avatar file if exists
    if user.avatar and "/static/avatars/" in user.avatar:
        old_filename = user.avatar.split("/static/avatars/")[-1]
        old_path = os.path.join(UPLOAD_DIR, old_filename)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass

    with open(filepath, "wb") as f:
        f.write(contents)

    # Build full URL from request
    base_url = str(request.base_url).rstrip("/")
    avatar_url = f"{base_url}/static/avatars/{filename}"

    user.avatar = avatar_url
    db.commit()
    db.refresh(user)

    return {"avatar_url": avatar_url}


@router.get("/project/{project_id}", response_model=list[ProjectMemberOut])
def get_project_members(project_id: int, db: Session = Depends(get_db)):
    members = (
        db.query(ProjectMember)
        .filter(ProjectMember.project_id == project_id)
        .all()
    )
    return members


@router.post("/project/{project_id}/add/{user_id}", response_model=ProjectMemberOut)
def add_member_to_project(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):
    existing = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="User already a member.")

    member = ProjectMember(
        project_id=project_id,
        user_id=user_id,
        role="member",
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/project/{project_id}/remove/{user_id}")
def remove_member_from_project(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):
    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")

    db.delete(member)
    db.commit()
    return {"detail": "Member removed successfully."}