import math
from typing import Optional


def build_plan_summary(
    title: str,
    target_amount: int,
    saved_amount: int = 0,
    monthly_contribution: int = 0,
    monthly_income: Optional[int] = None,
    mandatory_expenses: Optional[int] = None,
    months_saved: int = 0,
) -> str:
    if not title.strip():
        title = "your dream"

    if target_amount <= 0:
        return f"Set a realistic target for {title} so the plan can guide your saving journey."

    remaining = max(0, target_amount - saved_amount)
    if monthly_income is None or mandatory_expenses is None:
        return (
            f"Add your monthly income and mandatory expenses to get a tailored plan for {title}."
        )

    surplus = max(0, monthly_income - mandatory_expenses)
    contribution = max(monthly_contribution, 0)
    if contribution <= 0:
        contribution = max(0, min(surplus, max(1000, int(round(surplus * 0.3)))))

    if remaining <= 0:
        return f"{title} is already fully funded. Great job building momentum."

    if contribution <= 0:
        return (
            f"With a monthly income of ₹{monthly_income} and mandatory expenses of ₹{mandatory_expenses}, "
            f"you have ₹{surplus} left to build {title}. Start with a small recurring deposit to get moving."
        )

    months_needed = max(1, math.ceil(remaining / contribution))
    if months_saved > 0:
        return (
            f"You have already been saving for {months_saved} months. With your current plan, "
            f"saving ₹{contribution} each month can help you reach {title} in about {months_needed} more months."
        )

    return (
        f"With a monthly income of ₹{monthly_income} and mandatory expenses of ₹{mandatory_expenses}, "
        f"you have ₹{surplus} left to plan around. Saving ₹{contribution} each month can help you reach {title} in about {months_needed} months."
    )
