import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart
} from 'recharts';
import { BarChart3, TrendingUp, Layers } from 'lucide-react';

export default function ChartsSection({ result }) {
  const [activeChart, setActiveChart] = useState('hydrograph');

  if (!result || !result.hourly_projection) return null;

  const hourlyData = result.hourly_projection.map((d) => ({
    hour: `H+${d.hour}`,
    rainfall_mm: d.rainfall_mm,
    tank_level: Math.round(d.projected_tank_level_liters),
    cumulative_runoff: Math.round(d.cumulative_runoff_liters),
    overflow: Math.round(d.overflow_liters),
  }));

  // Comparison Data: Conventional Unmanaged Tank vs JalLoop AutoReserve
  const conventionalRunoff = result.harvestable_runoff_liters;
  const initialHeadroom = result.available_storage_liters;
  const conventionalOverflow = Math.max(0, conventionalRunoff - initialHeadroom);
  const conventionalCaptured = Math.min(conventionalRunoff, initialHeadroom);

  const jalLoopDrawdown = result.recommended_drawdown_liters;
  const jalLoopCaptured = result.captured_water_liters;
  const jalLoopOverflow = result.overflow_liters;

  const comparisonData = [
    {
      category: 'Conventional Tank (No Drawdown)',
      WaterCaptured: conventionalCaptured,
      WaterSpilled: conventionalOverflow,
      DrawdownBuffer: 0,
    },
    {
      category: 'JalLoop AutoReserve',
      WaterCaptured: jalLoopCaptured,
      WaterSpilled: jalLoopOverflow,
      DrawdownBuffer: jalLoopDrawdown,
    },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-sky-400" />
            Hydrological Forecasting & Comparative Analytics
          </h2>
          <p className="text-xs text-slate-400">
            Simulated 24-hour storm hydrograph and flood mitigation impact
          </p>
        </div>
        <div className="flex items-center bg-slate-800 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setActiveChart('hydrograph')}
            className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
              activeChart === 'hydrograph'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            24h Storm Hydrograph
          </button>
          <button
            onClick={() => setActiveChart('comparison')}
            className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
              activeChart === 'comparison'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            JalLoop vs Conventional
          </button>
        </div>
      </div>

      {/* Chart 1: 24h Hydrograph */}
      {activeChart === 'hydrograph' && (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hourlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis
                yAxisId="left"
                stroke="#38bdf8"
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k L`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#94a3b8"
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => `${val} mm`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar
                yAxisId="right"
                dataKey="rainfall_mm"
                name="Hourly Rain (mm)"
                fill="#38bdf8"
                opacity={0.6}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="tank_level"
                name="Projected Tank Level (L)"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="cumulative_runoff"
                name="Cumulative Runoff (L)"
                stroke="#a855f7"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Chart 2: Comparative Water Balance */}
      {activeChart === 'comparison' && (
        <div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k L`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                  formatter={(value) => `${value.toLocaleString()} Liters`}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="WaterCaptured" name="Captured Rainwater (L)" fill="#0ea5e9" stackId="a" radius={[0, 0, 4, 4]} />
                <Bar dataKey="DrawdownBuffer" name="Controlled Drawdown Buffer (L)" fill="#f59e0b" stackId="a" />
                <Bar dataKey="WaterSpilled" name="Uncontrolled Flood Spillage (L)" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span>
              💡 <strong className="text-slate-200">The JalLoop Advantage:</strong> Pre-storm drawdown safely converts potential municipal drain overflow into high-value storage or deep groundwater recharge.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
