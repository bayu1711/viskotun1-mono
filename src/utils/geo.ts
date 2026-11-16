export interface ClientDetectedRegion {
  countryCode: string;
  countryName: string;
  city?: string;
}

export function detectClientRegion(): ClientDetectedRegion {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (
      timeZone.includes('Dubai') ||
      timeZone.includes('Abu_Dhabi') ||
      timeZone.includes('Muscat')
    ) {
      return {
        countryCode: 'AE',
        countryName: 'United Arab Emirates',
        city: 'Abu Dhabi / Dubai'
      };
    }
    if (timeZone.includes('Riyadh')) {
      return {
        countryCode: 'SA',
        countryName: 'Saudi Arabia',
        city: 'Riyadh'
      };
    }
    if (timeZone.includes('London')) {
      return {
        countryCode: 'GB',
        countryName: 'United Kingdom',
        city: 'London'
      };
    }
    if (timeZone.includes('New_York') || timeZone.includes('Los_Angeles') || timeZone.includes('Chicago')) {
      return {
        countryCode: 'US',
        countryName: 'United States',
        city: 'New York'
      };
    }
  } catch {
    // Ignore error
  }

  // Default to UAE for this competition
  return {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    city: 'Abu Dhabi'
  };
}
