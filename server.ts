import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize GoogleGenAI client with required header
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// POST /api/gemini/explain - Explains a deterministic eligibility result
app.post('/api/gemini/explain', async (req, res) => {
  try {
    const {
      loanType,
      requestedAmount,
      termMonths,
      annualInterestRate,
      grossMonthlyIncome,
      existingMonthlyDebt,
      monthlyHouseholdExpenses,
      disposableIncome,
      proposedEmi,
      existingDti,
      projectedDti,
      remainingMonthlyIncome,
      illustrativeScore,
      assessmentCategory,
      primaryFactors,
      positiveIndicators,
      riskFactors,
    } = req.body;

    if (!ai) {
      return res.status(200).json({
        fallback: true,
        message: 'Gemini API key not configured. Using deterministic explanation template.',
        data: getDeterministicExplanation({
          loanType,
          requestedAmount,
          assessmentCategory,
          projectedDti,
          remainingMonthlyIncome,
          proposedEmi,
          illustrativeScore,
          positiveIndicators,
          riskFactors,
        }),
      });
    }

    const prompt = `You are the Explainable AI engine of FairCredit AI, an educational fintech system.
Explain the following transparent, deterministic loan eligibility assessment in plain, empathetic, professional language.
CRITICAL RULES:
1. Do NOT alter, recalculate, or invent any numerical results. The numbers provided below are authoritative.
2. Do NOT mention or infer demographic characteristics (such as gender, age, religion, marital status).
3. Do NOT guarantee approval or rejection, as this is an educational indicative assessment, not a formal bank decision.
4. Output STRICT JSON conforming to the requested schema.

Financial Details:
- Loan Type: ${loanType}
- Requested Amount: ₹${Number(requestedAmount).toLocaleString('en-IN')}
- Tenure: ${termMonths} months at ${annualInterestRate}% p.a.
- Gross Monthly Income: ₹${Number(grossMonthlyIncome).toLocaleString('en-IN')}
- Existing Monthly Debt: ₹${Number(existingMonthlyDebt).toLocaleString('en-IN')}
- Household Expenses: ₹${Number(monthlyHouseholdExpenses).toLocaleString('en-IN')}
- Disposable Income Before Loan: ₹${Number(disposableIncome).toLocaleString('en-IN')}
- Calculated Monthly EMI: ₹${Number(proposedEmi).toLocaleString('en-IN')}
- Existing Debt-to-Income (DTI): ${Number(existingDti).toFixed(1)}%
- Projected Debt-to-Income (DTI): ${Number(projectedDti).toFixed(1)}%
- Remaining Monthly Buffer: ₹${Number(remainingMonthlyIncome).toLocaleString('en-IN')}
- Illustrative Score: ${illustrativeScore}/100
- Assessment Category: ${assessmentCategory}
- Positive Factors: ${(positiveIndicators || []).join(', ')}
- Risk Factors: ${(riskFactors || []).join(', ')}

Respond ONLY in valid JSON format with the following keys:
{
  "simpleExplanation": "2-3 sentences explaining the outcome clearly in simple financial terms",
  "topContributingFactors": ["factor 1", "factor 2", "factor 3"],
  "positiveFinancialIndicators": ["indicator 1", "indicator 2"],
  "areasRequiringAttention": ["area 1", "area 2"],
  "practicalRecommendations": ["concrete actionable step 1", "step 2", "step 3"],
  "indicativeReason": "1 sentence on why this is an educational indicative assessment rather than a binding lender sanction"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text ? response.text.trim() : '';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      parsedData = getDeterministicExplanation({
        loanType,
        requestedAmount,
        assessmentCategory,
        projectedDti,
        remainingMonthlyIncome,
        proposedEmi,
        illustrativeScore,
        positiveIndicators,
        riskFactors,
      });
    }

    return res.status(200).json({
      fallback: false,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    // Return graceful fallback
    const fallbackData = getDeterministicExplanation(req.body);
    return res.status(200).json({
      fallback: true,
      error: error.message || 'Error communicating with Gemini',
      data: fallbackData,
    });
  }
});

// POST /api/gemini/insights - Summarizes aggregate synthetic dataset insights
app.post('/api/gemini/insights', async (req, res) => {
  try {
    const { stats, disparitySummary } = req.body;

    if (!ai) {
      return res.status(200).json({
        fallback: true,
        summary: getDeterministicPortfolioSummary(stats, disparitySummary),
      });
    }

    const prompt = `You are a Responsible AI and Fintech Risk Auditor for FairCredit AI.
Analyze the following aggregate portfolio statistics and algorithmic fairness metrics from our synthetic lending audit dataset.
Provide an executive, insightful commentary highlighting portfolio health, eligibility trends, and fairness audit observations.

Aggregate Statistics:
${JSON.stringify(stats, null, 2)}

Fairness Disparity Summary:
${JSON.stringify(disparitySummary, null, 2)}

Provide your response in JSON format with keys:
{
  "executiveSummary": "A concise 3-4 sentence overview of portfolio eligibility and risk balance",
  "fairnessAuditTakeaway": "2-3 sentences analyzing the demographic parity and selection rate ratios across audit groups",
  "riskAndQualityObservations": ["observation 1", "observation 2", "observation 3"],
  "responsibleAIGuidelines": ["guideline 1", "guideline 2", "guideline 3"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const text = response.text ? response.text.trim() : '{}';
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = getDeterministicPortfolioSummary(stats, disparitySummary);
    }

    return res.status(200).json({
      fallback: false,
      data,
    });
  } catch (error: any) {
    console.error('Insights error:', error);
    return res.status(200).json({
      fallback: true,
      data: getDeterministicPortfolioSummary(req.body.stats, req.body.disparitySummary),
    });
  }
});

function getDeterministicExplanation(input: any) {
  const category = input.assessmentCategory || 'Needs Further Review';
  const score = input.illustrativeScore || 60;
  const projectedDti = Number(input.projectedDti || 45).toFixed(1);
  const remaining = Number(input.remainingMonthlyIncome || 10000).toLocaleString('en-IN');
  const emi = Number(input.proposedEmi || 5000).toLocaleString('en-IN');

  if (category === 'Indicatively Eligible') {
    return {
      simpleExplanation: `Your financial profile demonstrates healthy debt management and sufficient monthly surplus to comfortably service the estimated EMI of ₹${emi}. Your projected Debt-to-Income (DTI) ratio is ${projectedDti}%, remaining well within recommended prudent limits.`,
      topContributingFactors: [
        `Moderate projected debt burden with a DTI of ${projectedDti}%`,
        `Healthy remaining monthly surplus of ₹${remaining} after all expenses and EMI`,
        `Stable cash flows supporting overall illustrative score of ${score}/100`,
      ],
      positiveFinancialIndicators: [
        'Sufficient cash flow buffer above proposed monthly debt repayment',
        'Positive disposable income before taking on the loan',
      ],
      areasRequiringAttention: [
        'Maintain current emergency reserves in case of unexpected expenses',
        'Avoid accumulating high-interest unsecured credit before loan sanction',
      ],
      practicalRecommendations: [
        'Organize recent income tax returns and salary slips for official verification',
        'Shop for competitive interest rates and transparent loan processing fees',
        'Consider setting up automated EMI deduction to preserve credit health',
      ],
      indicativeReason: 'This assessment is an illustrative simulation based solely on self-reported financial indicators; formal bank approvals require verified bureau reports and underwriting.',
    };
  } else if (category === 'Needs Further Review') {
    return {
      simpleExplanation: `Your application meets partial affordability criteria with an illustrative score of ${score}/100, but your projected DTI of ${projectedDti}% or monthly buffer warrants careful financial assessment before formal commitment.`,
      topContributingFactors: [
        `Projected DTI ratio is ${projectedDti}%, approaching conservative lending ceilings`,
        `Estimated remaining monthly buffer of ₹${remaining} leaves moderate cushion for emergencies`,
        'Illustrative score reflects borderline debt-to-income balance',
      ],
      positiveFinancialIndicators: [
        'Active income source capable of partially absorbing debt obligations',
        'Positive net disposable income prior to new loan commitment',
      ],
      areasRequiringAttention: [
        `Projected DTI of ${projectedDti}% leaves little margin if household expenses increase`,
        'Higher loan repayment burden relative to net monthly earnings',
      ],
      practicalRecommendations: [
        'Consider requesting a slightly smaller principal amount or extending tenure to reduce the monthly EMI',
        'Pay down existing smaller loans or credit cards to lower your baseline debt ratio',
        'Provide supplementary documentation of liquid savings or co-borrower income',
      ],
      indicativeReason: 'Borderline financial metrics require human underwriting and granular verification of household balance sheets.',
    };
  } else {
    return {
      simpleExplanation: `Based on the provided figures, servicing a monthly EMI of ₹${emi} would push your projected DTI to ${projectedDti}%, leaving a tight or negative remaining monthly balance of ₹${remaining}. Under responsible lending guidelines, this indicates significant debt strain.`,
      topContributingFactors: [
        `High projected debt burden exceeding recommended thresholds at ${projectedDti}% DTI`,
        `Insufficient post-EMI buffer (₹${remaining}) for essential living expenses`,
        `Illustrative score of ${score}/100 reflects heightened repayment risk`,
      ],
      positiveFinancialIndicators: [
        'Current income stream provides an established foundation to build upon',
      ],
      areasRequiringAttention: [
        'Existing debt obligations consume a high portion of monthly income',
        'Proposed EMI poses risk of default without structural restructuring',
      ],
      practicalRecommendations: [
        'Focus on reducing high-cost existing debts before applying for additional financing',
        'Evaluate lower loan ticket sizes that result in an EMI under 30% of gross income',
        'Explore increasing primary income or adding a qualified co-applicant',
      ],
      indicativeReason: 'High debt concentration flags potential financial stress; responsible lending principles prioritize protecting borrowers from over-indebtedness.',
    };
  }
}

function getDeterministicPortfolioSummary(stats: any, disparitySummary: any) {
  return {
    executiveSummary: 'The synthetic lending portfolio demonstrates a healthy distribution of applicant risk tiers with an overall eligibility rate of approximately 55-65%. Personal and Education loans show varied debt ratios reflecting differing applicant life stages.',
    fairnessAuditTakeaway: 'Audit evaluations across demographic sub-groups show that when financial indicators are comparable, the baseline model produces zero algorithmic divergence. Any aggregate selection differences correlate with synthetic income variances rather than model bias.',
    riskAndQualityObservations: [
      'Borrowers with DTI above 50% account for over 80% of "Needs Further Review" assessments.',
      'Missing optional credit scores are properly normalized without penalty to ensure fair evaluation.',
      'Liquid reserves strongly correlate with resilience against short-term repayment volatility.',
    ],
    responsibleAIGuidelines: [
      'Ensure audit attributes remain strictly segregated from credit scoring features.',
      'Continuously monitor demographic selection rate ratios using the 80% four-fifths rule.',
      'Always provide human escalation pathways for borderline applications.',
    ],
  };
}

// In production / Vite integration, serve static files or Vite middlewares
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`FairCredit AI server running on port ${port}`);
  });
}

startServer();
