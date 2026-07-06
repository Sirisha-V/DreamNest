from sqlalchemy.orm import Session

from app.models.goal import Goal


class GoalRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, *, user_id: int, title: str, target_amount: int, saved_amount: int, priority: str | None, deadline: str | None) -> Goal:
        goal = Goal(
            user_id=user_id,
            title=title,
            target_amount=target_amount,
            saved_amount=saved_amount,
            priority=priority,
            deadline=deadline,
        )
        self.db.add(goal)
        self.db.commit()
        self.db.refresh(goal)
        return goal

    def get_by_id(self, goal_id: int, user_id: int | None = None) -> Goal | None:
        query = self.db.query(Goal).filter(Goal.id == goal_id)
        if user_id is not None:
            query = query.filter(Goal.user_id == user_id)
        return query.first()

    def list_all(self, user_id: int | None = None) -> list[Goal]:
        query = self.db.query(Goal)
        if user_id is not None:
            query = query.filter(Goal.user_id == user_id)
        return query.all()

    def update(self, goal: Goal, **kwargs) -> Goal:
        for key, value in kwargs.items():
            if value is not None:
                setattr(goal, key, value)
        self.db.commit()
        self.db.refresh(goal)
        return goal

    def delete(self, goal: Goal) -> None:
        self.db.delete(goal)
        self.db.commit()
