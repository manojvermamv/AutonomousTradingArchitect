import { useEffect, useState } from 'react';
import { ArchitectureOverview } from './ArchitectureOverview';
import { IssueAnalysis } from './IssueAnalysis';
import { Recommendations } from './Recommendations';
import { ModuleDetails } from './ModuleDetails';
import { Scorecard } from './Scorecard';
import { CodeVerifiedFindings } from './CodeVerifiedFindings';
import { MarkdownDocument } from './MarkdownDocument';
import { MermaidDiagrams } from './MermaidDiagrams';
import { modules, issues, recommendations, architectureLayers } from '../data/architectureData';

type MainTab = 'overview' | 'architecture' | 'diagrams' | 'repository' | 'review' | 'readme' | 'roadmap';
type ReviewTab = 'dataflow' | 'issues' | 'source-audit' | 'scorecard' | 'roadmap' | 'layers' | 'readiness';

const mainTabs: { id: MainTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'fa-solid fa-diagram-project' },
  { id: 'architecture', label: 'Architecture', icon: 'fa-solid fa-layer-group' },
  { id: 'diagrams', label: 'Diagrams', icon: 'fa-solid fa-diagram-project' },
  { id: 'repository', label: 'Repository', icon: 'fa-solid fa-code-branch' },
  { id: 'review', label: 'Review', icon: 'fa-solid fa-clipboard-check' },
  { id: 'readme', label: 'Master README', icon: 'fa-brands fa-markdown' },
  { id: 'roadmap', label: 'Roadmap', icon: 'fa-solid fa-road' },
];

const reviewTabs: { id: ReviewTab; label: string; icon: string }[] = [
  { id: 'dataflow', label: 'Data Flow', icon: 'fa-solid fa-arrow-right-arrow-left' },
  { id: 'issues', label: 'Issues Analysis', icon: 'fa-solid fa-triangle-exclamation' },
  { id: 'source-audit', label: 'Code Audit', icon: 'fa-solid fa-magnifying-glass-chart' },
  { id: 'scorecard', label: 'Scorecard', icon: 'fa-solid fa-chart-bar' },
  { id: 'roadmap', label: 'Improvement Roadmap', icon: 'fa-solid fa-road' },
  { id: 'layers', label: 'Architecture Layers', icon: 'fa-solid fa-layer-group' },
  { id: 'readiness', label: 'Readiness', icon: 'fa-solid fa-clipboard-check' },
];

function routeFromHash(hash: string): { main: MainTab; review: ReviewTab } {
  const [mainPart, subPart] = hash.replace(/^#/, '').split('/');
  const main: MainTab = mainTabs.some(tab => tab.id === mainPart) ? mainPart as MainTab : 'overview';
  const review: ReviewTab = reviewTabs.some(tab => tab.id === subPart) ? subPart as ReviewTab : 'dataflow';
  return { main, review };
}

export default function App() {
  const [route, setRoute] = useState(() => routeFromHash(window.location.hash));
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.replace(/^#/, '');
      const main = hash.split('/')[0];
      if (mainTabs.some(tab => tab.id === main)) setRoute(routeFromHash(window.location.hash));
    };
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  const navigate = (main: MainTab, review = route.review) => {
    const hash = main === 'review' ? `#review/${review}` : `#${main}`;
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
    setRoute({ main, review });
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const severityCounts = {
    critical: issues.filter(issue => issue.severity === 'critical').length,
    high: issues.filter(issue => issue.severity === 'high').length,
    medium: issues.filter(issue => issue.severity === 'medium').length,
    low: issues.filter(issue => issue.severity === 'low').length,
  };

  const handleTabKey = (event: React.KeyboardEvent<HTMLDivElement>, ids: string[], active: string, choose: (id: string) => void) => {
    const index = ids.indexOf(active);
    let next = -1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % ids.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + ids.length) % ids.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = ids.length - 1;
    if (next >= 0) {
      event.preventDefault();
      const tabList = event.currentTarget;
      choose(ids[next]);
      requestAnimationFrame(() => tabList.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus());
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100">
      <header className="app-header sticky top-0 z-50 border-b border-gray-800/70 bg-[#0d1220]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-900/30"><i className="fa-solid fa-microchip text-lg text-white" /></div>
            <div><h1 className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-xl font-bold text-transparent">AutonomousTrading</h1><p className="text-sm text-slate-500">Production-Ready Architecture Research &amp; Design</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Dashboard issue severity counts">
            {(['critical', 'high', 'medium', 'low'] as const).map((severity) => <span key={severity} className="inline-flex items-center gap-2 text-xs text-slate-400"><i className={`h-2.5 w-2.5 rounded-full ${severity === 'critical' ? 'bg-red-500' : severity === 'high' ? 'bg-orange-500' : severity === 'medium' ? 'bg-amber-400' : 'bg-blue-500'}`} />{severityCounts[severity]} {severity[0].toUpperCase() + severity.slice(1)}</span>)}
          </div>
        </div>
        <nav className="border-t border-gray-800/70 bg-[#0d1220]/90" aria-label="Main sections">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8"><div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide" role="tablist" aria-label="Main sections" onKeyDown={event => handleTabKey(event, mainTabs.map(tab => tab.id), route.main, value => navigate(value as MainTab))}>
            {mainTabs.map(tab => <button key={tab.id} id={`tab-${tab.id}`} type="button" role="tab" aria-selected={route.main === tab.id} aria-controls={`panel-${tab.id}`} tabIndex={route.main === tab.id ? 0 : -1} onClick={() => navigate(tab.id)} className={`main-tab ${route.main === tab.id ? 'main-tab-active' : ''}`}><i className={tab.icon} aria-hidden="true" />{tab.label}</button>)}
          </div></div>
        </nav>
      </header>

      <main className="mx-auto min-h-[70vh] max-w-[1600px] px-4 py-7 sm:px-6 lg:px-8">
        <div id={`panel-${route.main}`} role="tabpanel" aria-labelledby={`tab-${route.main}`}>
          {route.main === 'overview' && <><div className="review-evidence-note">Overview cards preserve the dashboard presentation. Their scores, strengths, gaps, and readiness labels are not source verification; use Review → Code Audit for dated code findings and evidence limits.</div><ArchitectureOverview modules={modules} issues={issues} recommendations={recommendations} layers={architectureLayers} /></>}
          {route.main === 'architecture' && <ModuleDetails modules={modules} issues={issues} />}
          {route.main === 'diagrams' && <MermaidDiagrams />}
          {route.main === 'repository' && <MarkdownDocument title="Repository Structure" path="README.md" sectionHeading="Fully commented target repository" />}
          {route.main === 'readme' && <MarkdownDocument title="Master README" path="README.md" />}
          {route.main === 'roadmap' && <MarkdownDocument title="Project Roadmap" path="ROADMAP.md" />}
          {route.main === 'review' && <>
            <aside className="review-evidence-note" role="note">The dashboard score, severity labels, and issue cards are presentation assessments. Code Audit contains dated source findings; proposals and readiness judgments remain separate. See the <button type="button" onClick={() => navigate('readme')} className="inline-link">Master README</button> for citations and evidence limits.</aside>
            <div className="review-tabs" role="tablist" aria-label="Review sections" onKeyDown={event => handleTabKey(event, reviewTabs.map(tab => tab.id), route.review, value => navigate('review', value as ReviewTab))}>
              {reviewTabs.map(tab => <button key={tab.id} id={`review-tab-${tab.id}`} type="button" role="tab" aria-selected={route.review === tab.id} aria-controls={`review-panel-${tab.id}`} tabIndex={route.review === tab.id ? 0 : -1} onClick={() => navigate('review', tab.id)} className={`review-tab ${route.review === tab.id ? 'review-tab-active' : ''}`}><i className={tab.icon} aria-hidden="true" />{tab.label}</button>)}
            </div>
            <div id={`review-panel-${route.review}`} role="tabpanel" aria-labelledby={`review-tab-${route.review}`} className="mt-7">
              {route.review === 'dataflow' && <DataFlowReview onNavigate={navigate} />}
              {route.review === 'issues' && <IssueAnalysis issues={issues} />}
              {route.review === 'source-audit' && <CodeVerifiedFindings />}
              {route.review === 'scorecard' && <Scorecard modules={modules} issues={issues} recommendations={recommendations} />}
              {route.review === 'roadmap' && <Recommendations recommendations={recommendations} />}
              {route.review === 'layers' && <ModuleDetails modules={modules} issues={issues} />}
              {route.review === 'readiness' && <ReadinessReview />}
            </div>
          </>}
        </div>
      </main>
      <footer className="border-t border-gray-800/70 py-5"><p className="text-center text-xs text-slate-600">Architecture research and audit presentation · {modules.length} modules · {issues.length} dashboard assessments · {recommendations.length} evidence dispositions</p></footer>
    </div>
  );
}

function DataFlowReview({ onNavigate }: { onNavigate: (main: MainTab, review?: ReviewTab) => void }) {
  const stages = [
    ['Market inputs', 'Broker and market interfaces provide observations; canonical storage and immutable research bundles provide the evidence inputs.'],
    ['Market view', 'MarketInputSource normalizes and retains provenance before a deterministic MarketView is consumed by strategy logic.'],
    ['Cognition and proposals', 'Tier2 cognition operates without financial credentials and produces typed proposals for review.'],
    ['Tier1 authority', 'Authenticated intent reaches the sole production execution owner; cognition remains advisory.'],
    ['External effects and records', 'Broker effects, local ownership state, and financial ledger records are reconciled by stable identities.'],
    ['Replay and research', 'Replay uses recorded evidence and disarmed adapters; research evaluation and activation remain separate governance stages.'],
  ];
  const boundaryClaims = [
    ['Market → Strategy', 'Stale data can trigger incorrect intents', 'Freshness, quality, provenance, and cutoff checks are present in source; caller-specific settings still need review.'],
    ['Cognition → Decision', 'Proposal loops may create oscillation or excess work', 'Historical assessment only; measure churn before adding cooldowns, rate limits, or confidence thresholds.'],
    ['Strategy → Planning', 'Intent must be typed and validated', 'Preserve existing versioned planning paths and compare behavior before extraction.'],
    ['Admission → Reservation', 'Concurrent admission can race', 'Verify atomic identity and reservation behavior at the authoritative transaction boundary.'],
    ['Coordinator → Broker', 'Network failures can leave external effects ambiguous', 'The code includes explicit ambiguous outcomes and observation-based resolution; verify persistence/settlement at F1/F2.'],
    ['Broker → Observations', 'Stale or incomplete observations can mislead reconciliation', 'Validate identity, freshness, completeness, and the deployed OpenAlgo response contract.'],
    ['Ledger → Backup', 'A backup during writes may be inconsistent', 'WAL-aware backup and isolated restore exist in source; runtime recovery acceptance was not established.'],
    ['Simulation → Production', 'Shared code could be accidentally armed', 'Disarmed simulation components exist; verify credentials, process/network, ledger, and lifecycle isolation.'],
  ];
  const patterns = [
    ['Forward market pipeline', 'Ingest → Store → View → Canvas → Tools → Render', 'Design description; validate as-of availability in each caller.'],
    ['Bidirectional advisory', 'Cognition proposes; the deterministic decision path returns state/context.', 'Bounded cognition exists; churn-control thresholds remain measurement decisions.'],
    ['Synchronous command, asynchronous observation', 'Kernel submits a command; observations arrive and reconcile later.', 'Ambiguous outcomes are modeled; end-to-end persistence is under F1/F2.'],
    ['Append-only ledger with verified reads', 'Events are committed and projections are checked against source state.', 'Source code implements this; full runtime fault behavior was outside the audit.'],
    ['Shared engine with disarmed replay', 'Simulation reuses selected deterministic logic with recorded evidence and distinct adapters.', 'Partial parity is present; exact replay and operational isolation are unverified.'],
    ['Evidence and research pipeline', 'Ledger → export → bundles → custody → experiments → evaluation.', 'Research custody/evaluation exists; historical cleanliness is not certified.'],
    ['Asynchronous telemetry', 'Operational events feed UI, metrics, traces, and alerts.', 'The dashboard’s completeness claim is not code-verified; inventory actual observability before extending it.'],
  ];
  const comparison = [
    ['Strategy logic', 'Live decision and typed intent', 'Same strategy with recorded clock', 'Shared logic described; parity not fully tested'],
    ['Planning port', 'Versioned implementations', 'Same port and implementations', 'Preserve both existing planning paths until parity is proven'],
    ['Admission', 'Exact checks and account state', 'Same transitions with simulated account', 'Code exists; end-to-end equivalence not established'],
    ['Reservation', 'Atomic identity and commit', 'Same reservation transitions', 'Verify from the respective stores and failure paths'],
    ['Coordinator', 'Sole live execution owner', 'No live socket or credential by design', 'Different authority; simulation isolation needs proof'],
    ['Broker', 'OpenAlgo adapter', 'Local simulated broker model', 'Separate effects and adapter'],
    ['Ledger', 'Production financial ledger', 'Separate simulation run ledger', 'Separate stores; deployment-level isolation not established'],
    ['Lifecycle', 'Live observations, protection, settlement', 'Shared functions with simulated effects', 'Partial behavior reuse; prove fill/cancel race parity'],
    ['Market data', 'Live causal MarketView', 'Recorded clock and immutable bundle', 'Different inputs; verify causal cutoffs'],
    ['Credentials', 'Production adapter credentials', 'None should be available', 'Target boundary; verify OS/process/network capability'],
  ];
  return <section className="space-y-6" aria-labelledby="data-flow-heading"><header><h2 id="data-flow-heading" className="page-heading">Data Flow &amp; Trust Boundaries</h2><p className="mt-3 text-sm leading-relaxed text-gray-400">An audit navigation aid based on the documented architecture. It is not runtime telemetry or proof of deployment; canonical diagrams remain the Mermaid blocks in the Master README.</p></header>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{stages.map(([title, description], index) => <article key={title} className="review-flow-card"><span className="flow-step-number">{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
    <div className="grid gap-4 lg:grid-cols-3">{[
      ['Tier1 execution ownership', 'Typed intent crosses an authenticated boundary to the production coordinator. No production deployment or failover behavior is claimed here.'],
      ['Broker, registry, and ledger reconciliation', 'Broker effects, local ownership records, and ledger projections may represent different stages of one action. Findings F1/F2 concern persistence/settlement contracts; no duplicate send or loss was established.'],
      ['Replay and research isolation', 'Replay evidence, custody, evaluation, candidate freezing, and activation are distinct stages. Any unverified isolation or owner policy remains open.'],
    ].map(([title, body]) => <article key={title} className="rounded-xl border border-gray-800 bg-[#0d1220] p-5"><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-300">Boundary</p><h3 className="text-sm font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-relaxed text-gray-400">{body}</p></article>)}</div>
    <details className="markdown-details"><summary><strong>Legacy boundary, data-flow pattern, and simulation comparison</strong></summary><div className="markdown-details-content space-y-5">
      <p className="text-xs leading-relaxed text-gray-400">This preserves the older review bundle’s content as an assessment inventory. Its risks and mitigation language are not proof of defects or approved policy; current dispositions below reflect the scoped code audit.</p>
      <section><h3 className="text-sm font-semibold text-white">Boundary assessment</h3><div className="mt-3 grid gap-3 md:grid-cols-2">{boundaryClaims.map(([boundary, risk, disposition]) => <article key={boundary} className="rounded-lg border border-gray-800 bg-gray-900/50 p-4"><p className="text-xs font-semibold text-blue-200">{boundary}</p><p className="mt-2 text-xs text-gray-300"><strong className="text-amber-200">Historical risk claim:</strong> {risk}</p><p className="mt-2 text-xs leading-relaxed text-gray-400"><strong className="text-emerald-300">Audit disposition:</strong> {disposition}</p></article>)}</div></section>
      <section><h3 className="text-sm font-semibold text-white">Data-flow patterns</h3><div className="mt-3 grid gap-3 md:grid-cols-2">{patterns.map(([name, description, disposition]) => <article key={name} className="rounded-lg border border-gray-800 bg-gray-900/50 p-4"><h4 className="text-xs font-semibold text-white">{name}</h4><p className="mt-2 text-xs text-gray-300">{description}</p><p className="mt-2 text-xs leading-relaxed text-gray-400">{disposition}</p></article>)}</div></section>
      <section><h3 className="text-sm font-semibold text-white">Production and simulation comparison</h3><p className="mt-2 text-xs text-gray-400">Comparison retained from the presentation bundle; it does not claim deployment acceptance.</p><div className="mt-3 overflow-x-auto rounded-lg border border-gray-800"><table className="w-full min-w-[720px] border-collapse text-left text-xs"><thead className="bg-gray-800/70 text-gray-300"><tr>{['Aspect', 'Production', 'Simulation / replay', 'Evidence note'].map(label => <th key={label} className="px-3 py-2 font-semibold">{label}</th>)}</tr></thead><tbody>{comparison.map(row => <tr key={row[0]} className="border-t border-gray-800/70 text-gray-300">{row.map((cell, index) => <td key={index} className={`px-3 py-2 align-top ${index === 0 ? 'font-medium text-white' : ''}`}>{cell}</td>)}</tr>)}</tbody></table></div></section>
    </div></details>
    <div className="flex flex-wrap gap-3"><button className="secondary-action" onClick={() => onNavigate('diagrams')}>Open canonical diagrams</button><button className="secondary-action" onClick={() => onNavigate('review', 'source-audit')}>View code-audit evidence</button></div>
  </section>;
}

function ReadinessReview() {
  const groups = [
    { title: 'Established by scoped source review', tone: 'blue', points: ['The audit records specific source-level contracts and findings F1–F9.', 'Dashboard issue labels and scores are historical presentation claims.', 'No production deployment, broker acceptance, or runtime acceptance is established.'] },
    { title: 'Requires verification or measurement', tone: 'amber', points: ['Verify persistence and settlement at cited transaction boundaries.', 'Measure workload, contention, latency, outage frequency, and recovery objectives before scaling or failover changes.', 'Validate replay credential, process, network, ledger, and lifecycle boundaries.'] },
    { title: 'Open owner decisions', tone: 'violet', points: ['Financial authority, emergency permissions, and governance remain owner decisions.', 'No quorum, retry behavior, broker policy, or production safeguard is approved by this presentation.', 'Production readiness is not claimed.'] },
  ];
  return <section className="space-y-6" aria-labelledby="readiness-heading"><header><h2 id="readiness-heading" className="page-heading">Readiness &amp; Evidence Limits</h2><p className="mt-3 text-sm leading-relaxed text-gray-400">Readiness here describes the audit evidence boundary, not a production release decision.</p></header>
    <div className="grid gap-4 lg:grid-cols-3">{groups.map(group => <article key={group.title} className={`readiness-card readiness-${group.tone}`}><h3>{group.title}</h3><ul>{group.points.map(point => <li key={point}>{point}</li>)}</ul></article>)}</div>
  </section>;
}
