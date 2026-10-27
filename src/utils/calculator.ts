import {
  FinancialDetails,
  LoanDetails,
  EligibilityCalculationResult,
  ScoreBreakdown,
  ScoreComponent,
  AssessmentCategory,
} from '../types';

/**
 * Calculates monthly EMI using the standard amortizing loan formula.
 * Handles zero interest loans gracefully.
 */
export function calculateEMI(principal: number, annualInterestRate: number, termMonths: number): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualInterestRate <= 0) {
    return Math.round(principal / termMonths);
  }
  const monthlyRate = annualInterestRate / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  if (factor === 1 || isNaN(factor) || !isFinite(factor)) {
    return Math.round(principal / termMonths);
  }
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  return Math.round(emi);
}

/**
 * Formats a number to Indian Rupee (INR) currency representation.
 * Example: 75000 -> ₹75,000
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  const isNegative = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toLocaleString('en-IN');
  return `${isNegative ? '-' : ''}₹${formatted}`;
}

/**
 * Main deterministic eligibility engine.
 * STRICT RULE: No demographic characteristics are accepted or used in this calculation.
 */
export function evaluateLoanEligibility(
  finances: FinancialDetails,
  loan: LoanDetails
): EligibilityCalculationResult {
  const grossMonthlyIncome = Math.max(0, finances.grossMonthlyIncome || 0);
  const existingMonthlyDebt = Math.max(0, finances.existingMonthlyDebt || 0);
  const monthlyHouseholdExpenses = Math.max(0, finances.monthlyHouseholdExpenses || 0);
  const liquidReserves = Math.max(0, finances.liquidReserves || 0);
  const stability = finances.incomeStability || 'Moderate';

  const requestedAmount = Math.max(0, loan.requestedAmount || 0);
  const termMonths = Math.max(1, loan.termMonths || 1);
  const annualInterestRate = Math.max(0, loan.annualInterestRate || 0);
  const creditScore = loan.applicantCreditScore;

  // 1. Existing DTI
  const existingDti = grossMonthlyIncome > 0
    ? (existingMonthlyDebt / grossMonthlyIncome) * 100
    : 100;

  // 2. Disposable Income Before New Loan
  const disposableIncome = grossMonthlyIncome - existingMonthlyDebt - monthlyHouseholdExpenses;

  // 3. Proposed EMI
  const proposedEmi = calculateEMI(requestedAmount, annualInterestRate, termMonths);

  // 4. Projected DTI
  const totalMonthlyDebtObligation = existingMonthlyDebt + proposedEmi;
  const projectedDti = grossMonthlyIncome > 0
    ? (totalMonthlyDebtObligation / grossMonthlyIncome) * 100
    : 100;

  // 5. Remaining Monthly Income Buffer
  const remainingMonthlyIncome = disposableIncome - proposedEmi;

  // 6. Score Breakdown Calculations (Transparent & Documented)
  // Factor 1: Projected DTI (Max 35 pts)
  let dtiPoints = 0;
  let dtiRationale = '';
  if (projectedDti <= 30) {
    dtiPoints = 35;
    dtiRationale = `Excellent: Projected DTI of ${projectedDti.toFixed(1)}% is comfortably under 30%.`;
  } else if (projectedDti <= 40) {
    dtiPoints = 28;
    dtiRationale = `Healthy: Projected DTI of ${projectedDti.toFixed(1)}% is within standard 40% threshold.`;
  } else if (projectedDti <= 50) {
    dtiPoints = 18;
    dtiRationale = `Moderate: Projected DTI of ${projectedDti.toFixed(1)}% approaches standard 50% ceiling.`;
  } else if (projectedDti <= 60) {
    dtiPoints = 8;
    dtiRationale = `High Risk: Projected DTI of ${projectedDti.toFixed(1)}% leaves little margin for volatility.`;
  } else {
    dtiPoints = 0;
    dtiRationale = `Critical: Projected DTI of ${projectedDti.toFixed(1)}% exceeds responsible lending limits (>60%).`;
  }

  const projectedDtiScore: ScoreComponent = {
    score: dtiPoints,
    maxScore: 35,
    weightPercent: 35,
    title: 'Projected Debt Burden (DTI)',
    rationale: dtiRationale,
  };

  // Factor 2: Repayment Capacity & Monthly Surplus (Max 30 pts)
  let repaymentPoints = 0;
  let repaymentRationale = '';
  const emiCoverageRatio = proposedEmi > 0 ? remainingMonthlyIncome / proposedEmi : 0;

  if (remainingMonthlyIncome <= 0) {
    repaymentPoints = 0;
    repaymentRationale = `Deficit: Post-loan expenses exceed income by ${formatINR(Math.abs(remainingMonthlyIncome))}.`;
  } else if (emiCoverageRatio >= 2.0) {
    repaymentPoints = 30;
    repaymentRationale = `Substantial Buffer: Remaining surplus (${formatINR(remainingMonthlyIncome)}) is over 2.0x the EMI.`;
  } else if (emiCoverageRatio >= 1.2) {
    repaymentPoints = 23;
    repaymentRationale = `Good Buffer: Remaining surplus (${formatINR(remainingMonthlyIncome)}) comfortably exceeds EMI.`;
  } else if (emiCoverageRatio >= 0.5) {
    repaymentPoints = 14;
    repaymentRationale = `Adequate: Remaining surplus (${formatINR(remainingMonthlyIncome)}) covers essential expenses.`;
  } else {
    repaymentPoints = 6;
    repaymentRationale = `Tight Buffer: Remaining surplus (${formatINR(remainingMonthlyIncome)}) is narrow for emergency absorption.`;
  }

  const repaymentCapacityScore: ScoreComponent = {
    score: repaymentPoints,
    maxScore: 30,
    weightPercent: 30,
    title: 'Disposable Income & Buffer',
    rationale: repaymentRationale,
  };

  // Factor 3: Income Stability (Max 15 pts)
  let stabilityPoints = 0;
  let stabilityRationale = '';
  switch (stability) {
    case 'Very Stable':
      stabilityPoints = 15;
      stabilityRationale = 'High stability: Established tenure or verified consistent revenue stream.';
      break;
    case 'Stable':
      stabilityPoints = 12;
      stabilityRationale = 'Good stability: Consistent monthly earnings history.';
      break;
    case 'Moderate':
      stabilityPoints = 8;
      stabilityRationale = 'Average stability: Regular income with minor seasonal fluctuations.';
      break;
    case 'Volatile':
      stabilityPoints = 3;
      stabilityRationale = 'Variable cash flow: Fluctuating income requires higher liquidity cushions.';
      break;
  }

  const incomeStabilityScore: ScoreComponent = {
    score: stabilityPoints,
    maxScore: 15,
    weightPercent: 15,
    title: 'Income Consistency & Stability',
    rationale: stabilityRationale,
  };

  // Factor 4: Optional Credit Score (Max 15 pts) - Normalized if missing!
  const hasCreditScore = typeof creditScore === 'number' && creditScore >= 300 && creditScore <= 900;
  let creditScorePoints = 0;
  let creditScoreRationale = '';

  if (hasCreditScore) {
    if (creditScore >= 750) {
      creditScorePoints = 15;
      creditScoreRationale = `Prime Credit (${creditScore}): Strong demonstration credit history.`;
    } else if (creditScore >= 700) {
      creditScorePoints = 12;
      creditScoreRationale = `Good Credit (${creditScore}): Solid track record with low historical default risk.`;
    } else if (creditScore >= 650) {
      creditScorePoints = 8;
      creditScoreRationale = `Fair Credit (${creditScore}): Moderate credit profile; acceptable with verification.`;
    } else {
      creditScorePoints = 3;
      creditScoreRationale = `Sub-prime Credit (${creditScore}): Past credit friction indicates elevated underwriting review.`;
    }
  } else {
    creditScorePoints = 0;
    creditScoreRationale = 'Optional field omitted. Score automatically normalized so applicant is not penalized.';
  }

  const creditScoreComponent: ScoreComponent = {
    score: creditScorePoints,
    maxScore: hasCreditScore ? 15 : 0,
    weightPercent: hasCreditScore ? 15 : 0,
    title: 'Credit Score Component (Optional)',
    rationale: creditScoreRationale,
    isNormalized: !hasCreditScore,
  };

  // Factor 5: Liquid Reserves Cushion (Max 5 pts)
  let reservesPoints = 0;
  let reservesRationale = '';
  const monthlyBurn = existingMonthlyDebt + monthlyHouseholdExpenses + proposedEmi;
  const reserveMonths = monthlyBurn > 0 ? liquidReserves / monthlyBurn : 0;

  if (reserveMonths >= 6) {
    reservesPoints = 5;
    reservesRationale = `Strong Reserves: ${reserveMonths.toFixed(1)} months of emergency cash buffer.`;
  } else if (reserveMonths >= 3) {
    reservesPoints = 3;
    reservesRationale = `Adequate Reserves: ${reserveMonths.toFixed(1)} months of living and debt expenses.`;
  } else if (liquidReserves > 0) {
    reservesPoints = 1;
    reservesRationale = `Partial Reserves: Modest emergency cushion of ${formatINR(liquidReserves)}.`;
  } else {
    reservesPoints = 0;
    reservesRationale = 'No liquid emergency reserves reported.';
  }

  const reservesScore: ScoreComponent = {
    score: reservesPoints,
    maxScore: 5,
    weightPercent: 5,
    title: 'Emergency Liquid Reserves',
    rationale: reservesRationale,
  };

  const scoreBreakdown: ScoreBreakdown = {
    projectedDtiScore,
    repaymentCapacityScore,
    incomeStabilityScore,
    creditScoreComponent,
    reservesScore,
  };

  // Calculate composite illustrative score out of 100
  let illustrativeScore = 0;
  if (hasCreditScore) {
    illustrativeScore = Math.min(
      100,
      Math.round(dtiPoints + repaymentPoints + stabilityPoints + creditScorePoints + reservesPoints)
    );
  } else {
    // Missing credit score normalization: Scale available 85 points to 100 points
    const availablePointsEarned = dtiPoints + repaymentPoints + stabilityPoints + reservesPoints;
    const maxAvailable = 35 + 30 + 15 + 5; // 85 points
    illustrativeScore = Math.min(100, Math.round((availablePointsEarned / maxAvailable) * 100));
  }

  // Determine Categorical Assessment
  let assessmentCategory: AssessmentCategory;

  if (grossMonthlyIncome <= 0 || remainingMonthlyIncome <= 0 || projectedDti > 60 || illustrativeScore < 50) {
    assessmentCategory = 'Indicatively Not Eligible';
  } else if (illustrativeScore >= 70 && projectedDti <= 50 && remainingMonthlyIncome >= proposedEmi * 0.35) {
    assessmentCategory = 'Indicatively Eligible';
  } else {
    assessmentCategory = 'Needs Further Review';
  }

  // Compile Positive Factors
  const positiveIndicators: string[] = [];
  if (projectedDti <= 40) {
    positiveIndicators.push(`Conservative projected debt burden (DTI: ${projectedDti.toFixed(1)}%)`);
  }
  if (remainingMonthlyIncome > proposedEmi * 1.5) {
    positiveIndicators.push(`Robust post-EMI surplus of ${formatINR(remainingMonthlyIncome)} per month`);
  }
  if (stability === 'Very Stable' || stability === 'Stable') {
    positiveIndicators.push(`Reliable employment/income consistency (${stability})`);
  }
  if (hasCreditScore && creditScore >= 700) {
    positiveIndicators.push(`Favorable demonstration credit score (${creditScore})`);
  }
  if (reserveMonths >= 3) {
    positiveIndicators.push(`Healthy liquid reserves (${reserveMonths.toFixed(1)} months of expenses)`);
  }
  if (positiveIndicators.length === 0 && grossMonthlyIncome > 0) {
    positiveIndicators.push('Documented regular income stream');
  }

  // Compile Risk Factors
  const riskFactors: string[] = [];
  if (projectedDti > 50) {
    riskFactors.push(`Elevated debt concentration (Projected DTI: ${projectedDti.toFixed(1)}%)`);
  }
  if (remainingMonthlyIncome <= 0) {
    riskFactors.push(`Monthly deficit: Living expenses and loan EMI exceed income by ${formatINR(Math.abs(remainingMonthlyIncome))}`);
  } else if (remainingMonthlyIncome < proposedEmi * 0.5) {
    riskFactors.push(`Narrow monthly safety buffer (${formatINR(remainingMonthlyIncome)}) leaves little room for unexpected expenses`);
  }
  if (stability === 'Volatile') {
    riskFactors.push('Volatile income profile presents seasonal cash-flow uncertainty');
  }
  if (hasCreditScore && creditScore < 650) {
    riskFactors.push(`Lower credit score tier (${creditScore}) suggests past debt servicing friction`);
  }
  if (liquidReserves <= 0) {
    riskFactors.push('Absence of emergency liquid reserves');
  }

  // Missing Information
  const missingInformation: string[] = [];
  if (!hasCreditScore) {
    missingInformation.push('Credit bureau score omitted (score normalized without penalty)');
  }
  if (liquidReserves <= 0) {
    missingInformation.push('Liquid savings or collateral documentation not specified');
  }

  // Primary Contributing Factors
  const primaryFactors: string[] = [
    `Projected DTI of ${projectedDti.toFixed(1)}% (Threshold: ≤50% for standard eligibility)`,
    `Monthly remaining buffer of ${formatINR(remainingMonthlyIncome)} after proposed EMI of ${formatINR(proposedEmi)}`,
    `Stability rating: ${stability} (${stabilityPoints}/15 pts)`,
  ];

  // Recommended Next Steps
  const recommendedNextSteps: string[] = [];
  if (assessmentCategory === 'Indicatively Eligible') {
    recommendedNextSteps.push('Prepare recent bank statements and income tax filings for formal underwriting.');
    recommendedNextSteps.push('Compare transparent APR offers across regulated banking institutions.');
    recommendedNextSteps.push('Set up automated repayment mandates to safeguard credit standing.');
  } else if (assessmentCategory === 'Needs Further Review') {
    recommendedNextSteps.push('Explore extending loan tenure or requesting a slightly lower principal amount to reduce the monthly EMI.');
    recommendedNextSteps.push('Consider consolidating or paying off smaller existing debts to lower your baseline DTI.');
    recommendedNextSteps.push('Provide evidence of additional co-borrower income or liquid deposits.');
  } else {
    recommendedNextSteps.push('Prioritize paying down existing high-interest revolving credit or personal loans.');
    recommendedNextSteps.push('Reassess total household expenses to rebuild positive monthly cash flow.');
    recommendedNextSteps.push('Allow 6-12 months of structured financial rebuilding before applying for major term financing.');
  }

  return {
    existingDti: Number(existingDti.toFixed(2)),
    disposableIncome: Math.round(disposableIncome),
    proposedEmi,
    projectedDti: Number(projectedDti.toFixed(2)),
    remainingMonthlyIncome: Math.round(remainingMonthlyIncome),
    illustrativeScore,
    scoreBreakdown,
    assessmentCategory,
    primaryFactors,
    positiveIndicators,
    riskFactors,
    missingInformation,
    recommendedNextSteps,
    disclaimer:
      'This assessment is an illustrative educational simulation produced by FairCredit AI. It does not constitute a legally binding credit decision, loan sanction, or credit bureau score. Actual lending institutions evaluate verified documentation, proprietary risk models, and regulatory credit bureau reports.',
    calculatedAt: new Date().toISOString(),
  };
}
