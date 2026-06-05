from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_home():

    response = client.get("/")

    assert response.status_code == 200


def test_register():

    response = client.post(
        "/api/register",
        json={
            "name": "testuser",
            "email": "test@test.com",
            "password": "Password1"
        }
    )

    assert response.status_code in [200, 409]