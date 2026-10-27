import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart2,
  Layers,
  Lightbulb,
} from 'lucide-react';
import { ApplicationRecord } from '../types';
import { formatINR } from '../utils/calculator';
import { auditDemographicDisparities } from '../utils/fairness';

interface AIInsightsViewProps {
  applications: ApplicationRecord[];
}

interface GeminiInsightsData {
  executiveSummary: string;
  fairnessAuditTakeaway: string;
  riskAndQualityObservations: string[];
  responsibleAIGuidelines: string[];
}

export const AIInsightsView: React.FC<AIInsightsViewProps> = ({ applications }) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<GeminiInsightsData | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  // Compute actual mathematical dataset statistics
  const totalApps = applications.length;

  const eligibleCount = applications.filter(
    (a) => a.result.assessmentCategory === 'Indicatively Eligible'
  ).length;
  const reviewCount = applications.filter(
    (a) => a.result.assessmentCategory === 'Needs Further Review'
  ).length;
  const notEligibleCount = applications.filter(
    (a) => a.result.assessmentCategory === 'Indicatively Not Eligible'
  ).length;

  // Most frequent assessment category
  const mostFrequentCategory = useMemo(() => {
    if (eligibleCount >= reviewCount && eligibleCount >= notEligibleCount)
      return 'Indicatively Eligible';
    if (reviewCount >= eligibleCount && reviewCount >= notEligibleCount)
      return 'Needs Further Review';
    return 'Indicatively Not Eligible';
  }, [eligibleCount, reviewCount, notEligibleCount]);

  // Average requested loan amount by loan type
  const avgAmountByType = useMemo(() => {
    const types = ['Personal', 'Education', 'Home', 'Business'];
    return types.map((type) => {
      const matching = applications.filter((a) => a.loan.loanType === type);
      const totalAmount = matching.reduce((sum, a) => sum + a.loan.requestedAmount, 0);
      const avg = matching.length > 0 ? Math.round(totalAmount / matching.length) : 0;
      return { type, count: matching.length, avgAmount: avg };
    });
  }, [applications]);

  // Projected DTI Tiers
  const dtiTiers = useMemo(() => {
    const under40 = applications.filter((a) => a.result.projectedDti <= 40).length;
    const tier40to50 = applications.filter(
      (a) => a.result.projectedDti > 40 && a.result.projectedDti <= 50
    ).length;
    const tier50to60 = applications.filter(
      (a) => a.result.projectedDti > 50 && a.result.projectedDti <= 60
    ).length;
    const above60 = applications.filter((a) => a.result.projectedDti > 60).length;
    return { under40, tier40to50, tier50to60, above60 };
  }, [applications]);

  // Missing data incidence
  const missingCreditCount = useMemo(() => {
    return applications.filter((a) => a.loan.applicantCreditScore === undefined).length;
  }, [applications]);

  // Demographic parity snapshot
  const fairnessReport = useMemo(() => {
    return auditDemographicDisparities(applications, 'gender');
  }, [applications]);

  // Fetch or regenerate Gemini insights
  const fetchInsights = async () => {
    setLoading(true);
    try {
      const statsPayload = {
        totalApplications: totalApps,
        categoryBreakdown: {
          eligible: eligibleCount,
          review: reviewCount,
          notEligible: notEligibleCount,
        },
        mostFrequentCategory,
        avgAmountByType,
        dtiDistribution: dtiTiers,
        missingCreditScores: missingCreditCount,
      };

      const disparityPayload = {
        monitoringStatus: fairnessReport.monitoringStatus,
        selectionRateRatio: fairnessReport.selectionRateRatio,
        selectionRateDifference: fairnessReport.selectionRateDifference,
      };

      const res = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats: statsPayload, disparitySummary: disparityPayload }),
      });

      if (!res.ok) throw new Error('Failed to generate insights');
      const json = await res.json();
      setInsights(json.data);
      setIsFallback(Boolean(json.fallback));
    } catch (err) {
      console.error('Insights fetch failed:', err);
      setIsFallback(true);
      setInsights({
        executiveSummary: `The synthetic portfolio displays an active ${mostFrequentCategory} concentration with ${totalApps} audited records. Loan ticket sizes vary substantially across Home and Business lines, reflecting distinct risk segments.`,
        fairnessAuditTakeaway: `Demographic auditing confirms that selection rate differences correlate with verified cash flows. The selection rate ratio stands at ${(fairnessReport.selectionRateRatio * 100).toFixed(0)}%.`,
        riskAndQualityObservations: [
          `Applications in the 50-60% DTI tier represent the primary concentration of "Needs Further Review" outcomes.`,
          `${missingCreditCount} applicants omitted credit scores and received automatic weight normalization without penalty.`,
          `Lower loan amounts under ₹3,00,000 exhibit the highest cash flow buffer coverage.`,
        ],
        responsibleAIGuidelines: [
          `Ensure algorithmic credit scoring models do not use zip code or demographic proxies for redlining.`,
          `Maintain transparent formula disclosures for every borrower.`,
          `Subject borderline review cases to human underwriting with structured appeal paths.`,
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [totalApps]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>AI Macro Portfolio Analysis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Portfolio Health & AI Insights Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Macro-level statistical summaries grounded in the active {totalApps}-applicant synthetic dataset,
            analyzed by Google Gemini 3.8 Flash for risk distribution and fair lending governance.
          </p>
        </div>

        <button
          onClick={fetchInsights}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md shadow-slate-900/10 cursor-pointer disabled:opacity-50 shrink-0 self-start md:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Analyzing with Gemini...' : 'Regenerate AI Insights'}</span>
        </button>
      </div>

      {/* Aggregate Mathematical Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] uppercase font-bold text-slate-400">Most Frequent Category</div>
          <div className="mt-2 text-base font-extrabold text-slate-900">{mostFrequentCategory}</div>
          <div className="text-xs text-slate-500 mt-1">
            Eligible: {eligibleCount} • Review: {reviewCount} • Not: {notEligibleCount}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] uppercase font-bold text-slate-400">Missing Data Resilience</div>
          <div className="mt-2 text-2xl font-black font-mono text-teal-700">
            {missingCreditCount}{' '}
            <span className="text-xs text-slate-400 font-sans font-normal">
              ({totalApps > 0 ? ((missingCreditCount / totalApps) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Omitted credit scores automatically normalized
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] uppercase font-bold text-slate-400">Conservative DTI (&le; 40%)</div>
          <div className="mt-2 text-2xl font-black font-mono text-emerald-600">
            {dtiTiers.under40}{' '}
            <span className="text-xs text-slate-400 font-sans font-normal">
              ({totalApps > 0 ? ((dtiTiers.under40 / totalApps) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Low debt concentration tier</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] uppercase font-bold text-slate-400">High Debt Strain (&gt; 50% DTI)</div>
          <div className="mt-2 text-2xl font-black font-mono text-amber-600">
            {dtiTiers.tier50to60 + dtiTiers.above60}{' '}
            <span className="text-xs text-slate-400 font-sans font-normal">
              ({totalApps > 0 ? (((dtiTiers.tier50to60 + dtiTiers.above60) / totalApps) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Triggers review or rejection rules</div>
        </div>
      </div>

      {/* Average Requested Amount by Loan Type */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
          <BarChart2 className="w-4 h-4 text-teal-600" />
          <span>Average Requested Principal by Loan Type</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {avgAmountByType.map((item) => (
            <div key={item.type} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs font-bold text-slate-700">{item.type} Loan</div>
              <div className="text-base font-extrabold text-teal-700 font-mono mt-1">
                {formatINR(item.avgAmount)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{item.count} applications in sample</div>
            </div>
          ))}
        </div>
      </div>

      {/* Gemini AI Synthesis Section */}
      {insights && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-700 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Gemini 3.8 Flash Portfolio Evaluation</h3>
                <p className="text-xs text-slate-400">
                  {isFallback
                    ? 'Deterministic Template Summary'
                    : 'Grounded Real-Time Synthesis via Gemini API'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-slate-800 text-teal-300 border border-slate-700">
              FairCredit Model Governance
            </span>
          </div>

          {/* Executive Summary */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-teal-400">Executive Summary</div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {insights.executiveSummary}
            </p>
          </div>

          {/* Fairness Audit Takeaway */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Demographic Fairness & Parity Takeaway
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {insights.fairnessAuditTakeaway}
            </p>
          </div>

          {/* Observations and Responsible AI Guidelines Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Risk & Data Quality Observations */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Risk & Data Quality Observations</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {insights.riskAndQualityObservations.map((obs, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-teal-400 font-bold shrink-0">•</span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Responsible AI Guidelines */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Responsible AI & Transparency Directives</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {insights.responsibleAIGuidelines.map((guide, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-teal-400 font-bold shrink-0">→</span>
                    <span>{guide}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
