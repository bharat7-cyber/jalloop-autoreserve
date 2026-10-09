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

  // 1. Harvestable Runoff (L) = rainfall (mm) * catchment_area (m²) * runoff_coefficient
  // (1 mm of rain over 1 m² = 1.0 Liter)
  const harvestable_runoff_liters = Number((rainfall_mm * catchment_area_sqm * runoff_coefficient).toFixed(2));

  // 2. Safety Reserve (L)
  const safety_reserve_liters = Number((daily_water_demand_liters * reserve_days).toFixed(2));

  // 3. Headroom before action
  const available_storage_liters = Number(Math.max(0, tank_capacity_liters - current_water_level_liters).toFixed(2));

  // 4. Needed room to prevent overflow
  const needed_room = Math.max(0, harvestable_runoff_liters - available_storage_liters);

  // 5. Max safe drawdown without dropping below dry-period baseline
  const max_safe_drawdown = Math.max(0, current_water_level_liters - safety_reserve_liters);

  // 6. Recommended Drawdown
  const recommended_drawdown_liters = Number(Math.min(needed_room, max_safe_drawdown).toFixed(2));

  // 7. Post-drawdown level
  const post_drawdown_level_liters = Number((current_water_level_liters - recommended_drawdown_liters).toFixed(2));

  // 8. Headroom after drawdown
  const room_after_drawdown = tank_capacity_liters - post_drawdown_level_liters;

  // 9. Captured vs Overflow
  const captured_water_liters = Number(Math.min(harvestable_runoff_liters, room_after_drawdown).toFixed(2));
  const overflow_liters = Number(Math.max(0, harvestable_runoff_liters - room_after_drawdown).toFixed(2));

  // 10. Overflow risk %
  const overflow_risk_percentage = harvestable_runoff_liters > 0
    ? Number(((overflow_liters / harvestable_runoff_liters) * 100).toFixed(1))
    : 0;

  // 11. Post-rain level & %
  const post_rain_tank_level_liters = Number(Math.min(tank_capacity_liters, post_drawdown_level_liters + captured_water_liters).toFixed(2));
  const post_rain_fill_percentage = Number(((post_rain_tank_level_liters / tank_capacity_liters) * 100).toFixed(1));

  // 12. Autonomy days
  const days_of_autonomy_remaining = daily_water_demand_liters > 0
    ? Number((post_rain_tank_level_liters / daily_water_demand_liters).toFixed(1))
    : 999;

  // 13. Valve discharge rate (over 4 hours = 240 mins)
  const valve_discharge_rate_lpm = recommended_drawdown_liters > 0
    ? Number((recommended_drawdown_liters / 240).toFixed(1))
    : 0;

  // 14. Strategy & Advisory
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
    days_of_autonomy_remaining,
    reserve_days
  });

  // 15. Synthetic 24-Hour Hydrograph
  const hourly_projection = generateHourlyCurve(
    rainfall_mm,
    harvestable_runoff_liters,
    tank_capacity_liters,
    post_drawdown_level_liters,
    daily_water_demand_liters
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
    days_of_autonomy_remaining,
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
  reserve_days
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
        `Tank holds ${days_of_autonomy_remaining} days of building autonomy. Prioritize reservoir preservation against thermal stress.`
      );
      return { mode, alert_level, valve_action, recommendations };
    }
  }

  if (rainfall_mm >= 40.0 || overflow_liters > 0 || recommended_drawdown_liters > 0) {
    const mode = 'STORM_SURGE_PREP';
    if (recommended_drawdown_liters > 0 && overflow_liters === 0) {
      const alert_level = 'WARNING';
      const valve_action = 'CONTROLLED_DISCHARGE';
      recommendations.push(
        `🌧️ OPTIMAL PRE-STORM DRAWDOWN: Release ${recommended_drawdown_liters.toLocaleString()} L prior to storm onset over a 4-hour window.`
      );
      recommendations.push(
        `This creates buffer room to capture 100% of incoming ${harvestable_runoff_liters.toLocaleString()} L runoff without flooding municipal drains.`
      );
      recommendations.push(
        `Discharge rate: Set smart actuator to ${(recommended_drawdown_liters / 240).toFixed(1)} LPM directed to percolation trenches or district recharge pits.`
      );
      recommendations.push(
        `Post-storm tank will reach ${post_rain_tank_level_liters.toLocaleString()} L (${((post_rain_tank_level_liters / tank_capacity_liters) * 100).toFixed(1)}% capacity) with zero spillage.`
      );
      return { mode, alert_level, valve_action, recommendations };
    } else if (overflow_liters > 0) {
      const alert_level = recommended_drawdown_liters > 0 ? 'WARNING' : 'CRITICAL';
      const valve_action = 'EMERGENCY_BYPASS';
      recommendations.push(
        `⚠️ INCOMING RUNOFF EXCEEDS TANK CAPACITY: Storm produces ${harvestable_runoff_liters.toLocaleString()} L, but maximum available headspace is only ${(tank_capacity_liters - (current_water_level_liters - recommended_drawdown_liters)).toLocaleString()} L.`
      );
      if (recommended_drawdown_liters > 0) {
        recommendations.push(
          `Execute maximum safe drawdown of ${recommended_drawdown_liters.toLocaleString()} L to preserve the critical ${safety_reserve_liters.toLocaleString()} L reserve.`
        );
      } else {
        recommendations.push('Cannot draw down further: Current water level is at or below the dry-period safety baseline.');
      }
      recommendations.push(
        `Anticipated overflow of ${overflow_liters.toLocaleString()} L (${overflow_risk_percentage}%). Engage high-capacity stormwater bypass pumps.`
      );
      recommendations.push('Inspect rooftop sediment traps and first-flush filters to avoid hydraulic clogging.');
      return { mode, alert_level, valve_action, recommendations };
    } else {
      const mode = 'STORM_SURGE_PREP';
      const alert_level = 'NORMAL';
      const valve_action = 'MAX_HARVEST_OPEN';
      recommendations.push(`💧 HIGH INFLOW EVENT: Tank has ample headspace (${(tank_capacity_liters - current_water_level_liters).toLocaleString()} L) to harvest full ${harvestable_runoff_liters.toLocaleString()} L.`);
      recommendations.push('Keep intake valves wide open. No pre-storm drawdown required.');
      return { mode, alert_level, valve_action, recommendations };
    }
  }

  const mode = 'BALANCED_BUFFER';
  const alert_level = 'NORMAL';
  const valve_action = 'KEEP_CLOSED';
  recommendations.push(`✅ BALANCED STORAGE STABILITY: Forecasted ${rainfall_mm} mm yields ${harvestable_runoff_liters.toLocaleString()} L harvestable runoff.`);
  recommendations.push(`Storage headroom (${(tank_capacity_liters - current_water_level_liters).toLocaleString()} L) fully accommodates inflow. Tank will reach ${((post_rain_tank_level_liters / tank_capacity_liters) * 100).toFixed(1)}% capacity.`);
  recommendations.push(`Post-storm reserve guarantees ${days_of_autonomy_remaining} days of self-sufficient building water supply.`);
  return { mode, alert_level, valve_action, recommendations };
}

function generateHourlyCurve(rainfall_mm, total_runoff, capacity, post_drawdown_level, daily_demand) {
  const hours = 24;
  const hourlyDemand = daily_demand / 24;
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

    const headroom = capacity - currentSimLevel;
    const hCaptured = Math.min(hRunoff, headroom);
    const hOverflow = Math.max(0, hRunoff - headroom);

    currentSimLevel = Number(Math.min(capacity, Math.max(0, currentSimLevel + hCaptured - (hourlyDemand * 0.5))).toFixed(2));

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
