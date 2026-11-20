/**
 * Decodes a percent-encoded header value (CDN geo headers such as x-vercel-ip-city).
 * A malformed value is returned as-is instead of throwing, so one bad header can never
 * turn every request into a 500.
 */
export function safeDecodeHeader(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
