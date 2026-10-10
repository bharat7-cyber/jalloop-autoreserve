/**
 * JalLoop AutoReserve Client-Side Mathematical Engine.
 * Matches backend formulas 1-to-1 to guarantee 100% offline Local Demo capability.
 */

export function calculateWaterBalance(inputs, storageBackend = 'local_demo') {
  const rainfall_mm = Math.max(0, Number(inputs.rainfall_mm) || 0);
  const catchment_area_sqm = Math.max(0, Number(inputs.catchment_area_sqm) || 0);
  const runoff_coefficient = Math.min(1.0, Math.max(0, Number(inputs.runoff_coefficient) || 0.85));
  const tank_capacity_liters = Math.max(1, Number(inputs.tank_capacity_liters) || 100000);
  const current_water_level_liters = Math.min(tank_capacity_liters, Math.max(0, Number(inputs.current_water_level_liters) || 0));
  const daily_water_demand_liters = Math.max(0, Number(inputs.daily_water_demand_liters) || 0);
  const reserve_days = Math.max(0, Number(inputs.reserve_days) || 3.0);
  const secondary_tank_capacity_liters = Math.max(0, Number(inputs.secondary_tank_capacity_liters ?? 25000));
  const planned_prestorm_consumption_liters = Math.max(0, Number(inputs.planned_prestorm_consumption_liters ?? 0));

  // 1. Harvestable Runoff (L) = rainfall (mm) * catchment_area (m²) * runoff_coefficient
  // (1 mm of rain over 1 m² = 1.00 Liter)
  const harvestable_runoff_liters = Number((rainfall_mm * catchment_area_sqm * runoff_coefficient).toFixed(2));

  // 2. Safety Reserve (L) derived strictly from daily demand and reserve days
  const safety_reserve_liters = Number((daily_water_demand_liters * reserve_days).toFixed(2));

  // 3. Headroom before action
  const available_storage_liters = Number(Math.max(0, tank_capacity_liters - current_water_level_liters).toFixed(2));

  // 4. Needed room to prevent overflow
  const needed_room = Math.max(0, harvestable_runoff_liters - available_storage_liters);

  // 5. Max safe drawdown without dropping below dry-period baseline
  const max_safe_drawdown = Math.max(0, current_water_level_liters - safety_reserve_liters);

  // 6. Recommended Drawdown (only what is needed, and never breach safety reserve)
  const recommended_drawdown_liters = Number(Math.min(needed_room, max_safe_drawdown).toFixed(2));

  // 7. Post-drawdown level
  const post_drawdown_level_liters = Number((current_water_level_liters - recommended_drawdown_liters).toFixed(2));

  // 8. Headroom after drawdown
  const room_after_drawdown = tank_capacity_liters - post_drawdown_level_liters;

  // 9. Captured vs Overflow (strict partition of incoming runoff: zero double counting)
  const captured_water_liters = Number(Math.min(harvestable_runoff_liters, room_after_drawdown).toFixed(2));
  const overflow_liters = Number(Math.max(0, harvestable_runoff_liters - room_after_drawdown).toFixed(2));

  // 10. Overflow risk %
  const overflow_risk_percentage = harvestable_runoff_liters > 0
    ? Number(((overflow_liters / harvestable_runoff_liters) * 100).toFixed(1))
    : 0;

  // 11. Post-rain level & %
  const post_rain_tank_level_liters = Number(Math.min(tank_capacity_liters, post_drawdown_level_liters + captured_water_liters).toFixed(2));
  const post_rain_fill_percentage = Number(((post_rain_tank_level_liters / tank_capacity_liters) * 100).toFixed(1));

  // 12. Consistent Autonomy Metrics (Derived from daily_water_demand_liters)
  const target_reserve_days = reserve_days;
  const current_autonomy_days = daily_water_demand_liters > 0
    ? Number((current_water_level_liters / daily_water_demand_liters).toFixed(1))
    : 999;
  const post_rain_autonomy_days = daily_water_demand_liters > 0
    ? Number((post_rain_tank_level_liters / daily_water_demand_liters).toFixed(1))
    : 999;
  const days_of_autonomy_remaining = post_rain_autonomy_days;

  // 13. Valve discharge rate (over 4 hours = 240 mins)
  const valve_discharge_rate_lpm = recommended_drawdown_liters > 0
    ? Number((recommended_drawdown_liters / 240).toFixed(1))
    : 0;

  // 14. Drawdown Routing & Destination Modeling
  // Do NOT assume unlimited discharge into municipal storm drains!
  const effective_planned_consumption = planned_prestorm_consumption_liters > 0
    ? planned_prestorm_consumption_liters
    : Number((daily_water_demand_liters * (4.0 / 24.0)).toFixed(2));

  const drawdown_to_consumption_liters = Number(Math.min(recommended_drawdown_liters, effective_planned_consumption).toFixed(2));
  const rem_drawdown_1 = recommended_drawdown_liters - drawdown_to_consumption_liters;

  const drawdown_to_secondary_tank_liters = Number(Math.min(rem_drawdown_1, secondary_tank_capacity_liters).toFixed(2));
  const drawdown_to_controlled_discharge_liters = Number(Math.max(0, rem_drawdown_1 - drawdown_to_secondary_tank_liters).toFixed(2));

  const drain_overload_risk_note = drawdown_to_controlled_discharge_liters > 0
    ? `Release of ${drawdown_to_controlled_discharge_liters.toLocaleString()} L is throttled to ${(drawdown_to_controlled_discharge_liters / 240).toFixed(1)} LPM and scheduled strictly 4 hours ahead of storm to prevent urban drain surcharge.`
    : `100% of pre-storm drawdown is retained on-site (absorbed by scheduled non-potable demand and secondary tank transfer). Zero discharge to municipal drains.`;

  const unavoidable_overflow_liters = overflow_liters;
  const overflow_explanation = overflow_liters > 0
    ? `Unavoidable overflow of ${overflow_liters.toLocaleString()} L occurs because total storm runoff (${harvestable_runoff_liters.toLocaleString()} L) exceeds maximum facility capacity (${room_after_drawdown.toLocaleString()} L). Further drawdown is prohibited to protect the ${safety_reserve_liters.toLocaleString()} L (${target_reserve_days} days) emergency reserve.`
    : `Zero uncontrolled overflow: 100% of the ${harvestable_runoff_liters.toLocaleString()} L storm surge is accommodated within primary headspace and pre-storm drawdown buffer.`;

  // 15. Water Reuse & Savings Accounting (Zero Double Counting)
  // Reusable water = Captured in-tank runoff + Productively utilized/held drawdown
  const total_reusable_water_liters = Number((captured_water_liters + drawdown_to_consumption_liters + drawdown_to_secondary_tank_liters).toFixed(2));
  const avoided_freshwater_tankers = Number((total_reusable_water_liters / 10000).toFixed(1));
  const estimated_cost_savings_inr = Math.round(avoided_freshwater_tankers * 1500);

  const non_potable_breakdown = {
    hvac_cooling_liters: Number((post_rain_tank_level_liters * 0.40).toFixed(2)),
    toilet_flushing_liters: Number((post_rain_tank_level_liters * 0.35).toFixed(2)),
    landscape_irrigation_liters: Number((post_rain_tank_level_liters * 0.25).toFixed(2)),
  };

  const savings_assumptions = [
    "Runoff conservation: 1 mm rainfall over 1 m² catchment yields exactly 1.00 Liter.",
    "Zero double-counting: Incoming runoff is partitioned strictly into Captured In-Tank and Unavoidable Spill.",
    "Drawdown water destination: Productively diverted to pre-storm HVAC/cisterns and secondary storage before any drain discharge.",
    "Tanker equivalency: 1 municipal water tanker = 10,000 Liters at benchmark replacement rate of ₹1,500 ($18.00).",
    "Non-potable breakdown: Standard commercial building demand profile (40% HVAC cooling, 35% toilet flushing, 25% irrigation)."
  ];

  // 16. Strategy & Advisory
  const { mode, alert_level, valve_action, recommendations } = determineStrategy({
    rainfall_mm,
    harvestable_runoff_liters,
    safety_reserve_liters,
    current_water_level_liters,
    tank_capacity_liters,
    recommended_drawdown_liters,
    overflow_liters,
    overflow_risk_percentage,
    post_rain_tank_level_liters,
    days_of_autonomy_remaining: post_rain_autonomy_days,
    reserve_days,
    drawdown_to_consumption_liters,
    drawdown_to_secondary_tank_liters
  });

  // 17. Synthetic 24-Hour Hydrograph consistent with balance
  const hourly_projection = generateHourlyCurve(
    rainfall_mm,
    harvestable_runoff_liters,
    tank_capacity_liters,
    post_drawdown_level_liters,
    post_rain_tank_level_liters,
    captured_water_liters,
    overflow_liters
  );

  return {
    id: `demo_${Date.now()}`,
    timestamp: new Date().toISOString(),
    inputs: {
      rainfall_mm,
      catchment_area_sqm,
      runoff_coefficient,
      tank_capacity_liters,
      current_water_level_liters,
      daily_water_demand_liters,
      reserve_days,
      secondary_tank_capacity_liters,
      planned_prestorm_consumption_liters,
      scenario_name: inputs.scenario_name || 'Simulated Scenario'
    },
    harvestable_runoff_liters,
    safety_reserve_liters,
    available_storage_liters,
    recommended_drawdown_liters,
    post_drawdown_level_liters,
    captured_water_liters,
    overflow_liters,
    overflow_risk_percentage,
    post_rain_tank_level_liters,
    post_rain_fill_percentage,
    target_reserve_days,
    current_autonomy_days,
    post_rain_autonomy_days,
    days_of_autonomy_remaining,
    drawdown_to_consumption_liters,
    drawdown_to_secondary_tank_liters,
    drawdown_to_controlled_discharge_liters,
    drain_overload_risk_note,
    unavoidable_overflow_liters,
    overflow_explanation,
    drawdown_routing: {
      drawdown_to_consumption_liters,
      drawdown_to_secondary_tank_liters,
      drawdown_to_controlled_discharge_liters,
      drain_overload_risk_note,
      unavoidable_overflow_liters,
      overflow_explanation
    },
    total_reusable_water_liters,
    avoided_freshwater_tankers,
    estimated_cost_savings_inr,
    non_potable_breakdown,
    water_savings: {
      total_reusable_water_liters,
      avoided_freshwater_tankers,
      estimated_cost_savings_inr,
      non_potable_breakdown,
      assumptions: savings_assumptions
    },
    mode,
    alert_level,
    valve_action,
    valve_discharge_rate_lpm,
    recommendations,
    storage_backend: storageBackend,
    hourly_projection
  };
}

function determineStrategy({
  rainfall_mm,
  harvestable_runoff_liters,
  safety_reserve_liters,
  current_water_level_liters,
  tank_capacity_liters,
  recommended_drawdown_liters,
  overflow_liters,
  overflow_risk_percentage,
  post_rain_tank_level_liters,
  days_of_autonomy_remaining,
  reserve_days,
  drawdown_to_consumption_liters = 0,
  drawdown_to_secondary_tank_liters = 0,
  drawdown_to_controlled_discharge_liters = 0
}) {
  const recommendations = [];

  if (rainfall_mm < 10.0 || current_water_level_liters < safety_reserve_liters) {
    const mode = 'HEATWAVE_DEFENSE';
    const valve_action = 'KEEP_CLOSED';
    if (current_water_level_liters < safety_reserve_liters) {
      const alert_level = 'CRITICAL';
      const deficit = safety_reserve_liters - current_water_level_liters;
      recommendations.push(
        `🚨 CRITICAL WATER DEFICIT: Current tank (${current_water_level_liters.toLocaleString()} L) is below the ${reserve_days}-day safety reserve (${safety_reserve_liters.toLocaleString()} L) by ${deficit.toLocaleString()} L.`
      );
      recommendations.push('Keep all discharge valves firmly LOCKED. Enforce strict building non-potable water rationing.');
      recommendations.push('Activate graywater recycling loop and divert cooling tower blowdown to secondary reserves.');
      return { mode, alert_level, valve_action, recommendations };
    } else {
      const alert_level = 'ADVISORY';
      recommendations.push(
        `☀️ DRY / HEATWAVE PERIOD ACTIVE: Minimal rainfall predicted (${rainfall_mm} mm). Zero drawdown recommended.`
      );
      recommendations.push(
        `Tank holds ${days_of_autonomy_remaining} days of building non-potable autonomy. Prioritize reservoir preservation against thermal stress.`
      );
      return { mode, alert_level, valve_action, recommendations };
    }
  }

    if (
    rainfall_mm >= 40.0 ||
    overflow_liters > 0 ||
    recommended_drawdown_liters > 0
  ) {
    const mode = 'STORM_SURGE_PREP';

    if (recommended_drawdown_liters > 0 && overflow_liters === 0) {
      const alert_level = 'WARNING';
      const valve_action = 'CONTROLLED_DISCHARGE';

      recommendations.push(
        `Recommended pre-storm drawdown: ${recommended_drawdown_liters.toLocaleString()} L over a 4-hour planning window.`
      );

      if (
        drawdown_to_consumption_liters > 0 ||
        drawdown_to_secondary_tank_liters > 0 ||
        drawdown_to_controlled_discharge_liters > 0
      ) {
        recommendations.push(
          `Drawdown destination breakdown: ` +
          `${drawdown_to_consumption_liters.toLocaleString()} L for planned demand; ` +
          `${drawdown_to_secondary_tank_liters.toLocaleString()} L for secondary storage; ` +
          `${drawdown_to_controlled_discharge_liters.toLocaleString()} L allocated to controlled discharge.`
        );
      }

      if (drawdown_to_controlled_discharge_liters > 0) {
        recommendations.push(
          `The ${drawdown_to_controlled_discharge_liters.toLocaleString()} L controlled-discharge allocation is a planning estimate. Verify a permitted, safe destination and available capacity before any discharge.`
        );
      }

      recommendations.push(
        `Modeled primary-tank level after rainfall: ${post_rain_tank_level_liters.toLocaleString()} L (${((post_rain_tank_level_liters / tank_capacity_liters) * 100).toFixed(1)}% capacity).`
      );

      recommendations.push(
        `Estimated primary-tank overflow: ${overflow_liters.toLocaleString()} L. Site-wide flooding and municipal drainage are not modeled.`
      );

      return { mode, alert_level, valve_action, recommendations };

    } else if (overflow_liters > 0) {
      const alert_level =
        recommended_drawdown_liters > 0 ? 'WARNING' : 'CRITICAL';

      const valve_action = 'EMERGENCY_BYPASS';

      recommendations.push(
        `Incoming runoff: ${harvestable_runoff_liters.toLocaleString()} L. ` +
        `Available primary-tank headroom after the planned drawdown: ` +
        `${(tank_capacity_liters - (current_water_level_liters - recommended_drawdown_liters)).toLocaleString()} L.`
      );

      if (recommended_drawdown_liters > 0) {
        recommendations.push(
          `Recommended safe drawdown: ${recommended_drawdown_liters.toLocaleString()} L. ` +
          `The model preserves the ${safety_reserve_liters.toLocaleString()} L safety reserve.`
        );
      } else {
        recommendations.push(
          'No further drawdown is recommended because the tank is at or below its safety-reserve limit.'
        );
      }

      recommendations.push(
        `Estimated primary-tank overflow: ${overflow_liters.toLocaleString()} L (${overflow_risk_percentage}%). ` +
        `Verify a safe overflow route and available drainage capacity.`
      );

      recommendations.push(
        'Inspect first-flush filters and sediment traps before a storm.'
      );

      return { mode, alert_level, valve_action, recommendations };

    } else {
      const alert_level = 'NORMAL';
      const valve_action = 'MAX_HARVEST_OPEN';

      recommendations.push(
        `The current model estimates ${harvestable_runoff_liters.toLocaleString()} L of runoff and sufficient primary-tank headroom without a drawdown.`
      );

      recommendations.push(
        'This is a software recommendation; no physical valve is controlled by this demo.'
      );

            return { mode, alert_level, valve_action, recommendations };
    }
  }

  // Balanced storage scenario: no drawdown is required.
  const mode = 'BALANCED_BUFFER';
  const alert_level = 'NORMAL';
  const valve_action = 'KEEP_CLOSED';

  recommendations.push(
    `BALANCED STORAGE: Forecasted ${rainfall_mm} mm yields ` +
    `${harvestable_runoff_liters.toLocaleString()} L of estimated runoff.`
  );

  recommendations.push(
    `Available storage headroom: ` +
    `${(tank_capacity_liters - current_water_level_liters).toLocaleString()} L. ` +
    `Modeled post-rain tank level: ` +
    `${post_rain_tank_level_liters.toLocaleString()} L.`
  );

  recommendations.push(
    `The modeled post-rain water level supports approximately ` +
    `${days_of_autonomy_remaining} days of supply at configured demand. ` +
    `Actual duration depends on real consumption and operating conditions.`
  );

  return { mode, alert_level, valve_action, recommendations };
}



function generateHourlyCurve(rainfall_mm, total_runoff, capacity, post_drawdown_level, post_rain_level, total_captured, total_overflow) {
  const hours = 24;
  const peakHour = 10;
  const sigma = 3.2;

  const weights = [];
  for (let h = 1; h <= hours; h++) {
    weights.push(Math.exp(-0.5 * Math.pow((h - peakHour) / sigma, 2)));
  }
  const sumWeights = weights.reduce((a, b) => a + b, 0) || 1;

  let currentSimLevel = post_drawdown_level;
  let cumRunoff = 0;
  const hourly = [];

  for (let h = 1; h <= hours; h++) {
    const fraction = weights[h - 1] / sumWeights;
    const hRain = Number((rainfall_mm * fraction).toFixed(2));
    const hRunoff = Number((total_runoff * fraction).toFixed(2));
    cumRunoff = Number((cumRunoff + hRunoff).toFixed(2));

    const hCaptured = Number((total_captured * fraction).toFixed(2));
    const hOverflow = Number((total_overflow * fraction).toFixed(2));

    currentSimLevel = Number(Math.min(capacity, currentSimLevel + hCaptured).toFixed(2));
    if (h === hours) {
      currentSimLevel = post_rain_level;
    }

    hourly.push({
      hour: h,
      rainfall_mm: hRain,
      cumulative_runoff_liters: cumRunoff,
      projected_tank_level_liters: currentSimLevel,
      overflow_liters: hOverflow
    });
  }

  return hourly;
}
