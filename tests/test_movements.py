from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_get_movements():

    response = client.get(
        "/api/movements/test@test.com"
    )

    assert response.status_code in [200, 404]