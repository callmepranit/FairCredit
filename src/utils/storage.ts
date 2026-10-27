import { ApplicationRecord } from '../types';
import { getSeededSyntheticApplications } from '../data/syntheticApplications';
import { formatINR } from './calculator';

const STORAGE_KEY = 'faircredit_applications_v1';

/**
 * Initializes and retrieves applications from localStorage.
 * Seeds initial synthetic records on first load.
 */
export function getStoredApplications(): ApplicationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = getSeededSyntheticApplications();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seeded = getSeededSyntheticApplications();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return parsed;
  } catch (err) {
    console.error('Failed reading from localStorage:', err);
    return getSeededSyntheticApplications();
  }
}

/**
 * Saves an application record to local storage.
 */
export function saveApplication(record: ApplicationRecord): ApplicationRecord[] {
  try {
    const current = getStoredApplications();
    const existingIndex = current.findIndex((a) => a.id === record.id);
    let updated: ApplicationRecord[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = record;
    } else {
      updated = [record, ...current];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed saving application:', err);
    return getStoredApplications();
  }
}

/**
 * Deletes a single application by ID.
 */
export function deleteApplication(id: string): ApplicationRecord[] {
  try {
    const current = getStoredApplications();
    const updated = current.filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed deleting application:', err);
    return getStoredApplications();
  }
}

/**
 * Resets storage to original 32 synthetic applications.
 */
export function resetToSyntheticSeed(): ApplicationRecord[] {
  const seeded = getSeededSyntheticApplications();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

/**
 * Clears all applications from storage.
 */
export function clearAllApplications(): ApplicationRecord[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  return [];
}

/**
 * Downloads a structured CSV export of all stored applications.
 */
export function exportToCSV(applications: ApplicationRecord[]) {
  const headers = [
    'Application ID',
    'Created At',
    'Applicant Name',
    'Age',
    'Employment Type',
    'Gender (Audit)',
    'Location (Audit)',
    'Education (Audit)',
    'Gross Monthly Income (INR)',
    'Existing Debt (INR)',
    'Household Expenses (INR)',
    'Loan Type',
    'Requested Amount (INR)',
    'Tenure (Months)',
    'Interest Rate (%)',
    'Credit Score',
    'Proposed EMI (INR)',
    'Existing DTI (%)',
    'Projected DTI (%)',
    'Remaining Monthly Surplus (INR)',
    'Illustrative Score (0-100)',
    'Assessment Category',
  ];

  const rows = applications.map((app) => [
    app.id,
    app.createdAt,
    `"${app.applicant.name.replace(/"/g, '""')}"`,
    app.applicant.age,
    app.applicant.employmentType,
    app.applicant.gender || 'N/A',
    app.applicant.locationCategory || 'N/A',
    app.applicant.educationLevel || 'N/A',
    app.finances.grossMonthlyIncome,
    app.finances.existingMonthlyDebt,
    app.finances.monthlyHouseholdExpenses,
    app.loan.loanType,
    app.loan.requestedAmount,
    app.loan.termMonths,
    app.loan.annualInterestRate,
    app.loan.applicantCreditScore ?? 'Missing/Normalized',
    app.result.proposedEmi,
    app.result.existingDti,
    app.result.projectedDti,
    app.result.remainingMonthlyIncome,
    app.result.illustrativeScore,
    `"${app.result.assessmentCategory}"`,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `FairCredit_AI_Export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates and downloads a clean, printable HTML assessment report.
 */
export function downloadHTMLReport(app: ApplicationRecord) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to view and download the report.');
    return;
  }

  const categoryColor =
    app.result.assessmentCategory === 'Indicatively Eligible'
      ? '#059669'
      : app.result.assessmentCategory === 'Needs Further Review'
      ? '#d97706'
      : '#dc2626';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Assessment Report - ${app.id}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.5; margin: 0; padding: 40px; background: #fff; }
    .header { border-bottom: 2px solid #0f766e; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 24px; font-weight: bold; color: #0f172a; margin: 0; }
    .tagline { color: #0f766e; font-size: 13px; font-weight: 600; text-transform: uppercase; margin-top: 4px; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; font-weight: bold; font-size: 14px; color: #fff; background: ${categoryColor}; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; }
    .card h3 { margin-top: 0; font-size: 15px; color: #0f766e; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
    .row:last-child { border-bottom: none; }
    .label { color: #64748b; font-weight: 500; }
    .value { font-weight: 600; color: #0f172a; }
    .score-box { text-align: center; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .score-num { font-size: 42px; font-weight: 800; color: #0f766e; }
    .disclaimer { font-size: 11px; color: #64748b; background: #fffbeb; border: 1px solid #fef3c7; padding: 12px; border-radius: 6px; margin-top: 30px; }
    ul { margin: 8px 0; padding-left: 20px; font-size: 13px; color: #334155; }
    li { margin-bottom: 4px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="background: #0f766e; color: #fff; border: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; cursor: pointer;">Print / Save to PDF</button>
  </div>
  <div class="header">
    <div>
      <div class="title">FairCredit AI</div>
      <div class="tagline">Fairer assessments. Clearer decisions.</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 8px;">Reference: <strong>${app.id}</strong> | Generated: ${new Date(app.createdAt).toLocaleString()}</div>
    </div>
    <div style="text-align: right;">
      <div class="badge">${app.result.assessmentCategory}</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Evaluation Mode: Deterministic Engine</div>
    </div>
  </div>

  <div class="score-box">
    <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #0f766e; font-weight: 600;">Illustrative Creditworthiness Score</div>
    <div class="score-num">${app.result.illustrativeScore}<span style="font-size: 20px; color: #64748b;"> / 100</span></div>
    <div style="font-size: 13px; color: #475569; max-width: 600px; margin: 8px auto 0;">
      Transparent composite evaluation based on projected debt obligations, cash flow surplus, income stability, and reserves.
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <h3>Applicant & Loan Request</h3>
      <div class="row"><span class="label">Applicant Name</span><span class="value">${app.applicant.name}</span></div>
      <div class="row"><span class="label">Employment Type</span><span class="value">${app.applicant.employmentType} (${app.applicant.employmentDurationMonths} mos)</span></div>
      <div class="row"><span class="label">Loan Type</span><span class="value">${app.loan.loanType} Loan</span></div>
      <div class="row"><span class="label">Requested Principal</span><span class="value">${formatINR(app.loan.requestedAmount)}</span></div>
      <div class="row"><span class="label">Repayment Tenure</span><span class="value">${app.loan.termMonths} Months</span></div>
      <div class="row"><span class="label">Illustrative Interest Rate</span><span class="value">${app.loan.annualInterestRate}% p.a.</span></div>
      <div class="row"><span class="label">Demonstration Credit Score</span><span class="value">${app.loan.applicantCreditScore ? app.loan.applicantCreditScore : 'Normalized (Omitted)'}</span></div>
    </div>

    <div class="card">
      <h3>Key Financial Metrics</h3>
      <div class="row"><span class="label">Gross Monthly Income</span><span class="value">${formatINR(app.finances.grossMonthlyIncome)}</span></div>
      <div class="row"><span class="label">Existing Monthly Debt</span><span class="value">${formatINR(app.finances.existingMonthlyDebt)}</span></div>
      <div class="row"><span class="label">Monthly Household Expenses</span><span class="value">${formatINR(app.finances.monthlyHouseholdExpenses)}</span></div>
      <div class="row"><span class="label">Estimated Monthly EMI</span><span class="value" style="color: #0f766e; font-size: 14px;">${formatINR(app.result.proposedEmi)}</span></div>
      <div class="row"><span class="label">Existing DTI Ratio</span><span class="value">${app.result.existingDti}%</span></div>
      <div class="row"><span class="label">Projected DTI Ratio</span><span class="value">${app.result.projectedDti}%</span></div>
      <div class="row"><span class="label">Remaining Monthly Surplus</span><span class="value">${formatINR(app.result.remainingMonthlyIncome)}</span></div>
    </div>
  </div>

  <div class="card" style="margin-bottom: 24px;">
    <h3>Key Assessment Rationale</h3>
    <div style="font-weight: 600; font-size: 13px; color: #047857; margin-top: 8px;">Positive Indicators:</div>
    <ul>
      ${app.result.positiveIndicators.map((p) => `<li>${p}</li>`).join('')}
    </ul>
    ${
      app.result.riskFactors.length > 0
        ? `<div style="font-weight: 600; font-size: 13px; color: #b45309; margin-top: 12px;">Risk Considerations:</div>
           <ul>${app.result.riskFactors.map((r) => `<li>${r}</li>`).join('')}</ul>`
        : ''
    }
    <div style="font-weight: 600; font-size: 13px; color: #1e293b; margin-top: 12px;">Recommended Actions:</div>
    <ul>
      ${app.result.recommendedNextSteps.map((s) => `<li>${s}</li>`).join('')}
    </ul>
  </div>

  ${
    app.aiExplanation
      ? `
  <div class="card" style="margin-bottom: 24px; background: #f0fdf4; border-color: #bbf7d0;">
    <h3 style="color: #166534;">AI Natural Language Explanation (Gemini 3.8 Flash)</h3>
    <p style="font-size: 13px; color: #14532d;">${app.aiExplanation.simpleExplanation}</p>
    <div style="font-size: 12px; color: #15803d; font-style: italic;">${app.aiExplanation.indicativeReason}</div>
  </div>
  `
      : ''
  }

  <div class="disclaimer">
    <strong>Educational Prototype Disclaimer:</strong> ${app.result.disclaimer}
  </div>
</body>
</html>
`;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
