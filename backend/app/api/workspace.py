from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.workspace import Workspace, WorkspaceMember
from app.models.user import User
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceOut,
    WorkspaceDetailOut,
    WorkspaceMemberOut,
    WorkspaceSwitchRequest,
)

router = APIRouter()


@router.get("")
def get_user_workspaces(user_id: int, db: Session = Depends(get_db)):
    """Get all workspaces the user is a member of."""
    memberships = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.user_id == user_id)
        .all()
    )
    workspace_ids = [m.workspace_id for m in memberships]
    workspaces = (
        db.query(Workspace)
        .filter(Workspace.id.in_(workspace_ids))
        .order_by(Workspace.id.asc())
        .all()
    )

    result = []
    for ws in workspaces:
        member_count = (
            db.query(WorkspaceMember)
            .filter(WorkspaceMember.workspace_id == ws.id)
            .count()
        )
        membership = next((m for m in memberships if m.workspace_id == ws.id), None)
        result.append({
            "id": ws.id,
            "name": ws.name,
            "owner_id": ws.owner_id,
            "created_at": ws.created_at,
            "member_count": member_count,
            "role": membership.role if membership else "member",
        })

    return result


@router.get("/{workspace_id}")
def get_workspace_detail(workspace_id: int, db: Session = Depends(get_db)):
    """Get workspace details with members."""
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")

    memberships = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == workspace_id)
        .all()
    )

    members = []
    for m in memberships:
        user = db.query(User).filter(User.id == m.user_id).first()
        members.append({
            "id": m.id,
            "workspace_id": m.workspace_id,
            "user_id": m.user_id,
            "role": m.role,
            "user_name": user.name if user else "",
            "user_avatar": user.avatar if user else "",
        })

    return {
        "id": ws.id,
        "name": ws.name,
        "owner_id": ws.owner_id,
        "created_at": ws.created_at,
        "members": members,
        "member_count": len(members),
    }


@router.post("")
def create_workspace(body: WorkspaceCreate, user_id: int, db: Session = Depends(get_db)):
    """Create a new workspace and add the creator as owner."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    ws = Workspace(name=body.name, owner_id=user_id)
    db.add(ws)
    db.commit()
    db.refresh(ws)

    # Add creator as owner member
    member = WorkspaceMember(workspace_id=ws.id, user_id=user_id, role="owner")
    db.add(member)
    db.commit()

    # Switch user to the new workspace
    user.active_workspace_id = ws.id
    db.commit()

    return {
        "id": ws.id,
        "name": ws.name,
        "owner_id": ws.owner_id,
        "created_at": ws.created_at,
        "member_count": 1,
    }


@router.put("/{workspace_id}")
def update_workspace(
    workspace_id: int, body: WorkspaceUpdate, user_id: int, db: Session = Depends(get_db)
):
    """Update workspace name. Only owner can update."""
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")

    if ws.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Only the owner can update this workspace.")

    if body.name is not None:
        ws.name = body.name

    db.commit()
    db.refresh(ws)

    return {
        "id": ws.id,
        "name": ws.name,
        "owner_id": ws.owner_id,
        "created_at": ws.created_at,
    }


@router.delete("/{workspace_id}")
def delete_workspace(workspace_id: int, user_id: int, db: Session = Depends(get_db)):
    """Delete workspace. Only owner can delete."""
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")

    if ws.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Only the owner can delete this workspace.")

    # Check if user has other workspaces
    user_memberships = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.user_id == user_id)
        .filter(WorkspaceMember.workspace_id != workspace_id)
        .all()
    )

    if not user_memberships:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete your only workspace. Create another one first.",
        )

    # Switch affected users to another workspace
    members = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == workspace_id)
        .all()
    )
    for m in members:
        u = db.query(User).filter(User.id == m.user_id).first()
        if u and u.active_workspace_id == workspace_id:
            other = (
                db.query(WorkspaceMember)
                .filter(WorkspaceMember.user_id == u.id)
                .filter(WorkspaceMember.workspace_id != workspace_id)
                .first()
            )
            u.active_workspace_id = other.workspace_id if other else None

    db.delete(ws)
    db.commit()

    # Return the new active workspace id for the requesting user
    user = db.query(User).filter(User.id == user_id).first()
    return {
        "message": "Workspace deleted successfully.",
        "active_workspace_id": user.active_workspace_id if user else None,
    }


@router.post("/switch")
def switch_workspace(body: WorkspaceSwitchRequest, user_id: int, db: Session = Depends(get_db)):
    """Switch user's active workspace."""
    # Verify membership
    membership = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == body.workspace_id,
            WorkspaceMember.user_id == user_id,
        )
        .first()
    )

    if not membership:
        raise HTTPException(status_code=403, detail="You are not a member of this workspace.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.active_workspace_id = body.workspace_id
    db.commit()

    ws = db.query(Workspace).filter(Workspace.id == body.workspace_id).first()

    return {
        "message": "Workspace switched successfully.",
        "workspace": {
            "id": ws.id,
            "name": ws.name,
            "owner_id": ws.owner_id,
        },
    }