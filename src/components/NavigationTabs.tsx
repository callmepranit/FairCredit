import React from 'react';
import {
  LayoutDashboard,
  Calculator,
  Scale,
  History,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface NavigationTabsProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  historyCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  currentTab,
  onSelectTab,
  historyCount,
}) => {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Overview Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'apply',
      label: 'Check Loan Eligibility',
      icon: Calculator,
      badge: 'Interactive',
    },
    {
      id: 'fairness',
      label: 'Fairness Analysis',
      icon: Scale,
      badge: 'Key Audit',
    },
    {
      id: 'history',
      label: 'Application History',
      icon: History,
      badge: historyCount > 0 ? `${historyCount}` : null,
    },
    {
      id: 'insights',
      label: 'AI Insights',
      icon: Sparkles,
      badge: 'Gemini',
    },
    {
      id: 'about',
      label: 'About Project',
      icon: HelpCircle,
      badge: null,
    },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2.5 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
