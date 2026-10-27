/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ApplicantProfile,
  FinancialDetails,
  LoanDetails,
  ApplicationRecord,
  GeminiExplanation,
} from './types';
import { evaluateLoanEligibility } from './utils/calculator';
import {
  getStoredApplications,
  saveApplication,
  deleteApplication,
  clearAllApplications,
  resetToSyntheticSeed,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { NavigationTabs } from './components/NavigationTabs';
import { OverviewDashboard } from './components/OverviewDashboard';
import { LoanApplicationWizard } from './components/LoanApplicationWizard';
import { AssessmentResultView } from './components/AssessmentResultView';
import { FairnessAnalysisDashboard } from './components/FairnessAnalysisDashboard';
import { ApplicationHistoryView } from './components/ApplicationHistoryView';
import { AIInsightsView } from './components/AIInsightsView';
import { AboutProjectView } from './components/AboutProjectView';
import { Toast, ToastMessage } from './components/Toast';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [activeApplication, setActiveApplication] = useState<ApplicationRecord | null>(null);
  const [preselectedForFairness, setPreselectedForFairness] = useState<ApplicationRecord | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Initialize applications from storage on mount
  useEffect(() => {
    const stored = getStoredApplications();
    setApplications(stored);
    if (stored.length > 0) {
      setActiveApplication(stored[0]);
    }
  }, []);

  const showToast = (type: 'success' | 'info' | 'warning', title: string, message?: string) => {
    setToast({ id: Date.now().toString(), type, title, message });
  };

  // Handle application submission from the Wizard
  const handleAnalyzeApplication = async (
    applicant: ApplicantProfile,
    finances: FinancialDetails,
    loan: LoanDetails
  ) => {
    setIsAnalyzing(true);
    try {
      // 1. Run deterministic calculation engine
      const calculationResult = evaluateLoanEligibility(finances, loan);

      // 2. Query server-side Gemini explainable AI API
      let aiExplanation: GeminiExplanation | undefined;
      try {
        const payload = {
          loanType: loan.loanType,
          requestedAmount: loan.requestedAmount,
          termMonths: loan.termMonths,
          annualInterestRate: loan.annualInterestRate,
          grossMonthlyIncome: finances.grossMonthlyIncome,
          existingMonthlyDebt: finances.existingMonthlyDebt,
          monthlyHouseholdExpenses: finances.monthlyHouseholdExpenses,
          disposableIncome: calculationResult.disposableIncome,
          proposedEmi: calculationResult.proposedEmi,
          existingDti: calculationResult.existingDti,
          projectedDti: calculationResult.projectedDti,
          remainingMonthlyIncome: calculationResult.remainingMonthlyIncome,
          illustrativeScore: calculationResult.illustrativeScore,
          assessmentCategory: calculationResult.assessmentCategory,
          primaryFactors: calculationResult.primaryFactors,
          positiveIndicators: calculationResult.positiveIndicators,
          riskFactors: calculationResult.riskFactors,
        };

        const res = await fetch('/api/gemini/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const resData = await res.json();
          aiExplanation = {
            ...resData.data,
            generatedAt: new Date().toISOString(),
            isFallback: Boolean(resData.fallback),
          };
        }
      } catch (err) {
        console.warn('Gemini explanation fallback:', err);
      }

      // Generate Reference ID
      const newId = `FC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newRecord: ApplicationRecord = {
        id: newId,
        createdAt: new Date().toISOString(),
        applicant,
        finances,
        loan,
        result: calculationResult,
        aiExplanation,
        consentGiven: true,
        isSynthetic: false,
      };

      // Save to storage & state
      const updatedList = saveApplication(newRecord);
      setApplications(updatedList);
      setActiveApplication(newRecord);

      showToast(
        'success',
        'Assessment Complete',
        `Reference ${newId} evaluated: ${calculationResult.assessmentCategory} (Score: ${calculationResult.illustrativeScore}/100)`
      );

      setCurrentTab('result');
    } catch (error) {
      console.error('Analysis failed:', error);
      showToast('warning', 'Evaluation Notice', 'Deterministic result computed with local rule engine.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Inspect existing application
  const handleSelectApplication = (app: ApplicationRecord) => {
    setActiveApplication(app);
    setCurrentTab('result');
  };

  // Navigate to Fairness audit with preloaded applicant
  const handleAuditInFairness = (app: ApplicationRecord) => {
    setPreselectedForFairness(app);
    setCurrentTab('fairness');
    showToast(
      'info',
      'Loaded into Counterfactual Suite',
      `Testing ${app.applicant.name}'s profile (${app.id}) with zero-divergence validation.`
    );
  };

  // Save to history action
  const handleSaveToHistory = (app: ApplicationRecord) => {
    const updated = saveApplication(app);
    setApplications(updated);
    showToast('success', 'Application Saved', `Reference ${app.id} recorded in local session.`);
  };

  // Delete individual application
  const handleDeleteApplication = (id: string) => {
    const updated = deleteApplication(id);
    setApplications(updated);
    if (activeApplication?.id === id) {
      setActiveApplication(updated[0] || null);
    }
    showToast('info', 'Record Deleted', `Application ${id} removed from history.`);
  };

  // Clear all applications
  const handleClearAll = () => {
    const updated = clearAllApplications();
    setApplications(updated);
    setActiveApplication(null);
    showToast('warning', 'History Cleared', 'All stored application records have been removed.');
  };

  // Reset to initial 32 synthetic profiles
  const handleResetToSynthetic = () => {
    const seeded = resetToSyntheticSeed();
    setApplications(seeded);
    setActiveApplication(seeded[0] || null);
    showToast('success', 'Reset Complete', 'Standard 32 synthetic loan applications restored.');
  };

  // Aggregate stats for top nav
  const eligibleCount = applications.filter(
    (a) => a.result.assessmentCategory === 'Indicatively Eligible'
  ).length;
  const eligibleRate =
    applications.length > 0 ? Math.round((eligibleCount / applications.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        totalApplicationsCount={applications.length}
        eligibleRate={eligibleRate}
      />

      {/* Main Page Navigation Tabs */}
      <NavigationTabs
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        historyCount={applications.length}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentTab === 'dashboard' && (
          <OverviewDashboard
            applications={applications}
            onSelectApplication={handleSelectApplication}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'apply' && (
          <LoanApplicationWizard
            onSubmitApplication={handleAnalyzeApplication}
            isAnalyzing={isAnalyzing}
          />
        )}

        {currentTab === 'result' && activeApplication && (
          <AssessmentResultView
            application={activeApplication}
            onSaveToHistory={handleSaveToHistory}
            onAuditInFairness={handleAuditInFairness}
            onCheckAnother={() => setCurrentTab('apply')}
            onReturnDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'fairness' && (
          <FairnessAnalysisDashboard
            applications={applications}
            preselectedApplicant={preselectedForFairness}
          />
        )}

        {currentTab === 'history' && (
          <ApplicationHistoryView
            applications={applications}
            onSelectApplication={handleSelectApplication}
            onDeleteApplication={handleDeleteApplication}
            onClearAll={handleClearAll}
            onResetToSynthetic={handleResetToSynthetic}
          />
        )}

        {currentTab === 'insights' && <AIInsightsView applications={applications} />}

        {currentTab === 'about' && <AboutProjectView />}
      </main>

      {/* Global Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8 mt-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-slate-200 font-bold flex items-center justify-center sm:justify-start space-x-2">
              <span>FairCredit AI</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300">
                Fintech Prototype
              </span>
            </div>
            <p className="text-slate-500">
              Responsible AI loan assessment, explainability with Gemini 3.8 Flash, and demographic parity checking.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <button
              onClick={() => setCurrentTab('about')}
              className="hover:text-white transition-colors"
            >
              Methodology & Ethics
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentTab('fairness')}
              className="hover:text-white transition-colors"
            >
              Fairness Audits
            </button>
            <span>•</span>
            <span>Educational Use Only</span>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
