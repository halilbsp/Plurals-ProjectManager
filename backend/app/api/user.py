from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.project_member import ProjectMember
from app.schemas.user import UserOut, ProjectMemberOut

router = APIRouter()


@router.get("", response_model=list[UserOut])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.id.asc()).all()


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