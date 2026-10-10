import React from 'react';
import { ShieldAlert, AlertTriangle, ArrowDown, ArrowUp, Droplet } from 'lucide-react';

export default function WaterTankVisual({ result }) {
  if (!result || !result.inputs) return null;

  const capacity = result.inputs.tank_capacity_liters || 100000;
  const currentLevel = result.inputs.current_water_level_liters || 0;
  const safetyReserve = result.safety_reserve_liters || 0;
  const drawdown = result.recommended_drawdown_liters || 0;
  const postDrawdown = result.post_drawdown_level_liters || (currentLevel - drawdown);
  const captured = result.captured_water_liters || 0;
  const overflow = result.overflow_liters || 0;
  const postRainLevel = result.post_rain_tank_level_liters || 0;

  // Percentage heights (clamped 0 to 100%)
  const currentPct = Math.min(100, Math.max(0, (currentLevel / capacity) * 100));
  const reservePct = Math.min(100, Math.max(0, (safetyReserve / capacity) * 100));
  const drawdownPct = Math.min(100, Math.max(0, (drawdown / capacity) * 100));
  const postDrawdownPct = Math.min(100, Math.max(0, (postDrawdown / capacity) * 100));
  const postRainPct = Math.min(100, Math.max(0, (postRainLevel / capacity) * 100));

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Droplet className="h-4 w-4 text-sky-400" />
            Dynamic Water Tank Cross-Section
          </h2>
          <p className="text-xs text-slate-400">
            Total Capacity: <span className="font-mono text-slate-300 font-semibold">{capacity.toLocaleString()} L</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-sky-300">
            Post-Rain: {postRainPct.toFixed(1)}% Full
          </span>
        </div>
      </div>

      {/* Tank Graphic Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-auto">
        {/* Left Column: Visual Tank */}
        <div className="md:col-span-6 flex justify-center py-2">
          <div className="relative w-48 sm:w-56 h-72 border-4 border-slate-600 rounded-b-3xl rounded-t-lg bg-slate-950/90 shadow-2xl overflow-hidden flex flex-col justify-end">
            {/* Top overflow spill warning if any */}
            {overflow > 0 && (
              <div className="absolute top-2 left-2 right-2 z-30 bg-rose-950/90 border border-rose-500/80 text-rose-300 rounded px-2 py-1 text-[11px] font-mono flex items-center justify-center gap-1.5 animate-pulse">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                Overflow: {overflow.toLocaleString()} L
              </div>
            )}

            {/* Inflow Rain simulation animation */}
            <div className="absolute inset-x-0 top-0 h-16 pointer-events-none opacity-40 overflow-hidden">
              <div className="w-full h-full bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px] animate-pulse"></div>
            </div>

            {/* DRAWDOWN ZONE (water that will be released prior to storm) */}
            {drawdown > 0 && (
              <div
                style={{ height: `${drawdownPct}%` }}
                className="w-full bg-amber-500/30 border-y border-amber-400/80 relative flex items-center justify-center transition-all duration-700 z-10"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(245,158,11,0.25)_6px,rgba(245,158,11,0.25)_12px)]"></div>
                <span className="text-[10px] font-mono text-amber-300 bg-slate-900/90 px-1.5 py-0.5 rounded z-20 flex items-center gap-1 shadow">
                  <ArrowDown className="h-2.5 w-2.5" /> Drawdown: -{drawdown.toLocaleString()} L
                </span>
              </div>
            )}

            {/* BASE RETAINED WATER (Post-drawdown volume) */}
            <div
              style={{ height: `${postDrawdownPct}%` }}
              className="w-full bg-gradient-to-t from-sky-800 via-cyan-700 to-sky-600 relative transition-all duration-700"
            >
              {/* Shimmer water line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></div>

              {/* Water Label */}
              <div className="absolute bottom-2 inset-x-0 text-center">
                <span className="text-[11px] font-mono font-semibold text-white/90 bg-slate-900/60 px-2 py-0.5 rounded backdrop-blur-sm">
                  {postDrawdown.toLocaleString()} L Base
                </span>
              </div>
            </div>

            {/* CRITICAL SAFETY RESERVE THRESHOLD LINE */}
            <div
              style={{ bottom: `${reservePct}%` }}
              className="absolute inset-x-0 border-b-2 border-dashed border-emerald-400 z-20 flex items-center justify-end pr-2 pointer-events-none"
            >
              <span className="text-[9px] font-mono bg-emerald-950/90 text-emerald-300 border border-emerald-600/80 px-1 rounded -translate-y-1/2">
                Safety Reserve: {safetyReserve.toLocaleString()} L
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Volume Stages Breakdown */}
        <div className="md:col-span-6 space-y-3">
          {/* Stage 1: Current State */}
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
            <div>
              <div className="text-slate-400">Current Storage</div>
              <div className="font-mono font-bold text-slate-200">
                {currentLevel.toLocaleString()} L
              </div>
            </div>
            <span className="font-mono text-slate-300 bg-slate-700/60 px-2 py-0.5 rounded">
              {currentPct.toFixed(1)}%
            </span>
          </div>

          {/* Stage 2: Drawdown Action */}
          <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
            drawdown > 0
              ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
              : 'bg-slate-800/40 border-slate-700/40 text-slate-400'
          }`}>
            <div>
              <div className="flex items-center gap-1 font-medium">
                <ArrowDown className="h-3 w-3 text-amber-400" />
                Pre-Storm Drawdown
              </div>
              <div className="font-mono font-bold text-amber-300">
                {drawdown > 0 ? `-${drawdown.toLocaleString()} L` : '0 L (Hold All Water)'}
              </div>
            </div>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900/80">
              {drawdown > 0 ? `${result.valve_discharge_rate_lpm} LPM` : 'Valves Closed'}
            </span>
          </div>

          {/* Stage 3: Post-Rain Harvest */}
          <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-800/60 flex items-center justify-between text-xs">
            <div>
              <div className="text-sky-300 flex items-center gap-1 font-medium">
                <ArrowUp className="h-3 w-3 text-sky-400" />
                Incoming Captured Rain
              </div>
              <div className="font-mono font-bold text-cyan-200">
                +{captured.toLocaleString()} L
              </div>
            </div>
            <span className="font-mono text-cyan-300 bg-sky-900/60 px-2 py-0.5 rounded">
              From {result.harvestable_runoff_liters.toLocaleString()} L Runoff
            </span>
          </div>

          {/* Stage 4: Critical Dry-Period Safety Reserve */}
          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between text-xs">
            <div>
              <div className="text-emerald-300 flex items-center gap-1 font-medium">
                <ShieldAlert className="h-3 w-3 text-emerald-400" />
                Modelled Dry-Period Reserve
              </div>
              <div className="font-mono font-bold text-emerald-200">
                {safetyReserve.toLocaleString()} L ({result.inputs.reserve_days} Days)
              </div>
            </div>
            <span className="font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700/60">
              Modelled Reserve
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
