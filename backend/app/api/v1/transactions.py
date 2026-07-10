from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.goals import get_current_user_id
from app.db.session import get_db
from app.repositories.goal_repository import GoalRepository
from app.repositories.transaction_repository import TransactionRepository
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionSummaryResponse
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


@router.get("/summary", response_model=TransactionSummaryResponse)
def transaction_summary(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    service = TransactionService(TransactionRepository(db), GoalRepository(db))
    return service.summarize(user_id)
