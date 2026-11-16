import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  // 1. Detect country from standard edge/CDN/cloud proxy headers
  const countryCode =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-country') ||
    '';

  const city =
    request.headers.get('x-vercel-ip-city') ||
    request.headers.get('x-city') ||
    '';

  if (countryCode) {
    requestHeaders.set('x-detected-country', countryCode.toUpperCase());
  }
  if (city) {
    requestHeaders.set('x-detected-city', decodeURIComponent(city));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|pdf)$).*)']
};
