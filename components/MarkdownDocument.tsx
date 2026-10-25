import { useEffect, useMemo, useState } from 'react';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { isValidElement } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MermaidDiagram } from './MermaidDiagram';

interface Props {
  title: string;
  path: 'README.md' | 'ROADMAP.md';
  sectionHeading?: string;
}

interface DetailsBlock { summary: string; body: string }

function extractDetails(markdown: string) {
  const details = new Map<string, DetailsBlock>();
  let index = 0;
  const transformed = markdown.replace(/<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi, (_whole, summary: string, body: string) => {
    const token = `MARKDOWN_DETAILS_BLOCK_${index++}`;
    details.set(token, {
      summary: summary.replace(/<[^>]*>/g, '').trim(),
      body: body.trim(),
    });
    return `\n\n${token}\n\n`;
  });
  return { markdown: transformed, details };
}

function extractSection(markdown: string, title: string) {
  const lines = markdown.split(/\r?\n/);
  const normalized = title.trim().toLowerCase();
  const headingText = (line: string) => line.replace(/^#{1,6}\s+/, '').trim().replace(/^\d+(?:\.\d+)*\.\s*/, '').toLowerCase();
  const start = lines.findIndex(line => /^#{1,6}\s+/.test(line) && headingText(line).includes(normalized));
  if (start < 0) return markdown;
  const level = (lines[start].match(/^#+/) ?? ['##'])[0].length;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const heading = lines[i].match(/^(#{1,6})\s+/);
    if (heading && heading[1].length <= level) { end = i; break; }
  }
  // The page has its own visible title, so show the requested section body
  // without repeating the source README's numbered heading.
  return lines.slice(start + 1, end).join('\n');
}

export function MarkdownDocument({ title, path, sectionHeading }: Props) {
  const [markdown, setMarkdown] = useState('');
  const [error, setError] = useState('');
  const documentContent = useMemo(() => extractDetails(markdown), [markdown]);

  useEffect(() => {
    const controller = new AbortController();
    setMarkdown('');
    setError('');

    fetch(path, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`Could not load ${path} (${response.status}).`);
        return response.text();
      })
      .then(text => setMarkdown(sectionHeading ? extractSection(text, sectionHeading) : text))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return;
        setError(reason instanceof Error ? reason.message : `Could not load ${path}.`);
      });

    return () => controller.abort();
  }, [path, sectionHeading]);

  const markdownComponents = useMemo(() => {
    let diagramIndex = 0;
    const plainText = (value: unknown): string => Array.isArray(value)
      ? value.map(plainText).join('')
      : value && typeof value === 'object' && 'props' in value
        ? plainText((value as { props?: { children?: unknown } }).props?.children)
        : String(value ?? '');
    const heading = (tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') => ({ children }: { children?: ReactNode }) => {
      const text = plainText(children);
      const base = text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/[\s-]+/g, '-');
      const Tag = tag;
      return <Tag id={base} className="scroll-mt-28">{children}</Tag>;
    };
    return {
      h1: heading('h1'), h2: heading('h2'), h3: heading('h3'), h4: heading('h4'), h5: heading('h5'), h6: heading('h6'),
      pre({ children }: { children?: ReactNode }) {
        const child = Array.isArray(children) ? children[0] : children;
        const isMermaid = isValidElement(child) && Boolean((child as ReactElement<{ className?: string }>).props.className?.split(/\s+/).includes('language-mermaid'));
        return isMermaid ? <>{children}</> : <pre className="markdown-code-block">{children}</pre>;
      },
      code({ className, children, ...props }: ComponentProps<'code'>) {
        if (className?.split(/\s+/).includes('language-mermaid')) {
          diagramIndex += 1;
          return <MermaidDiagram title={`README architecture diagram ${diagramIndex}`} source={String(children).replace(/\n$/, '')} />;
        }
        return <code className={className} {...props}>{children}</code>;
      },
      p({ children }: { children?: ReactNode }) {
        const child = Array.isArray(children) ? children[0] : children;
        if (typeof child === 'string' && documentContent.details.has(child)) {
          const block = documentContent.details.get(child)!;
          return <details className="markdown-details"><summary><strong>{block.summary}</strong></summary><div className="markdown-details-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{block.body}</ReactMarkdown></div></details>;
        }
        return <p>{children}</p>;
      },
    };
  }, [documentContent]);

  return (
    <section className="space-y-5" aria-labelledby="markdown-document-title">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Markdown document</p>
          <h2 id="markdown-document-title" className="mt-1 text-xl font-bold text-white">{title}</h2>
        </div>
        <a className="rounded-lg border border-gray-700 px-3 py-2 text-xs text-blue-200 hover:border-blue-400/50" href={path} target="_blank" rel="noreferrer">
          Open raw Markdown
        </a>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200" role="alert">{error}</div>
      ) : markdown ? (
        <article className="markdown-content rounded-xl border border-gray-800/70 bg-[#0d1220] p-5 sm:p-8">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{documentContent.markdown}</ReactMarkdown>
        </article>
      ) : (
        <p className="rounded-lg border border-gray-800 bg-[#0d1220] p-4 text-sm text-gray-400" role="status">Loading {title}…</p>
      )}
    </section>
  );
}
