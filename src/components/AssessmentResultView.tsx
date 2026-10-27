import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Download,
  BookmarkCheck,
  RotateCcw,
  LayoutDashboard,
  Scale,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Info,
  Layers,
  TrendingUp,
  Percent,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { ApplicationRecord } from '../types';
import { formatINR } from '../utils/calculator';
import { downloadHTMLReport } from '../utils/storage';

interface AssessmentResultViewProps {
  application: ApplicationRecord;
  onSaveToHistory: (app: ApplicationRecord) => void;
  onAuditInFairness: (app: ApplicationRecord) => void;
  onCheckAnother: () => void;
  onReturnDashboard: () => void;
  isSaved?: boolean;
}

export const AssessmentResultView: React.FC<AssessmentResultViewProps> = ({
  application,
  onSaveToHistory,
  onAuditInFairness,
  onCheckAnother,
  onReturnDashboard,
  isSaved = false,
}) => {
  const [savedLocally, setSavedLocally] = useState(isSaved);
  const { applicant, finances, loan, result, aiExplanation } = application;

  const handleSave = () => {
    onSaveToHistory(application);
    setSavedLocally(true);
  };

  const handleDownloadReport = () => {
    downloadHTMLReport(application);
  };

  const isEligible = result.assessmentCategory === 'Indicatively Eligible';
  const isReview = result.assessmentCategory === 'Needs Further Review';
  const isNotEligible = result.assessmentCategory === 'Indicatively Not Eligible';

  const categoryColorClass = isEligible
    ? 'bg-emerald-600 text-white'
    : isReview
    ? 'bg-amber-600 text-white'
    : 'bg-red-600 text-white';

  const categoryBorderClass = isEligible
    ? 'border-emerald-500/30 bg-emerald-50/50'
    : isReview
    ? 'border-amber-500/30 bg-amber-50/50'
    : 'border-red-500/30 bg-red-50/50';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Action Nav & Reference Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={onReturnDashboard}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            title="Return to Dashboard"
          >
            <LayoutDashboard className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-slate-900">{application.id}</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {loan.loanType} Loan
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Evaluated on {new Date(application.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadReport}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Download Report</span>
          </button>
          <button
            onClick={() => onAuditInFairness(application)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition-colors"
          >
            <Scale className="w-3.5 h-3.5 text-teal-600" />
            <span>Audit in Fairness Tool</span>
          </button>
          <button
            onClick={handleSave}
            disabled={savedLocally}
            className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
              savedLocally
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default'
                : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>{savedLocally ? 'Saved to History' : 'Save to History'}</span>
          </button>
        </div>
      </div>

      {/* Main Assessment Header Card */}
      <div className={`rounded-2xl p-6 sm:p-8 border shadow-sm ${categoryBorderClass}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span
                className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide ${categoryColorClass} shadow-sm`}
              >
                {isEligible && <CheckCircle2 className="w-4 h-4" />}
                {isReview && <AlertCircle className="w-4 h-4" />}
                {isNotEligible && <XCircle className="w-4 h-4" />}
                <span>{result.assessmentCategory}</span>
              </span>
              <span className="text-xs font-medium text-slate-500">
                • Deterministic Underwriting Simulation
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {applicant.name}’s Assessment Result
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Requested {formatINR(loan.requestedAmount)} over {loan.termMonths} months at {loan.annualInterestRate}%
              p.a. with an estimated monthly instalment (EMI) of {formatINR(result.proposedEmi)}.
            </p>
          </div>

          {/* Illustrative Score Circular / Visual Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-5 shrink-0 self-start md:self-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Outer Score Gauge */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={isEligible ? 'text-emerald-500' : isReview ? 'text-amber-500' : 'text-red-500'}
                  strokeDasharray={`${result.illustrativeScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-slate-900">{result.illustrativeScore}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400">Score</span>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Illustrative Score</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Scale: 0 to 100</div>
              <div className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block bg-slate-100 text-slate-700">
                {result.illustrativeScore >= 70
                  ? 'Strong Tier'
                  : result.illustrativeScore >= 50
                  ? 'Moderate Tier'
                  : 'High Risk Tier'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Key Financial Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Estimated EMI */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Estimated EMI</div>
          <div className="text-base font-extrabold text-teal-700 font-mono mt-1">
            {formatINR(result.proposedEmi)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Per month</div>
        </div>

        {/* Existing DTI */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Existing DTI</div>
          <div className="text-base font-extrabold text-slate-900 font-mono mt-1">
            {result.existingDti}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Prior obligations</div>
        </div>

        {/* Projected DTI */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Projected DTI</div>
          <div
            className={`text-base font-extrabold font-mono mt-1 ${
              result.projectedDti <= 40
                ? 'text-emerald-600'
                : result.projectedDti <= 50
                ? 'text-teal-600'
                : 'text-amber-600'
            }`}
          >
            {result.projectedDti}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Target: ≤ 50%</div>
        </div>

        {/* Disposable Income */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Disposable Income</div>
          <div className="text-base font-extrabold text-slate-900 font-mono mt-1">
            {formatINR(result.disposableIncome)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Before proposed loan</div>
        </div>

        {/* Remaining Monthly Income Buffer */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Remaining Buffer</div>
          <div
            className={`text-base font-extrabold font-mono mt-1 ${
              result.remainingMonthlyIncome > 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {formatINR(result.remainingMonthlyIncome)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">After all expenses & EMI</div>
        </div>

        {/* Credit Score Input */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Credit Score</div>
          <div className="text-base font-extrabold text-slate-900 font-mono mt-1">
            {loan.applicantCreditScore ?? 'Normalized'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {loan.applicantCreditScore ? 'Demo input' : 'No penalty'}
          </div>
        </div>
      </div>

      {/* Transparent Score Breakdown Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>Transparent Scoring Rules & Factor Breakdown</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic weighting out of 100 points. Protected demographic characteristics are excluded.
            </p>
          </div>
          <div className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md self-start sm:self-auto">
            Total Points: {result.illustrativeScore} / 100
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Factor 1: DTI */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                {result.scoreBreakdown.projectedDtiScore.title}
              </span>
              <span className="text-xs font-mono font-extrabold text-teal-700">
                {result.scoreBreakdown.projectedDtiScore.score} /{' '}
                {result.scoreBreakdown.projectedDtiScore.maxScore} pts
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-teal-600 h-full rounded-full"
                style={{
                  width: `${
                    (result.scoreBreakdown.projectedDtiScore.score /
                      result.scoreBreakdown.projectedDtiScore.maxScore) *
                    100
                  }%`,
                }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-500">
              {result.scoreBreakdown.projectedDtiScore.rationale}
            </p>
          </div>

          {/* Factor 2: Repayment Capacity */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                {result.scoreBreakdown.repaymentCapacityScore.title}
              </span>
              <span className="text-xs font-mono font-extrabold text-teal-700">
                {result.scoreBreakdown.repaymentCapacityScore.score} /{' '}
                {result.scoreBreakdown.repaymentCapacityScore.maxScore} pts
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-teal-600 h-full rounded-full"
                style={{
                  width: `${
                    (result.scoreBreakdown.repaymentCapacityScore.score /
                      result.scoreBreakdown.repaymentCapacityScore.maxScore) *
                    100
                  }%`,
                }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-500">
              {result.scoreBreakdown.repaymentCapacityScore.rationale}
            </p>
          </div>

          {/* Factor 3: Income Stability */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                {result.scoreBreakdown.incomeStabilityScore.title}
              </span>
              <span className="text-xs font-mono font-extrabold text-teal-700">
                {result.scoreBreakdown.incomeStabilityScore.score} /{' '}
                {result.scoreBreakdown.incomeStabilityScore.maxScore} pts
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-teal-600 h-full rounded-full"
                style={{
                  width: `${
                    (result.scoreBreakdown.incomeStabilityScore.score /
                      result.scoreBreakdown.incomeStabilityScore.maxScore) *
                    100
                  }%`,
                }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-500">
              {result.scoreBreakdown.incomeStabilityScore.rationale}
            </p>
          </div>

          {/* Factor 4: Credit Score (Normalized if missing) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-slate-900">
                  {result.scoreBreakdown.creditScoreComponent.title}
                </span>
                {result.scoreBreakdown.creditScoreComponent.isNormalized && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                    Normalized
                  </span>
                )}
              </div>
              <span className="text-xs font-mono font-extrabold text-teal-700">
                {result.scoreBreakdown.creditScoreComponent.isNormalized
                  ? 'Omitted (Scaled to 100)'
                  : `${result.scoreBreakdown.creditScoreComponent.score} / 15 pts`}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-teal-600 h-full rounded-full"
                style={{
                  width: result.scoreBreakdown.creditScoreComponent.isNormalized
                    ? '100%'
                    : `${(result.scoreBreakdown.creditScoreComponent.score / 15) * 100}%`,
                }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-500">
              {result.scoreBreakdown.creditScoreComponent.rationale}
            </p>
          </div>
        </div>
      </div>

      {/* Positive Factors and Risk Considerations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Positive Factors */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Positive Financial Indicators</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700">
            {result.positiveIndicators.map((pos, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                <span>{pos}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risk Factors */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Risk Factors & Constraints</span>
          </div>
          {result.riskFactors.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No significant risk factors identified.</p>
          ) : (
            <ul className="space-y-2 text-xs text-slate-700">
              {result.riskFactors.map((risk, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5"></span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Gemini AI Natural Language Explanation Card */}
      {aiExplanation && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Gemini Explainable AI Synthesis</h3>
                <p className="text-[11px] text-slate-400">
                  {aiExplanation.isFallback ? 'Deterministic Template Engine' : 'Powered by Gemini 3.8 Flash'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
              Responsible AI Explainer
            </span>
          </div>

          <div className="text-sm text-slate-200 leading-relaxed font-sans bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            {aiExplanation.simpleExplanation}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Top Contributing Factors */}
            <div className="space-y-2">
              <h4 className="font-bold text-teal-300 uppercase tracking-wider text-[11px]">
                Top Contributing Factors
              </h4>
              <ul className="space-y-1.5 text-slate-300">
                {aiExplanation.topContributingFactors?.map((f, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-teal-400 font-bold shrink-0">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Practical Recommendations */}
            <div className="space-y-2">
              <h4 className="font-bold text-teal-300 uppercase tracking-wider text-[11px]">
                Actionable Recommendations
              </h4>
              <ul className="space-y-1.5 text-slate-300">
                {aiExplanation.practicalRecommendations?.map((r, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-teal-400 font-bold shrink-0">→</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700/60 text-[11px] text-slate-400 italic">
            <strong>Why this assessment is indicative:</strong> {aiExplanation.indicativeReason}
          </div>
        </div>
      )}

      {/* Disclaimers & Next Step Actions */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start space-x-3">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
        <div>
          <span className="font-bold">Educational Simulation Notice:</span> {result.disclaimer}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <button
          onClick={onReturnDashboard}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onAuditInFairness(application)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Scale className="w-3.5 h-3.5 text-teal-400" />
            <span>Test Counterfactual Consistency</span>
          </button>
          <button
            onClick={onCheckAnother}
            className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-600/20"
          >
            <span>Check Another Application</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
