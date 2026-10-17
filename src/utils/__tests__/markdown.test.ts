import { describe, it, expect } from 'vitest';
import { parseMarkdownBlocks } from '../../components/ui/MarkdownContent';

describe('MarkdownContent parser', () => {
  it('parses headings and deduplicates identical consecutive headers', () => {
    const raw = `### Bent-Knee Eccentric Heel Drops\n\n### Bent-Knee Eccentric Heel Drops\n\nSome paragraph text.`;
    const blocks = parseMarkdownBlocks(raw);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({
      type: 'heading',
      level: 3,
      text: 'Bent-Knee Eccentric Heel Drops'
    });
    expect(blocks[1]).toEqual({
      type: 'paragraph',
      lines: ['Some paragraph text.']
    });
  });

  it('handles accidental leading character on headings (e.g. x###)', () => {
    const raw = `x### Bent-Knee Eccentric Heel Drops\n\nParagraph text`;
    const blocks = parseMarkdownBlocks(raw);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({
      type: 'heading',
      level: 3,
      text: 'Bent-Knee Eccentric Heel Drops'
    });
  });

  it('parses unordered lists with bullet markers and inline bold', () => {
    const raw = `* **Posture and Form:** Stand with balls of feet on edge.\n* **Execution:** Lower heels down slowly.`;
    const blocks = parseMarkdownBlocks(raw);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('ul');
    if (blocks[0].type === 'ul') {
      expect(blocks[0].items).toHaveLength(2);
      expect(blocks[0].items[0]).toBe('**Posture and Form:** Stand with balls of feet on edge.');
      expect(blocks[0].items[1]).toBe('**Execution:** Lower heels down slowly.');
    }
  });

  it('parses ordered lists properly', () => {
    const raw = `1. First step\n2. Second step`;
    const blocks = parseMarkdownBlocks(raw);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('ol');
    if (blocks[0].type === 'ol') {
      expect(blocks[0].items).toEqual(['First step', 'Second step']);
    }
  });

  it('parses blockquotes and horizontal rules', () => {
    const raw = `> Advisory note\n\n---\n\nConclusion`;
    const blocks = parseMarkdownBlocks(raw);

    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toEqual({ type: 'blockquote', lines: ['Advisory note'] });
    expect(blocks[1]).toEqual({ type: 'hr' });
    expect(blocks[2]).toEqual({ type: 'paragraph', lines: ['Conclusion'] });
  });

  it('handles empty input gracefully', () => {
    expect(parseMarkdownBlocks('')).toEqual([]);
    expect(parseMarkdownBlocks('   ')).toEqual([]);
  });
});
