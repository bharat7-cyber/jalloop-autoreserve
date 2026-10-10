import React from 'react';
import { SunMedium, CloudLightning, CheckCircle2, SlidersHorizontal, Info } from 'lucide-react';

export default function RecommendationsPanel({ result }) {
  if (!result) return null;

  const { mode, alert_level, valve_action, valve_discharge_rate_lpm, recommendations } = result;

  const getModeTheme = () => {
    switch (mode) {
      case 'HEATWAVE_DEFENSE':
        return {
          icon: SunMedium,
          title: 'HEATWAVE & DROUGHT DEFENSE MODE',
          badgeBg: 'bg-amber-950/80 border-amber-600 text-amber-300',
          containerBg: 'border-amber-900/60 bg-amber-950/10',
          desc: 'Prioritizing maximum water retention against prolonged heat and municipal tanker shortages.',
        };
      case 'STORM_SURGE_PREP':
        return {
          icon: CloudLightning,
          title: 'STORM SURGE & CLOUDBURST PREPARATION',
          badgeBg: 'bg-blue-950/80 border-blue-600 text-sky-300',
          containerBg: 'border-blue-900/60 bg-blue-950/10',
          desc: 'Recommended pre-storm drawdown to create storage capacity. Excess runoff may still overflow when it exceeds available capacity.',
        };
      case 'BALANCED_BUFFER':
      default:
        return {
          icon: CheckCircle2,
          title: 'BALANCED STORAGE STABILITY',
          badgeBg: 'bg-emerald-950/80 border-emerald-600 text-emerald-300',
          containerBg: 'border-emerald-900/60 bg-emerald-950/10',
          desc: 'Normal operating envelope. Inflow is comfortably accommodated by existing storage headspace.',
        };
    }
  };

  const getAlertBadge = () => {
    switch (alert_level) {
      case 'CRITICAL':
        return 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse';
      case 'WARNING':
        return 'bg-amber-950 text-amber-300 border-amber-700';
      case 'ADVISORY':
        return 'bg-sky-950 text-sky-300 border-sky-700';
      default:
        return 'bg-emerald-950 text-emerald-300 border-emerald-700';
    }
  };

  const theme = getModeTheme();
  const ModeIcon = theme.icon;

  return (
    <div className={`border rounded-2xl p-5 shadow-xl transition-all ${theme.containerBg}`}>
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-sky-400">
            <ModeIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-wider font-semibold text-slate-200">
                {theme.title}
              </span>
              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${getAlertBadge()}`}>
                {alert_level}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{theme.desc}</p>
          </div>
        </div>

        {/* Valve Actuator Command */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl">
          <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono text-slate-400">Suggested Valve Action — Advisory</div>
            <div className="text-xs font-mono font-bold text-cyan-300">
              {valve_action} {valve_discharge_rate_lpm > 0 && `(${valve_discharge_rate_lpm} LPM)`}
            </div>
          </div>
        </div>
      </div>

      {/* Itemized Directives */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2">
          <Info className="h-3.5 w-3.5 text-sky-400" />
          Actionable Advisory Directives
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {recommendations && recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs text-slate-200 leading-relaxed flex items-start gap-2 shadow-sm"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0 mt-1.5"></div>
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
