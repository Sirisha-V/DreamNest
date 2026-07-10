from datetime import date

from app.repositories.goal_repository import GoalRepository
from app.repositories.transaction_repository import TransactionRepository
from app.schemas.transaction import TransactionCreate, TransactionUpdate


class TransactionService:
    def __init__(self, repository: TransactionRepository, goal_repository: GoalRepository):
        self.repository = repository
        self.goal_repository = goal_repository

    def _apply_goal_balance_change(self, user_id: int, goal_id: int | None, amount_delta: int) -> None:
        if goal_id is None or amount_delta == 0:
            return

        goal = self.goal_repository.get_by_id(goal_id, user_id=user_id)
        if not goal:
            return

        updated_saved_amount = max(0, goal.saved_amount + amount_delta)
        self.goal_repository.update(goal, saved_amount=updated_saved_amount)

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
            self._apply_goal_balance_change(user_id, payload.goal_id, payload.amount)

        return transaction

    def update_transaction(self, user_id: int, transaction_id: int, payload: TransactionUpdate):
        transaction = self.repository.get_by_id(transaction_id, user_id=user_id)
        if not transaction:
                        raise ValueError("Transaction not found")

        next_kind = payload.kind or transaction.kind
        next_category = payload.category or transaction.category
        next_amount = payload.amount if payload.amount is not None else transaction.amount
        next_goal_id = payload.goal_id if payload.goal_id is not None or payload.kind == "savings" else transaction.goal_id
        next_note = payload.note if payload.note is not None else transaction.note
        next_occurred_on = payload.occurred_on.isoformat() if payload.occurred_on else transaction.occurred_on

        if transaction.kind == "savings" and transaction.goal_id is not None:
            self._apply_goal_balance_change(user_id, transaction.goal_id, -transaction.amount)

        updated = self.repository.update(
            transaction,
            kind=next_kind,
            category=next_category,
            amount=next_amount,
            goal_id=next_goal_id,
            note=next_note,
            occurred_on=next_occurred_on,
        )

        if next_kind == "savings" and next_goal_id is not None:
            self._apply_goal_balance_change(user_id, next_goal_id, next_amount)

        return updated

    def delete_transaction(self, user_id: int, transaction_id: int):
        transaction = self.repository.get_by_id(transaction_id, user_id=user_id)
        if not transaction:
            raise ValueError("Transaction not found")

        if transaction.kind == "savings" and transaction.goal_id is not None:
            self._apply_goal_balance_change(user_id, transaction.goal_id, -transaction.amount)

        self.repository.delete(transaction)

    def list_transactions(self, user_id: int):
        return self.repository.list_all(user_id=user_id)

    def recent_transactions(self, user_id: int, limit: int = 10):
        return self.repository.list_recent(user_id=user_id, limit=limit)

    def summarize(self, user_id: int):
        summary = self.repository.summarize(user_id=user_id)
        summary["recent_transactions"] = self.recent_transactions(user_id=user_id, limit=8)
        return summary
