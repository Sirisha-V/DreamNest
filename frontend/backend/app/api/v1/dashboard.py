from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.v1.goals import get_current_user_id
from app.db.session import get_db
from app.repositories.goal_repository import GoalRepository
from app.services.dashboard_service import DashboardService
from app.repositories.user_repository import UserRepository

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/")
def get_dashboard(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    user = UserRepository(db).get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    goals = GoalRepository(db).list_all(user_id=user_id)
    service = DashboardService(user, goals)
    return service.build_dashboard()
