import type { ReactNode } from 'react';

interface MarkdownTextProps {
  text: string;
  className?: string;
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*)/g;
  const parts = text.split(pattern);

  parts.forEach((part, index) => {
    if (!part) return;

    if (part.startsWith('**') && part.endsWith('**')) {
      nodes.push(
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>,
      );
      return;
    }

    nodes.push(part);
  });

  return nodes;
}

export function MarkdownText({ text, className = '' }: MarkdownTextProps) {
  const lines = text.split(/\r?\n/);

  return (
    <div className={`space-y-2 whitespace-pre-wrap ${className}`}>
      {lines.map((line, index) => {
        const heading = line.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
          const level = heading[1].length;
          let sizeClass = 'text-sm';
          if (level === 1) {
            sizeClass = 'text-lg';
          } else if (level === 2) {
            sizeClass = 'text-base';
          }

          return (
            <p key={index} className={`${sizeClass} leading-relaxed font-bold`}>
              {renderInlineMarkdown(heading[2])}
            </p>
          );
        }

        if (line.trim() === '') {
          return <div key={index} className="h-1" />;
        }

        return (
          <p key={index} className="leading-relaxed">
            {renderInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
}
