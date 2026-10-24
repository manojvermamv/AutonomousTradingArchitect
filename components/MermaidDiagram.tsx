import { useEffect, useId, useState } from 'react';

interface MermaidRuntime {
  initialize: (config: Record<string, unknown>) => void;
  render: (id: string, source: string) => Promise<{ svg: string }>;
}

let mermaidConfigured = false;

interface Props {
  title: string;
  source: string;
}

export function MermaidDiagram({ title, source }: Props) {
  const reactId = useId();
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);
  const renderId = `mermaid-${reactId.replace(/[^a-zA-Z0-9]/g, '')}`;

  useEffect(() => {
    let mounted = true;
    const runtime = (window as Window & { mermaid?: MermaidRuntime }).mermaid;
    if (!runtime) {
      setError('Mermaid runtime did not load.');
      return () => { mounted = false; };
    }
    if (!mermaidConfigured) {
      runtime.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'dark',
        look: 'classic',
        flowchart: { curve: 'step', nodeSpacing: 30, rankSpacing: 42, htmlLabels: true },
        themeVariables: {
          darkMode: true,
          background: '#0d1117',
          primaryColor: '#1f1f1f',
          primaryTextColor: '#f0f6fc',
          primaryBorderColor: '#8b949e',
          lineColor: '#8b949e',
          secondaryColor: '#161b22',
          tertiaryColor: '#0d1117',
          edgeLabelBackground: '#30363d',
          fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        },
      });
      mermaidConfigured = true;
    }

    runtime.render(renderId, source)
      .then(result => { if (mounted) { setSvg(result.svg); setError(''); } })
      .catch((reason: unknown) => {
        if (mounted) setError(reason instanceof Error ? reason.message : 'Mermaid could not render this source.');
      });
    return () => { mounted = false; };
  }, [renderId, source]);

  const copySource = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-xl border border-gray-700/70 bg-[#0d1117]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 px-4 py-3">
        <h3 className="min-w-0 text-sm font-semibold text-gray-100">{title}</h3>
        <div className="flex items-center gap-2" aria-label="Diagram controls">
          <button className="diagram-control" type="button" onClick={() => setZoom(value => Math.max(0.7, value - 0.15))} aria-label={`Zoom out ${title}`}>−</button>
          <button className="diagram-control" type="button" onClick={() => setZoom(1)} aria-label={`Fit ${title}`}>Fit</button>
          <button className="diagram-control" type="button" onClick={() => setZoom(value => Math.min(2.5, value + 0.15))} aria-label={`Zoom in ${title}`}>+</button>
          <span className="min-w-10 text-right text-xs text-gray-500">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {error ? (
        <div className="p-4" role="status">
          <p className="mb-3 text-sm text-amber-200">Diagram render unavailable. The canonical Mermaid source remains available below.</p>
          <pre className="diagram-source"><code>{source}</code></pre>
        </div>
      ) : svg ? (
        <div className="diagram-canvas" aria-label={`${title} rendered Mermaid diagram`}>
          <div className="diagram-svg" style={{ width: `${zoom * 100}%` }} dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      ) : (
        <div className="p-5 text-sm text-gray-500" role="status">Rendering diagram…</div>
      )}

      <details className="border-t border-gray-800">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-blue-200 hover:text-blue-100">Inspect Mermaid source</summary>
        <div className="px-4 pb-4">
          <button className="diagram-copy" type="button" onClick={copySource}>{copied ? 'Copied' : 'Copy source'}</button>
          <pre className="diagram-source mt-3"><code>{source}</code></pre>
        </div>
      </details>
    </article>
  );
}
