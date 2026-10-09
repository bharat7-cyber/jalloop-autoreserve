import os
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .models import WaterSystemInput, CalculationResult, SensorTelemetry, SystemHealth
from .calculator import calculate_water_balance
from .db import storage
from .sensors import sensor_simulator

app = FastAPI(
    title="JalLoop AutoReserve API",
    description="Intelligent building water management system reconciling cloudburst flood prevention with dry-period & heatwave reserves.",
    version="1.0.0",
)

# Enable CORS for local dev and production frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PRESETS: Dict[str, Dict[str, Any]] = {
    "bangalore_highrise": {
        "name": "Bangalore Residential High-Rise (Monsoon Alert)",
        "description": "Dense residential tower facing intense monsoon showers; tank near capacity needs pre-storm headroom.",
        "params": {
            "rainfall_mm": 65.0,
            "catchment_area_sqm": 2400.0,
            "runoff_coefficient": 0.90,
            "tank_capacity_liters": 150000.0,
            "current_water_level_liters": 115000.0,
            "daily_water_demand_liters": 18000.0,
            "reserve_days": 3.5,
            "scenario_name": "Bangalore High-Rise Monsoon Buffer"
        }
    },
    "hyderabad_techpark": {
        "name": "Hyderabad Tech Park (Heatwave Defense)",
        "description": "Commercial IT park facing extreme summer heat; minimal rain requires aggressive water-banking and zero discharge.",
        "params": {
            "rainfall_mm": 4.0,
            "catchment_area_sqm": 8500.0,
            "runoff_coefficient": 0.85,
            "tank_capacity_liters": 500000.0,
            "current_water_level_liters": 130000.0,
            "daily_water_demand_liters": 35000.0,
            "reserve_days": 4.0,
            "scenario_name": "Hyderabad Tech Park Heatwave Defense"
        }
    },
    "mumbai_coastal": {
        "name": "Mumbai Coastal Campus (Cloudburst Overload)",
        "description": "High-intensity coastal cloudburst producing runoff exceeding total tank volume; requires controlled discharge + storm bypass.",
        "params": {
            "rainfall_mm": 120.0,
            "catchment_area_sqm": 3200.0,
            "runoff_coefficient": 0.95,
            "tank_capacity_liters": 250000.0,
            "current_water_level_liters": 210000.0,
            "daily_water_demand_liters": 25000.0,
            "reserve_days": 3.0,
            "scenario_name": "Mumbai Coastal Cloudburst Overload"
        }
    },
    "delhi_hospital": {
        "name": "Delhi Institutional Hospital (Critical Reserve)",
        "description": "Hospital infrastructure requiring strict 5-day emergency water autonomy at all times.",
        "params": {
            "rainfall_mm": 35.0,
            "catchment_area_sqm": 5000.0,
            "runoff_coefficient": 0.88,
            "tank_capacity_liters": 300000.0,
            "current_water_level_liters": 160000.0,
            "daily_water_demand_liters": 40000.0,
            "reserve_days": 5.0,
            "scenario_name": "Delhi Hospital Critical Infrastructure"
        }
    },
    "eco_villa": {
        "name": "Eco-Villa Sustainable Community (Balanced Harvest)",
        "description": "Green community with permeable surfaces and rainwater harvesting sized to absorb standard storm surge.",
        "params": {
            "rainfall_mm": 28.0,
            "catchment_area_sqm": 800.0,
            "runoff_coefficient": 0.80,
            "tank_capacity_liters": 40000.0,
            "current_water_level_liters": 16000.0,
            "daily_water_demand_liters": 3200.0,
            "reserve_days": 3.0,
            "scenario_name": "Eco-Villa Balanced Harvest"
        }
    }
}


@app.get("/")
def root():
    return {
        "service": "JalLoop AutoReserve API",
        "status": "operational",
        "version": "1.0.0",
        "docs_url": "/docs",
        "description": "Intelligent building rainwater harvesting & dynamic pre-storm buffer management"
    }


@app.get("/api/health", response_model=SystemHealth)
def get_health():
    """Returns honest health state, records count, and AWS DynamoDB connection status."""
    return storage.get_health()


@app.get("/api/presets")
def get_presets():
    """Provides curated real-world architectural and climatological presets."""
    return PRESETS


@app.post("/api/calculate", response_model=CalculationResult)
def calculate_system(input_data: WaterSystemInput):
    """
    Computes exact water balance, pre-storm drawdown, available headspace,
    post-rain tank level, and AI-driven advisory strategy.
    Persists to AWS DynamoDB if configured, else local SQLite.
    """
    backend_mode = "dynamodb" if storage.is_dynamodb_active else "sqlite"
    result = calculate_water_balance(inputs=input_data, storage_backend=backend_mode)
    
    # Persist calculation
    storage.save_calculation(result)
    
    # Sync sensor simulator current water level for realistic telemetry feedback
    sensor_simulator.current_water_level = result.post_rain_tank_level_liters
    sensor_simulator.tank_capacity = input_data.tank_capacity_liters
    sensor_simulator.cumulative_rain_mm = input_data.rainfall_mm
    
    return result


@app.get("/api/history", response_model=List[CalculationResult])
def get_calculation_history(limit: int = Query(default=20, ge=1, le=100)):
    """Fetches recent calculation audit history from storage."""
    return storage.get_history(limit=limit)


@app.get("/api/sensors/current", response_model=SensorTelemetry)
def get_sensor_telemetry():
    """Fetches real-time simulated IoT sensor telemetry (tank level, rain gauge, valve)."""
    return sensor_simulator.get_current_telemetry()


@app.post("/api/sensors/simulate-control")
def update_sensor_control(payload: Dict[str, Any]):
    """Manual or automated actuator trigger for demo and testing."""
    sensor_simulator.set_simulation_state(payload)
    return {"status": "actuator_state_updated", "current": sensor_simulator.get_current_telemetry()}
