from collections import defaultdict
from sqlalchemy.orm import Session

from app.models.transaction import Transaction


class TransactionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, transaction_id: int, user_id: int | None = None) -> Transaction | None:
        query = self.db.query(Transaction).filter(Transaction.id == transaction_id)
        if user_id is not None:
            query = query.filter(Transaction.user_id == user_id)
        return query.first()

    def create(
        self,
        *,
        user_id: int,
        kind: str,
        category: str,
        amount: int,
        goal_id: int | None,
        note: str | None,
        occurred_on: str,
    ) -> Transaction:
        transaction = Transaction(
            user_id=user_id,
            goal_id=goal_id,
            kind=kind,
            category=category,
            amount=amount,
            note=note,
            occurred_on=occurred_on,
        )
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        return transaction

    def update(
        self,
        transaction: Transaction,
        *,
        kind: str,
        category: str,
        amount: int,
        goal_id: int | None,
        note: str | None,
        occurred_on: str,
    ) -> Transaction:
        transaction.kind = kind
        transaction.category = category
        transaction.amount = amount
        transaction.goal_id = goal_id
        transaction.note = note
        transaction.occurred_on = occurred_on
        self.db.commit()
        self.db.refresh(transaction)
        return transaction

    def delete(self, transaction: Transaction) -> None:
        self.db.delete(transaction)
        self.db.commit()

    def list_all(self, user_id: int | None = None) -> list[Transaction]:
        query = self.db.query(Transaction)
        if user_id is not None:
            query = query.filter(Transaction.user_id == user_id)
        return query.order_by(Transaction.id.desc()).all()

    def list_recent(self, user_id: int | None = None, limit: int = 10) -> list[Transaction]:
        query = self.db.query(Transaction)
        if user_id is not None:
            query = query.filter(Transaction.user_id == user_id)
        return query.order_by(Transaction.id.desc()).limit(limit).all()

    def summarize(self, user_id: int | None = None) -> dict[str, object]:
        transactions = self.list_all(user_id=user_id)
        totals = defaultdict(int)
        breakdown: dict[str, int] = defaultdict(int)

        for transaction in transactions:
            totals[transaction.kind] += transaction.amount
            breakdown[transaction.category] += transaction.amount

        return {
            "income": totals["income"],
            "expenses": totals["expense"],
            "savings": totals["savings"],
            "investments": totals["investment"],
            "transfers": totals["transfer"],
            "net": totals["income"] - totals["expense"] - totals["savings"] - totals["investment"] - totals["transfer"],
            "breakdown": [{"label": label, "value": value} for label, value in breakdown.items()],
        }
