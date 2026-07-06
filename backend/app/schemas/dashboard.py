from pydantic import BaseModel


class NestyInsight(BaseModel):
    title: str
    message: str


class DashboardResponse(BaseModel):
    user: str
    dream_score: int
    total_saved: int
    total_target: int
    overall_progress: float
    active_dreams: int
    completed_dreams: int
    monthly_saving: int
    nesty: NestyInsight
