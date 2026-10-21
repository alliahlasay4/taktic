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

  it('detects password recovery links accurately across search and hash', () => {
    window.history.replaceState(null, '', '/#type=recovery');
    expect(isPasswordRecoveryLink()).toBe(true);

    window.history.replaceState(null, '', '/?type=recovery');
    expect(isPasswordRecoveryLink()).toBe(true);

    window.history.replaceState(null, '', '/#access_token=test_tok&refresh_token=ref_tok&type=recovery');
    expect(isPasswordRecoveryLink()).toBe(true);

    window.history.replaceState(null, '', '/#type=signup');
    expect(isPasswordRecoveryLink()).toBe(false);

    window.history.replaceState(null, '', '/login');
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
    localStorage.setItem('taktic_circles_onboarding_completed', 'true');
    localStorage.setItem(`taktic_circles_onboarding_completed_${userId}`, 'true');

    clearUserScopedStorage(userId);

    expect(localStorage.getItem(`taktic_circle_members_${userId}`)).toBeNull();
    expect(localStorage.getItem(`taktic_focus_pods_${userId}`)).toBeNull();
    expect(localStorage.getItem(`taktic_user_profile_${userId}`)).toBeNull();
    expect(localStorage.getItem('taktic_dark_mode')).toBe('true');
    expect(localStorage.getItem('taktic_ambient_volume')).toBe('0.5');
    expect(localStorage.getItem('taktic_circles_onboarding_completed')).toBe('true');
    expect(localStorage.getItem(`taktic_circles_onboarding_completed_${userId}`)).toBe('true');
  });

  it('recognizes reset-password and update-password paths as auth routes', async () => {
    const { isAuthPath } = await import('../lib/routes');
    expect(isAuthPath('/reset-password')).toBe(true);
    expect(isAuthPath('/update-password')).toBe(true);
    expect(isAuthPath('/login')).toBe(true);
    expect(isAuthPath('/signup')).toBe(true);
    expect(isAuthPath('/focushub')).toBe(false);
  });

  it('keeps DEFAULT_PROFILE neutral and separates DEMO_PROFILE to prevent demo flash on sign in', async () => {
    const { DEFAULT_PROFILE, DEMO_PROFILE } = await import('../context/AuthContext');
    expect(DEFAULT_PROFILE.fullName).toBe('');
    expect(DEFAULT_PROFILE.username).toBe('');
    expect(DEFAULT_PROFILE.id).toBe('');
    expect(DEMO_PROFILE.fullName).toBe('Portfolio Reviewer');
    expect(DEMO_PROFILE.username).toBe('@reviewer');
    expect(DEMO_PROFILE.id).toBe('demo-user-123');
  });

  it('detects circle invite mismatch and incorporates into hasIncomingAuthLink', async () => {
    const { isCircleInviteMismatchLink, hasIncomingAuthLink } = await import('../context/AuthContext');

    // Scenario: user is logged in as inviter@example.com
    localStorage.setItem(
      'sb-test-auth-token',
      JSON.stringify({ user: { email: 'inviter@example.com' } })
    );

    // Link arrives for invitee@example.com
    window.history.replaceState(null, '', '/login?circle_invite=tok123&email=invitee%40example.com');
    expect(isCircleInviteMismatchLink()).toBe(true);
    expect(hasIncomingAuthLink()).toBe(true);

    // Link arrives matching the logged-in email
    window.history.replaceState(null, '', '/login?circle_invite=tok123&email=inviter%40example.com');
    expect(isCircleInviteMismatchLink()).toBe(false);
  });
});

