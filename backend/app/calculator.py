import math
import uuid
from datetime import datetime, timezone
from typing import List, Tuple
from .models import WaterSystemInput, CalculationResult, HourlyWaterForecast


def calculate_water_balance(inputs: WaterSystemInput, storage_backend: str = "sqlite") -> CalculationResult:
    """
    Core mathematical engine for JalLoop AutoReserve.
    
    Equations:
    - Runoff (L) = rainfall (mm) * catchment_area (m²) * runoff_coefficient
      (1 mm of rain over 1 m² = 1 Liter of water)
    - Safety Reserve (L) = daily_water_demand (L/day) * reserve_days
    - Available Storage (L) = max(0, tank_capacity - current_water_level)
    - Needed Storage Room (L) = max(0, runoff - available_storage)
    - Max Safe Drawdown (L) = max(0, current_water_level - safety_reserve)
    - Recommended Drawdown (L) = min(needed_room, max_safe_drawdown)
    - Post-Drawdown Level (L) = current_water_level - recommended_drawdown
    - Room After Drawdown (L) = tank_capacity - post_drawdown_level
    - Captured Water (L) = min(runoff, room_after_drawdown)
    - Overflow Water (L) = max(0, runoff - room_after_drawdown)
    - Post-Rain Level (L) = post_drawdown_level + captured_water
    """
    calc_id = f"calc_{uuid.uuid4().hex[:10]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Harvestable Runoff Volume (Liters)
    # 1 mm * 1 m² = 0.001 m * 1 m² = 0.001 m³ = 1.0 Liter
    runoff_liters = inputs.rainfall_mm * inputs.catchment_area_sqm * inputs.runoff_coefficient
    runoff_liters = round(max(0.0, runoff_liters), 2)

    # 2. Critical Safety Reserve (Liters)
    safety_reserve_liters = inputs.daily_water_demand_liters * inputs.reserve_days
    safety_reserve_liters = round(max(0.0, safety_reserve_liters), 2)

    # 3. Available Storage Headroom prior to action
    capacity = inputs.tank_capacity_liters
    current_level = min(inputs.current_water_level_liters, capacity)
    available_storage = max(0.0, capacity - current_level)
    available_storage = round(available_storage, 2)

    # 4. Storage headroom needed to capture 100% of incoming runoff
    needed_room = max(0.0, runoff_liters - available_storage)

    # 5. Maximum safe drawdown permitted without violating building dry-period reserve
    max_safe_drawdown = max(0.0, current_level - safety_reserve_liters)

    # 6. Optimal Recommended Pre-Storm Drawdown
    # Only draw down what is needed, and NEVER breach safety reserve
    recommended_drawdown = min(needed_room, max_safe_drawdown)
    recommended_drawdown = round(max(0.0, recommended_drawdown), 2)

    # 7. Level after drawdown execution
    post_drawdown_level = round(current_level - recommended_drawdown, 2)

    # 8. Available room after drawdown
    room_after_drawdown = capacity - post_drawdown_level

    # 9. Captured vs Overflow
    captured_water = round(min(runoff_liters, room_after_drawdown), 2)
    overflow_water = round(max(0.0, runoff_liters - room_after_drawdown), 2)

    # 10. Overflow risk %
    if runoff_liters > 0.0:
        overflow_risk_pct = round((overflow_water / runoff_liters) * 100.0, 1)
    else:
        overflow_risk_pct = 0.0

    # 11. Post-rain final tank level & percentage
    post_rain_level = round(min(capacity, post_drawdown_level + captured_water), 2)
    post_rain_fill_pct = round((post_rain_level / capacity) * 100.0, 1) if capacity > 0 else 0.0

    # 12. Autonomy days remaining
    if inputs.daily_water_demand_liters > 0:
        autonomy_days = round(post_rain_level / inputs.daily_water_demand_liters, 1)
    else:
        autonomy_days = 999.0

    # 13. Pre-storm discharge rate (assuming 4 hours / 240 mins pre-storm window)
    if recommended_drawdown > 0:
        valve_discharge_rate_lpm = round(recommended_drawdown / 240.0, 1)
    else:
        valve_discharge_rate_lpm = 0.0

    # 14. Determine Operational Mode & Strategy
    mode, alert_level, valve_action, recommendations = determine_strategy(
        inputs=inputs,
        runoff_liters=runoff_liters,
        safety_reserve=safety_reserve_liters,
        current_level=current_level,
        capacity=capacity,
        recommended_drawdown=recommended_drawdown,
        overflow_water=overflow_water,
        overflow_risk_pct=overflow_risk_pct,
        post_rain_level=post_rain_level,
        autonomy_days=autonomy_days,
    )

    # 15. Generate hourly 24h projection hydrograph
    hourly_projection = generate_hourly_projection(
        inputs=inputs,
        total_runoff=runoff_liters,
        capacity=capacity,
        post_drawdown_level=post_drawdown_level
    )

    return CalculationResult(
        id=calc_id,
        timestamp=now_iso,
        inputs=inputs,
        harvestable_runoff_liters=runoff_liters,
        safety_reserve_liters=safety_reserve_liters,
        available_storage_liters=available_storage,
        recommended_drawdown_liters=recommended_drawdown,
        post_drawdown_level_liters=post_drawdown_level,
        captured_water_liters=captured_water,
        overflow_liters=overflow_water,
        overflow_risk_percentage=overflow_risk_pct,
        post_rain_tank_level_liters=post_rain_level,
        post_rain_fill_percentage=post_rain_fill_pct,
        days_of_autonomy_remaining=autonomy_days,
        mode=mode,
        alert_level=alert_level,
        valve_action=valve_action,
        valve_discharge_rate_lpm=valve_discharge_rate_lpm,
        recommendations=recommendations,
        storage_backend=storage_backend,
        hourly_projection=hourly_projection,
    )


def determine_strategy(
    inputs: WaterSystemInput,
    runoff_liters: float,
    safety_reserve: float,
    current_level: float,
    capacity: float,
    recommended_drawdown: float,
    overflow_water: float,
    overflow_risk_pct: float,
    post_rain_level: float,
    autonomy_days: float,
) -> Tuple[str, str, str, List[str]]:
    """
    Intelligent decision engine reconciling flood prevention vs drought resilience.
    """
    recommendations: List[str] = []

    # Scenario A: Heatwave / Severe Dry Spell / Low Water Level
    if inputs.rainfall_mm < 10.0 or current_level < safety_reserve:
        mode = "HEATWAVE_DEFENSE"
        valve_action = "KEEP_CLOSED"
        
        if current_level < safety_reserve:
            alert_level = "CRITICAL"
            deficit = round(safety_reserve - current_level, 0)
            recommendations.append(
                f"🚨 CRITICAL WATER DEFICIT: Current tank ({current_level:,.0f} L) is below the {inputs.reserve_days:g}-day safety reserve ({safety_reserve:,.0f} L) by {deficit:,.0f} L."
            )
            recommendations.append(
                "Keep all discharge valves firmly LOCKED. Enforce strict building non-potable water rationing."
            )
            recommendations.append(
                "Activate graywater recycling loop and divert cooling tower blowdown to secondary reserves."
            )
        else:
            alert_level = "ADVISORY"
            recommendations.append(
                f"☀️ DRY / HEATWAVE PERIOD ACTIVE: Minimal rainfall predicted ({inputs.rainfall_mm} mm). Zero drawdown recommended."
            )
            recommendations.append(
                f"Tank holds {autonomy_days:.1f} days of building autonomy. Prioritize reservoir preservation against thermal stress."
            )
        return mode, alert_level, valve_action, recommendations

    # Scenario B: Heavy Rain / Storm Surge with High Overflow Risk
    if inputs.rainfall_mm >= 40.0 or overflow_water > 0 or recommended_drawdown > 0:
        mode = "STORM_SURGE_PREP"
        
        if recommended_drawdown > 0 and overflow_water == 0:
            alert_level = "WARNING"
            valve_action = "CONTROLLED_DISCHARGE"
            recommendations.append(
                f"🌧️ OPTIMAL PRE-STORM DRAWDOWN: Release {recommended_drawdown:,.0f} L prior to storm onset over a 4-hour window."
            )
            recommendations.append(
                f"This creates buffer room to capture 100% of incoming {runoff_liters:,.0f} L runoff without flooding municipal drains."
            )
            recommendations.append(
                f"Discharge rate: Set smart actuator to {recommended_drawdown / 240.0:.1f} LPM directed to percolation trenches or district recharge pits."
            )
            recommendations.append(
                f"Post-storm tank will reach {post_rain_level:,.0f} L ({(post_rain_level/capacity)*100:.1f}% capacity) with zero spillage."
            )
        elif overflow_water > 0:
            alert_level = "WARNING" if recommended_drawdown > 0 else "CRITICAL"
            valve_action = "EMERGENCY_BYPASS"
            recommendations.append(
                f"⚠️ INCOMING RUNOFF EXCEEDS TANK CAPACITY: Storm produces {runoff_liters:,.0f} L, but maximum available headspace is only {capacity - (current_level - recommended_drawdown):,.0f} L."
            )
            if recommended_drawdown > 0:
                recommendations.append(
                    f"Execute maximum safe drawdown of {recommended_drawdown:,.0f} L to preserve the critical {safety_reserve:,.0f} L reserve."
                )
            else:
                recommendations.append(
                    "Cannot draw down further: Current water level is at or below the dry-period safety baseline."
                )
            recommendations.append(
                f"Anticipated overflow of {overflow_water:,.0f} L ({overflow_risk_pct:.1f}%). Engage high-capacity stormwater bypass pumps."
            )
            recommendations.append(
                "Inspect rooftop sediment traps and first-flush filters to avoid hydraulic clogging."
            )
        else:
            alert_level = "NORMAL"
            valve_action = "MAX_HARVEST_OPEN"
            recommendations.append(
                f"💧 HIGH INFLOW EVENT: Tank has ample headspace ({capacity - current_level:,.0f} L) to harvest full {runoff_liters:,.0f} L."
            )
            recommendations.append(
                "Keep intake valves wide open. No pre-storm drawdown required."
            )
        return mode, alert_level, valve_action, recommendations

    # Scenario C: Balanced Buffer Optimization
    mode = "BALANCED_BUFFER"
    alert_level = "NORMAL"
    valve_action = "KEEP_CLOSED"
    recommendations.append(
        f"✅ BALANCED STORAGE STABILITY: Forecasted {inputs.rainfall_mm} mm yields {runoff_liters:,.0f} L harvestable runoff."
    )
    recommendations.append(
        f"Storage headroom ({capacity - current_level:,.0f} L) fully accommodates inflow. Tank will reach {(post_rain_level/capacity)*100:.1f}% capacity."
    )
    recommendations.append(
        f"Post-storm reserve guarantees {autonomy_days:.1f} days of self-sufficient building water supply."
    )
    return mode, alert_level, valve_action, recommendations


def generate_hourly_projection(
    inputs: WaterSystemInput,
    total_runoff: float,
    capacity: float,
    post_drawdown_level: float,
    hours: int = 24
) -> List[HourlyWaterForecast]:
    """
    Simulates hourly storm hydrograph (bell-shaped SCS synthetic curve)
    and dynamic tank water level curve.
    """
    hourly_data: List[HourlyWaterForecast] = []
    hourly_hourly_demand = inputs.daily_water_demand_liters / 24.0 if inputs.daily_water_demand_liters > 0 else 0.0

    # Gaussian peak around hour 8 to 14
    peak_hour = 10.0
    sigma = 3.2

    # Normalized weights
    weights = [
        math.exp(-0.5 * ((h - peak_hour) / sigma) ** 2)
        for h in range(1, hours + 1)
    ]
    sum_weights = sum(weights) if sum(weights) > 0 else 1.0

    current_sim_level = post_drawdown_level
    cum_runoff = 0.0

    for h in range(1, hours + 1):
        fraction = weights[h - 1] / sum_weights
        h_rain = round(inputs.rainfall_mm * fraction, 2)
        h_runoff = round(total_runoff * fraction, 2)
        cum_runoff = round(cum_runoff + h_runoff, 2)

        # Inflow vs capacity
        headroom = capacity - current_sim_level
        h_captured = min(h_runoff, headroom)
        h_overflow = max(0.0, h_runoff - headroom)

        current_sim_level = round(min(capacity, max(0.0, current_sim_level + h_captured - (hourly_hourly_demand * 0.5))), 2)

        hourly_data.append(HourlyWaterForecast(
            hour=h,
            rainfall_mm=h_rain,
            cumulative_runoff_liters=cum_runoff,
            projected_tank_level_liters=current_sim_level,
            overflow_liters=h_overflow,
        ))

    return hourly_data
