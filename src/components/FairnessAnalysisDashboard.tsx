import React, { useState, useMemo } from 'react';
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Users,
  Repeat,
  Info,
  ArrowRight,
  TrendingUp,
  Percent,
  Search,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  ApplicationRecord,
  FairnessDimension,
  CounterfactualTestResult,
  ApplicantProfile,
} from '../types';
import { auditDemographicDisparities } from '../utils/fairness';
import {
  runCounterfactualTest,
  CounterfactualAttribute,
  COUNTERFACTUAL_OPTIONS,
} from '../utils/counterfactual';
import { formatINR } from '../utils/calculator';

interface FairnessAnalysisDashboardProps {
  applications: ApplicationRecord[];
  preselectedApplicant?: ApplicationRecord | null;
}

export const FairnessAnalysisDashboard: React.FC<FairnessAnalysisDashboardProps> = ({
  applications,
  preselectedApplicant,
}) => {
  const [activeTab, setActiveTab] = useState<'aggregate' | 'counterfactual'>('aggregate');

  // Demographic Audit Controls
  const [dimension, setDimension] = useState<FairnessDimension>('gender');
  const [thresholdPercent, setThresholdPercent] = useState<number>(15);

  // Counterfactual Test Controls
  const [selectedAppId, setSelectedAppId] = useState<string>(
    preselectedApplicant ? preselectedApplicant.id : applications[0]?.id || ''
  );
  const [counterfactualAttr, setCounterfactualAttr] =
    useState<CounterfactualAttribute>('gender');
  const [valueA, setValueA] = useState<string>('Male');
  const [valueB, setValueB] = useState<string>('Female');

  // Compute Aggregate Audit Report
  const auditReport = useMemo(() => {
    return auditDemographicDisparities(applications, dimension, thresholdPercent);
  }, [applications, dimension, thresholdPercent]);

  // Selected base application for counterfactual test
  const baseApp = useMemo(() => {
    return applications.find((a) => a.id === selectedAppId) || applications[0];
  }, [applications, selectedAppId]);

  // Update default values when counterfactual attribute changes
  const handleAttributeChange = (newAttr: CounterfactualAttribute) => {
    setCounterfactualAttr(newAttr);
    const opts = COUNTERFACTUAL_OPTIONS[newAttr].values;
    setValueA(opts[0]);
    setValueB(opts[1] || opts[0]);
  };

  // Run the Counterfactual Software Consistency Test
  const counterfactualResult: CounterfactualTestResult | null = useMemo(() => {
    if (!baseApp) return null;
    return runCounterfactualTest(
      baseApp.applicant,
      baseApp.finances,
      baseApp.loan,
      counterfactualAttr,
      valueA,
      valueB
    );
  }, [baseApp, counterfactualAttr, valueA, valueB]);

  // Chart data for group breakdown
  const chartData = useMemo(() => {
    return auditReport.groups.map((g) => ({
      name: g.groupName,
      Eligible: g.eligibilityRate,
      'Needs Review': g.reviewRate,
      'Not Eligible': g.notEligibleRate,
      sampleSize: g.totalCount,
    }));
  }, [auditReport]);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
            <Scale className="w-3.5 h-3.5 text-teal-600" />
            <span>Algorithmic Fairness & Responsible AI Audit Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Fairness Auditing & Counterfactual Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Audit synthetic application outcomes across demographic groups, measure selection rate ratios
            (4/5ths rule), and run controlled counterfactual software tests to verify demographic isolation.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 shrink-0 self-start md:self-center">
          <button
            onClick={() => setActiveTab('aggregate')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'aggregate'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Group Disparities Audit
          </button>
          <button
            onClick={() => setActiveTab('counterfactual')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'counterfactual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Counterfactual Testing (Δ = 0)
          </button>
        </div>
      </div>

      {/* TAB 1: GROUP DISPARITY AUDIT */}
      {activeTab === 'aggregate' && (
        <div className="space-y-6">
          {/* Controls Bar: Dimension Selector & Threshold Slider */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-700">Audit Demographic:</span>
              {(['gender', 'ageBand', 'locationCategory'] as FairnessDimension[]).map((dim) => (
                <button
                  key={dim}
                  onClick={() => setDimension(dim)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    dimension === dim
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dim === 'gender'
                    ? 'Gender Audit'
                    : dim === 'ageBand'
                    ? 'Age Bands'
                    : 'Location Tier'}
                </button>
              ))}
            </div>

            {/* Configurable Threshold Slider */}
            <div className="flex items-center space-x-3 text-xs">
              <Sliders className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-700">Disparity Tolerance:</span>
              <input
                type="range"
                min={5}
                max={30}
                step={1}
                value={thresholdPercent}
                onChange={(e) => setThresholdPercent(parseInt(e.target.value, 10))}
                className="w-24 accent-teal-600 cursor-pointer"
              />
              <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                ±{thresholdPercent}%
              </span>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
              <div className="text-[11px] uppercase font-bold text-slate-400">Monitoring Status</div>
              <div className="mt-2">
                <span
                  className={`inline-block text-xs font-extrabold px-2.5 py-1 rounded-md ${
                    auditReport.monitoringStatus.includes('No major')
                      ? 'bg-emerald-100 text-emerald-800'
                      : auditReport.monitoringStatus.includes('Potential')
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {auditReport.monitoringStatus}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Sample sufficiency: <strong>{auditReport.sampleSufficiency}</strong>
              </p>
            </div>

            {/* Selection Rate Ratio (4/5ths Rule) */}
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
              <div className="text-[11px] uppercase font-bold text-slate-400">
                Selection Rate Ratio (4/5ths Rule)
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span
                  className={`text-2xl font-black font-mono ${
                    auditReport.selectionRateRatio >= 0.8 ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {(auditReport.selectionRateRatio * 100).toFixed(0)}%
                </span>
                <span className="text-xs text-slate-500">Benchmark: ≥ 80%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {auditReport.comparisonGroup} vs {auditReport.benchmarkGroup}
              </p>
            </div>

            {/* Selection Rate Difference */}
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
              <div className="text-[11px] uppercase font-bold text-slate-400">
                Max Selection Rate Gap
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {auditReport.selectionRateDifference}%
                </span>
                <span className="text-xs text-slate-400">Tolerance: {thresholdPercent}%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Difference between highest & lowest groups
              </p>
            </div>

            {/* Demographic Parity Evaluation */}
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
              <div className="text-[11px] uppercase font-bold text-slate-400">
                Demographic Parity Status
              </div>
              <div className="mt-2 flex items-center space-x-2">
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    auditReport.demographicParityStatus === 'Compliant'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {auditReport.demographicParityStatus}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Across {auditReport.groups.length} sub-demographics
              </p>
            </div>
          </div>

          {/* Group Comparison Table & Visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Detailed Group Audit Table */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">
                  Sub-Group Demographic Metrics ({auditReport.dimensionLabel})
                </h3>
                <p className="text-xs text-slate-500">
                  Breakdown of approval rates, reviews, and average income levels
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Group Label</th>
                      <th className="py-3 px-4">Sample (N)</th>
                      <th className="py-3 px-4">Eligible %</th>
                      <th className="py-3 px-4">Review %</th>
                      <th className="py-3 px-4">Not Eligible %</th>
                      <th className="py-3 px-4">Avg Income</th>
                      <th className="py-3 px-4">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {auditReport.groups.map((group) => (
                      <tr key={group.groupName} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {group.groupName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-medium">{group.totalCount}</span>
                          {group.totalCount < 4 && (
                            <span className="ml-1 text-[10px] text-amber-600 font-bold">
                              (Small N)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-emerald-700">
                            {group.eligibilityRate}%
                          </span>{' '}
                          <span className="text-[11px] text-slate-400">({group.eligibleCount})</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-amber-700">
                          {group.reviewRate}%
                        </td>
                        <td className="py-3 px-4 font-mono text-red-600">
                          {group.notEligibleRate}%
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold">
                          {formatINR(group.avgIncome)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-teal-700">
                          {group.avgScore} / 100
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recharts Stacked Breakdown */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 mb-1">Outcome Distribution by Group</h3>
              <p className="text-xs text-slate-500 mb-4">Selection rate proportions</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(val: any) => [`${val ?? 0}%`, 'Rate']} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Eligible" fill="#059669" stackId="stack" />
                    <Bar dataKey="Needs Review" fill="#d97706" stackId="stack" />
                    <Bar dataKey="Not Eligible" fill="#dc2626" stackId="stack" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Actionable Fairness Recommendations */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Responsible AI & Audit Action Recommendations
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
              {auditReport.actionableInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-2.5"
                >
                  <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-1"></span>
                  <span className="leading-relaxed">{insight}</span>
                </div>
              ))}
            </div>

            {/* Educational Note */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
              <Info className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
              <div>
                <strong>Statistical Fairness Distinction:</strong> A disparity in group selection rates
                is a signal for deeper audit and investigative review, not legal proof of systemic bias. In
                responsible lending, statistical disparities often mirror underlying socioeconomic realities
                (e.g., lower average reported income in rural areas) rather than biased decision rules.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COUNTERFACTUAL CONSISTENCY PLAYGROUND */}
      {activeTab === 'counterfactual' && counterfactualResult && (
        <div className="space-y-6">
          {/* Explanation Header */}
          <div className="p-5 rounded-2xl bg-teal-900 text-white shadow-sm space-y-2">
            <div className="flex items-center space-x-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
              <Repeat className="w-4 h-4" />
              <span>Controlled Software Consistency Test</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              What is a Counterfactual Fairness Test?
            </h3>
            <p className="text-xs text-teal-100 max-w-3xl leading-relaxed">
              In this test, we duplicate an applicant's exact financial profile (income, debts, expenses,
              loan amount, tenure, interest rate, and credit score) into two identical profiles. We then mutate
              <strong> strictly ONE audit-only demographic attribute</strong> (such as Gender or Location Tier).
              Because the scoring algorithm is strictly demographic-blind, the mathematical score and eligibility
              outcome must remain <strong>100% identical (Δ = 0)</strong>.
            </p>
          </div>

          {/* Test Setup Controls */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Applicant Selector */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Base Applicant Profile
              </label>
              <select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.id} — {app.applicant.name} ({app.loan.loanType} Loan,{' '}
                    {formatINR(app.finances.grossMonthlyIncome)}/mo)
                  </option>
                ))}
              </select>
            </div>

            {/* Attribute to Mutate */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Demographic Variable to Test
              </label>
              <select
                value={counterfactualAttr}
                onChange={(e) =>
                  handleAttributeChange(e.target.value as CounterfactualAttribute)
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="gender">Gender</option>
                <option value="locationCategory">Location Category</option>
                <option value="educationLevel">Education Level</option>
                <option value="maritalStatus">Marital Status</option>
                <option value="age">Applicant Age</option>
              </select>
            </div>

            {/* Mutation Values */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Profile A</label>
                <select
                  value={valueA}
                  onChange={(e) => setValueA(e.target.value)}
                  className="w-full px-2 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {COUNTERFACTUAL_OPTIONS[counterfactualAttr].values.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Profile B</label>
                <select
                  value={valueB}
                  onChange={(e) => setValueB(e.target.value)}
                  className="w-full px-2 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {COUNTERFACTUAL_OPTIONS[counterfactualAttr].values.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Test Result Verification Banner */}
          <div
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              counterfactualResult.isStrictlyConsistent
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-red-50 border-red-200 text-red-950'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div
                className={`p-2 rounded-xl text-white shrink-0 mt-0.5 ${
                  counterfactualResult.isStrictlyConsistent ? 'bg-emerald-600' : 'bg-red-600'
                }`}
              >
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold">
                  {counterfactualResult.isStrictlyConsistent
                    ? 'Strict Software Consistency Confirmed (ΔScore = 0)'
                    : 'Disparity Detected'}
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  {counterfactualResult.technicalExplanation}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs font-bold text-slate-500 uppercase">Score Delta</div>
              <div className="text-2xl font-black font-mono text-emerald-700">
                Δ {counterfactualResult.scoreDifference} pts
              </div>
              <div className="text-[10px] text-emerald-800 font-semibold">100% Deterministic Match</div>
            </div>
          </div>

          {/* Side-by-Side Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile A */}
            <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Profile A
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-teal-100 text-teal-800 border border-teal-200">
                  {counterfactualAttr}: {valueA}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Gross Monthly Income:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {formatINR(counterfactualResult.profileA.finances.grossMonthlyIncome)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Existing Monthly Debt:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {formatINR(counterfactualResult.profileA.finances.existingMonthlyDebt)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Requested Principal:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {formatINR(counterfactualResult.profileA.loan.requestedAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Estimated EMI:</span>
                  <span className="font-semibold text-teal-700 font-mono">
                    {formatINR(counterfactualResult.profileA.result.proposedEmi)}/mo
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Projected DTI:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {counterfactualResult.profileA.result.projectedDti}%
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Illustrative Score</div>
                <div className="text-3xl font-black text-slate-900 font-mono">
                  {counterfactualResult.profileA.result.illustrativeScore} / 100
                </div>
                <div className="text-xs font-bold text-teal-700">
                  {counterfactualResult.profileA.result.assessmentCategory}
                </div>
              </div>
            </div>

            {/* Profile B */}
            <div className="bg-white rounded-2xl p-6 border-2 border-teal-500/50 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  Profile B (Mutated)
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-teal-600 text-white shadow-xs">
                  {counterfactualAttr}: {valueB}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Gross Monthly Income:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {formatINR(counterfactualResult.profileB.finances.grossMonthlyIncome)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Existing Monthly Debt:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {formatINR(counterfactualResult.profileB.finances.existingMonthlyDebt)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Requested Principal:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {formatINR(counterfactualResult.profileB.loan.requestedAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Estimated EMI:</span>
                  <span className="font-semibold text-teal-700 font-mono">
                    {formatINR(counterfactualResult.profileB.result.proposedEmi)}/mo
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Projected DTI:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {counterfactualResult.profileB.result.projectedDti}%
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200 text-center space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Illustrative Score</div>
                <div className="text-3xl font-black text-slate-900 font-mono">
                  {counterfactualResult.profileB.result.illustrativeScore} / 100
                </div>
                <div className="text-xs font-bold text-teal-700">
                  {counterfactualResult.profileB.result.assessmentCategory}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
