import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MetricsOverview from './components/MetricsOverview';
import WaterTankVisual from './components/WaterTankVisual';
import ParameterForm from './components/ParameterForm';
import RecommendationsPanel from './components/RecommendationsPanel';
import ChartsSection from './components/ChartsSection';
import ScenarioSimulator from './components/ScenarioSimulator';
import LiveSensorStream from './components/LiveSensorStream';
import CalculationHistory from './components/CalculationHistory';
import CloudStatusModal from './components/CloudStatusModal';
import DemoScriptModal from './components/DemoScriptModal';

import {
  checkBackendHealth,
  fetchPresets,
  executeCalculation,
  fetchHistory,
} from './services/api';
import { calculateWaterBalance } from './utils/calculator';

const DEFAULT_INPUTS = {
  rainfall_mm: 65.0,
  catchment_area_sqm: 2400.0,
  runoff_coefficient: 0.90,
  tank_capacity_liters: 150000.0,
  current_water_level_liters: 115000.0,
  daily_water_demand_liters: 18000.0,
  reserve_days: 3.5,
  scenario_name: 'Bangalore High-Rise Monsoon Buffer',
};

export default function App() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [result, setResult] = useState(() => calculateWaterBalance(DEFAULT_INPUTS, 'local_demo'));
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [health, setHealth] = useState(null);
  const [presets, setPresets] = useState({});
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);

  const refreshHistory = async () => {
    const hist = await fetchHistory();
    if (hist && hist.length > 0) {
      setHistory(hist);
    }
  };

  const performCalculation = async (inputParams, forceDemo = isDemoMode) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await executeCalculation(inputParams, forceDemo);
      setResult(data);
      // If result was created, refresh history
      if (!forceDemo) {
        setTimeout(refreshHistory, 500);
      } else {
        // In local demo, prepend to local history
        setHistory((prev) => [data, ...prev.slice(0, 24)]);
      }
    } catch (err) {
      console.error('Calculation error:', err);
      setError('Calculation failed. Switched to local offline calculation engine.');
      const fallback = calculateWaterBalance(inputParams, 'local_demo_fallback');
      setResult(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial setup
  useEffect(() => {
    async function init() {
      const healthData = await checkBackendHealth();
      setHealth(healthData);
      if (healthData.status === 'offline') {
        setIsDemoMode(true);
      }

      const presetsData = await fetchPresets();
      setPresets(presetsData);

      // Perform initial calculation
      await performCalculation(DEFAULT_INPUTS, healthData.status === 'offline');
      await refreshHistory();
    }
    init();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    performCalculation(inputs, isDemoMode);
  };

  const handleSelectPreset = (preset) => {
    if (preset && preset.params) {
      setInputs(preset.params);
      performCalculation(preset.params, isDemoMode);
    }
  };

  const handleApplyScenario = (newInputs) => {
    setInputs(newInputs);
    performCalculation(newInputs, isDemoMode);
  };

  const handleLoadScenario = (loadedInputs) => {
    if (loadedInputs) {
      setInputs(loadedInputs);
      performCalculation(loadedInputs, isDemoMode);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        isDemoMode={isDemoMode}
        setIsDemoMode={setIsDemoMode}
        health={health}
        presets={presets}
        onSelectPreset={handleSelectPreset}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
        onOpenScriptModal={() => setIsScriptModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">
        {/* Banner: Scenario info & Quick presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <h2 className="text-sm font-semibold text-slate-200">
                Active Scenario: <span className="text-sky-300 font-mono">{inputs.scenario_name || 'Custom Simulation'}</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Dual-Objective Optimization: Capturing cloudburst runoff while reserving minimum safety reserves for heatwaves.
            </p>
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-500 uppercase font-mono mr-1">Presets:</span>
            {presets && Object.entries(presets).map(([k, p]) => (
              <button
                key={k}
                onClick={() => handleSelectPreset(p)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                  inputs.scenario_name === p.name || inputs.scenario_name === p.params?.scenario_name
                    ? 'bg-sky-950 text-sky-300 border-sky-600 font-medium'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                {p.name.split(' (')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* 1. Metrics Overview */}
        <MetricsOverview result={result} />

        {/* 2. Parameters Form & Water Tank Cross-Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5 flex flex-col">
            <ParameterForm
              inputs={inputs}
              onChange={setInputs}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
            />
          </div>
          <div className="lg:col-span-7 flex flex-col">
            <WaterTankVisual result={result} />
          </div>
        </div>

        {/* 3. Smart Recommendations & Actuator Directives */}
        <RecommendationsPanel result={result} />

        {/* 4. Charts & Live Stress Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 flex flex-col">
            <ChartsSection result={result} />
          </div>
          <div className="lg:col-span-5 flex flex-col">
            <ScenarioSimulator
              baseInputs={inputs}
              onApplyScenario={handleApplyScenario}
            />
          </div>
        </div>

        {/* 5. Live Simulated IoT Stream */}
        <LiveSensorStream />

        {/* 6. Audit Trail & History */}
        <CalculationHistory
          history={history}
          onLoadScenario={handleLoadScenario}
          onRefresh={refreshHistory}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">JalLoop AutoReserve</span>
            <span>•</span>
            <span>Intelligent Rainwater & Pre-Storm Buffer Architecture</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-300">
              React + Vite + Tailwind
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300">
              FastAPI + Mangum
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-300">
              AWS DynamoDB / SQLite
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CloudStatusModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        health={health}
      />
      <DemoScriptModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
      />
    </div>
  );
}
