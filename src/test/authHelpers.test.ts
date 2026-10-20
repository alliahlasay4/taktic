import { describe, it, expect, beforeEach } from 'vitest';
import {
  isEmailConfirmationLink,
  isPasswordRecoveryLink,
  hasIncomingAuthLink,
  clearDemoData,
  clearUserScopedStorage,
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

  it('clears private user-scoped storage on signOut while preserving device preferences', () => {
    const userId = 'user-abc-123';
    localStorage.setItem(`taktic_circle_members_${userId}`, JSON.stringify([{ id: '1' }]));
    localStorage.setItem(`taktic_focus_pods_${userId}`, JSON.stringify([{ id: 'pod1' }]));
    localStorage.setItem(`taktic_user_profile_${userId}`, JSON.stringify({ fullName: 'Alice' }));
    localStorage.setItem('taktic_dark_mode', 'true');
    localStorage.setItem('taktic_ambient_volume', '0.5');

    clearUserScopedStorage(userId);

    expect(localStorage.getItem(`taktic_circle_members_${userId}`)).toBeNull();
    expect(localStorage.getItem(`taktic_focus_pods_${userId}`)).toBeNull();
    expect(localStorage.getItem(`taktic_user_profile_${userId}`)).toBeNull();
    expect(localStorage.getItem('taktic_dark_mode')).toBe('true');
    expect(localStorage.getItem('taktic_ambient_volume')).toBe('0.5');
  });
});
