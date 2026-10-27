import React, { useState, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Scale,
  Search,
  Filter,
  ArrowUpDown,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Percent,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ApplicationRecord } from '../types';
import { formatINR } from '../utils/calculator';
import { auditDemographicDisparities } from '../utils/fairness';

interface OverviewDashboardProps {
  applications: ApplicationRecord[];
  onSelectApplication: (app: ApplicationRecord) => void;
  onNavigate: (tab: string) => void;
}

const OUTCOME_COLORS: Record<string, string> = {
  'Indicatively Eligible': '#059669', // Emerald 600
  'Needs Further Review': '#d97706', // Amber 600
  'Indicatively Not Eligible': '#dc2626', // Red 600
};

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  applications,
  onSelectApplication,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoanType, setSelectedLoanType] = useState<string>('All');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('All');
  const [sortField, setSortField] = useState<'date' | 'score' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Real dataset metrics calculations
  const totalApps = applications.length;

  const eligibleApps = useMemo(
    () => applications.filter((a) => a.result.assessmentCategory === 'Indicatively Eligible'),
    [applications]
  );
  const reviewApps = useMemo(
    () => applications.filter((a) => a.result.assessmentCategory === 'Needs Further Review'),
    [applications]
  );
  const notEligibleApps = useMemo(
    () => applications.filter((a) => a.result.assessmentCategory === 'Indicatively Not Eligible'),
    [applications]
  );

  const eligibleRate = totalApps > 0 ? ((eligibleApps.length / totalApps) * 100).toFixed(1) : '0';
  const reviewRate = totalApps > 0 ? ((reviewApps.length / totalApps) * 100).toFixed(1) : '0';
  const notEligibleRate = totalApps > 0 ? ((notEligibleApps.length / totalApps) * 100).toFixed(1) : '0';

  // Fairness audit on current dataset
  const fairnessReport = useMemo(
    () => auditDemographicDisparities(applications, 'gender'),
    [applications]
  );

  // Outcome distribution data for Pie Chart
  const outcomeData = useMemo(() => {
    return [
      { name: 'Indicatively Eligible', value: eligibleApps.length, color: '#059669' },
      { name: 'Needs Further Review', value: reviewApps.length, color: '#d97706' },
      { name: 'Indicatively Not Eligible', value: notEligibleApps.length, color: '#dc2626' },
    ].filter((item) => item.value > 0);
  }, [eligibleApps, reviewApps, notEligibleApps]);

  // Loan type breakdown
  const loanTypeData = useMemo(() => {
    const types = ['Personal', 'Education', 'Home', 'Business'];
    return types.map((type) => {
      const matching = applications.filter((a) => a.loan.loanType === type);
      const eligible = matching.filter((a) => a.result.assessmentCategory === 'Indicatively Eligible').length;
      return {
        loanType: type,
        total: matching.length,
        eligible,
        review: matching.length - eligible,
      };
    });
  }, [applications]);

  // Eligibility rate by demographic group chart data
  const demographicGroupData = useMemo(() => {
    return fairnessReport.groups.map((g) => ({
      group: g.groupName,
      eligibilityRate: g.eligibilityRate,
      sampleSize: g.totalCount,
      avgScore: g.avgScore,
    }));
  }, [fairnessReport]);

  // Filtering & Sorting of table
  const filteredApplications = useMemo(() => {
    return applications
      .filter((app) => {
        const matchesSearch =
          app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.loan.loanType.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLoanType =
          selectedLoanType === 'All' || app.loan.loanType === selectedLoanType;
        const matchesOutcome =
          selectedOutcome === 'All' || app.result.assessmentCategory === selectedOutcome;
        return matchesSearch && matchesLoanType && matchesOutcome;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'date') {
          diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else if (sortField === 'score') {
          diff = a.result.illustrativeScore - b.result.illustrativeScore;
        } else if (sortField === 'amount') {
          diff = a.loan.requestedAmount - b.loan.requestedAmount;
        }
        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [applications, searchTerm, selectedLoanType, selectedOutcome, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage) || 1;
  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredApplications.slice(start, start + itemsPerPage);
  }, [filteredApplications, currentPage]);

  const handleSort = (field: 'date' | 'score' | 'amount') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Transparent Responsible AI Financial Prototype</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Loan Assessment & Algorithmic Fairness Dashboard
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Real-time portfolio evaluation combining deterministic debt-to-income models, Gemini 3.8
              Flash explainability, and counterfactual demographic parity auditing.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('apply')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/25 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Loan Assessment</span>
            </button>
            <button
              onClick={() => onNavigate('fairness')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all cursor-pointer"
            >
              <Scale className="w-4 h-4 text-teal-400" />
              <span>Audit Disparities</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Applications */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Applications
            </span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalApps}</span>
            <span className="text-xs text-slate-500 font-medium">Synthetic Dataset</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            <span>Multi-loan portfolio coverage</span>
          </div>
        </div>

        {/* Indicatively Eligible */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Indicatively Eligible
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-700">{eligibleApps.length}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {eligibleRate}%
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            DTI ≤ 50% & healthy surplus
          </div>
        </div>

        {/* Needs Further Review */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Needs Further Review
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-amber-700">{reviewApps.length}</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              {reviewRate}%
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Borderline buffer / DTI 50–60%
          </div>
        </div>

        {/* Fairness Monitoring Status */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Fairness Status
            </span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span
              className={`inline-block text-xs font-bold px-2.5 py-1 rounded-md ${
                fairnessReport.monitoringStatus.includes('No major')
                  ? 'bg-emerald-100 text-emerald-800'
                  : fairnessReport.monitoringStatus.includes('Potential')
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {fairnessReport.monitoringStatus}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Selection Ratio: {(fairnessReport.selectionRateRatio * 100).toFixed(0)}%</span>
            <button
              onClick={() => onNavigate('fairness')}
              className="text-teal-600 hover:text-teal-700 font-semibold inline-flex items-center space-x-0.5"
            >
              <span>View Audit</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outcome Breakdown Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Outcome Distribution</h3>
              <p className="text-xs text-slate-500">Categorical assessment breakdown</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">{totalApps} total</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [
                    `${val ?? 0} applications (${totalApps > 0 ? (((Number(val) || 0) / totalApps) * 100).toFixed(1) : 0}%)`,
                    'Outcome',
                  ]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Loan Type Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Applications by Loan Type</h3>
              <p className="text-xs text-slate-500">Volume and eligibility status</p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loanTypeData}>
                <XAxis dataKey="loanType" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="eligible" name="Eligible" fill="#059669" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="review" name="Review / Not Eligible" fill="#94a3b8" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Group Eligibility Rates */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Selection Rates by Audit Group</h3>
              <p className="text-xs text-slate-500">Gender parity audit benchmark</p>
            </div>
            <button
              onClick={() => onNavigate('fairness')}
              className="text-xs text-teal-600 font-semibold hover:underline"
            >
              Configure
            </button>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demographicGroupData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="group" width={90} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val ?? 0}% eligibility`, 'Rate']}
                />
                <Bar
                  dataKey="eligibilityRate"
                  name="Eligibility Rate"
                  fill="#0d9488"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Applications Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Synthetic Applications</h3>
            <p className="text-xs text-slate-500">
              Showing {filteredApplications.length} records computed with deterministic financial engine
            </p>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ID, applicant..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Filter by Loan Type */}
            <select
              value={selectedLoanType}
              onChange={(e) => {
                setSelectedLoanType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="All">All Loan Types</option>
              <option value="Personal">Personal</option>
              <option value="Education">Education</option>
              <option value="Home">Home</option>
              <option value="Business">Business</option>
            </select>

            {/* Filter by Outcome */}
            <select
              value={selectedOutcome}
              onChange={(e) => {
                setSelectedOutcome(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="All">All Outcomes</option>
              <option value="Indicatively Eligible">Indicatively Eligible</option>
              <option value="Needs Further Review">Needs Further Review</option>
              <option value="Indicatively Not Eligible">Indicatively Not Eligible</option>
            </select>
          </div>
        </div>

        {/* Applications Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Application ID</th>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Loan Type</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Requested</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('score')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Fairness Audit Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedApplications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching applications found. Try adjusting filters.
                  </td>
                </tr>
              ) : (
                paginatedApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{app.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{app.applicant.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {app.applicant.age} yrs • {app.applicant.employmentType}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {app.loan.loanType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {formatINR(app.loan.requestedAmount)}
                      <div className="text-[11px] text-slate-400 font-normal">
                        EMI: {formatINR(app.result.proposedEmi)}/mo
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-900">
                          {app.result.illustrativeScore}
                        </span>
                        <span className="text-[10px] text-slate-400">/100</span>
                      </div>
                      <div className="w-16 h-1.5 rounded-full bg-slate-200 mt-1 overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full"
                          style={{ width: `${app.result.illustrativeScore}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          app.result.assessmentCategory === 'Indicatively Eligible'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.result.assessmentCategory === 'Needs Further Review'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {app.result.assessmentCategory}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] text-slate-500 inline-flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                        <span>Audit isolated</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectApplication(app)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 font-semibold transition-colors cursor-pointer text-[11px]"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div>
            Page <span className="font-bold text-slate-900">{currentPage}</span> of{' '}
            <span className="font-bold text-slate-900">{totalPages}</span> (
            {filteredApplications.length} records)
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
