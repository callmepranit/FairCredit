import React, { useState } from 'react';
import { ShieldCheck, Scale, Bell, Sparkles, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  totalApplicationsCount: number;
  eligibleRate: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  totalApplicationsCount,
  eligibleRate,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">FairCredit</span>
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Fairer assessments. Clearer decisions.</p>
            </div>
          </div>

          {/* Right Status Badges & Quick Controls */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Demo Mode Badge */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Educational Prototype • Demo Mode</span>
            </div>

            {/* Currency Pill */}
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-teal-300">
              <span className="font-semibold">INR (₹)</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Simulation Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-400"></span>
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 text-slate-200 z-50">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-teal-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        System & Audit Notifications
                      </h4>
                    </div>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-800/80 border border-teal-500/20 flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-100">Deterministic Engine Active</div>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Financial rules calculate EMI, DTI, and remaining income strictly with mathematical formulas.
                        </p>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800/80 border border-emerald-500/20 flex items-start space-x-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-100">Demographic Isolation Enforced</div>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Protected attributes (gender, age, location) are isolated for fairness audits only.
                        </p>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800/80 border border-amber-500/20 flex items-start space-x-2">
                      <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-100">Active Audit Dataset</div>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {totalApplicationsCount} synthetic applications loaded. Portfolio eligibility rate: {eligibleRate}%.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => onNavigate('apply')}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md shadow-teal-600/20 transition-colors"
            >
              <span>+ Check Loan</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
