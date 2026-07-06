from app.repositories.goal_repository import GoalRepository
from app.schemas.goal import GoalCreate


class GoalService:
    def __init__(self, repository: GoalRepository):
        self.repository = repository

    def create_goal(self, user_id: int, goal_data: GoalCreate):
        return self.repository.create(
            user_id=user_id,
            title=goal_data.title,
            target_amount=goal_data.target_amount,
            saved_amount=goal_data.saved_amount,
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
        if goal_data.priority is not None:
            update_data["priority"] = goal_data.priority
        if goal_data.deadline is not None:
            update_data["deadline"] = goal_data.deadline.isoformat()
        return self.repository.update(goal, **update_data)

    def delete_goal(self, goal):
        self.repository.delete(goal)
        return None
