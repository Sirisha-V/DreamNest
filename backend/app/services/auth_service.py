from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserLogin


class AuthService:
    def __init__(self, db: Session):
        self.repository = UserRepository(db)

    def register(self, user_data: UserCreate):
        if self.repository.get_by_email(user_data.email):
            raise HTTPException(status_code=400, detail="Email already registered")

        password_hash = hash_password(user_data.password)
        user = self.repository.create(
            name=user_data.name,
            email=str(user_data.email),
            password_hash=password_hash,
        )
        token = create_access_token(user.id)
        return {"access_token": token, "token_type": "bearer"}

    def login(self, user_data: UserLogin):
        user = self.repository.get_by_email(str(user_data.email))
        if not user or not verify_password(user_data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_access_token(user.id)
        return {"access_token": token, "token_type": "bearer"}
