from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "persistence_mode" in data


def test_presets_endpoint():
    response = client.get("/api/presets")
    assert response.status_code == 200
    presets = response.json()
    assert "bangalore_highrise" in presets
    assert "hyderabad_techpark" in presets


def test_calculate_endpoint():
    payload = {
        "rainfall_mm": 50.0,
        "catchment_area_sqm": 2000.0,
        "runoff_coefficient": 0.9,
        "tank_capacity_liters": 150000.0,
        "current_water_level_liters": 100000.0,
        "daily_water_demand_liters": 15000.0,
        "reserve_days": 3.0,
        "scenario_name": "API Test Scenario"
    }
    response = client.post("/api/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["harvestable_runoff_liters"] == 90000.0
    assert "recommended_drawdown_liters" in data
    assert "recommendations" in data
    assert len(data["recommendations"]) > 0


def test_history_endpoint():
    response = client.get("/api/history")
    assert response.status_code == 200
    history = response.json()
    assert isinstance(history, list)
    assert len(history) >= 1


def test_sensors_endpoint():
    response = client.get("/api/sensors/current")
    assert response.status_code == 200
    telemetry = response.json()
    assert "tank_level_liters" in telemetry
    assert "rain_rate_mm_hr" in telemetry
