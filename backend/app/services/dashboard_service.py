from app.models.goal import Goal
from app.models.user import User
from app.schemas.dashboard import DashboardResponse, NestyInsight


class DashboardService:
    def __init__(self, user: User, goals: list[Goal]):
        self.user = user
        self.goals = goals

    def build_dashboard(self) -> DashboardResponse:
        total_target = sum(goal.target_amount for goal in self.goals)
        total_saved = sum(goal.saved_amount for goal in self.goals)
        active_dreams = len([goal for goal in self.goals if goal.saved_amount < goal.target_amount])
        completed_dreams = len([goal for goal in self.goals if goal.saved_amount >= goal.target_amount])

        overall_progress = round((total_saved / total_target * 100) if total_target else 0, 2)
        monthly_saving = max(1000, int(total_saved / max(1, len(self.goals) or 1)))

        consistency_score = min(100, 40 + (len(self.goals) * 5))
        progress_score = min(100, int(overall_progress))
        emergency_score = 70 if total_saved > 0 else 20
        discipline_score = min(100, 50 + min(30, len(self.goals) * 2))

        dream_score = int(round((consistency_score * 0.3) + (progress_score * 0.3) + (emergency_score * 0.2) + (discipline_score * 0.2)))

        nesty_message = self._build_nesty_message(overall_progress, total_saved, total_target)
        return DashboardResponse(
            user=self.user.name,
            dream_score=dream_score,
            total_saved=total_saved,
            total_target=total_target,
            overall_progress=overall_progress,
            active_dreams=active_dreams,
            completed_dreams=completed_dreams,
            monthly_saving=monthly_saving,
            nesty=NestyInsight(**nesty_message),
        )

    def _build_nesty_message(self, overall_progress: float, total_saved: int, total_target: int) -> dict[str, str]:
        if overall_progress >= 50:
            return {
                "title": "You are building momentum!",
                "message": f"You reached {overall_progress:.0f}% of your dreams. Keep going!",
            }
        if total_saved > 0:
            return {
                "title": "You're doing great!",
                "message": f"You reached {overall_progress:.0f}% of your overall dreams. Keep going!",
            }
        return {
            "title": "Start your first dream",
            "message": "Create your first dream and let DreamNest guide your progress.",
        }
