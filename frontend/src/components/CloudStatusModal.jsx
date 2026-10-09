import React from 'react';
import { X, Database, Cloud, ShieldCheck, CheckCircle2, AlertCircle, Copy, Terminal } from 'lucide-react';

export default function CloudStatusModal({ isOpen, onClose, health }) {
  if (!isOpen) return null;

  const isAwsConfigured = health?.aws_dynamodb_configured;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden text-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-xl bg-sky-950 border border-sky-800 text-sky-400">
            <Cloud className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              AWS Cloud Integration & Storage Status
            </h3>
            <p className="text-xs text-slate-400">
              Transparent verification of cloud services and database persistence
            </p>
          </div>
        </div>

        {/* Current Status Box */}
        <div className={`p-4 rounded-xl border mb-5 ${
          isAwsConfigured
            ? 'bg-emerald-950/40 border-emerald-700/80'
            : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Current Persistence Engine
            </span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
              isAwsConfigured
                ? 'bg-emerald-900 text-emerald-300 border-emerald-600'
                : 'bg-amber-950 text-amber-300 border-amber-700'
            }`}>
              {isAwsConfigured ? 'AWS DynamoDB Production' : 'Local SQLite Fallback'}
            </span>
          </div>

          <div className="text-xs text-slate-300 space-y-1 font-mono">
            <div>Mode: <span className="text-sky-300">{health?.persistence_mode || 'N/A'}</span></div>
            <div>AWS Region: <span className="text-slate-400">{health?.aws_region || 'us-east-1 (Default)'}</span></div>
            <div>DynamoDB Table: <span className="text-slate-400">{health?.dynamodb_table || 'JalLoopCalculations'}</span></div>
            <div>Records Persisted: <span className="text-emerald-400 font-bold">{health?.total_records_stored || 0}</span></div>
          </div>
        </div>

        {/* Transparency Disclosure */}
        <div className="text-xs text-slate-300 bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 mb-5 leading-relaxed">
          <strong className="text-white block mb-1">Honest Architecture Guarantee:</strong>
          When valid AWS credentials (<code className="text-sky-300">AWS_ACCESS_KEY_ID</code>, <code className="text-sky-300">AWS_SECRET_ACCESS_KEY</code>) are detected, the backend connects directly to real AWS DynamoDB using <code className="text-sky-300">boto3</code> and runs serverless on AWS Lambda via <code className="text-sky-300">Mangum</code>. When AWS credentials are not configured, the app runs locally with SQLite zero-loss persistence and local demo capabilities.
        </div>

        {/* How to Connect AWS */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-sky-400" />
            How to Connect Real AWS Services
          </h4>
          <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
            <li>Configure credentials in <code className="text-sky-300">backend/.env</code> or system environment:
              <pre className="mt-1 p-2 bg-slate-900 rounded text-[11px] text-slate-300">
                AWS_ACCESS_KEY_ID=AKIA...<br/>
                AWS_SECRET_ACCESS_KEY=...<br/>
                AWS_REGION=us-east-1<br/>
                DYNAMODB_TABLE_NAME=JalLoopCalculations
              </pre>
            </li>
            <li>Deploy to AWS Lambda & API Gateway with SAM:
              <pre className="mt-1 p-2 bg-slate-900 rounded text-[11px] text-emerald-400">
                sam build<br/>
                sam deploy --guided
              </pre>
            </li>
          </ol>
        </div>

        <div className="mt-5 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
