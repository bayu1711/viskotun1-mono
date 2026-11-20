import { describe, expect, it } from 'vitest';
import { SAMPLE_PAPERS } from '../../data/samplePapers';
import {
  buildExternalSearchLinks,
  extractQueryFromInput,
  matchCommunityPapers
} from '../paperQuery';

describe('paperQuery', () => {
  describe('extractQueryFromInput', () => {
    it('extracts slug keywords from general web URLs', () => {
      const url = 'https://www.healthline.com/nutrition/creatine-for-sleep-deprivation.html';
      const extracted = extractQueryFromInput(url);
      expect(extracted).toContain('creatine');
      expect(extracted).toContain('sleep');
    });

    it('extracts query param from search URLs', () => {
      const url = 'https://pubmed.ncbi.nlm.nih.gov/?term=achilles+tendinopathy';
      const extracted = extractQueryFromInput(url);
      expect(extracted).toBe('achilles tendinopathy');
    });

    it('cleans conversational questions', () => {
      const text = 'Do you have anything for knee tendonitis?';
      const extracted = extractQueryFromInput(text);
      expect(extracted.toLowerCase()).toBe('knee tendonitis');
    });

    it('handles empty or malformed inputs safely', () => {
      expect(extractQueryFromInput('')).toBe('');
      expect(extractQueryFromInput('   ')).toBe('');
    });
  });

  describe('matchCommunityPapers', () => {
    it('matches Achilles paper for tendon or knee queries', () => {
      const results = matchCommunityPapers('achilles tendon', SAMPLE_PAPERS);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('achilles-rehab');
    });

    it('matches Hair regrowth paper for hair loss or alopecia', () => {
      const results = matchCommunityPapers('alopecia hair regrowth', SAMPLE_PAPERS);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('hair-regrowth');
    });

    it('matches Creatine paper for sleep fatigue', () => {
      const results = matchCommunityPapers('creatine sleep', SAMPLE_PAPERS);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('creatine-sleep');
    });

    it('never returns guardrail rejection test papers', () => {
      const results = matchCommunityPapers('rodent weight pulling', SAMPLE_PAPERS);
      expect(results.every((p) => !p.isGuardrailRejectionTest)).toBe(true);
    });

    it('returns top community papers when query is empty', () => {
      const results = matchCommunityPapers('', SAMPLE_PAPERS);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].isGuardrailRejectionTest).toBeFalsy();
    });
  });

  describe('buildExternalSearchLinks', () => {
    it('generates pre-filtered PubMed and Europe PMC links', () => {
      const links = buildExternalSearchLinks('achilles tendinopathy');
      expect(links.pubmed).toContain('pubmed.ncbi.nlm.nih.gov');
      expect(links.pubmed).toContain('clinical');
      expect(links.europePmc).toContain('europepmc.org');
      expect(links.europePmc).toContain('OPEN_ACCESS');
      expect(links.googleScholar).toContain('scholar.google.com');
    });
  });
});
