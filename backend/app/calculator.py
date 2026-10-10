import math
import uuid
from datetime import datetime, timezone
from typing import List, Tuple, Dict
from .models import (
    WaterSystemInput,
    CalculationResult,
    HourlyWaterForecast,
    DrawdownRouting,
    WaterSavingsEstimate,
)


def calculate_water_balance(inputs: WaterSystemInput, storage_backend: str = "sqlite") -> CalculationResult:
    """
    Core mathematical engine for JalLoop AutoReserve.
    
    Principles:
    - 1 mm of rain over 1 m² = 1.000 Liter of harvestable runoff.
    - Runoff (L) = rainfall_mm * catchment_area_sqm * runoff_coefficient.
    - Safety Reserve (L) = daily_water_demand_liters * reserve_days (guaranteed dry-period reserve).
    - Drawdown cannot breach Safety Reserve: max_safe_drawdown = max(0, current_level - safety_reserve).
    - Recommended Drawdown = min(needed_room, max_safe_drawdown).
    - Drawdown Destination: prioritized into planned pre-storm consumption -> secondary tank/cistern -> controlled dry-window discharge.
    - No double-counting: Total Runoff = Captured In-Tank + Unavoidable Overflow.
    """
    calc_id = f"calc_{uuid.uuid4().hex[:10]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Harvestable Runoff Volume (Liters)
    # 1 mm * 1 m² = 0.001 m * 1 m² = 0.001 m³ = 1.00 Liter
    runoff_liters = inputs.rainfall_mm * inputs.catchment_area_sqm * inputs.runoff_coefficient
    runoff_liters = round(max(0.0, runoff_liters), 2)

    # 2. Critical Safety Reserve (Liters) derived strictly from daily demand and reserve days
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

    # 9. Captured vs Overflow (Partition of incoming runoff: zero double counting)
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

    # 12. Consistent Autonomy Metrics (Derived from daily_water_demand_liters)
    daily_demand = inputs.daily_water_demand_liters
    target_reserve_days = inputs.reserve_days
    current_autonomy_days = round(current_level / daily_demand, 1) if daily_demand > 0 else 999.0
    post_rain_autonomy_days = round(post_rain_level / daily_demand, 1) if daily_demand > 0 else 999.0

    # 13. Pre-storm discharge rate (assuming 4 hours / 240 mins pre-storm window)
    if recommended_drawdown > 0:
        valve_discharge_rate_lpm = round(recommended_drawdown / 240.0, 1)
    else:
        valve_discharge_rate_lpm = 0.0

    # 14. Drawdown Routing & Destination Modeling
    # Do NOT assume unlimited discharge into storm drains. Prefer on-site reuse & secondary storage.
    planned_consumption = inputs.planned_prestorm_consumption_liters
    if planned_consumption <= 0 and daily_demand > 0:
        # Default 4-hour accelerated non-potable use: HVAC thermal pre-cooling + irrigation
        planned_consumption = round(daily_demand * (4.0 / 24.0), 2)

    drawdown_to_consumption = min(recommended_drawdown, planned_consumption)
    rem_drawdown_1 = recommended_drawdown - drawdown_to_consumption

    secondary_cap = getattr(inputs, "secondary_tank_capacity_liters", 25000.0)
    drawdown_to_secondary = min(rem_drawdown_1, secondary_cap)
    drawdown_to_discharge = round(rem_drawdown_1 - drawdown_to_secondary, 2)

    drawdown_to_consumption = round(drawdown_to_consumption, 2)
    drawdown_to_secondary = round(drawdown_to_secondary, 2)

    # Municipal drain overload risk note
    if drawdown_to_discharge > 0:
        drain_overload_risk_note = (
            f"Release of {drawdown_to_discharge:,.0f} L is throttled to {drawdown_to_discharge/240.0:.1f} LPM "
            f"and scheduled strictly during the 4-hour pre-storm dry window to prevent municipal storm sewer backflow. "
            f"Divert to percolation trenches if municipal storm mains are saturated."
        )
    else:
        drain_overload_risk_note = (
            "100% of pre-storm drawdown is retained on-site (absorbed by scheduled non-potable demand and secondary tank transfer). "
            "Zero water discharged to municipal storm drains."
        )

    # Overflow Explanation
    if overflow_water > 0:
        overflow_explanation = (
            f"Unavoidable overflow of {overflow_water:,.0f} L occurs because total storm runoff ({runoff_liters:,.0f} L) "
            f"exceeds the maximum available facility capacity ({room_after_drawdown:,.0f} L). "
            f"Further drawdown is prohibited because water level is at the critical {safety_reserve_liters:,.0f} L "
            f"({target_reserve_days} days) dry-period safety reserve. Engage high-capacity stormwater bypass pumps."
        )
    else:
        overflow_explanation = (
            f"Zero uncontrolled overflow: 100% of the {runoff_liters:,.0f} L storm surge is accommodated within "
            f"the primary tank headroom and pre-storm drawdown buffer."
        )

    drawdown_routing = DrawdownRouting(
        drawdown_to_consumption_liters=drawdown_to_consumption,
        drawdown_to_secondary_tank_liters=drawdown_to_secondary,
        drawdown_to_controlled_discharge_liters=drawdown_to_discharge,
        drain_overload_risk_note=drain_overload_risk_note,
        unavoidable_overflow_liters=overflow_water,
        overflow_explanation=overflow_explanation,
    )

    # 15. Water Reuse & Savings Accounting (Strictly avoided double-counting)
    # Reusable water = Captured in-tank runoff + Productively consumed/held drawdown
    total_reusable_water = round(captured_water + drawdown_to_consumption + drawdown_to_secondary, 2)
    avoided_tankers = round(total_reusable_water / 10000.0, 1)  # 10,000 L per commercial tanker
    cost_savings_inr = round(avoided_tankers * 1500.0, 0)      # ₹1,500 benchmark per tanker

    non_potable_breakdown = {
        "hvac_cooling_liters": round(post_rain_level * 0.40, 2),
        "toilet_flushing_liters": round(post_rain_level * 0.35, 2),
        "landscape_irrigation_liters": round(post_rain_level * 0.25, 2),
    }

    savings_assumptions = [
        "Runoff conservation: 1 mm rainfall over 1 m² catchment yields exactly 1.00 Liter.",
        "Zero double-counting: Incoming runoff is partitioned strictly into Captured In-Tank and Unavoidable Spill.",
        "Drawdown water destination: Productively diverted to pre-storm HVAC/cisterns and secondary storage before any drain discharge.",
        "Tanker equivalency: 1 municipal water tanker = 10,000 Liters at benchmark replacement rate of ₹1,500 ($18.00).",
        "Non-potable breakdown: Standard commercial building demand profile (40% HVAC cooling, 35% toilet flushing, 25% irrigation)."
    ]

    water_savings = WaterSavingsEstimate(
        total_reusable_water_liters=total_reusable_water,
        avoided_freshwater_tankers=avoided_tankers,
        estimated_cost_savings_inr=cost_savings_inr,
        non_potable_breakdown=non_potable_breakdown,
        assumptions=savings_assumptions,
    )

    # 16. Determine Operational Strategy
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
        autonomy_days=post_rain_autonomy_days,
        drawdown_to_consumption=drawdown_to_consumption,
        drawdown_to_secondary=drawdown_to_secondary,
        drawdown_to_discharge=drawdown_to_discharge,
    )

    # 17. Generate hourly 24h projection hydrograph consistent with final balance
    hourly_projection = generate_hourly_projection(
        inputs=inputs,
        total_runoff=runoff_liters,
        capacity=capacity,
        post_drawdown_level=post_drawdown_level,
        post_rain_level=post_rain_level,
        total_captured=captured_water,
        total_overflow=overflow_water,
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
        target_reserve_days=target_reserve_days,
        current_autonomy_days=current_autonomy_days,
        post_rain_autonomy_days=post_rain_autonomy_days,
        days_of_autonomy_remaining=post_rain_autonomy_days,
        drawdown_to_consumption_liters=drawdown_to_consumption,
        drawdown_to_secondary_tank_liters=drawdown_to_secondary,
        drawdown_to_controlled_discharge_liters=drawdown_to_discharge,
        drain_overload_risk_note=drain_overload_risk_note,
        unavoidable_overflow_liters=overflow_water,
        overflow_explanation=overflow_explanation,
        drawdown_routing=drawdown_routing,
        total_reusable_water_liters=total_reusable_water,
        avoided_freshwater_tankers=avoided_tankers,
        estimated_cost_savings_inr=cost_savings_inr,
        non_potable_breakdown=non_potable_breakdown,
        water_savings=water_savings,
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
    drawdown_to_consumption: float = 0.0,
    drawdown_to_secondary: float = 0.0,
    drawdown_to_discharge: float = 0.0,
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
                f"🚨 CRITICAL WATER DEFICIT: Current primary tank ({current_level:,.0f} L) is below the {inputs.reserve_days:g}-day safety reserve ({safety_reserve:,.0f} L) by {deficit:,.0f} L."
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
                f"Primary tank holds {autonomy_days:.1f} days of building non-potable autonomy. Prioritize reservoir preservation against thermal stress."
            )
        return mode, alert_level, valve_action, recommendations

    # Scenario B: Heavy Rain / Storm Surge with Overflow Risk
    if inputs.rainfall_mm >= 40.0 or overflow_water > 0 or recommended_drawdown > 0:
        mode = "STORM_SURGE_PREP"
        
        if recommended_drawdown > 0 and overflow_water == 0:
            alert_level = "WARNING"
            valve_action = "CONTROLLED_DISCHARGE"
            recommendations.append(
                f"🌧️ OPTIMAL PRE-STORM DRAWDOWN: Release {recommended_drawdown:,.0f} L prior to storm onset over a 4-hour dry window."
            )
            if (drawdown_to_consumption > 0 or drawdown_to_secondary > 0 or drawdown_to_discharge > 0):
                recommendations.append(f"Drawdown destination breakdown: " f"{drawdown_to_consumption:,.1f} L for planned pre-storm demand; " f"{drawdown_to_secondary:,.1f} L for secondary-tank transfer; " f"{drawdown_to_discharge:,.1f} L allocated to controlled discharge.")

                if drawdown_to_discharge > 0:
                    recommendations.append(
                    f"Controlled discharge of {drawdown_to_discharge:,.1f} L "
                    "is only a planning estimate. Confirm a permitted, safe "
                    "destination and its capacity before executing. Do not "
                    "discharge into a saturated drain or an unverified site."
                )
            recommendations.append(
                f"The model predicts sufficient primary-tank capacity for "
f"{runoff_liters:,.1f} L of runoff in this scenario. "
"Site-wide and municipal flood risk is not modeled."
            )
            recommendations.append(
                f"Modeled primary-tank level after rainfall: "
f"{post_rain_level:,.1f} L "
f"({(post_rain_level / capacity) * 100:.1f}% capacity). "
f"Modeled primary-tank overflow: {overflow_water:,.1f} L. "
"Actual site flooding and downstream drainage are not simulated."
            )
        elif overflow_water > 0:
            alert_level = "WARNING" if recommended_drawdown > 0 else "CRITICAL"
            valve_action = "EMERGENCY_BYPASS"
            recommendations.append(
                f"⚠️ INCOMING RUNOFF EXCEEDS TANK CAPACITY: Storm produces {runoff_liters:,.0f} L, but maximum available headspace is only {capacity - (current_level - recommended_drawdown):,.0f} L."
            )
            if recommended_drawdown > 0:
                recommendations.append(
        
                f"Drawdown destination breakdown: "
                f"{drawdown_to_consumption:,.1f} L for planned demand; "
                f"{drawdown_to_secondary:,.1f} L for secondary-tank transfer; "
                f"{drawdown_to_discharge:,.1f} L allocated to controlled discharge."
            )

            if drawdown_to_discharge > 0:
                recommendations.append(
                    f"The {drawdown_to_discharge:,.1f} L controlled-discharge "
                    "volume is a planning estimate. Verify a permitted, safe "
                    "destination and sufficient capacity before any discharge."
                )
            else:
                recommendations.append(
                    "Cannot draw down further: Current water level is at or below the dry-period safety baseline."
                )
            recommendations.append(
                f"Anticipated unavoidable overflow of {overflow_water:,.0f} L ({overflow_risk_pct:.1f}%). Engage high-capacity stormwater bypass pumps."
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
        f"The modeled post-rain water level supports approximately {autonomy_days:.1f} days of supply at the configured demand. Actual duration depends on real consumption and operating conditions."
    )
    return mode, alert_level, valve_action, recommendations


def generate_hourly_projection(
    inputs: WaterSystemInput,
    total_runoff: float,
    capacity: float,
    post_drawdown_level: float,
    post_rain_level: float,
    total_captured: float,
    total_overflow: float,
    hours: int = 24
) -> List[HourlyWaterForecast]:
    """
    Simulates hourly storm hydrograph strictly consistent with the total water balance.
    The sum of hourly captured water equals total_captured, sum of hourly overflow
    equals total_overflow, and hour 24 tank level equals post_rain_level.
    """
    hourly_data: List[HourlyWaterForecast] = []

    # Bell-shaped curve centered at hour 10
    peak_hour = 10.0
    sigma = 3.2

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

        # Distribute captured and overflow proportionally to rain intensity
        h_captured = round(total_captured * fraction, 2)
        h_overflow = round(total_overflow * fraction, 2)

        current_sim_level = round(min(capacity, current_sim_level + h_captured), 2)
        if h == hours:
            # Anchor hour 24 strictly to post_rain_level
            current_sim_level = post_rain_level

        hourly_data.append(HourlyWaterForecast(
            hour=h,
            rainfall_mm=h_rain,
            cumulative_runoff_liters=cum_runoff,
            projected_tank_level_liters=current_sim_level,
            overflow_liters=h_overflow,
        ))

    return hourly_data
