import React, { useState } from 'react';
import { PlayCircle, RotateCcw, Zap, ArrowRight } from 'lucide-react';
import { calculateWaterBalance } from '../utils/calculator';

export default function ScenarioSimulator({ baseInputs, onApplyScenario }) {
  const [rainMultiplier, setRainMultiplier] = useState(1.0); // 0.5x to 2.0x
  const [simulatedReserveDays, setSimulatedReserveDays] = useState(baseInputs.reserve_days || 3.0);

  // Compute what-if scenario dynamically
  const modifiedRain = Number((baseInputs.rainfall_mm * rainMultiplier).toFixed(1));
  const simInputs = {
    ...baseInputs,
    rainfall_mm: modifiedRain,
    reserve_days: simulatedReserveDays,
    scenario_name: `What-If: ${modifiedRain}mm (${rainMultiplier.toFixed(1)}x) & ${simulatedReserveDays}d reserve`
  };

  const simResult = calculateWaterBalance(simInputs);

  const resetSimulation = () => {
    setRainMultiplier(1.0);
    setSimulatedReserveDays(baseInputs.reserve_days || 3.0);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-slate-100">Live "What-If" Stress Simulator</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetSimulation}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 transition"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
          <button
            onClick={() => onApplyScenario(simInputs)}
            className="text-xs text-white bg-sky-600 hover:bg-sky-500 font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition shadow"
          >
            <span>Apply To Dashboard</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Slider 1: Rain Forecast Shift */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-slate-300 font-medium">Rainfall Intensity Scale</span>
            <span className="font-mono text-sky-400 font-bold">
              {modifiedRain} mm ({rainMultiplier.toFixed(2)}x)
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="2.5"
            step="0.05"
            value={rainMultiplier}
            onChange={(e) => setRainMultiplier(parseFloat(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>Drought (-90%)</span>
            <span>Forecast Baseline (1.0x)</span>
            <span>Cloudburst (+150%)</span>
          </div>
        </div>

        {/* Slider 2: Safety Reserve Days */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-slate-300 font-medium">Building Reserve Target</span>
            <span className="font-mono text-emerald-400 font-bold">
              {simulatedReserveDays} Days ({Math.round(baseInputs.daily_water_demand_liters * simulatedReserveDays).toLocaleString()} L)
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="10.0"
            step="0.5"
            value={simulatedReserveDays}
            onChange={(e) => setSimulatedReserveDays(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>Aggressive (1 Day)</span>
            <span>Standard (3-4 Days)</span>
            <span>Conservative (10 Days)</span>
          </div>
        </div>
      </div>

      {/* Instant Dynamic Preview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 text-xs">
        <div>
          <div className="text-[11px] text-slate-400">Simulated Runoff</div>
          <div className="font-mono font-bold text-sky-300 text-sm">
            {simResult.harvestable_runoff_liters.toLocaleString()} L
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">Required Drawdown</div>
          <div className="font-mono font-bold text-amber-300 text-sm">
            {simResult.recommended_drawdown_liters.toLocaleString()} L
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">Overflow Spill Risk</div>
          <div className={`font-mono font-bold text-sm ${simResult.overflow_liters > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {simResult.overflow_risk_percentage}% ({simResult.overflow_liters.toLocaleString()} L)
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">Strategy Triggered</div>
          <div className="font-mono font-bold text-slate-200 text-xs mt-0.5 truncate">
            {simResult.mode}
          </div>
        </div>
      </div>
    </div>
  );
}
