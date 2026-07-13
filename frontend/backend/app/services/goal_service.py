from app.repositories.goal_repository import GoalRepository
from app.schemas.goal import GoalCreate
from app.utils.goal_planning import build_plan_summary


class GoalService:
    def __init__(self, repository: GoalRepository):
        self.repository = repository

    def create_goal(self, user_id: int, goal_data: GoalCreate):
        plan_summary = goal_data.plan_summary or build_plan_summary(
            goal_data.title,
            goal_data.target_amount,
            goal_data.saved_amount,
            goal_data.monthly_contribution,
            goal_data.monthly_income,
            goal_data.mandatory_expenses,
            goal_data.months_saved,
        )
        return self.repository.create(
            user_id=user_id,
            title=goal_data.title,
            target_amount=goal_data.target_amount,
            saved_amount=goal_data.saved_amount,
            monthly_contribution=goal_data.monthly_contribution,
            months_saved=goal_data.months_saved,
            monthly_income=goal_data.monthly_income,
            mandatory_expenses=goal_data.mandatory_expenses,
            is_couple_goal=goal_data.is_couple_goal,
            partner_name=goal_data.partner_name,
            plan_summary=plan_summary,
            notes=goal_data.notes,
            priority=goal_data.priority,
            deadline=goal_data.deadline.isoformat() if goal_data.deadline else None,
        )

    def get_goal(self, goal_id: int, user_id: int):
        return self.repository.get_by_id(goal_id, user_id=user_id)

    def list_goals(self, user_id: int):
        return self.repository.list_all(user_id=user_id)

    def update_goal(self, goal, goal_data):
        update_data = {}
        if goal_data.title is not None:
            update_data["title"] = goal_data.title
        if goal_data.target_amount is not None:
            update_data["target_amount"] = goal_data.target_amount
        if goal_data.saved_amount is not None:
            update_data["saved_amount"] = goal_data.saved_amount
        if goal_data.monthly_contribution is not None:
            update_data["monthly_contribution"] = goal_data.monthly_contribution
        if goal_data.months_saved is not None:
            update_data["months_saved"] = goal_data.months_saved
        if goal_data.monthly_income is not None:
            update_data["monthly_income"] = goal_data.monthly_income
        if goal_data.mandatory_expenses is not None:
            update_data["mandatory_expenses"] = goal_data.mandatory_expenses
        if goal_data.is_couple_goal is not None:
            update_data["is_couple_goal"] = goal_data.is_couple_goal
        if goal_data.partner_name is not None:
            update_data["partner_name"] = goal_data.partner_name
        if goal_data.plan_summary is not None:
            update_data["plan_summary"] = goal_data.plan_summary
        if goal_data.notes is not None:
            update_data["notes"] = goal_data.notes
        if goal_data.priority is not None:
            update_data["priority"] = goal_data.priority
        if goal_data.deadline is not None:
            update_data["deadline"] = goal_data.deadline.isoformat()
        return self.repository.update(goal, **update_data)

    def delete_goal(self, goal):
        self.repository.delete(goal)
        return None
