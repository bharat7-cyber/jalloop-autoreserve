import { calculateWaterBalance } from '../utils/calculator';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/api/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error('Health check non-200');
    return await res.json();
  } catch (err) {
    return {
      status: 'offline',
      aws_dynamodb_configured: false,
      persistence_mode: 'Client-Side Local Demo (Backend Offline)',
      total_records_stored: 0
    };
  }
}

export async function fetchPresets() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/presets`);
    if (res.ok) return await res.json();
  } catch (_) {}
  // Fallback default presets if backend not reachable
  return {
    bangalore_highrise: {
      name: "Bangalore Residential High-Rise (Monsoon Alert)",
      description: "Dense residential tower facing intense monsoon showers; tank near capacity needs pre-storm headroom.",
      params: {
        rainfall_mm: 65.0,
        catchment_area_sqm: 2400.0,
        runoff_coefficient: 0.90,
        tank_capacity_liters: 150000.0,
        current_water_level_liters: 115000.0,
        daily_water_demand_liters: 18000.0,
        reserve_days: 3.5,
        scenario_name: "Bangalore High-Rise Monsoon Buffer"
      }
    },
    hyderabad_techpark: {
      name: "Hyderabad Tech Park (Heatwave Defense)",
      description: "Commercial IT park facing extreme summer heat; minimal rain requires aggressive water-banking and zero discharge.",
      params: {
        rainfall_mm: 4.0,
        catchment_area_sqm: 8500.0,
        runoff_coefficient: 0.85,
        tank_capacity_liters: 500000.0,
        current_water_level_liters: 130000.0,
        daily_water_demand_liters: 35000.0,
        reserve_days: 4.0,
        scenario_name: "Hyderabad Tech Park Heatwave Defense"
      }
    },
    mumbai_coastal: {
      name: "Mumbai Coastal Campus (Cloudburst Overload)",
      description: "High-intensity coastal cloudburst producing runoff exceeding total tank volume; requires controlled discharge + storm bypass.",
      params: {
        rainfall_mm: 120.0,
        catchment_area_sqm: 3200.0,
        runoff_coefficient: 0.95,
        tank_capacity_liters: 250000.0,
        current_water_level_liters: 210000.0,
        daily_water_demand_liters: 25000.0,
        reserve_days: 3.0,
        scenario_name: "Mumbai Coastal Cloudburst Overload"
      }
    },
    delhi_hospital: {
      name: "Delhi Institutional Hospital (Critical Reserve)",
      description: "Hospital infrastructure requiring strict 5-day emergency water autonomy at all times.",
      params: {
        rainfall_mm: 35.0,
        catchment_area_sqm: 5000.0,
        runoff_coefficient: 0.88,
        tank_capacity_liters: 300000.0,
        current_water_level_liters: 160000.0,
        daily_water_demand_liters: 40000.0,
        reserve_days: 5.0,
        scenario_name: "Delhi Hospital Critical Infrastructure"
      }
    },
    eco_villa: {
      name: "Eco-Villa Sustainable Community (Balanced Harvest)",
      description: "Green community with permeable surfaces and rainwater harvesting sized to absorb standard storm surge.",
      params: {
        rainfall_mm: 28.0,
        catchment_area_sqm: 800.0,
        runoff_coefficient: 0.80,
        tank_capacity_liters: 40000.0,
        current_water_level_liters: 16000.0,
        daily_water_demand_liters: 3200.0,
        reserve_days: 3.0,
        scenario_name: "Eco-Villa Balanced Harvest"
      }
    }
  };
}

export async function executeCalculation(inputData, forceDemoMode = false) {
  if (!forceDemoMode) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputData),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Backend unavailable, falling back to client-side calculator:', err);
    }
  }

  // Client-side fallback
  return calculateWaterBalance(inputData, 'local_demo_engine');
}

export async function fetchHistory() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/history?limit=25`);
    if (res.ok) return await res.json();
  } catch (_) {}
  return [];
}

export async function fetchSensorTelemetry() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sensors/current`);
    if (res.ok) return await res.json();
  } catch (_) {}
  
  // High-fidelity fallback client telemetry generator
  const now = new Date().toISOString();
  return {
    sensor_id: "JL-BLDG-IOT-001 (Client Simulated)",
    timestamp: now,
    tank_level_liters: 68500.0,
    tank_level_percentage: 68.5,
    rain_rate_mm_hr: 14.5,
    cumulative_rain_mm: 28.2,
    inflow_lpm: 261.0,
    outflow_lpm: 12.0,
    valve_position_pct: 0.0,
    ambient_temp_c: 32.4,
    humidity_pct: 78.0,
    heatwave_index: "MODERATE",
    storm_alert_active: false,
    status: "ONLINE (Local Simulator)"
  };
}
