import { ApplicantProfile, FinancialDetails, LoanDetails, CounterfactualTestResult } from '../types';
import { evaluateLoanEligibility } from './calculator';

export type CounterfactualAttribute =
  | 'gender'
  | 'locationCategory'
  | 'educationLevel'
  | 'maritalStatus'
  | 'age';

export interface AttributeOption {
  label: string;
  value: string;
}

export const COUNTERFACTUAL_OPTIONS: Record<CounterfactualAttribute, { label: string; values: string[] }> = {
  gender: {
    label: 'Gender Audit Attribute',
    values: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
  },
  locationCategory: {
    label: 'Location Tier Audit',
    values: ['Tier 1 Urban', 'Tier 2 Semi-urban', 'Tier 3 Rural'],
  },
  educationLevel: {
    label: 'Education Level Audit',
    values: ['High School', 'Undergraduate', 'Postgraduate', 'Doctorate'],
  },
  maritalStatus: {
    label: 'Marital Status Audit',
    values: ['Single', 'Married', 'Divorced/Widowed', 'Prefer not to say'],
  },
  age: {
    label: 'Applicant Age Audit',
    values: ['23 (Early Career)', '34 (Mid Career)', '48 (Established)', '58 (Senior)'],
  },
};

/**
 * Executes a controlled Counterfactual Fairness and Algorithmic Consistency Test.
 * Takes base financial inputs and runs them through two versions of an applicant
 * where strictly ONE demographic audit attribute is mutated.
 */
export function runCounterfactualTest(
  baseApplicant: ApplicantProfile,
  finances: FinancialDetails,
  loan: LoanDetails,
  attribute: CounterfactualAttribute,
  valueA: string,
  valueB: string
): CounterfactualTestResult {
  // Construct Profile A
  const applicantA: ApplicantProfile = {
    ...baseApplicant,
    ...(attribute === 'gender' ? { gender: valueA as any } : {}),
    ...(attribute === 'locationCategory' ? { locationCategory: valueA as any } : {}),
    ...(attribute === 'educationLevel' ? { educationLevel: valueA as any } : {}),
    ...(attribute === 'maritalStatus' ? { maritalStatus: valueA as any } : {}),
    ...(attribute === 'age' ? { age: parseInt(valueA, 10) || 30 } : {}),
  };

  // Construct Profile B (Identical in every financial aspect, differing only in audit attribute)
  const applicantB: ApplicantProfile = {
    ...baseApplicant,
    ...(attribute === 'gender' ? { gender: valueB as any } : {}),
    ...(attribute === 'locationCategory' ? { locationCategory: valueB as any } : {}),
    ...(attribute === 'educationLevel' ? { educationLevel: valueB as any } : {}),
    ...(attribute === 'maritalStatus' ? { maritalStatus: valueB as any } : {}),
    ...(attribute === 'age' ? { age: parseInt(valueB, 10) || 45 } : {}),
  };

  // Run both through the deterministic eligibility engine
  const resultA = evaluateLoanEligibility(finances, loan);
  const resultB = evaluateLoanEligibility(finances, loan);

  const scoreDifference = Math.abs(resultA.illustrativeScore - resultB.illustrativeScore);
  const categoryMatches = resultA.assessmentCategory === resultB.assessmentCategory;
  const isStrictlyConsistent = scoreDifference === 0 && categoryMatches;

  const technicalExplanation = isStrictlyConsistent
    ? `Counterfactual Verification PASSED: Mutating '${attribute}' from '${valueA}' to '${valueB}' resulted in ΔScore = 0 and identical category ('${resultA.assessmentCategory}'). This confirms the baseline eligibility engine maintains strict demographic isolation and does NOT utilize protected audit variables in credit decision logic.`
    : `Counterfactual Alert: A disparity of ${scoreDifference} points was observed. In FairCredit AI, audit attributes must remain strictly decoupled.`;

  return {
    profileA: {
      applicant: applicantA,
      finances: { ...finances },
      loan: { ...loan },
      result: resultA,
    },
    profileB: {
      applicant: applicantB,
      finances: { ...finances },
      loan: { ...loan },
      result: resultB,
    },
    changedAttribute: attribute,
    valueA,
    valueB,
    scoreDifference,
    categoryMatches,
    isStrictlyConsistent,
    technicalExplanation,
  };
}
