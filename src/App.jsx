import React from 'react';
import { architectureLayers, modules, issues, recommendations } from '../architectureData';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = React.useState('overview');

  return (
    <div className="app">
      <header className="main-header">
        <div className="header-content">
          <h1>AutonomousTrading</h1>
          <p>Production-Ready Architecture Research & Design</p>
          <span className="status-badge">Production-Ready Architecture</span>
        </div>
      </header>

      <nav className="nav-tabs">
        <button className={activeTab === 'overview' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveTab('overview')}>
          <i className="fas fa-info-circle"></i> Overview
        </button>
        <button className={activeTab === 'architecture' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveTab('architecture')}>
          <i className="fas fa-layer-group"></i> Architecture
        </button>
        <button className={activeTab === 'diagrams' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveTab('diagrams')}>
          <i className="fas fa-diagram-project"></i> Diagrams
        </button>
        <button className={activeTab === 'repository' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveTab('repository')}>
          <i className="fas fa-code-branch"></i> Repository
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'overview' && <OverviewSection />}
        {activeTab === 'architecture' && <ArchitectureSection />}
        {activeTab === 'diagrams' && <DiagramsSection />}
        {activeTab === 'repository' && <RepositorySection />}
      </main>

      <footer className="main-footer">
        <p>AutonomousTrading Architecture Preview | Generated 2026-10-24</p>
        <p>Production-Ready Architecture Research & Clean-Rebuild Design</p>
      </footer>
    </div>
  );
}

function OverviewSection() {
  return (
    <section className="content-section">
      <h2 className="section-title">Project Overview</h2>
      <p className="section-subtitle">Research date: 24 October 2026 | Revision: 445eb11</p>
      
      <div className="arch-section">
        <h3>Recommendation</h3>
        <p>Recompose the existing system into one installable Python application around its deterministic financial semantics and one execution owner.</p>
      </div>

      <h3>Key Features</h3>
      <div className="features-grid">
        <div className="feature-card">
          <h3>Tiered Architecture</h3>
          <p>Three-tier system with Tier-1 for financial authority, Tier-2 for cognition, and clear separation of concerns.</p>
        </div>
        <div className="feature-card">
          <h3>Agentic Cognitive Fabric</h3>
          <p>Bounded AI coordination with role-scoped capabilities, memory partitioning, and evidence-based decision making.</p>
        </div>
        <div className="feature-card">
          <h3>Deterministic Canvas</h3>
          <p>Reproducible market intelligence scratchpad for agentic use with causal fact tracking.</p>
        </div>
        <div className="feature-card">
          <h3>Evidence-Driven</h3>
          <p>Immutable evidence bundles, hash-chained ledgers, and comprehensive audit trails.</p>
        </div>
      </div>
    </section>
  );
}

function ArchitectureSection() {
  return (
    <section className="content-section">
      <h2 className="section-title">Target Architecture</h2>
      
      <div className="arch-section">
        <h3>Architecture Principles</h3>
        <ul>
          <li>One canonical financial history and one execution owner</li>
          <li>Governed, evidence-driven agentic trading platform</li>
          <li>Production and simulation share code but not authority</li>
          <li>Deterministic Market Canvas with full scratchpad capability</li>
          <li>Bounded AI cognition without financial credentials</li>
          <li>Research-side RL with governed promotion</li>
        </ul>
      </div>

      <div className="arch-section">
        <h3>Three-Tier Structure</h3>
        <ul>
          <li><strong>Tier-1:</strong> Financial authority, policy/admission, execution gateway, and ledger management</li>
          <li><strong>Tier-2:</strong> AI cognition, tool use, research coordination, memory management</li>
          <li><strong>Shared Code:</strong> Deterministic engine with separate instances for live and simulation</li>
        </ul>
      </div>

      <h3 className="section-subtitle">Architecture Modules</h3>
      <div className="modules-grid">
        {modules.map((module) => (
          <div key={module.id} className="module-card">
            <h4>{module.name}</h4>
            <div className="module-tier">{module.tier}</div>
            <p>{module.responsibility}</p>
            <div className="module-strengths">
              <h5>Strengths:</h5>
              <ul>
                {module.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div className="module-concerns">
              <h5>Concerns:</h5>
              <ul>
                {module.concerns.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DiagramsSection() {
  return (
    <section className="content-section">
      <h2 className="section-title">Architecture Diagrams</h2>
      
      <div className="mermaid-diagram">
        <h3>Primary Target Diagram 1 - Higher-Level Architecture</h3>
        <div className="diagram-container">
          <pre>flowchart TB
    INPUT[Validated licensed live market inputs] --> MARKET[Live MarketView and deterministic Canvas]
    MARKET --> DECIDE[Live strategies and bounded review application]
    MARKET --> COG[Tier2 scoped cognition without financial credentials]
    COG -. typed proposals reviews and advice .-> DECIDE
    DECIDE --> KERNEL[Production Tier1 kernel and sole live execution owner]
    OWNER[Authenticated owner governance] -. approved policy and session candidates .-> KERNEL
    KERNEL <--> LEDGER[Production SQLite WAL financial ledger]
    KERNEL --> OA[OpenAlgo sole live broker boundary]
    OA --> EFFECT[Broker effects or OpenAlgo analyzer sandbox]
    OBS[Validated account order and trade observations] --> SUP[Independent protection and reconciliation supervisor]
    SUP -. action proposals only .-> KERNEL
    CODE[Shared versioned deterministic engine code] -. instantiated in production .-> KERNEL
    DEV[Permitted immutable research dataset] --> SVIEW[Simulation MarketView and Canvas with recorded clock]
    SVIEW --> SDEC[Simulation strategy and recorded or isolated review]
    SDEC --> SKERNEL[Disarmed simulation kernel and execution owner]
    SKERNEL <--> SLEDGER[Separate simulation run ledger]
    SKERNEL --> SBROKER[Local simulated broker no live capability]
    SBROKER --> SKERNEL</pre>
        </div>
      </div>

      <div className="mermaid-diagram">
        <h3>Primary Target Diagram 2 - Detailed End-to-End Architecture</h3>
        <div className="diagram-container">
          <pre>flowchart TB
    subgraph M[Production market and Canvas]
        INPUT --> INGEST[Validate normalize and retain]
        INGEST --> STORE[Canonical records]
        STORE --> VIEW[Live causal MarketView]
        VIEW --> CANVAS[Canvas facts and evidence]
        CANVAS --> TOOLS[Bounded tools]
        CANVAS --> RENDER[Charts render]
    end
    subgraph F[Production Tier1 kernel]
        VIEW --> STRAT[Strategy intent]
        STRAT --> PLAN[Planning port]
        PLAN --> ADMIT[Admission checks]
        ADMIT --> RESERVE[Atomic reservation]
        RESERVE --> COORD[Execution coordinator]
        COORD --> OA[OpenAlgo adapter]
        OA --> RESULT[ACK/rejection]
        RESULT --> LIFE[Live lifecycle]
        OA --> BOBS[Validated observations]
        BOBS --> ACCOUNT
        ACCOUNT --> LEDGER[SQLite WAL]
    end
    subgraph S[Disarmed Simulation]
        HIST --> SVIEW[Sim MarketView]
        SVIEW --> SSTRAT[Sim strategy]
        SSTRAT --> SPLAN[Sim planning]
        SPLAN --> SADMIT[Sim admission]
        SADMIT --> SCOORD[Sim coordinator]
        SCOORD --> SBROKER[Sim broker]
        SBROKER --> SLIFE[Sim lifecycle]
        SLIFE --> SLEDGER[Sim ledger]
    end</pre>
        </div>
      </div>
    </section>
  );
}

function RepositorySection() {
  return (
    <section className="content-section">
      <h2 className="section-title">Repository Structure</h2>
      
      <div className="arch-section">
        <h3>Project Layout</h3>
        <p>The repository follows a clean, modular structure designed for maintainability and scalability:</p>
      </div>

      <div className="file-tree">
        <pre>AutonomousTrading/
├── pyproject.toml
├── requirements.lock
├── README.md
├── LICENSE
├── .gitignore
├── config/
│   ├── defaults.yaml
│   ├── live.example.yaml
│   ├── simulation.yaml
│   └── research.yaml
├── src/
│   └── autonomous_trading/
│       ├── contracts/
│       ├── market/
│       ├── strategies/
│       ├── cognition/
│       ├── kernel/
│       ├── adapters/
│       ├── research/
│       ├── operations/
│       └── interfaces/
├── schemas/
├── deploy/
├── scripts/
├── tests/
└── docs/</pre>
      </div>
    </section>
  );
}

export default App;