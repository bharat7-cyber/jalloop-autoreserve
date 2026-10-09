import React from 'react';
import { Droplets, Database, Radio, Sparkles, FileText } from 'lucide-react';

export default function Navbar({
  isDemoMode,
  setIsDemoMode,
  health,
  presets,
  onSelectPreset,
  onOpenCloudModal,
  onOpenScriptModal
}) {
  const isAwsActive = health?.aws_dynamodb_configured;
  const isBackendUp = health?.status === 'healthy';

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

          {/* AWS Cloud Status Pill */}
          <button
            onClick={onOpenCloudModal}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition ${
              isAwsActive
                ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800 hover:bg-emerald-900/50'
                : isBackendUp
                ? 'bg-slate-800 text-amber-300 border-amber-700/60 hover:bg-slate-700'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
            title="Click to view honest AWS & storage connectivity status"
          >
            <Database className="h-3.5 w-3.5" />
            <span className="hidden md:inline">
              {isAwsActive
                ? 'AWS DynamoDB: Active'
                : isBackendUp
                ? 'Storage: Local SQLite'
                : 'Offline Demo Mode'}
            </span>
            <span className="md:hidden">
              {isAwsActive ? 'AWS' : 'SQLite'}
            </span>
          </button>

          {/* Hackathon Pitch Script Button */}
          <button
            onClick={onOpenScriptModal}
            className="flex items-center gap-1.5 bg-sky-900/40 text-sky-300 border border-sky-700/60 hover:bg-sky-800/50 px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
          >
            <FileText className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden sm:inline">Demo Script</span>
          </button>
        </div>
      </div>
    </header>
  );
}
