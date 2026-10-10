import React, { useState } from 'react';
import { Sliders, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

export default function ParameterForm({
  inputs,
  onChange,
  onSubmit,
  isLoading,
  error
}) {
  const [activeTab, setActiveTab] = useState('storm'); // 'storm' or 'facility'

  const handleQuickRain = (val) => {
    onChange({ ...inputs, rainfall_mm: val });
  };

  const handleQuickCoeff = (val) => {
    onChange({ ...inputs, runoff_coefficient: val });
  };

  const handleLevelPercent = (pct) => {
    const liters = Math.round((pct / 100) * (inputs.tank_capacity_liters || 100000));
    onChange({ ...inputs, current_water_level_liters: liters });
  };

  const currentLevelPct = inputs.tank_capacity_liters > 0
    ? Math.min(100, Math.round((inputs.current_water_level_liters / inputs.tank_capacity_liters) * 100))
    : 0;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-slate-100">System & Storm Parameters</h2>
          </div>
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('storm')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                activeTab === 'storm'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Meteorology
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('facility')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                activeTab === 'facility'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Building Tank
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {/* TAB 1: METEOROLOGY & RUNOFF */}
          {activeTab === 'storm' && (
            <div className="space-y-4">
              {/* Rainfall (mm) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="rainfall-mm-input" className="text-xs font-medium text-slate-300">
                    Forecasted Rainfall Depth (mm)
                  </label>
                  <span className="text-xs font-mono font-bold text-sky-400">
                    {inputs.rainfall_mm} mm
                  </span>
                </div>
                <input
                  id="rainfall-mm-input"
                  type="number"
                  min="0"
                  max="1000"
                  step="0.5"
                  value={inputs.rainfall_mm}
                  onChange={(e) => onChange({ ...inputs, rainfall_mm: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                  required
                />
                {/* Quick rain intensity buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Quick:</span>
                  {[
                    { label: 'Drizzle (5mm)', val: 5 },
                    { label: 'Moderate (25mm)', val: 25 },
                    { label: 'Heavy (65mm)', val: 65 },
                    { label: 'Cloudburst (120mm)', val: 120 }
                  ].map((btn) => (
                    <button
                      key={btn.val}
                      type="button"
                      onClick={() => handleQuickRain(btn.val)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition ${
                        inputs.rainfall_mm === btn.val
                          ? 'bg-sky-950 text-sky-300 border-sky-600'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750 hover:text-slate-200'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catchment Area (m²) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="catchment-area-input" className="text-xs font-medium text-slate-300">
                    Catchment / Roof Area (m²)
                  </label>
                  <span className="text-xs font-mono text-slate-400">
                    {Number(inputs.catchment_area_sqm).toLocaleString()} m²
                  </span>
                </div>
                <input
                  id="catchment-area-input"
                  type="number"
                  min="1"
                  max="500000"
                  step="10"
                  value={inputs.catchment_area_sqm}
                  onChange={(e) => onChange({ ...inputs, catchment_area_sqm: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                  required
                />
              </div>

              {/* Runoff Coefficient */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="runoff-coeff-select" className="text-xs font-medium text-slate-300">
                    Runoff Coefficient (C: 0.0 - 1.0)
                  </label>
                  <span className="text-xs font-mono text-cyan-400 font-bold">
                    C = {inputs.runoff_coefficient}
                  </span>
                </div>
                <select
                  id="runoff-coeff-select"
                  value={inputs.runoff_coefficient}
                  onChange={(e) => handleQuickCoeff(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 mb-2 cursor-pointer"
                >
                  <option value={0.95}>Sheet Metal / Glazed Tile (C = 0.95 - High Runoff)</option>
                  <option value={0.90}>Smooth Concrete Rooftop (C = 0.90 - Standard Urban)</option>
                  <option value={0.80}>Asphalt Shingle / Paved Court (C = 0.80)</option>
                  <option value={0.65}>Permeable Pavers / Gravel Surface (C = 0.65)</option>
                  <option value={0.50}>Extensive Green Roof (C = 0.50 - Retentive)</option>
                </select>
                <div className="text-[11px] text-slate-400 font-mono bg-slate-950/60 p-2 rounded border border-slate-800">
                  Formula: <span className="text-sky-300">Runoff (L) = Rain (mm) × Area (m²) × C</span>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    (1 mm on 1 m² = exactly 1.00 Liter)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUILDING TANK & DEMAND */}
          {activeTab === 'facility' && (
            <div className="space-y-4">
              {/* Primary Tank Capacity (L) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="tank-capacity-input" className="text-xs font-medium text-slate-300">
                    Primary Tank Capacity (Liters)
                  </label>
                  <span className="text-xs font-mono text-slate-400">
                    {Number(inputs.tank_capacity_liters).toLocaleString()} L
                  </span>
                </div>
                <input
                  id="tank-capacity-input"
                  type="number"
                  min="1000"
                  max="10000000"
                  step="5000"
                  value={inputs.tank_capacity_liters}
                  onChange={(e) => onChange({ ...inputs, tank_capacity_liters: parseFloat(e.target.value) || 1000 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                  required
                />
              </div>

              {/* Current Water Level (L) + slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="water-level-slider" className="text-xs font-medium text-slate-300">
                    Current Stored Water (Liters)
                  </label>
                  <span className="text-xs font-mono text-cyan-400 font-bold">
                    {Number(inputs.current_water_level_liters).toLocaleString()} L ({currentLevelPct}%)
                  </span>
                </div>
                <input
                  id="water-level-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={currentLevelPct}
                  onChange={(e) => handleLevelPercent(parseInt(e.target.value, 10))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
                <input
                  id="water-level-number-input"
                  type="number"
                  min="0"
                  max={inputs.tank_capacity_liters}
                  step="1000"
                  value={inputs.current_water_level_liters}
                  onChange={(e) => onChange({ ...inputs, current_water_level_liters: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Daily Consumption Demand (L/day) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="daily-demand-input" className="text-xs font-medium text-slate-300">
                    Daily Water Demand (L/day)
                  </label>
                  <span className="text-xs font-mono text-slate-400">
                    {Number(inputs.daily_water_demand_liters).toLocaleString()} L/day
                  </span>
                </div>
                <input
                  id="daily-demand-input"
                  type="number"
                  min="0"
                  max="1000000"
                  step="500"
                  value={inputs.daily_water_demand_liters}
                  onChange={(e) => onChange({ ...inputs, daily_water_demand_liters: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                  required
                />
              </div>

              {/* Emergency Reserve Days (days) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="reserve-days-input" className="text-xs font-medium text-slate-300">
                    Critical Dry-Period Reserve Days
                  </label>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    {inputs.reserve_days} Days ({Math.round(inputs.daily_water_demand_liters * inputs.reserve_days).toLocaleString()} L)
                  </span>
                </div>
                <input
                  id="reserve-days-input"
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  value={inputs.reserve_days}
                  onChange={(e) => onChange({ ...inputs, reserve_days: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  AutoReserve strictly guards this reserve volume. Drawdown will never drop water below this threshold.
                </p>
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 active:scale-[0.99] transition shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Computing Balance...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Compute Water Balance</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
