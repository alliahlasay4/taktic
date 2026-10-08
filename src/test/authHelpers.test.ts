import { describe, it, expect, beforeEach } from 'vitest';
import {
  isEmailConfirmationLink,
  isPasswordRecoveryLink,
  hasIncomingAuthLink,
  clearDemoData,
} from '../context/AuthContext';

describe('AuthContext Link & Token Helpers', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    sessionStorage.clear();
    localStorage.clear();
  });

  it('detects email confirmation link from URL search or hash', () => {
    window.history.replaceState(null, '', '/?type=signup');
    expect(isEmailConfirmationLink()).toBe(true);

    window.history.replaceState(null, '', '/#type=email_change');
    expect(isEmailConfirmationLink()).toBe(true);

    window.history.replaceState(null, '', '/#unrelated=true');
    expect(isEmailConfirmationLink()).toBe(false);
  });

  it('detects password recovery links accurately', () => {
    window.history.replaceState(null, '', '/#type=recovery');
    expect(isPasswordRecoveryLink()).toBe(true);

    window.history.replaceState(null, '', '/#type=signup');
    expect(isPasswordRecoveryLink()).toBe(false);
  });

  it('detects incoming auth tokens and OAuth codes', () => {
    window.history.replaceState(null, '', '/?code=supabase-pkce-code-123');
    expect(hasIncomingAuthLink()).toBe(true);

    window.history.replaceState(null, '', '/#access_token=mock-token-xyz');
    expect(hasIncomingAuthLink()).toBe(true);
  });

  it('clears demo-specific local and session storage keys without removing user keys', () => {
    sessionStorage.setItem('taktic_demo_profile', JSON.stringify({ name: 'Demo' }));
    localStorage.setItem('taktic_demo_mode', 'true');
    localStorage.setItem('taktic_habits_demo', '[]');
    localStorage.setItem('taktic_user_real_data', 'keep-me');

    clearDemoData();

    expect(sessionStorage.getItem('taktic_demo_profile')).toBeNull();
    expect(localStorage.getItem('taktic_demo_mode')).toBeNull();
    expect(localStorage.getItem('taktic_habits_demo')).toBeNull();
    expect(localStorage.getItem('taktic_user_real_data')).toBe('keep-me');
  });
});
