from fastapi import APIRouter

router = APIRouter()

# DİKKAT: İçi tamamen BOŞ ("") olmalı! Çünkü "workspace" kelimesi zaten main.py'den geliyor.
@router.get("")
def get_workspaces():
    return [{"id": 1, "name": "Plurals Workspace"}]

@router.post("")
def create_workspace(name: str):
    return {"message": "success", "name": name}