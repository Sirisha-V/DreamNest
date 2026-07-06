from fastapi.testclient import TestClient

from app.db.base import Base
from app.db.database import engine
from app.main import app


client = TestClient(app)


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_goal_crud_flow():
    create_response = client.post(
        "/api/v1/goals",
        json={
            "title": "Buy a House",
            "target_amount": 5000000,
            "saved_amount": 50000,
            "priority": "High",
            "deadline": "2030-12-31",
        },
    )

    assert create_response.status_code == 200
    created_goal = create_response.json()
    assert created_goal["title"] == "Buy a House"
    assert created_goal["target_amount"] == 5000000
    assert created_goal["saved_amount"] == 50000
    assert created_goal["progress"] == 1
    assert created_goal["remaining_amount"] == 4950000

    list_response = client.get("/api/v1/goals")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    get_response = client.get(f"/api/v1/goals/{created_goal['id']}")
    assert get_response.status_code == 200
    assert get_response.json()["title"] == "Buy a House"

    update_response = client.put(
        f"/api/v1/goals/{created_goal['id']}",
        json={"saved_amount": 100000},
    )
    assert update_response.status_code == 200
    updated_goal = update_response.json()
    assert updated_goal["saved_amount"] == 100000
    assert updated_goal["progress"] == 2

    delete_response = client.delete(f"/api/v1/goals/{created_goal['id']}")
    assert delete_response.status_code == 204
