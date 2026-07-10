from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_PATH = Path(__file__).resolve().parents[2] / "app.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    if "goals" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("goals")}
    with engine.begin() as connection:
        if "monthly_contribution" not in existing_columns:
            connection.execute(text("ALTER TABLE goals ADD COLUMN monthly_contribution INTEGER NOT NULL DEFAULT 0"))
        if "months_saved" not in existing_columns:
            connection.execute(text("ALTER TABLE goals ADD COLUMN months_saved INTEGER NOT NULL DEFAULT 0"))
        if "monthly_income" not in existing_columns:
            connection.execute(text("ALTER TABLE goals ADD COLUMN monthly_income INTEGER"))
        if "mandatory_expenses" not in existing_columns:
            connection.execute(text("ALTER TABLE goals ADD COLUMN mandatory_expenses INTEGER"))
        if "is_couple_goal" not in existing_columns:
            connection.execute(text("ALTER TABLE goals ADD COLUMN is_couple_goal BOOLEAN NOT NULL DEFAULT 0"))
        if "partner_name" not in existing_columns:
            connection.execute(text("ALTER TABLE goals ADD COLUMN partner_name VARCHAR(100)"))
        if "plan_summary" not in existing_columns:
            connection.execute(text("ALTER TABLE goals ADD COLUMN plan_summary VARCHAR(500)"))
        if "notes" not in existing_columns:
            connection.execute(text("ALTER TABLE goals ADD COLUMN notes VARCHAR(500)"))
        if "deadline" not in existing_columns:
            connection.execute(text("ALTER TABLE goals ADD COLUMN deadline VARCHAR(10)"))
        if "priority" not in existing_columns:
            connection.execute(text("ALTER TABLE goals ADD COLUMN priority VARCHAR(50)"))

    if "transactions" not in inspector.get_table_names():
        with engine.begin() as connection:
            connection.execute(text("""
                CREATE TABLE transactions (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    goal_id INTEGER,
                    kind VARCHAR(32) NOT NULL,
                    category VARCHAR(100) NOT NULL,
                    amount INTEGER NOT NULL,
                    note VARCHAR(500),
                    occurred_on VARCHAR(10) NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users(id),
                    FOREIGN KEY(goal_id) REFERENCES goals(id)
                )
            """))
