import { describe, expect, it, vi } from 'vitest';

const { generateContentMock } = vi.hoisted(() => ({
  generateContentMock: vi.fn()
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: generateContentMock
    })
  }))
}));

import { POST } from '../../app/api/lifestyle/tune/route';

describe('POST /api/lifestyle/tune', () => {
  it('updates region to Colombo, Sri Lanka and does NOT create a custom lifestyle tag', async () => {
    const req = new Request('http://localhost/api/lifestyle/tune', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'change my region to colombo sri lanka',
        country: 'AE',
        currentProfile: {
          region: {
            countryCode: 'AE',
            countryName: 'United Arab Emirates',
            city: 'Abu Dhabi',
            detectedBy: 'default_global',
            confirmed: true
          },
          activeTags: ['Early Dawn Riser']
        },
        interviewStage: 'complete'
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.profileUpdates.region).toBeDefined();
    expect(data.profileUpdates.region.city).toBe('Colombo');
    expect(data.profileUpdates.region.countryCode).toBe('LK');
    expect(data.profileUpdates.region.countryName).toBe('Sri Lanka');
    expect(data.profileUpdates.region.confirmed).toBe(true);

    // Verify the command did not leak into activeTags
    expect(data.extractedTags).not.toContain('change my region to colombo sri lanka');
    if (data.profileUpdates.activeTags) {
      expect(data.profileUpdates.activeTags).not.toContain('change my region to colombo sri lanka');
    }
    expect(data.reply).toContain('Colombo');
  });

  it('captures genuine custom lifestyle habits when no canned factor matches', async () => {
    const req = new Request('http://localhost/api/lifestyle/tune', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Daily sunset rooftop stretches',
        country: 'LK',
        currentProfile: {
          region: {
            countryCode: 'LK',
            countryName: 'Sri Lanka',
            city: 'Colombo',
            confirmed: true
          },
          activeTags: []
        },
        interviewStage: 'complete'
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.extractedTags).toContain('Daily sunset rooftop stretches');
    expect(data.profileUpdates.activeTags).toContain('Daily sunset rooftop stretches');
  });

  it('uses AI-first semantic intent extraction when Gemini is available', async () => {
    const originalKeys = process.env.GEMINI_API_KEYS;
    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.GEMINI_API_KEYS = 'test-gemini-key';

    generateContentMock.mockResolvedValueOnce({
      response: {
        text: () =>
          JSON.stringify({
            region: {
              countryCode: 'LK',
              countryName: 'Sri Lanka',
              city: 'Colombo'
            },
            age: 32,
            availabilityMode: 'windows',
            availableWindows: [{ start: 360, end: 420 }],
            workPattern: 'desk_sedentary',
            climateSensitivity: 'high_humidity',
            smokingStatus: 'non_smoker',
            isRamadanFastingObserver: false,
            culturalRhythms: [],
            physicalCautions: ['Knee sensitivity'],
            lifestyleTags: [],
            reply: 'Profile tuned for Colombo, Sri Lanka with morning schedule and knee caution.'
          })
      }
    });

    const req = new Request('http://localhost/api/lifestyle/tune', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'change my region to colombo sri lanka, I am 32 with a desk job and mild knee pain',
        country: 'AE',
        currentProfile: {
          region: {
            countryCode: 'AE',
            countryName: 'United Arab Emirates',
            city: 'Abu Dhabi',
            confirmed: true
          },
          activeTags: []
        },
        interviewStage: 'complete'
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.engine).toBe('cloud-gemini');
    expect(data.profileUpdates.region?.city).toBe('Colombo');
    expect(data.profileUpdates.region?.countryCode).toBe('LK');
    expect(data.userProfileUpdates?.age).toBe(32);
    expect(data.profileUpdates?.workPattern).toBe('desk_sedentary');
    expect(data.profileUpdates?.physicalCautions).toContain('Knee sensitivity');
    expect(data.extractedTags).not.toContain(
      'change my region to colombo sri lanka, I am 32 with a desk job and mild knee pain'
    );

    if (originalKeys !== undefined) process.env.GEMINI_API_KEYS = originalKeys;
    else delete process.env.GEMINI_API_KEYS;
    if (originalKey !== undefined) process.env.GEMINI_API_KEY = originalKey;
    else delete process.env.GEMINI_API_KEY;
  });
});
