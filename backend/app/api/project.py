from fastapi import APIRouter

router = APIRouter()

# SADECE "" (Boş bırakıyoruz, / bile koymuyoruz!) 🌟
@router.get("")
def get_projects(workspace_id: int = None):
    return [] # Frontend çökmesin diye şimdilik boş liste