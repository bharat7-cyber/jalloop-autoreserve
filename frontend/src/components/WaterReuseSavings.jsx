import React from 'react';
import { Droplets, Truck, IndianRupee, Sprout } from 'lucide-react';

function formatValue(value) {
  const number = Number(value ?? 0);

  return Number.isFinite(number)
    ? number.toLocaleString('en-IN', {
        maximumFractionDigits: 1,
      })
    : '0';
}

export default function WaterReuseSavings({ result }) {
  if (!result) return null;

  const savings = result.water_savings ?? result;

  const reusableWater =
    savings.total_reusable_water_liters ??
    result.total_reusable_water_liters ??
    0;

  const tankerEquivalent =
    savings.avoided_freshwater_tankers ??
    result.avoided_freshwater_tankers ??
    0;

  const estimatedSavings =
    savings.estimated_cost_savings_inr ??
    result.estimated_cost_savings_inr ??
    0;

  const breakdown =
    savings.non_potable_breakdown ??
    result.non_potable_breakdown ??
    {};

  const rawHvac = Number(breakdown.hvac_cooling_liters ?? 0);
const rawToilet = Number(breakdown.toilet_flushing_liters ?? 0);
const rawIrrigation = Number(
  breakdown.landscape_irrigation_liters ?? 0
);

const allocationTotal = rawHvac + rawToilet + rawIrrigation;
const reusableTotal = Number(reusableWater ?? 0);

const allocationScale =
  allocationTotal > 0
    ? Math.min(1, reusableTotal / allocationTotal)
    : 0;

const hvacAllocation = rawHvac * allocationScale;
const toiletAllocation = rawToilet * allocationScale;
const irrigationAllocation = rawIrrigation * allocationScale;

  const assumptions = Array.isArray(savings.assumptions)
    ? savings.assumptions
    : [];

  const metrics = [
    {
      label: 'Potential Reusable Water',
      value: `${formatValue(reusableWater)} L`,
      note: 'Model estimate',
      icon: Droplets,
      color: 'text-cyan-300',
    },
    {
      label: 'Tanker Equivalent',
      value: formatValue(tankerEquivalent),
      note: '10,000 L per tanker assumed',
      icon: Truck,
      color: 'text-sky-300',
    },
    {
      label: 'Estimated Cost Savings',
      value: `₹${formatValue(estimatedSavings)}`,
      note: '₹1,500 per tanker assumed',
      icon: IndianRupee,
      color: 'text-emerald-300',
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-800
      bg-slate-900/80 p-5 shadow-xl">

      <div className="flex items-center gap-3 mb-5">
        <div className="rounded-xl border border-emerald-800
          bg-emerald-950/50 p-3 text-emerald-300">
          <Sprout className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-100">
            Water Reuse & Estimated Savings
          </h2>

          <p className="text-sm text-slate-400">
            Potential benefits from the calculated water balance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className="rounded-xl border border-slate-800
                bg-slate-950/70 p-4"
            >
              <div className="mb-3 flex items-center
                justify-between gap-2">
                <span className="text-sm text-slate-400">
                  {metric.label}
                </span>

                <Icon className={`h-5 w-5 ${metric.color}`} />
              </div>

              <div className={`text-2xl font-bold font-mono
                ${metric.color}`}>
                {metric.value}
              </div>

              <p className="mt-2 text-xs text-slate-500">
                {metric.note}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-slate-800
        bg-slate-950/60 p-4">

        <h3 className="mb-3 font-semibold text-slate-200">
          Illustrative Non-Potable Water Allocation
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-400">
              HVAC Cooling
            </p>
            <p className="mt-1 font-mono text-sky-300">
              {formatValue(hvacAllocation)} L
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Toilet Flushing
            </p>
            <p className="mt-1 font-mono text-cyan-300">
              {formatValue(toiletAllocation)} L
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Landscape Irrigation
            </p>
            <p className="mt-1 font-mono text-emerald-300">
              {formatValue(irrigationAllocation)} L
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-amber-900/60
        bg-amber-950/20 p-3 text-xs leading-relaxed text-amber-200">
        These are estimates, not measured savings. Tanker
        equivalence assumes 10,000 L per tanker and cost savings
        assume ₹1,500 per tanker. Non-potable allocations are
        illustrative; actual savings depend on usable water,
        storage, water quality and real building demand.
      </div>

      {assumptions.length > 0 && (
        <details className="mt-4 text-sm text-slate-400">
          <summary className="cursor-pointer font-medium
            text-slate-300">
            Calculation assumptions
          </summary>

          <ul className="mt-3 list-disc space-y-2 pl-5">
            {assumptions.map((assumption, index) => (
              <li key={`${index}-${assumption}`}>
                {assumption}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}