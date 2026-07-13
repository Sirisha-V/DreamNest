from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class TransactionCreate(BaseModel):
    kind: str
    category: str
    amount: int
    goal_id: Optional[int] = None
    note: Optional[str] = None
    occurred_on: Optional[date] = None


class TransactionUpdate(BaseModel):
    kind: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[int] = None
    goal_id: Optional[int] = None
    note: Optional[str] = None
    occurred_on: Optional[date] = None


class TransactionResponse(BaseModel):
    id: int
    user_id: int
    goal_id: Optional[int] = None
    kind: str
    category: str
    amount: int
    note: Optional[str] = None
    occurred_on: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TransactionSummaryItem(BaseModel):
    label: str
    value: int


class TransactionSummaryResponse(BaseModel):
    income: int
    expenses: int
    savings: int
    investments: int
    transfers: int
    net: int
    recent_transactions: list[TransactionResponse]
    breakdown: list[TransactionSummaryItem]
