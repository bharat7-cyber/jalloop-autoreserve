import React, { useState, useEffect } from 'react';
import { Activity, Radio, Droplets, Thermometer, Wind, CloudRain, Cpu, RefreshCw } from 'lucide-react';
import { fetchSensorTelemetry } from '../services/api';

const INITIAL_TELEMETRY = {
  sensor_id: "JL-BLDG-IOT-001 (Simulated)",
  timestamp: new Date().toISOString(),
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
  status: "ONLINE (Hardware Emulation)"
};

export default function LiveSensorStream() {
  const [telemetry, setTelemetry] = useState(INITIAL_TELEMETRY);
  const [isLivePolling, setIsLivePolling] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const loadTelemetry = async () => {
  try {
    const data = await fetchSensorTelemetry();

    if (data) {
      setTelemetry(data);
    }
  } catch (err) {
    console.warn("Sensor telemetry fetch error:", err);
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
  let cancelled = false;

  const pollTelemetry = async () => {
    try {
      const data = await fetchSensorTelemetry();

      if (!cancelled && data) {
        setTelemetry(data);
      }
    } catch (err) {
      if (!cancelled) {
        console.warn("Sensor telemetry fetch error:", err);
      }
    }
  };

  void pollTelemetry();

  if (!isLivePolling) {
    return () => {
      cancelled = true;
    };
  }

  const interval = window.setInterval(() => {
    void pollTelemetry();
  }, 4000);

  return () => {
    cancelled = true;
    window.clearInterval(interval);
  };
}, [isLivePolling]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Radio className="h-4 w-4 text-emerald-400" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100">Live Building IoT Telemetry</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {telemetry.sensor_id}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Realistic hardware emulation • Ultrasonic depth, digital rain gauge, and smart valve actuators
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Transparent Hardware Disclaimer */}
          <span className="text-[10px] font-mono bg-amber-950/70 border border-amber-800 text-amber-300 px-2 py-1 rounded-md hidden sm:inline">
            ⚠️ Hardware: Simulated ADC Telemetry
          </span>

          <button
            onClick={() => setIsLivePolling(!isLivePolling)}
            className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition flex items-center gap-1.5 ${
              isLivePolling
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Activity className="h-3 w-3" />
            {isLivePolling ? 'Stream: Active' : 'Stream: Paused'}
          </button>

          <button
            onClick={() => {
  setIsLoading(true);
  void loadTelemetry();
}}
            disabled={isLoading}
            className="p-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition"
            title="Poll Now"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sensor Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Sensor 1: Ultrasonic Tank Depth */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-medium">Ultrasonic Level</span>
            <Droplets className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-sky-300">
              {telemetry.tank_level_percentage}%
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              {Math.round(telemetry.tank_level_liters).toLocaleString()} L Stored
            </div>
          </div>
        </div>

        {/* Sensor 2: Digital Rain Gauge */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-medium">Digital Rain Gauge</span>
            <CloudRain className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-cyan-300">
              {telemetry.rain_rate_mm_hr} <span className="text-[10px] text-slate-400">mm/h</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Cumul: {telemetry.cumulative_rain_mm} mm
            </div>
          </div>
        </div>

        {/* Sensor 3: Inflow & Outflow LPM */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-medium">Flow Turbine</span>
            <Wind className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-indigo-300">
              {telemetry.inflow_lpm} <span className="text-[10px] text-slate-400">LPM in</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Outflow: {telemetry.outflow_lpm} LPM
            </div>
          </div>
        </div>

        {/* Sensor 4: Smart Valve Position */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-medium">Motor Valve</span>
            <Cpu className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-amber-300">
              {telemetry.valve_position_pct}% <span className="text-[10px] text-slate-400">Open</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Actuator: Modulating
            </div>
          </div>
        </div>

        {/* Sensor 5: Weather & Heat Index */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-medium">Ambient Heat Index</span>
            <Thermometer className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-rose-300">
              {telemetry.ambient_temp_c}°C
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Humidity: {telemetry.humidity_pct}% • {telemetry.heatwave_index}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
