import { useEffect, useState } from 'react';
import { MermaidDiagram } from './MermaidDiagram';

interface DiagramSource {
  title: string;
  source: string;
}

function extractDiagrams(markdown: string): DiagramSource[] {
  const diagrams: DiagramSource[] = [];
  const pattern = /^```mermaid\s*\r?\n([\s\S]*?)^```\s*$/gm;
  for (const match of markdown.matchAll(pattern)) {
    const before = markdown.slice(0, match.index ?? 0);
    const headings = [...before.matchAll(/^#{1,6}\s+(.+)$/gm)];
    const title = headings.at(-1)?.[1]?.trim() ?? `Architecture diagram ${diagrams.length + 1}`;
    diagrams.push({ title, source: match[1].trim() });
  }
  return diagrams;
}

export function MermaidDiagrams() {
  const [diagrams, setDiagrams] = useState<DiagramSource[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('README.md', { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`Could not load the canonical README source (${response.status}).`);
        return response.text();
      })
      .then(markdown => {
        const extracted = extractDiagrams(markdown);
        if (!extracted.length) throw new Error('No fenced Mermaid source blocks were found in README.md.');
        setDiagrams(extracted);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return;
        setError(reason instanceof Error ? reason.message : 'Could not load the README diagrams.');
      });
    return () => controller.abort();
  }, []);

  return (
    <section className="space-y-5" aria-labelledby="diagrams-heading">
      <header>
        <h2 id="diagrams-heading" className="page-heading">Architecture Diagrams</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-400">Rendered from the fenced Mermaid blocks in Master README.md. The README source is the sole diagram definition; use each card to inspect or copy it.</p>
      </header>
      {error ? <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200" role="status">{error} Mermaid source remains readable in the Master README.</p> : null}
      {diagrams.map((diagram, index) => <MermaidDiagram key={`${index}-${diagram.title}`} {...diagram} />)}
      {!diagrams.length && !error ? <p className="text-sm text-gray-500" role="status">Loading canonical Mermaid sources…</p> : null}
    </section>
  );
}
