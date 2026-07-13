import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.goals import router as goal_router
from app.api.v1.transactions import router as transaction_router
from app.db.base import Base
from app.db.database import engine, initialize_database

app = FastAPI(
    title="DreamNest API",
    description="AI-powered Financial Goal Coach",
    version="1.0.0",
)

cors_origins_env = os.getenv("CORS_ORIGINS", "")
configured_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
default_local_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins or default_local_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

initialize_database()
app.include_router(auth_router)
app.include_router(goal_router)
app.include_router(transaction_router)
app.include_router(dashboard_router)


@app.get("/")
def root():
    return {"message": "Welcome to DreamNest 🌱"}


@app.get("/health")
def health():
    return {"status": "healthy"}