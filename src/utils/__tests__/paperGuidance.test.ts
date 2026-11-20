import { describe, expect, it } from 'vitest';
import { COPY } from '../../data/copy';
import { SAMPLE_PAPERS } from '../../data/samplePapers';
import { buildExternalSearchLinks, matchCommunityPapers } from '../paperQuery';
import { isUnrecognizedLinkReason, answerForGuidance } from '../rejectionAssistant';

describe('Paper Guidance & Discovery Flow', () => {
  it('correctly identifies unrecognized link reasons vs policy rejections', () => {
    expect(isUnrecognizedLinkReason(COPY.extraction.linkNotRecognized)).toBe(true);
    expect(isUnrecognizedLinkReason('No DOI, PubMed or PMC ID found in that link.')).toBe(true);
    expect(isUnrecognizedLinkReason(COPY.extraction.paperNotFound)).toBe(true);
    expect(isUnrecognizedLinkReason(COPY.extraction.fullTextUnavailable)).toBe(true);

    // Gatekeeper scientific policy rejections must NOT be treated as unrecognized links
    expect(isUnrecognizedLinkReason(COPY.extraction.declinedAnimalReason)).toBe(false);
    expect(isUnrecognizedLinkReason(COPY.extraction.declinedTheoreticalReason)).toBe(false);
  });

  it('provides matching community routines and direct external links for topic queries', () => {
    const guidance = answerForGuidance('hair regrowth');
    expect(guidance).toContain('Recommended Community Routines');
    expect(guidance).toContain('Alopecia Hair Regrowth');
    expect(guidance).toContain('pubmed.ncbi.nlm.nih.gov');
    expect(guidance).toContain('europepmc.org');
    expect(guidance).toContain('scholar.google.com');
  });

  it('matches appropriate community paper for tendon rehab query', () => {
    const matches = matchCommunityPapers('achilles tendonitis', SAMPLE_PAPERS);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].id).toBe('achilles-rehab');
    expect(matches[0].routineId).toBe('achilles');
  });

  it('builds pre-filtered PubMed queries emphasizing clinical trials', () => {
    const links = buildExternalSearchLinks('creatine sleep fatigue');
    expect(links.pubmed).toContain('pubmed.ncbi.nlm.nih.gov');
    expect(links.pubmed).toContain('clinical');
    expect(links.europePmc).toContain('europepmc.org');
    expect(links.europePmc).toContain('OPEN_ACCESS');
  });
});
