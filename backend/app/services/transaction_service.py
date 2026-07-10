from datetime import date

from app.repositories.goal_repository import GoalRepository
from app.repositories.transaction_repository import TransactionRepository
from app.schemas.transaction import TransactionCreate


class TransactionService:
    def __init__(self, repository: TransactionRepository, goal_repository: GoalRepository):
        self.repository = repository
        self.goal_repository = goal_repository

    def create_transaction(self, user_id: int, payload: TransactionCreate):
        occurred_on = payload.occurred_on.isoformat() if payload.occurred_on else date.today().isoformat()
        transaction = self.repository.create(
            user_id=user_id,
            kind=payload.kind,
            category=payload.category,
            amount=payload.amount,
            goal_id=payload.goal_id,
            note=payload.note,
            occurred_on=occurred_on,
        )

        if payload.kind == "savings" and payload.goal_id is not None:
            goal = self.goal_repository.get_by_id(payload.goal_id, user_id=user_id)
            if goal:
                self.goal_repository.update(goal, saved_amount=goal.saved_amount + payload.amount)

        return transaction

    def list_transactions(self, user_id: int):
        return self.repository.list_all(user_id=user_id)

    def recent_transactions(self, user_id: int, limit: int = 10):
        return self.repository.list_recent(user_id=user_id, limit=limit)

    def summarize(self, user_id: int):
        summary = self.repository.summarize(user_id=user_id)
        summary["recent_transactions"] = self.recent_transactions(user_id=user_id, limit=8)
        return summary
