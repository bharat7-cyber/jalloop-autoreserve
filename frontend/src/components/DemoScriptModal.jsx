import React from 'react';
import { X, Clock, Sparkles, CheckCircle2 } from 'lucide-react';

export default function DemoScriptModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden text-slate-200 max-h-[85vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white shadow-lg shadow-sky-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              2–3 Minute Hackathon Demo Script
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5 text-sky-400" />
              <span>Pitch Guide for Judges & Live Demonstrations</span>
            </div>
          </div>
        </div>

        {/* Scrollable Script Content */}
        <div className="overflow-y-auto space-y-4 pr-1 text-xs leading-relaxed text-slate-300">
          {/* Minute 0: Hook & The Paradox */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="font-bold text-sky-300 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider text-[11px]">
              <span className="h-2 w-2 rounded-full bg-sky-400"></span>
              Minute 0:00 - 0:45 • The Urban Water Paradox
            </div>
            <p>
              "Judges, every modern city faces a bizarre paradox: during summer heatwaves, buildings pay thousands for emergency water tankers. Yet when heavy rains hit, rainwater harvesting tanks are already 90% full, causing millions of liters of clean water to overflow onto streets, creating localized urban flooding."
            </p>
            <p className="mt-2 text-slate-400 italic">
              "Why does this happen? Because facility managers cannot predict when to release water. Draining tanks blindly risks running out during dry spells; keeping them full guarantees urban flood overflow. We solved this with <strong>JalLoop AutoReserve</strong>."
            </p>
          </div>

          {/* Minute 1: The Solution & Live Demo */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider text-[11px]">
              <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
              Minute 0:45 - 1:45 • Live Demonstration
            </div>
            <p>
              "Let's look at our live dashboard. In the top selector, we load our <em>Bangalore High-Rise Monsoon Alert</em>. Notice: A 65mm rainfall event over 2,400 m² of roof will generate <strong>140,400 Liters</strong> of clean runoff."
            </p>
            <p className="mt-2">
              "Look at our dynamic tank cross-section: The tank currently has only 35,000 L of headroom. Without JalLoop, over <strong>105,000 Liters</strong> would violently spill into city drains. But AutoReserve automatically calculates the exact pre-storm drawdown: release <strong>82,000 Liters</strong> at 341 LPM over 4 hours before the rain hits."
            </p>
            <p className="mt-2 text-slate-400 italic">
              "Crucially: AutoReserve guarantees that water levels NEVER dip below the 3.5-day emergency safety reserve (63,000 L). It protects drought resilience while absorbing 100% of the storm surge!"
            </p>
          </div>

          {/* Minute 2: Stress Simulator & Cloud Architecture */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              Minute 1:45 - 2:30 • Live Stress Test & AWS Architecture
            </div>
            <p>
              "What if the storm turns into a severe cloudburst? Let's drag the <strong>Live 'What-If' Stress Simulator</strong> to 1.8x intensity. Instantly, the strategy adapts to <em>Emergency Bypass</em> mode while modulating the smart valve."
            </p>
            <p className="mt-2">
              "Under the hood, JalLoop AutoReserve is powered by a FastAPI computational core running serverless on <strong>AWS Lambda + HTTP API Gateway</strong> with persistent audit logging in <strong>AWS DynamoDB</strong> and automatic zero-loss SQLite offline fallback."
            </p>
          </div>

          {/* Closing & Call to Action */}
          <div className="bg-sky-950/40 p-3.5 rounded-xl border border-sky-800/80">
            <div className="font-bold text-sky-200 mb-1 flex items-center gap-1.5 text-[11px] uppercase">
              <CheckCircle2 className="h-4 w-4 text-sky-400" />
              Closing Pitch
            </div>
            <p className="text-slate-200">
              "JalLoop AutoReserve turns dumb static rainwater storage into an intelligent flood-mitigating, drought-banking climate asset for every building. Thank you!"
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-medium transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
