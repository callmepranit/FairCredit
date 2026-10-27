import React from 'react';
import {
  ShieldCheck,
  Scale,
  Sparkles,
  Calculator,
  Cpu,
  Layers,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Lock,
} from 'lucide-react';

export const AboutProjectView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
          <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
          <span>About FairCredit AI</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          FairCredit — Loan Eligibility and Fairness Checking System
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          An open educational fintech prototype that reconciles mathematical loan affordability, explainable AI
          (XAI), and algorithmic fairness audits to foster financial transparency and protect borrowers.
        </p>
      </div>

      {/* The Problem & Solution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* The Problem */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-rose-700 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>The Challenge in Modern Lending</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Automated lending algorithms often operate as opaque "black boxes." When algorithmic credit scoring
            is trained on biased historical data, it can quietly encode historical socioeconomic inequities,
            penalize underbanked demographics, or rely on inappropriate proxy variables without transparent recourse.
          </p>
          <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4">
            <li>Unclear denial rationale without actionable remedies</li>
            <li>Potential disparate impact across gender, age bands, and geography</li>
            <li>Conflation of mathematical risk with protected personal characteristics</li>
          </ul>
        </div>

        {/* The Solution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-teal-700 font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>The FairCredit AI Architecture</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            FairCredit AI solves this by introducing a strict architectural separation: 100% deterministic
            mathematical rules calculate financial metrics and baseline scores, while Google Gemini 3.8 Flash
            synthesizes plain-language explanations. Protected demographic attributes are isolated for fairness audits only.
          </p>
          <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4">
            <li>Deterministic Debt-to-Income (DTI) and EMI formulas</li>
            <li>Counterfactual software consistency testing (ΔScore = 0)</li>
            <li>Four-Fifths Rule (80%) demographic parity auditing</li>
          </ul>
        </div>
      </div>

      {/* Core Architectural Modules */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
        <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-teal-600" />
          <span>System Modules & Capabilities</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
              <Calculator className="w-3.5 h-3.5 text-teal-600" />
              <span>1. Deterministic Affordability Engine</span>
            </div>
            <p className="text-slate-600">
              Implements standard amortizing EMI calculations: <code>P × r × (1+r)^n / ((1+r)^n - 1)</code>.
              Calculates Existing DTI, Projected DTI, and net remaining cash buffer.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>2. Explainable AI (XAI) Synthesis</span>
            </div>
            <p className="text-slate-600">
              Uses server-side Google Gemini 3.8 Flash to interpret mathematical scores into empathetic,
              plain-language summaries, key factors, positive indicators, and actionable next steps.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5 text-teal-600" />
              <span>3. Algorithmic Fairness Audits</span>
            </div>
            <p className="text-slate-600">
              Evaluates demographic parity and selection rate ratios across gender, age bands, and location tiers.
              Flags disparate impact when group approval ratios drop below 80%.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-teal-600" />
              <span>4. Counterfactual Verification</span>
            </div>
            <p className="text-slate-600">
              Allows running controlled tests where only one demographic audit attribute is mutated, proving
              that the baseline engine is strictly demographic-blind with zero score divergence.
            </p>
          </div>
        </div>
      </div>

      {/* Scoring Weight Disclosure */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900">Scoring Model Transparency & Weight Matrix</h3>
        <p className="text-xs text-slate-600">
          The illustrative score is calculated out of 100 points using the following published weight distribution:
        </p>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900">Projected Debt-to-Income (DTI)</span>
              <p className="text-slate-500 text-[11px]">DTI ≤ 30% earns 35 pts, 30–40% earns 28 pts, &gt;60% earns 0 pts.</p>
            </div>
            <span className="font-mono font-extrabold text-teal-700">35 Points</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900">Repayment Capacity & Monthly Buffer</span>
              <p className="text-slate-500 text-[11px]">Remaining surplus buffer compared against monthly EMI obligation.</p>
            </div>
            <span className="font-mono font-extrabold text-teal-700">30 Points</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900">Income Consistency & Stability</span>
              <p className="text-slate-500 text-[11px]">Evaluation of employment stability and cash flow regularities.</p>
            </div>
            <span className="font-mono font-extrabold text-teal-700">15 Points</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900">Applicant Credit Score (Optional)</span>
              <p className="text-slate-500 text-[11px]">
                Normalized if omitted! Missing scores automatically rescale remaining weights to 100 without penalty.
              </p>
            </div>
            <span className="font-mono font-extrabold text-teal-700">15 Points</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900">Emergency Liquid Reserves</span>
              <p className="text-slate-500 text-[11px]">Months of essential living and debt service expenses held in reserve.</p>
            </div>
            <span className="font-mono font-extrabold text-teal-700">5 Points</span>
          </div>
        </div>
      </div>

      {/* Educational Prototype Disclaimer */}
      <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
        <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Educational Simulation Disclaimer</span>
        </div>
        <p className="text-xs text-amber-900 leading-relaxed">
          FairCredit AI is an educational simulation created exclusively for academic research, ethical AI
          prototyping, and fintech demonstration purposes. It does not provide actual credit decisions, certified
          credit scores, or binding loan commitments. No real credit bureaus or financial accounts are connected.
          Regulated lenders employ distinct proprietary risk models, full bureau pull verifications, and regulatory
          compliance frameworks.
        </p>
      </div>
    </div>
  );
};
