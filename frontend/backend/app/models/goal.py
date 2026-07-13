from datetime import date

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    target_amount = Column(Integer, nullable=False, default=0)
    saved_amount = Column(Integer, nullable=False, default=0)
    monthly_contribution = Column(Integer, nullable=False, default=0)
    months_saved = Column(Integer, nullable=False, default=0)
    monthly_income = Column(Integer, nullable=True, default=0)
    mandatory_expenses = Column(Integer, nullable=True, default=0)
    is_couple_goal = Column(Boolean, nullable=False, default=False)
    partner_name = Column(String(100), nullable=True)
    plan_summary = Column(String(500), nullable=True)
    notes = Column(String(500), nullable=True)
    priority = Column(String(50), nullable=True)
    deadline = Column(String(10), nullable=True)

    user = relationship("User", backref="goals")

    @property
    def saved(self) -> int:
        return self.saved_amount

    @property
    def target(self) -> int:
        return self.target_amount

    @property
    def progress(self) -> int:
        if self.target_amount <= 0:
            return 0
        return int(round((self.saved_amount / self.target_amount) * 100))

    @property
    def remaining(self) -> int:
        return max(0, self.target_amount - self.saved_amount)

    @property
    def remaining_amount(self) -> int:
        return self.remaining

    @property
    def days_left(self) -> int:
        if not self.deadline:
            return 0
        try:
            deadline_date = date.fromisoformat(self.deadline)
        except ValueError:
            return 0
        return max(0, (deadline_date - date.today()).days)

    @property
    def estimated_completion(self) -> str | None:
        return self.deadline
