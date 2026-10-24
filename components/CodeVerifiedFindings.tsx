import {
  codeAuditBranch,
  codeAuditDate,
  codeAuditRevision,
  codeVerifiedFindings,
  sourceUrl,
} from '../data/codeVerifiedFindings';

const severityStyle = {
  high: 'border-red-400/30 bg-red-500/10 text-red-300',
  medium: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  low: 'border-blue-400/30 bg-blue-500/10 text-blue-200',
  boundary: 'border-violet-400/30 bg-violet-500/10 text-violet-200',
} as const;

export function CodeVerifiedFindings() {
  return (
    <section className="space-y-6" aria-labelledby="code-findings-heading">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Separate source audit</p>
        <h2 id="code-findings-heading" className="mt-2 text-xl font-bold text-white">Code-verified findings</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">
          These findings come from the dated code audit. Dashboard issue cards remain presentation assessments;
          a related source link is context and does not turn an assessment into a verified defect.
        </p>
      </header>

      <div className="rounded-xl border border-blue-400/20 bg-blue-500/5 p-4 text-xs leading-relaxed text-gray-300">
        <strong className="text-blue-200">Audit basis:</strong> {codeAuditDate} · branch{' '}
        <code className="break-all text-gray-200">{codeAuditBranch}</code> · revision{' '}
        <code className="break-all text-gray-200">{codeAuditRevision}</code>.
        <br />
        No critical exploit, actual duplicate broker order, or current financial loss was established. Runtime,
        deployment, and financial-policy acceptance remain outside this finding set.
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {codeVerifiedFindings.map(finding => (
          <article key={finding.id} className="min-w-0 rounded-xl border border-gray-700/70 bg-[#0d1220] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="shrink-0 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-200">
                  {finding.evidenceClass}
                </span>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{finding.id}</span>
                  <h3 className="mt-1 text-sm font-semibold leading-relaxed text-white">{finding.title}</h3>
                </div>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${severityStyle[finding.severity]}`}>
                {finding.severity === 'boundary' ? 'Known boundary' : finding.severity}
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-300">{finding.summary}</p>
            <p className="mt-3 border-l-2 border-amber-400/50 pl-3 text-xs leading-relaxed text-gray-400">
              <strong className="text-amber-200">Evidence limit:</strong> {finding.evidenceLimit}
            </p>
            <div className="mt-4 border-t border-gray-800 pt-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Audited source pointers</h4>
              <ul className="mt-2 flex flex-wrap gap-2">
                {finding.sources.map(source => (
                  <li key={`${source.path}:${source.line}`}>
                    <a
                      className="inline-flex rounded-md border border-gray-700 bg-gray-800/60 px-2 py-1 font-mono text-[10px] text-blue-200 underline decoration-blue-500/40 underline-offset-2 hover:border-blue-400/50 hover:bg-blue-500/10"
                      href={sourceUrl(source.path, source.line)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {source.path}:{source.line}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
