export type EmploymentType =
  | 'Salaried'
  | 'Self-employed'
  | 'Business Owner'
  | 'Contract'
  | 'Other';

export type IncomeStability = 'Very Stable' | 'Stable' | 'Moderate' | 'Volatile';

export type LoanType = 'Personal' | 'Education' | 'Home' | 'Business';

export type AssessmentCategory =
  | 'Indicatively Eligible'
  | 'Needs Further Review'
  | 'Indicatively Not Eligible';

export type GenderAudit = 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say';

export type LocationTierAudit = 'Tier 1 Urban' | 'Tier 2 Semi-urban' | 'Tier 3 Rural';

export type EducationLevelAudit =
  | 'High School'
  | 'Undergraduate'
  | 'Postgraduate'
  | 'Doctorate'
  | 'Other';

export type MaritalStatusAudit =
  | 'Single'
  | 'Married'
  | 'Divorced/Widowed'
  | 'Prefer not to say';

export interface ApplicantProfile {
  name: string;
  age: number;
  employmentType: EmploymentType;
  employmentDurationMonths: number;
  // Audit-only demographic attributes (strictly excluded from baseline eligibility scoring)
  gender?: GenderAudit;
  locationCategory?: LocationTierAudit;
  educationLevel?: EducationLevelAudit;
  maritalStatus?: MaritalStatusAudit;
}

export interface FinancialDetails {
  grossMonthlyIncome: number; // in INR
  existingMonthlyDebt: number; // in INR
  monthlyHouseholdExpenses: number; // in INR
  incomeStability: IncomeStability;
  liquidReserves?: number; // in INR
}

export interface LoanDetails {
  loanType: LoanType;
  requestedAmount: number; // in INR
  termMonths: number; // in months
  annualInterestRate: number; // % p.a. (demonstration illustrative value)
  applicantCreditScore?: number; // 300 to 900 (optional demonstration value)
}

export interface ScoreComponent {
  score: number;
  maxScore: number;
  weightPercent: number;
  title: string;
  rationale: string;
  isNormalized?: boolean;
}

export interface ScoreBreakdown {
  projectedDtiScore: ScoreComponent;
  repaymentCapacityScore: ScoreComponent;
  creditScoreComponent: ScoreComponent;
  incomeStabilityScore: ScoreComponent;
  reservesScore: ScoreComponent;
}

export interface EligibilityCalculationResult {
  existingDti: number; // %
  disposableIncome: number; // INR
  proposedEmi: number; // INR
  projectedDti: number; // %
  remainingMonthlyIncome: number; // INR
  illustrativeScore: number; // 0 - 100
  scoreBreakdown: ScoreBreakdown;
  assessmentCategory: AssessmentCategory;
  primaryFactors: string[];
  positiveIndicators: string[];
  riskFactors: string[];
  missingInformation: string[];
  recommendedNextSteps: string[];
  disclaimer: string;
  calculatedAt: string;
}

export interface GeminiExplanation {
  simpleExplanation: string;
  topContributingFactors: string[];
  positiveFinancialIndicators: string[];
  areasRequiringAttention: string[];
  practicalRecommendations: string[];
  indicativeReason: string;
  generatedAt?: string;
  isFallback?: boolean;
}

export interface ApplicationRecord {
  id: string;
  createdAt: string;
  applicant: ApplicantProfile;
  finances: FinancialDetails;
  loan: LoanDetails;
  result: EligibilityCalculationResult;
  aiExplanation?: GeminiExplanation;
  consentGiven: boolean;
  isSynthetic?: boolean;
}

export interface DemographicGroupMetric {
  groupName: string;
  totalCount: number;
  eligibleCount: number;
  reviewCount: number;
  notEligibleCount: number;
  eligibilityRate: number; // 0 to 100%
  reviewRate: number; // 0 to 100%
  notEligibleRate: number; // 0 to 100%
  avgScore: number;
  avgIncome: number;
  avgProjectedDti: number;
  missingDataCount: number;
}

export type FairnessDimension = 'gender' | 'ageBand' | 'locationCategory';

export interface FairnessAuditReport {
  dimension: FairnessDimension;
  dimensionLabel: string;
  groups: DemographicGroupMetric[];
  benchmarkGroup: string;
  comparisonGroup: string;
  selectionRateDifference: number; // Group A% - Group B%
  selectionRateRatio: number; // Group B% / Group A% (Four-Fifths Rule format)
  demographicParityStatus: 'Compliant' | 'Watchlist' | 'Potential Disparity';
  monitoringStatus:
    | 'No major disparity detected in this sample'
    | 'Potential disparity — investigate'
    | 'Insufficient data for reliable comparison';
  sampleSufficiency: 'Sufficient' | 'Low Sample Warning' | 'Insufficient';
  thresholdUsed: number;
  actionableInsights: string[];
}

export interface CounterfactualTestResult {
  profileA: {
    applicant: ApplicantProfile;
    finances: FinancialDetails;
    loan: LoanDetails;
    result: EligibilityCalculationResult;
  };
  profileB: {
    applicant: ApplicantProfile;
    finances: FinancialDetails;
    loan: LoanDetails;
    result: EligibilityCalculationResult;
  };
  changedAttribute: string;
  valueA: string;
  valueB: string;
  scoreDifference: number;
  categoryMatches: boolean;
  isStrictlyConsistent: boolean;
  technicalExplanation: string;
}
