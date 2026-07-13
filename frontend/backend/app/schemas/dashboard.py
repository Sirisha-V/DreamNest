from pydantic import BaseModel


class DashboardResponse(BaseModel):
    user: str
    dream_score: int
    total_saved: int
    total_target: int
    overall_progress: float
    active_dreams: int
    completed_dreams: int
    monthly_saving: int
