import React from 'react';
import { CloudRain, ArrowDownCircle, ShieldCheck, AlertTriangle, Gauge } from 'lucide-react';

export default function MetricsOverview({ result }) {
  if (!result) return null;

  const {
    harvestable_runoff_liters,
    recommended_drawdown_liters,
    safety_reserve_liters,
    overflow_liters,
    overflow_risk_percentage,
    post_rain_tank_level_liters,
    post_rain_fill_percentage,
    days_of_autonomy_remaining,
    valve_discharge_rate_lpm,
  } = result;

  const isOverflow = overflow_liters > 0;
  const isDrawdown = recommended_drawdown_liters > 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {/* 1. Harvestable Runoff */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Harvestable Runoff</span>
          <CloudRain className="h-4 w-4 text-sky-400" />
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-sky-300">
            {harvestable_runoff_liters.toLocaleString()} <span className="text-xs font-normal text-slate-400">L</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Rainfall × Area × C
          </div>
        </div>
      </div>

      {/* 2. Pre-Storm Drawdown */}
      <div className={`border rounded-2xl p-4 shadow-lg flex flex-col justify-between ${
        isDrawdown
          ? 'bg-amber-950/20 border-amber-800/80'
          : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Pre-Storm Drawdown</span>
          <ArrowDownCircle className={`h-4 w-4 ${isDrawdown ? 'text-amber-400' : 'text-slate-500'}`} />
        </div>
        <div>
          <div className={`text-xl sm:text-2xl font-bold font-mono ${isDrawdown ? 'text-amber-300' : 'text-slate-300'}`}>
            {recommended_drawdown_liters.toLocaleString()} <span className="text-xs font-normal text-slate-400">L</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {isDrawdown ? `Rate: ${valve_discharge_rate_lpm} LPM (4h)` : 'Hold Full Reservoir'}
          </div>
        </div>
      </div>

      {/* 3. Guaranteed Safety Reserve */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Safety Reserve</span>
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-300">
            {safety_reserve_liters.toLocaleString()} <span className="text-xs font-normal text-slate-400">L</span>
          </div>
          <div className="text-[11px] text-emerald-400/90 mt-1 font-mono">
            {days_of_autonomy_remaining} Days Autonomy
          </div>
        </div>
      </div>

      {/* 4. Overflow Risk */}
      <div className={`border rounded-2xl p-4 shadow-lg flex flex-col justify-between ${
        isOverflow
          ? 'bg-rose-950/30 border-rose-800/80'
          : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Overflow Risk</span>
          <AlertTriangle className={`h-4 w-4 ${isOverflow ? 'text-rose-400' : 'text-slate-500'}`} />
        </div>
        <div>
          <div className={`text-xl sm:text-2xl font-bold font-mono ${isOverflow ? 'text-rose-400' : 'text-slate-300'}`}>
            {overflow_risk_percentage}%
          </div>
          <div className={`text-[11px] mt-1 font-mono ${isOverflow ? 'text-rose-300' : 'text-slate-400'}`}>
            {isOverflow ? `Spill: ${overflow_liters.toLocaleString()} L` : 'Zero Spillage (100% Retained)'}
          </div>
        </div>
      </div>

      {/* 5. Post-Rain Fill % */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Post-Rain Level</span>
          <Gauge className="h-4 w-4 text-cyan-400" />
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-300">
            {post_rain_fill_percentage}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {post_rain_tank_level_liters.toLocaleString()} L Final
          </div>
        </div>
      </div>
    </div>
  );
}
