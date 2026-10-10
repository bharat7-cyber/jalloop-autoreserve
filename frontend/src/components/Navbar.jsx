import React from 'react';
import { Droplets, Radio, Sparkles } from 'lucide-react';

export default function Navbar({
  isDemoMode,
  setIsDemoMode,
  presets,
  onSelectPreset,
}) {
  

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Droplets className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-sky-300 via-cyan-200 to-blue-400 bg-clip-text text-transparent">
                JalLoop AutoReserve
              </h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                v1.0 MVP
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Intelligent Pre-Storm Drawdown & Drought Water Banking
            </p>
          </div>
        </div>

        {/* Controls & Badges */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Preset Selector */}
          <div className="relative">
            <select
              aria-label="Load Building Preset"
              onChange={(e) => {
                if (e.target.value && presets[e.target.value]) {
                  onSelectPreset(presets[e.target.value]);
                }
              }}
              defaultValue=""
              className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="" disabled>Load Preset Scenario...</option>
              {presets && Object.entries(presets).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/80 text-xs">
            <button
              onClick={() => setIsDemoMode(false)}
              className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                !isDemoMode
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Connects to FastAPI backend and persists to DynamoDB / SQLite"
            >
              <Radio className={`h-3.5 w-3.5 ${!isDemoMode ? 'text-white' : 'text-slate-400'}`} />
              <span>Live API</span>
            </button>
            <button
              onClick={() => setIsDemoMode(true)}
              className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                isDemoMode
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Runs standalone in-browser mathematical engine without backend dependency"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Local Demo</span>
            </button>
          </div>

        
        </div>
      </div>
    </header>
  );
}
