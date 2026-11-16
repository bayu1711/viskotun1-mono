import { NextResponse, type NextRequest } from 'next/server';

const COUNTRY_NAMES: Record<string, string> = {
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  GB: 'United Kingdom',
  US: 'United States',
  IN: 'India',
  EG: 'Egypt',
  QA: 'Qatar',
  KW: 'Kuwait',
  BH: 'Bahrain',
  OM: 'Oman',
  SG: 'Singapore',
  DE: 'Germany',
  FR: 'France',
  CA: 'Canada',
  AU: 'Australia'
};

export async function GET(request: NextRequest) {
  const headerCountry = request.headers.get('x-detected-country') || request.headers.get('x-vercel-ip-country') || '';
  const headerCity = request.headers.get('x-detected-city') || request.headers.get('x-vercel-ip-city') || '';

  if (headerCountry) {
    const code = headerCountry.toUpperCase();
    return NextResponse.json({
      countryCode: code,
      countryName: COUNTRY_NAMES[code] || code,
      city: headerCity ? decodeURIComponent(headerCity) : undefined,
      source: 'middleware_header',
      confirmed: false
    });
  }

  // Competition default: United Arab Emirates (Abu Dhabi)
  return NextResponse.json({
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    city: 'Abu Dhabi',
    source: 'default_uae',
    confirmed: false
  });
}
