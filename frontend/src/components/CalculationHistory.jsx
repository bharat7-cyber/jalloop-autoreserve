import React, { useState } from 'react';
import { History, Download, Play, RefreshCw } from 'lucide-react';

export default function CalculationHistory({ history, onLoadScenario, onRefresh }) {
  const [filterMode, setFilterMode] = useState('ALL');

  const filtered = history.filter((item) => {
    if (filterMode === 'ALL') return true;
    return item.mode === filterMode;
  });

  const exportCSV = () => {
    if (!history || history.length === 0) return;
    const headers = [
      'ID',
      'Timestamp',
      'Scenario',
      'Rainfall_mm',
      'Catchment_sqm',
      'Runoff_L',
      'Drawdown_L',
      'Overflow_L',
      'Safety_Reserve_L',
      'Mode',
      'Alert',
      'Storage'
    ];
    const rows = history.map((item) => [
      item.id,
      item.timestamp,
      `"${item.inputs?.scenario_name || ''}"`,
      item.inputs?.rainfall_mm || 0,
      item.inputs?.catchment_area_sqm || 0,
      item.harvestable_runoff_liters,
      item.recommended_drawdown_liters,
      item.overflow_liters,
      item.safety_reserve_liters,
      item.mode,
      item.alert_level,
      item.storage_backend
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jalloop_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-sky-400" />
          <h2 className="text-sm font-semibold text-slate-100">Audit Trail & Calculation History</h2>
          <span className="text-xs font-mono text-slate-400">
            ({history.length} records)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none"
          >
            <option value="ALL">All Modes</option>
            <option value="STORM_SURGE_PREP">Storm Surge Prep</option>
            <option value="HEATWAVE_DEFENSE">Heatwave Defense</option>
            <option value="BALANCED_BUFFER">Balanced Buffer</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={exportCSV}
            disabled={history.length === 0}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <Download className="h-3 w-3" />
            <span>Export CSV</span>
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition"
            title="Refresh History"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-500 font-mono">
          No calculation history recorded yet. Run a balance calculation to create an audit record.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="pb-2.5 font-normal">Timestamp</th>
                <th className="pb-2.5 font-normal">Scenario / Building</th>
                <th className="pb-2.5 font-normal text-right">Rain (mm)</th>
                <th className="pb-2.5 font-normal text-right">Runoff (L)</th>
                <th className="pb-2.5 font-normal text-right">Drawdown (L)</th>
                <th className="pb-2.5 font-normal text-right">Overflow (L)</th>
                <th className="pb-2.5 font-normal text-center">Mode</th>
                <th className="pb-2.5 font-normal text-center">Backend</th>
                <th className="pb-2.5 font-normal text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.map((item) => {
                const timeStr = item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A';
                return (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 text-slate-400">{timeStr}</td>
                    <td className="py-2.5 text-slate-200 font-sans font-medium truncate max-w-[160px]">
                      {item.inputs?.scenario_name || 'Standard Run'}
                    </td>
                    <td className="py-2.5 text-right text-sky-400">{item.inputs?.rainfall_mm} mm</td>
                    <td className="py-2.5 text-right text-slate-200">{Math.round(item.harvestable_runoff_liters).toLocaleString()} L</td>
                    <td className="py-2.5 text-right text-amber-400">
                      {item.recommended_drawdown_liters > 0 ? `-${Math.round(item.recommended_drawdown_liters).toLocaleString()} L` : '0 L'}
                    </td>
                    <td className={`py-2.5 text-right ${item.overflow_liters > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                      {Math.round(item.overflow_liters).toLocaleString()} L
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans uppercase ${
                        item.mode === 'HEATWAVE_DEFENSE'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : item.mode === 'STORM_SURGE_PREP'
                          ? 'bg-sky-950 text-sky-300 border border-sky-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {item.mode.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="text-[10px] text-slate-400 uppercase">
                        {item.storage_backend === 'dynamodb' ? 'AWS' : 'SQLite'}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <button
                        onClick={() => onLoadScenario(item.inputs)}
                        className="text-[11px] text-sky-400 hover:text-sky-300 bg-sky-950/60 hover:bg-sky-900/60 border border-sky-800/80 px-2 py-0.5 rounded transition inline-flex items-center gap-1 font-sans"
                        title="Load into Form"
                      >
                        <Play className="h-2.5 w-2.5" />
                        <span>Load</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
