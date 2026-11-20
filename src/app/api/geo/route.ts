import { NextResponse, type NextRequest } from 'next/server';
import { resolveCountryName, resolveRegionFromTimezone } from '../../../utils/geo';
import { safeDecodeHeader } from '../../../utils/headers';

export async function GET(request: NextRequest) {
  const headerCountry =
    request.headers.get('x-detected-country') ||
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    '';
  const headerCity =
    request.headers.get('x-detected-city') ||
    request.headers.get('x-vercel-ip-city') ||
    '';

  if (headerCountry && headerCountry.toUpperCase() !== 'XX') {
    const code = headerCountry.trim().toUpperCase().slice(0, 3);
    return NextResponse.json({
      countryCode: code,
      countryName: resolveCountryName(code),
      city: headerCity ? safeDecodeHeader(headerCity).slice(0, 100) : undefined,
      source: 'middleware_header',
      confirmed: false
    });
  }

  const tz = request.nextUrl.searchParams.get('tz') || undefined;
  const tzMatch = resolveRegionFromTimezone(tz);
  if (tzMatch) {
    return NextResponse.json({
      ...tzMatch,
      source: 'client_timezone',
      confirmed: false
    });
  }

  // Global neutral fallback when neither CDN geo headers nor timezone resolved
  return NextResponse.json({
    countryCode: '',
    countryName: '',
    city: undefined,
    source: 'default_global',
    confirmed: false
  });
}
