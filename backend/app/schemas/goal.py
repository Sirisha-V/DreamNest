from datetime import date
from typing import Optional

from pydantic import BaseModel


class GoalCreate(BaseModel):
    title: str
    target_amount: int
    saved_amount: int = 0
    monthly_contribution: int = 0
    months_saved: int = 0
    monthly_income: Optional[int] = None
    mandatory_expenses: Optional[int] = None
    is_couple_goal: bool = False
    partner_name: Optional[str] = None
    plan_summary: Optional[str] = None
    notes: Optional[str] = None
    deadline: Optional[date] = None
    priority: Optional[str] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target_amount: Optional[int] = None
    saved_amount: Optional[int] = None
    monthly_contribution: Optional[int] = None
    months_saved: Optional[int] = None
    monthly_income: Optional[int] = None
    mandatory_expenses: Optional[int] = None
    is_couple_goal: Optional[bool] = None
    partner_name: Optional[str] = None
    plan_summary: Optional[str] = None
    notes: Optional[str] = None
    deadline: Optional[date] = None
    priority: Optional[str] = None


class GoalResponse(BaseModel):
    id: int
    title: str
    target_amount: int
    saved_amount: int
    monthly_contribution: int
    months_saved: int
    monthly_income: Optional[int] = None
    mandatory_expenses: Optional[int] = None
    is_couple_goal: bool
    partner_name: Optional[str] = None
    plan_summary: Optional[str] = None
    notes: Optional[str] = None
    deadline: Optional[str] = None
    priority: Optional[str] = None
    progress: int
    remaining_amount: int

    class Config:
        from_attributes = True