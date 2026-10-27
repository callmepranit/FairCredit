import { ApplicationRecord, FairnessAuditReport, DemographicGroupMetric, FairnessDimension } from '../types';

/**
 * Group applications into age bands for demographic parity auditing.
 */
function getAgeBand(age: number): string {
  if (age < 26) return '18–25 years (Early Career)';
  if (age <= 35) return '26–35 years (Prime Growth)';
  if (age <= 48) return '36–48 years (Mid Career)';
  return '49+ years (Senior / Established)';
}

/**
 * Audits a population of loan applications across a demographic dimension.
 * Implements Selection Rate Difference, Selection Rate Ratio (Four-Fifths Rule),
 * and sample sufficiency validation.
 */
export function auditDemographicDisparities(
  applications: ApplicationRecord[],
  dimension: FairnessDimension,
  disparityThresholdPercent: number = 15 // Default 15% threshold for difference
): FairnessAuditReport {
  let dimensionLabel = 'Gender';
  if (dimension === 'ageBand') dimensionLabel = 'Age Band';
  if (dimension === 'locationCategory') dimensionLabel = 'Location Tier';

  // Group applications by selected demographic dimension
  const groupsMap = new Map<string, ApplicationRecord[]>();

  applications.forEach((app) => {
    let groupKey = 'Unknown / Unspecified';
    if (dimension === 'gender') {
      groupKey = app.applicant.gender || 'Prefer not to say';
    } else if (dimension === 'ageBand') {
      groupKey = getAgeBand(app.applicant.age);
    } else if (dimension === 'locationCategory') {
      groupKey = app.applicant.locationCategory || 'Tier 2 Semi-urban';
    }

    if (!groupsMap.has(groupKey)) {
      groupsMap.set(groupKey, []);
    }
    groupsMap.get(groupKey)!.push(app);
  });

  const groupMetrics: DemographicGroupMetric[] = [];

  groupsMap.forEach((apps, groupName) => {
    const totalCount = apps.length;
    const eligibleCount = apps.filter((a) => a.result.assessmentCategory === 'Indicatively Eligible').length;
    const reviewCount = apps.filter((a) => a.result.assessmentCategory === 'Needs Further Review').length;
    const notEligibleCount = apps.filter((a) => a.result.assessmentCategory === 'Indicatively Not Eligible').length;
    const missingCreditCount = apps.filter((a) => a.loan.applicantCreditScore === undefined).length;

    const eligibilityRate = totalCount > 0 ? (eligibleCount / totalCount) * 100 : 0;
    const reviewRate = totalCount > 0 ? (reviewCount / totalCount) * 100 : 0;
    const notEligibleRate = totalCount > 0 ? (notEligibleCount / totalCount) * 100 : 0;

    const totalScore = apps.reduce((sum, a) => sum + a.result.illustrativeScore, 0);
    const totalIncome = apps.reduce((sum, a) => sum + a.finances.grossMonthlyIncome, 0);
    const totalProjectedDti = apps.reduce((sum, a) => sum + a.result.projectedDti, 0);

    groupMetrics.push({
      groupName,
      totalCount,
      eligibleCount,
      reviewCount,
      notEligibleCount,
      eligibilityRate: Number(eligibilityRate.toFixed(1)),
      reviewRate: Number(reviewRate.toFixed(1)),
      notEligibleRate: Number(notEligibleRate.toFixed(1)),
      avgScore: Math.round(totalCount > 0 ? totalScore / totalCount : 0),
      avgIncome: Math.round(totalCount > 0 ? totalIncome / totalCount : 0),
      avgProjectedDti: Number((totalCount > 0 ? totalProjectedDti / totalCount : 0).toFixed(1)),
      missingDataCount: missingCreditCount,
    });
  });

  // Sort groups by sample size descending
  groupMetrics.sort((a, b) => b.totalCount - a.totalCount);

  // Identify benchmark (highest selection rate or largest group) and comparison groups
  const validGroups = groupMetrics.filter((g) => g.totalCount >= 2);

  let benchmarkGroup = 'Benchmark Group';
  let comparisonGroup = 'Comparison Group';
  let selectionRateDifference = 0;
  let selectionRateRatio = 1.0;

  if (validGroups.length >= 2) {
    // Sort by eligibility rate to compare highest vs lowest valid group
    const byRate = [...validGroups].sort((a, b) => b.eligibilityRate - a.eligibilityRate);
    const highest = byRate[0];
    const lowest = byRate[byRate.length - 1];

    benchmarkGroup = highest.groupName;
    comparisonGroup = lowest.groupName;
    selectionRateDifference = Number((highest.eligibilityRate - lowest.eligibilityRate).toFixed(1));

    if (highest.eligibilityRate > 0) {
      selectionRateRatio = Number((lowest.eligibilityRate / highest.eligibilityRate).toFixed(2));
    } else {
      selectionRateRatio = 1.0;
    }
  }

  // Sample sufficiency check
  const minSampleSize = 4;
  const hasSmallGroups = groupMetrics.some((g) => g.totalCount < minSampleSize);
  let sampleSufficiency: 'Sufficient' | 'Low Sample Warning' | 'Insufficient' = 'Sufficient';

  if (applications.length < 10 || validGroups.length < 2) {
    sampleSufficiency = 'Insufficient';
  } else if (hasSmallGroups || applications.length < 25) {
    sampleSufficiency = 'Low Sample Warning';
  }

  // Monitoring Status determination
  let monitoringStatus:
    | 'No major disparity detected in this sample'
    | 'Potential disparity — investigate'
    | 'Insufficient data for reliable comparison';

  let demographicParityStatus: 'Compliant' | 'Watchlist' | 'Potential Disparity';

  if (sampleSufficiency === 'Insufficient') {
    monitoringStatus = 'Insufficient data for reliable comparison';
    demographicParityStatus = 'Watchlist';
  } else if (selectionRateRatio < 0.80 || selectionRateDifference > disparityThresholdPercent) {
    monitoringStatus = 'Potential disparity — investigate';
    demographicParityStatus = 'Potential Disparity';
  } else {
    monitoringStatus = 'No major disparity detected in this sample';
    demographicParityStatus = 'Compliant';
  }

  // Generate grounded recommendations
  const actionableInsights: string[] = [];

  if (sampleSufficiency !== 'Sufficient') {
    actionableInsights.push(
      `Dataset has small subgroup samples (e.g. groups under ${minSampleSize} records). Collect more representative synthetic data before drawing audit conclusions.`
    );
  }

  if (selectionRateRatio < 0.80) {
    actionableInsights.push(
      `Selection rate ratio between '${comparisonGroup}' (${groupMetrics.find(g => g.groupName === comparisonGroup)?.eligibilityRate}%) and '${benchmarkGroup}' (${groupMetrics.find(g => g.groupName === benchmarkGroup)?.eligibilityRate}%) is ${(selectionRateRatio * 100).toFixed(0)}%, falling below the 80% (4/5ths) disparate impact standard.`
    );
    actionableInsights.push(
      'Investigate whether financial correlates (such as average income, requested loan ticket sizes, or existing debt obligations) explain the group difference.'
    );
  } else {
    actionableInsights.push(
      `Selection rate ratio is ${(selectionRateRatio * 100).toFixed(0)}%, comfortably satisfying the 80% four-fifths rule benchmark.`
    );
  }

  const missingRates = groupMetrics.filter((g) => g.missingDataCount > 0);
  if (missingRates.length > 0) {
    actionableInsights.push(
      'Ensure missing optional credit score normalization functions consistently across all sub-groups without disparate friction.'
    );
  }

  actionableInsights.push(
    'Always conduct human-in-the-loop review on borderline assessments rather than relying solely on automated thresholds.'
  );

  return {
    dimension,
    dimensionLabel,
    groups: groupMetrics,
    benchmarkGroup,
    comparisonGroup,
    selectionRateDifference,
    selectionRateRatio,
    demographicParityStatus,
    monitoringStatus,
    sampleSufficiency,
    thresholdUsed: disparityThresholdPercent,
    actionableInsights,
  };
}
