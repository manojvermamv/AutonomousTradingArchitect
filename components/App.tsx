import { useState } from 'react';
import { ArchitectureOverview } from './components/ArchitectureOverview';
import { IssueAnalysis } from './components/IssueAnalysis';
import { Recommendations } from './components/Recommendations';
import { ModuleDetails } from './components/ModuleDetails';
import { ArchitectureFlow } from './components/ArchitectureFlow';
import { Scorecard } from './components/Scorecard';
import { modules, issues, recommendations, architectureLayers } from './data/architectureData';

type Tab = 'overview' | 'flow' | 'issues' | 'modules' | 'recommendations' | 'scorecard';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'fa-solid fa-diagram-project' },
    { id: 'flow', label: 'Data Flow', icon: 'fa-solid fa-arrows-spin' },
    { id: 'issues', label: 'Issues', icon: 'fa-solid fa-triangle-exclamation' },
    { id: 'modules', label: 'Modules', icon: 'fa-solid fa-cubes' },
    { id: 'recommendations', label: 'Roadmap', icon: 'fa-solid fa-road' },
    { id: 'scorecard', label: 'Scorecard', icon: 'fa-solid fa-chart-bar' },
  ];

  const severityCounts = {
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-[#0d1220]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <i className="fa-solid fa-microchip text-white text-sm"></i>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Architecture Deep Review
                </h1>
                <p className="text-[10px] text-gray-500 -mt-0.5">Trading System • Module Boundaries & Readiness Assessment</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-gray-400">{severityCounts.critical} Critical</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span className="text-gray-400">{severityCounts.high} High</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                <span className="text-gray-400">{severityCounts.medium} Medium</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-gray-400">{severityCounts.low} Low</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-gray-800/30 bg-[#0d1220]/40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30 border border-transparent'
                }`}
              >
                <i className={`${tab.icon} text-xs`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <ArchitectureOverview
            modules={modules}
            issues={issues}
            recommendations={recommendations}
            layers={architectureLayers}
          />
        )}
        {activeTab === 'flow' && <ArchitectureFlow layers={architectureLayers} />}
        {activeTab === 'issues' && <IssueAnalysis issues={issues} />}
        {activeTab === 'modules' && <ModuleDetails modules={modules} issues={issues} />}
        {activeTab === 'recommendations' && <Recommendations recommendations={recommendations} />}
        {activeTab === 'scorecard' && <Scorecard modules={modules} issues={issues} recommendations={recommendations} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/30 py-4 mt-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-600">
            Architecture Review • {modules.length} Modules Analyzed • {issues.length} Issues Found • {recommendations.length} Recommendations
          </p>
        </div>
      </footer>
    </div>
  );
}
