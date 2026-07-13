from sqlalchemy.orm import Session

from app.models.goal import Goal


class GoalRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        *,
        user_id: int,
        title: str,
        target_amount: int,
        saved_amount: int,
        monthly_contribution: int,
        months_saved: int,
        monthly_income: int | None,
        mandatory_expenses: int | None,
        is_couple_goal: bool,
        partner_name: str | None,
        plan_summary: str | None,
        notes: str | None,
        priority: str | None,
        deadline: str | None,
    ) -> Goal:
        goal = Goal(
            user_id=user_id,
            title=title,
            target_amount=target_amount,
            saved_amount=saved_amount,
            monthly_contribution=monthly_contribution,
            months_saved=months_saved,
            monthly_income=monthly_income,
            mandatory_expenses=mandatory_expenses,
            is_couple_goal=is_couple_goal,
            partner_name=partner_name,
            plan_summary=plan_summary,
            notes=notes,
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
