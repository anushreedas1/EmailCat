"""Test API endpoints to verify setup."""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["status"] == "running"
    print("✓ Root endpoint working")

def test_health_endpoint():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    print("✓ Health check endpoint working")

if __name__ == "__main__":
    print("Testing API endpoints...")
    test_root_endpoint()
    test_health_endpoint()
    print("\n✅ All API tests passed!")
