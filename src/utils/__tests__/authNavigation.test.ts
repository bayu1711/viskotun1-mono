import { describe, expect, it } from 'vitest';
import { ROUTES } from '../../data/navigation';
import { COPY } from '../../data/copy';

describe('Auth and Navigation Routing Contracts', () => {
  it('defines the correct destination routes for login and landing', () => {
    expect(ROUTES.login).toBe('/login');
    expect(ROUTES.landing).toBe('/');
    expect(ROUTES.routine).toBe('/routine');
    expect(ROUTES.dashboard).toBe('/dashboard');
  });

  it('contains expected labels and copy for sign out and authentication', () => {
    expect(COPY.auth.signOut).toBe('Sign out');
    expect(COPY.auth.defaultGuestName).toBe('Guest Explorer');
    expect(COPY.brand.name).toBe('ViskotuN1');
  });
});
