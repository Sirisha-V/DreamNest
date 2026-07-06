from datetime import date
from typing import Optional

from pydantic import BaseModel


class GoalCreate(BaseModel):
    title: str
    target_amount: int
    saved_amount: int = 0
    deadline: Optional[date] = None
    priority: Optional[str] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target_amount: Optional[int] = None
    saved_amount: Optional[int] = None
    deadline: Optional[date] = None
    priority: Optional[str] = None


class GoalResponse(BaseModel):
    id: int
    title: str
    target_amount: int
    saved_amount: int
    deadline: Optional[str] = None
    priority: Optional[str] = None
    progress: int
    remaining_amount: int

    class Config:
        from_attributes = True