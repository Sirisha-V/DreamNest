from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.goals import get_current_user_id
from app.db.session import get_db
from app.repositories.goal_repository import GoalRepository
from app.repositories.transaction_repository import TransactionRepository
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionSummaryResponse, TransactionUpdate
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/api/v1/transactions", tags=["Transactions"])


@router.get("/", response_model=list[TransactionResponse])
def list_transactions(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    service = TransactionService(TransactionRepository(db), GoalRepository(db))
    return service.list_transactions(user_id)


@router.post("/", response_model=TransactionResponse)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    service = TransactionService(TransactionRepository(db), GoalRepository(db))
    return service.create_transaction(user_id, payload)


@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    service = TransactionService(TransactionRepository(db), GoalRepository(db))
    try:
        return service.update_transaction(user_id, transaction_id, payload)
    except ValueError:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Transaction not found")


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    service = TransactionService(TransactionRepository(db), GoalRepository(db))
    try:
        service.delete_transaction(user_id, transaction_id)
    except ValueError:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Transaction not found")


@router.get("/summary", response_model=TransactionSummaryResponse)
def transaction_summary(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    service = TransactionService(TransactionRepository(db), GoalRepository(db))
    return service.summarize(user_id)
