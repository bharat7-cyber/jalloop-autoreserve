import pytest
from app.models import WaterSystemInput
from app.calculator import calculate_water_balance


def test_accurate_runoff_formula():
    """
    Test standard runoff formula:
    Runoff = Rainfall (mm) * Catchment Area (m²) * Runoff Coefficient
    For: 50 mm, 1000 m², 0.9 C -> 50 * 1000 * 0.9 = 45,000 Liters
    """
    inp = WaterSystemInput(
        rainfall_mm=50.0,
        catchment_area_sqm=1000.0,
        runoff_coefficient=0.9,
        tank_capacity_liters=100000.0,
        current_water_level_liters=50000.0,
        daily_water_demand_liters=10000.0,
        reserve_days=3.0,
    )
    res = calculate_water_balance(inp)
    assert res.harvestable_runoff_liters == 45000.0
    assert res.safety_reserve_liters == 30000.0  # 10000 * 3
    assert res.available_storage_liters == 50000.0  # 100000 - 50000
    assert res.recommended_drawdown_liters == 0.0
    assert res.post_rain_tank_level_liters == 95000.0
    assert res.overflow_liters == 0.0


def test_pre_storm_drawdown_calculation():
    """
    Test pre-storm drawdown when tank is full and runoff will cause overflow:
    Tank: 100,000 L, Current: 90,000 L, Headroom: 10,000 L.
    Runoff: 40,000 L.
    Needed room: 40,000 - 10,000 = 30,000 L.
    Daily demand: 10,000 L, Reserve days: 3 -> Reserve: 30,000 L.
    Max safe drawdown: 90,000 - 30,000 = 60,000 L.
    Recommended drawdown: min(30,000, 60,000) = 30,000 L.
    Post-drawdown level: 60,000 L.
    Captured: 40,000 L.
    Post-rain level: 60,000 + 40,000 = 100,000 L (100% capacity).
    Overflow: 0 L!
    """
    inp = WaterSystemInput(
        rainfall_mm=40.0,
        catchment_area_sqm=1000.0,
        runoff_coefficient=1.0,
        tank_capacity_liters=100000.0,
        current_water_level_liters=90000.0,
        daily_water_demand_liters=10000.0,
        reserve_days=3.0,
    )
    res = calculate_water_balance(inp)
    assert res.harvestable_runoff_liters == 40000.0
    assert res.available_storage_liters == 10000.0
    assert res.recommended_drawdown_liters == 30000.0
    assert res.post_drawdown_level_liters == 60000.0
    assert res.post_rain_tank_level_liters == 100000.0
    assert res.overflow_liters == 0.0
    assert res.mode == "STORM_SURGE_PREP"
    assert res.valve_action == "CONTROLLED_DISCHARGE"


def test_safety_reserve_never_breached():
    """
    Test that drawdown NEVER breaches the safety reserve,
    even when storm runoff is massive.
    """
    inp = WaterSystemInput(
        rainfall_mm=100.0,
        catchment_area_sqm=1000.0,
        runoff_coefficient=1.0,
        tank_capacity_liters=100000.0,
        current_water_level_liters=40000.0,
        daily_water_demand_liters=10000.0,
        reserve_days=3.0,
    )
    res = calculate_water_balance(inp)
    assert res.recommended_drawdown_liters == 10000.0
    assert res.post_drawdown_level_liters == 30000.0  # Exactly at safety reserve
    assert res.post_drawdown_level_liters >= res.safety_reserve_liters


def test_heatwave_drought_mode():
    inp = WaterSystemInput(
        rainfall_mm=2.0,
        catchment_area_sqm=1000.0,
        runoff_coefficient=0.85,
        tank_capacity_liters=100000.0,
        current_water_level_liters=25000.0,
        daily_water_demand_liters=10000.0,
        reserve_days=3.0,
    )
    res = calculate_water_balance(inp)
    assert res.mode == "HEATWAVE_DEFENSE"
    assert res.alert_level == "CRITICAL"
    assert res.valve_action == "KEEP_CLOSED"
    assert res.recommended_drawdown_liters == 0.0


def test_zero_rainfall():
    inp = WaterSystemInput(
        rainfall_mm=0.0,
        catchment_area_sqm=1500.0,
        runoff_coefficient=0.9,
        tank_capacity_liters=80000.0,
        current_water_level_liters=60000.0,
        daily_water_demand_liters=5000.0,
        reserve_days=3.0,
    )
    res = calculate_water_balance(inp)
    assert res.harvestable_runoff_liters == 0.0
    assert res.recommended_drawdown_liters == 0.0
    assert res.captured_water_liters == 0.0
    assert res.overflow_liters == 0.0
    assert res.post_rain_tank_level_liters == 60000.0

def test_current_water_level_cannot_exceed_tank_capacity():
    with pytest.raises(
        ValueError,
        match="Current water level cannot exceed tank capacity"
    ):
        WaterSystemInput(
            rainfall_mm=10.0,
            catchment_area_sqm=1000.0,
            runoff_coefficient=0.9,
            tank_capacity_liters=100000.0,
            current_water_level_liters=100001.0,
            daily_water_demand_liters=10000.0,
            reserve_days=3.0,
        )
