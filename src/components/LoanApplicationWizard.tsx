import React, { useState } from 'react';
import {
  User,
  Wallet,
  Building,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Percent,
  Calendar,
  Lock,
} from 'lucide-react';
import {
  ApplicantProfile,
  FinancialDetails,
  LoanDetails,
  EmploymentType,
  IncomeStability,
  LoanType,
  GenderAudit,
  LocationTierAudit,
  EducationLevelAudit,
  MaritalStatusAudit,
} from '../types';
import { calculateEMI, formatINR } from '../utils/calculator';

interface LoanApplicationWizardProps {
  onSubmitApplication: (
    applicant: ApplicantProfile,
    finances: FinancialDetails,
    loan: LoanDetails
  ) => void;
  isAnalyzing: boolean;
}

export const LoanApplicationWizard: React.FC<LoanApplicationWizardProps> = ({
  onSubmitApplication,
  isAnalyzing,
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Form States
  // Step 1: Applicant Profile
  const [name, setName] = useState('Ananya Sharma');
  const [age, setAge] = useState<number>(29);
  const [employmentType, setEmploymentType] = useState<EmploymentType>('Salaried');
  const [employmentDurationMonths, setEmploymentDurationMonths] = useState<number>(48);
  const [gender, setGender] = useState<GenderAudit>('Female');
  const [locationCategory, setLocationCategory] = useState<LocationTierAudit>('Tier 1 Urban');
  const [educationLevel, setEducationLevel] = useState<EducationLevelAudit>('Postgraduate');
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatusAudit>('Single');

  // Step 2: Financial Details
  const [grossMonthlyIncome, setGrossMonthlyIncome] = useState<number>(125000);
  const [existingMonthlyDebt, setExistingMonthlyDebt] = useState<number>(12000);
  const [monthlyHouseholdExpenses, setMonthlyHouseholdExpenses] = useState<number>(35000);
  const [incomeStability, setIncomeStability] = useState<IncomeStability>('Very Stable');
  const [liquidReserves, setLiquidReserves] = useState<number>(450000);

  // Step 3: Loan Details
  const [loanType, setLoanType] = useState<LoanType>('Personal');
  const [requestedAmount, setRequestedAmount] = useState<number>(500000);
  const [termMonths, setTermMonths] = useState<number>(36);
  const [annualInterestRate, setAnnualInterestRate] = useState<number>(11.5);
  const [applicantCreditScore, setApplicantCreditScore] = useState<string>('765'); // string to allow empty

  // Step 4: Consent
  const [consentGiven, setConsentGiven] = useState(false);

  // Validation States
  const [stepErrors, setStepErrors] = useState<string[]>([]);

  // Live Calculations for instant feedback
  const existingDti =
    grossMonthlyIncome > 0
      ? ((existingMonthlyDebt / grossMonthlyIncome) * 100).toFixed(1)
      : '0.0';
  const disposableIncome =
    grossMonthlyIncome - existingMonthlyDebt - monthlyHouseholdExpenses;
  const liveEmi = calculateEMI(requestedAmount, annualInterestRate, termMonths);
  const liveRemaining = disposableIncome - liveEmi;
  const liveProjectedDti =
    grossMonthlyIncome > 0
      ? (((existingMonthlyDebt + liveEmi) / grossMonthlyIncome) * 100).toFixed(1)
      : '0.0';

  // Demo Profile Loaders
  const loadDemoProfile = (type: 'prime' | 'borderline' | 'early_career') => {
    if (type === 'prime') {
      setName('Aarav Mehta');
      setAge(34);
      setEmploymentType('Salaried');
      setEmploymentDurationMonths(72);
      setGender('Male');
      setLocationCategory('Tier 1 Urban');
      setEducationLevel('Postgraduate');
      setMaritalStatus('Married');
      setGrossMonthlyIncome(190000);
      setExistingMonthlyDebt(15000);
      setMonthlyHouseholdExpenses(50000);
      setIncomeStability('Very Stable');
      setLiquidReserves(900000);
      setLoanType('Home');
      setRequestedAmount(4200000);
      setTermMonths(240);
      setAnnualInterestRate(8.5);
      setApplicantCreditScore('790');
    } else if (type === 'borderline') {
      setName('Sunita Rao');
      setAge(42);
      setEmploymentType('Business Owner');
      setEmploymentDurationMonths(60);
      setGender('Female');
      setLocationCategory('Tier 2 Semi-urban');
      setEducationLevel('Undergraduate');
      setMaritalStatus('Married');
      setGrossMonthlyIncome(85000);
      setExistingMonthlyDebt(25000);
      setMonthlyHouseholdExpenses(35000);
      setIncomeStability('Moderate');
      setLiquidReserves(120000);
      setLoanType('Business');
      setRequestedAmount(750000);
      setTermMonths(48);
      setAnnualInterestRate(13.0);
      setApplicantCreditScore('680');
    } else {
      setName('Rohan Nair');
      setAge(23);
      setEmploymentType('Salaried');
      setEmploymentDurationMonths(12);
      setGender('Male');
      setLocationCategory('Tier 3 Rural');
      setEducationLevel('Undergraduate');
      setMaritalStatus('Single');
      setGrossMonthlyIncome(42000);
      setExistingMonthlyDebt(3000);
      setMonthlyHouseholdExpenses(16000);
      setIncomeStability('Stable');
      setLiquidReserves(50000);
      setLoanType('Education');
      setRequestedAmount(300000);
      setTermMonths(60);
      setAnnualInterestRate(9.0);
      setApplicantCreditScore(''); // Missing score test!
    }
    setStepErrors([]);
  };

  const handleResetForm = () => {
    setName('');
    setAge(25);
    setEmploymentType('Salaried');
    setEmploymentDurationMonths(12);
    setGender('Prefer not to say');
    setLocationCategory('Tier 1 Urban');
    setEducationLevel('Undergraduate');
    setMaritalStatus('Single');
    setGrossMonthlyIncome(50000);
    setExistingMonthlyDebt(0);
    setMonthlyHouseholdExpenses(20000);
    setIncomeStability('Stable');
    setLiquidReserves(50000);
    setLoanType('Personal');
    setRequestedAmount(200000);
    setTermMonths(24);
    setAnnualInterestRate(11.5);
    setApplicantCreditScore('');
    setConsentGiven(false);
    setCurrentStep(1);
    setStepErrors([]);
  };

  const validateStep = (step: number): boolean => {
    const errors: string[] = [];

    if (step === 1) {
      if (!name.trim()) errors.push('Applicant name or demo label is required.');
      if (isNaN(age) || age < 18 || age > 99)
        errors.push('Applicant age must be between 18 and 99 years.');
      if (isNaN(employmentDurationMonths) || employmentDurationMonths < 0)
        errors.push('Employment duration cannot be negative.');
    } else if (step === 2) {
      if (isNaN(grossMonthlyIncome) || grossMonthlyIncome <= 0)
        errors.push('Gross monthly income must be greater than ₹0.');
      if (isNaN(existingMonthlyDebt) || existingMonthlyDebt < 0)
        errors.push('Existing monthly debt cannot be negative.');
      if (isNaN(monthlyHouseholdExpenses) || monthlyHouseholdExpenses < 0)
        errors.push('Monthly household expenses cannot be negative.');
      if (isNaN(liquidReserves) || liquidReserves < 0)
        errors.push('Liquid reserves cannot be negative.');
    } else if (step === 3) {
      if (isNaN(requestedAmount) || requestedAmount <= 0)
        errors.push('Requested loan amount must be greater than ₹0.');
      if (isNaN(termMonths) || termMonths < 1 || termMonths > 360)
        errors.push('Tenure must be between 1 and 360 months.');
      if (isNaN(annualInterestRate) || annualInterestRate < 0)
        errors.push('Interest rate cannot be negative.');
      if (applicantCreditScore !== '') {
        const score = parseInt(applicantCreditScore, 10);
        if (isNaN(score) || score < 300 || score > 900) {
          errors.push('Optional credit score must be between 300 and 900.');
        }
      }
    }

    setStepErrors(errors);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setStepErrors([]);
      setCurrentStep((s) => Math.min(4, s + 1));
    }
  };

  const handleBack = () => {
    setStepErrors([]);
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentGiven) {
      setStepErrors(['Please review the privacy information and check the consent box to proceed.']);
      return;
    }
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    const applicantProfile: ApplicantProfile = {
      name: name.trim(),
      age: Number(age),
      employmentType,
      employmentDurationMonths: Number(employmentDurationMonths),
      gender,
      locationCategory,
      educationLevel,
      maritalStatus,
    };

    const financialDetails: FinancialDetails = {
      grossMonthlyIncome: Number(grossMonthlyIncome),
      existingMonthlyDebt: Number(existingMonthlyDebt),
      monthlyHouseholdExpenses: Number(monthlyHouseholdExpenses),
      incomeStability,
      liquidReserves: Number(liquidReserves),
    };

    const parsedCredit =
      applicantCreditScore.trim() !== '' ? parseInt(applicantCreditScore, 10) : undefined;

    const loanDetails: LoanDetails = {
      loanType,
      requestedAmount: Number(requestedAmount),
      termMonths: Number(termMonths),
      annualInterestRate: Number(annualInterestRate),
      applicantCreditScore: parsedCredit,
    };

    onSubmitApplication(applicantProfile, financialDetails, loanDetails);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header and Preset Switcher */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Check Loan Eligibility</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            4-Step transparent financial assessment with demographic isolation and Gemini AI explanation.
          </p>
        </div>

        {/* Demo Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">Load Demo Preset:</span>
          <button
            type="button"
            onClick={() => loadDemoProfile('prime')}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
          >
            Prime Salaried
          </button>
          <button
            type="button"
            onClick={() => loadDemoProfile('borderline')}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
          >
            Borderline Business
          </button>
          <button
            type="button"
            onClick={() => loadDemoProfile('early_career')}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors"
          >
            Early Career (No Credit Score)
          </button>
        </div>
      </div>

      {/* Step Progress Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-4 gap-2">
          {[
            { num: 1, label: 'Applicant Profile', icon: User },
            { num: 2, label: 'Financials', icon: Wallet },
            { num: 3, label: 'Loan Details', icon: Building },
            { num: 4, label: 'Review & Consent', icon: CheckCircle2 },
          ].map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.num;
            const isActive = currentStep === step.num;
            return (
              <div
                key={step.num}
                onClick={() => {
                  if (step.num < currentStep || validateStep(currentStep)) {
                    setCurrentStep(step.num);
                  }
                }}
                className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white font-bold'
                    : isCompleted
                    ? 'bg-teal-50 text-teal-800'
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isActive
                      ? 'bg-teal-500 text-slate-950'
                      : isCompleted
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? '✓' : step.num}
                </div>
                <div className="hidden sm:block truncate text-xs">
                  <div>{step.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Message Box */}
      {stepErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Please correct the following:</div>
            <ul className="list-disc pl-4 space-y-0.5">
              {stepErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Wizard Step Content */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        {/* STEP 1: APPLICANT PROFILE */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Step 1: Applicant Profile</h3>
              <p className="text-xs text-slate-500">
                General background and employment duration. Protected demographic characteristics are segregated
                and reserved strictly for aggregate algorithmic fairness auditing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Applicant Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Applicant Name or Demo Identifier <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Age (Years) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={18}
                  max={99}
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value, 10) || 18)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              {/* Employment Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Employment Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Salaried">Salaried</option>
                  <option value="Self-employed">Self-employed</option>
                  <option value="Business Owner">Business Owner</option>
                  <option value="Contract">Contract</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Employment Duration */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tenure in Current Role / Business (Months) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={employmentDurationMonths}
                  onChange={(e) => setEmploymentDurationMonths(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            {/* Audit Demographic Notice */}
            <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/60 flex items-start space-x-3">
              <Lock className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div className="text-xs text-teal-900">
                <span className="font-bold">Responsible AI Safeguard:</span> The demographic fields below
                (Gender, Location Tier, Education, Marital Status) are strictly audit-only. They are completely
                isolated from individual scoring and cannot impact an applicant's numerical eligibility result.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {/* Optional Gender (Audit) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Gender</label>
                  <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">
                    Audit Only
                  </span>
                </div>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as GenderAudit)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              {/* Location Tier (Audit) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Location Category</label>
                  <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">
                    Audit Only
                  </span>
                </div>
                <select
                  value={locationCategory}
                  onChange={(e) => setLocationCategory(e.target.value as LocationTierAudit)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Tier 1 Urban">Tier 1 Urban (Metro)</option>
                  <option value="Tier 2 Semi-urban">Tier 2 Semi-urban</option>
                  <option value="Tier 3 Rural">Tier 3 Rural</option>
                </select>
              </div>

              {/* Education (Audit) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Education Level</label>
                  <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">
                    Audit Only
                  </span>
                </div>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value as EducationLevelAudit)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="High School">High School</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="Doctorate">Doctorate</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Marital Status (Audit) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Marital Status</label>
                  <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">
                    Audit Only
                  </span>
                </div>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value as MaritalStatusAudit)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced/Widowed">Divorced / Widowed</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: FINANCIAL DETAILS */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Step 2: Financial Details</h3>
              <p className="text-xs text-slate-500">
                Core monthly cash flow metrics in Indian Rupees (INR). Used directly in deterministic debt burden and
                repayment capacity calculations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Gross Monthly Income */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gross Monthly Income (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={1}
                    step={1000}
                    value={grossMonthlyIncome}
                    onChange={(e) => setGrossMonthlyIncome(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full pl-8 pr-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Formatted: {formatINR(grossMonthlyIncome)}/mo</p>
              </div>

              {/* Existing Monthly Debt Payments */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Existing Monthly Debt Payments (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={existingMonthlyDebt}
                    onChange={(e) => setExistingMonthlyDebt(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full pl-8 pr-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Existing EMIs, credit card minimums, etc.</p>
              </div>

              {/* Monthly Household Expenses */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monthly Household Living Expenses (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={monthlyHouseholdExpenses}
                    onChange={(e) =>
                      setMonthlyHouseholdExpenses(Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className="w-full pl-8 pr-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Rent, groceries, utilities, schooling, transport</p>
              </div>

              {/* Income Stability */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Income Stability / Regularity <span className="text-red-500">*</span>
                </label>
                <select
                  value={incomeStability}
                  onChange={(e) => setIncomeStability(e.target.value as IncomeStability)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Very Stable">Very Stable (Permanent / Gov / Established MNC)</option>
                  <option value="Stable">Stable (Consistent regular business or professional)</option>
                  <option value="Moderate">Moderate (Some seasonal fluctuation)</option>
                  <option value="Volatile">Volatile (Irregular freelance or cyclical revenue)</option>
                </select>
              </div>

              {/* Optional Liquid Reserves */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Liquid Savings / Emergency Cash Reserves (₹) <span className="text-slate-400">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={liquidReserves}
                    onChange={(e) => setLiquidReserves(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full pl-8 pr-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Savings bank balance, fixed deposits, or liquid mutual funds available for emergency debt service.
                </p>
              </div>
            </div>

            {/* Live Financial Metrics Banner */}
            <div className="p-4 rounded-xl bg-slate-900 text-white grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Existing DTI</div>
                <div className="text-base font-extrabold text-teal-300 font-mono">{existingDti}%</div>
                <div className="text-[10px] text-slate-400">Baseline debt load</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Disposable Surplus</div>
                <div
                  className={`text-base font-extrabold font-mono ${
                    disposableIncome > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {formatINR(disposableIncome)}
                </div>
                <div className="text-[10px] text-slate-400">Before new loan</div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Reserves Cushion</div>
                <div className="text-base font-extrabold text-slate-200 font-mono">{formatINR(liquidReserves)}</div>
                <div className="text-[10px] text-slate-400">Emergency buffer</div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: LOAN DETAILS */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Step 3: Loan Details</h3>
              <p className="text-xs text-slate-500">
                Specify loan type, principal amount, tenure, and illustrative rate. Rates and credit scores are
                user-provided simulation inputs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Loan Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Loan Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={loanType}
                  onChange={(e) => {
                    const t = e.target.value as LoanType;
                    setLoanType(t);
                    // Helpful standard rates for realism
                    if (t === 'Home') setAnnualInterestRate(8.5);
                    else if (t === 'Education') setAnnualInterestRate(9.0);
                    else if (t === 'Business') setAnnualInterestRate(12.0);
                    else setAnnualInterestRate(11.5);
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Personal">Personal Loan</option>
                  <option value="Education">Education Loan</option>
                  <option value="Home">Home Loan</option>
                  <option value="Business">Business Loan</option>
                </select>
              </div>

              {/* Requested Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Requested Principal Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={1000}
                    step={10000}
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full pl-8 pr-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Formatted: {formatINR(requestedAmount)}</p>
              </div>

              {/* Repayment Term */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Repayment Tenure (Months) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={360}
                  value={termMonths}
                  onChange={(e) => setTermMonths(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  {(termMonths / 12).toFixed(1)} years ({termMonths} monthly instalments)
                </p>
              </div>

              {/* Annual Interest Rate */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Illustrative Annual Interest Rate (% p.a.) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={40}
                  step={0.1}
                  value={annualInterestRate}
                  onChange={(e) => setAnnualInterestRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">Demonstration rate (supports 0% zero-interest loans)</p>
              </div>

              {/* Optional Credit Score */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Applicant-Provided Credit Score (300 to 900) <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[11px] text-teal-700 font-medium">
                    Normalized if omitted (No Penalty)
                  </span>
                </div>
                <input
                  type="number"
                  min={300}
                  max={900}
                  placeholder="Leave empty or enter e.g. 750"
                  value={applicantCreditScore}
                  onChange={(e) => setApplicantCreditScore(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Demonstration illustrative value. If omitted, scoring engine automatically normalizes remaining weights
                  so the applicant is not penalized.
                </p>
              </div>
            </div>

            {/* Live EMI and Projected Burden Preview */}
            <div className="p-4 rounded-xl bg-teal-900 text-white grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-[11px] text-teal-200 uppercase font-semibold">Estimated Monthly EMI</div>
                <div className="text-xl font-extrabold text-teal-300 font-mono">{formatINR(liveEmi)}/mo</div>
                <div className="text-[10px] text-teal-100">Standard amortizing formula</div>
              </div>
              <div>
                <div className="text-[11px] text-teal-200 uppercase font-semibold">Projected DTI</div>
                <div
                  className={`text-xl font-extrabold font-mono ${
                    parseFloat(liveProjectedDti) <= 50 ? 'text-teal-300' : 'text-amber-300'
                  }`}
                >
                  {liveProjectedDti}%
                </div>
                <div className="text-[10px] text-teal-100">Includes new loan EMI</div>
              </div>
              <div>
                <div className="text-[11px] text-teal-200 uppercase font-semibold">Remaining Buffer</div>
                <div
                  className={`text-xl font-extrabold font-mono ${
                    liveRemaining >= 0 ? 'text-emerald-300' : 'text-red-300'
                  }`}
                >
                  {formatINR(liveRemaining)}
                </div>
                <div className="text-[10px] text-teal-100">Post-loan monthly cushion</div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW AND CONSENT */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Step 4: Review and Consent</h3>
              <p className="text-xs text-slate-500">
                Verify input parameters before triggering deterministic scoring and Gemini explainable AI assessment.
              </p>
            </div>

            {/* Review Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Applicant Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-900">Applicant Info</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs text-teal-600 font-semibold hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <div>
                    <span className="text-slate-400">Name:</span> <strong>{name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Age:</span> {age} years
                  </div>
                  <div>
                    <span className="text-slate-400">Employment:</span> {employmentType} ({employmentDurationMonths} mos)
                  </div>
                  <div className="pt-1 text-[11px] text-teal-800">
                    Audit: {gender} • {locationCategory}
                  </div>
                </div>
              </div>

              {/* Financials Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-900">Financial Profile</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs text-teal-600 font-semibold hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <div>
                    <span className="text-slate-400">Gross Income:</span> <strong>{formatINR(grossMonthlyIncome)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Existing Debt:</span> {formatINR(existingMonthlyDebt)}
                  </div>
                  <div>
                    <span className="text-slate-400">Household Living:</span> {formatINR(monthlyHouseholdExpenses)}
                  </div>
                  <div>
                    <span className="text-slate-400">Liquid Reserves:</span> {formatINR(liquidReserves)}
                  </div>
                </div>
              </div>

              {/* Loan Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-900">Requested Loan</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-xs text-teal-600 font-semibold hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <div>
                    <span className="text-slate-400">Type:</span> <strong>{loanType} Loan</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Amount:</span> <strong>{formatINR(requestedAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Tenure:</span> {termMonths} months @ {annualInterestRate}%
                  </div>
                  <div>
                    <span className="text-slate-400">Credit Score:</span>{' '}
                    {applicantCreditScore ? applicantCreditScore : 'Omitted (Normalized)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Calculated Preview Box */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-emerald-900">Deterministic Engine Preview</div>
                <div className="text-xs text-emerald-800 mt-0.5">
                  Proposed EMI: <strong className="font-mono">{formatINR(liveEmi)}/mo</strong> • Projected DTI:{' '}
                  <strong className="font-mono">{liveProjectedDti}%</strong> • Remaining Buffer:{' '}
                  <strong className="font-mono">{formatINR(liveRemaining)}</strong>
                </div>
              </div>
              <div className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-200/80 text-emerald-900 self-start sm:self-auto">
                Ready for Analysis
              </div>
            </div>

            {/* Privacy and Consent Checkbox */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Privacy Notice & Ethical AI Disclosure</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                FairCredit AI is an educational fintech demonstration. No personal banking credentials or government
                identifiers are requested or logged. Demographic audit fields are strictly isolated from credit
                scoring calculations. Evaluated results represent illustrative assessments, not lender sanctions.
              </p>
              <label className="flex items-start space-x-3 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                />
                <span className="text-xs text-slate-700 font-medium leading-tight">
                  I understand this is an educational simulation. I consent to deterministic financial evaluation and
                  Gemini-powered explainable AI reporting.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Wizard Controls Footer */}
        <div className="mt-8 pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Form</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md shadow-slate-900/10 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!consentGiven || isAnalyzing}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-lg shadow-teal-600/25 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Evaluating with Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Application</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
