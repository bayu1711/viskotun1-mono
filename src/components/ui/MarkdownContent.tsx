import React from 'react';
import { cn } from '../../utils/cn';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export type MarkdownBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; lines: string[] }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'blockquote'; lines: string[] }
  | { type: 'hr' };

export function renderInline(text: string): React.ReactNode[] {
  // Matches bold (**...** or __...__), inline code (`...`), markdown links ([...](...)), italic (*...* or _..._)
  const tokenRegex = /(\*\*[\s\S]+?\*\*|__[\s\S]+?__|`[^`]+`|\[[^\]]+\]\([^\)]+\)|\*[^\*\n]+?\*|_[^_\n]+?_)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold (**...** or __...__)
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      const inner = part.slice(2, -2);
      return (
        <strong key={index} className="font-semibold text-ink">
          {inner}
        </strong>
      );
    }

    // Inline code (`...`)
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code key={index} className="rounded bg-ink/5 px-1 py-0.5 text-2xs font-mono text-ink">
          {inner}
        </code>
      );
    }

    // Markdown link ([...](...))
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline decoration-ink/40 hover:text-ink"
        >
          {linkMatch[1]}
        </a>
      );
    }

    // Italic (*...* or _..._)
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic text-ink/90">
          {inner}
        </em>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export function parseMarkdownBlocks(rawText: string): MarkdownBlock[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let currentBlock: MarkdownBlock | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. Blank line -> terminates current block
    if (trimmed === '') {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }

    // 2. Headings: support #, ##, ###, and accidental typo prefixes (e.g. x###)
    const headingMatch = trimmed.match(/^(?:x\s*)?(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();

      // Deduplicate immediate duplicate headings (e.g. repeated exercise title)
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock && lastBlock.type === 'heading' && lastBlock.text.toLowerCase() === text.toLowerCase()) {
        continue;
      }

      blocks.push({ type: 'heading', level, text });
      continue;
    }

    // 3. Horizontal Rule: ---, ***, ___
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      blocks.push({ type: 'hr' });
      continue;
    }

    // 4. Unordered List Items: * item, - item, • item, + item
    const ulMatch = trimmed.match(/^[\*\-•\+]\s+(.*)$/);
    if (ulMatch) {
      const itemText = ulMatch[1].trim();
      if (currentBlock && currentBlock.type === 'ul') {
        currentBlock.items.push(itemText);
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'ul', items: [itemText] };
      }
      continue;
    }

    // 5. Ordered List Items: 1. item, 1) item
    const olMatch = trimmed.match(/^\d+[\.\)]\s+(.*)$/);
    if (olMatch) {
      const itemText = olMatch[1].trim();
      if (currentBlock && currentBlock.type === 'ol') {
        currentBlock.items.push(itemText);
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'ol', items: [itemText] };
      }
      continue;
    }

    // 6. Blockquote: > text
    const quoteMatch = trimmed.match(/^>\s*(.*)$/);
    if (quoteMatch) {
      const quoteText = quoteMatch[1];
      if (currentBlock && currentBlock.type === 'blockquote') {
        currentBlock.lines.push(quoteText);
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'blockquote', lines: [quoteText] };
      }
      continue;
    }

    // 7. List continuation lines
    if (currentBlock && currentBlock.type === 'ul' && (rawLine.startsWith('  ') || rawLine.startsWith('\t'))) {
      const lastIdx = currentBlock.items.length - 1;
      currentBlock.items[lastIdx] += ' ' + trimmed;
      continue;
    }

    if (currentBlock && currentBlock.type === 'ol' && (rawLine.startsWith('  ') || rawLine.startsWith('\t'))) {
      const lastIdx = currentBlock.items.length - 1;
      currentBlock.items[lastIdx] += ' ' + trimmed;
      continue;
    }

    // 8. Regular paragraph text
    if (currentBlock && currentBlock.type === 'paragraph') {
      currentBlock.lines.push(trimmed);
    } else {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: 'paragraph', lines: [trimmed] };
    }
  }

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  if (!content) return null;

  const blocks = parseMarkdownBlocks(content);

  return (
    <div className={cn('space-y-2.5 text-sm text-ink leading-relaxed', className)}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading': {
            if (block.level === 1) {
              return (
                <h3 key={idx} className="text-base font-semibold text-ink mt-3 first:mt-0 mb-1 leading-snug">
                  {renderInline(block.text)}
                </h3>
              );
            }
            if (block.level === 2) {
              return (
                <h4 key={idx} className="text-sm font-semibold text-ink mt-2.5 first:mt-0 mb-1 leading-snug">
                  {renderInline(block.text)}
                </h4>
              );
            }
            return (
              <h5 key={idx} className="text-xs font-bold text-ink/80 tracking-wide uppercase mt-2 first:mt-0 mb-0.5 leading-snug">
                {renderInline(block.text)}
              </h5>
            );
          }

          case 'paragraph': {
            return (
              <p key={idx} className="text-sm leading-relaxed text-ink/90">
                {block.lines.map((line, lineIdx) => (
                  <React.Fragment key={lineIdx}>
                    {lineIdx > 0 && <br />}
                    {renderInline(line)}
                  </React.Fragment>
                ))}
              </p>
            );
          }

          case 'ul': {
            return (
              <ul key={idx} className="my-1.5 space-y-1.5 pl-0.5">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2 text-sm leading-relaxed text-ink/90">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/50" />
                    <span className="flex-1">{renderInline(item)}</span>
                  </li>
                ))}
              </ul>
            );
          }

          case 'ol': {
            return (
              <ol key={idx} className="my-1.5 space-y-1.5 pl-0.5">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2 text-sm leading-relaxed text-ink/90">
                    <span className="shrink-0 font-medium text-xs text-ink/60 tabular-nums">
                      {itemIdx + 1}.
                    </span>
                    <span className="flex-1">{renderInline(item)}</span>
                  </li>
                ))}
              </ol>
            );
          }

          case 'blockquote': {
            return (
              <blockquote key={idx} className="my-2 border-l-2 border-ink/20 pl-3 italic text-xs text-ink/70">
                {block.lines.map((line, lIdx) => (
                  <p key={lIdx}>{renderInline(line)}</p>
                ))}
              </blockquote>
            );
          }

          case 'hr': {
            return <hr key={idx} className="my-2 border-ink/10" />;
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
