import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownTextProps {
  text: string;
  className?: string;
}

export function MarkdownText({ text, className = '' }: MarkdownTextProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-(--color-main-ui) underline underline-offset-2"
            >
              {children}
            </a>
          ),
          p: ({ children }) => (
            <p className="leading-relaxed text-slate-700">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-5">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed text-slate-700">{children}</li>
          ),
          h1: ({ children }) => (
            <h1 className="text-lg font-bold text-slate-950">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-slate-950">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold text-slate-950">{children}</h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-slate-200 pl-3 text-slate-600">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-900">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-t border-slate-100 px-3 py-2 text-slate-700">
              {children}
            </td>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-xs leading-relaxed text-slate-50 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-slate-50">
              {children}
            </pre>
          ),
          code: ({ children }) => (
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
              {children}
            </code>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
