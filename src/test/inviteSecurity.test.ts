import { describe, it, expect } from 'vitest';

// Test validation logic mirrored in invite-partner edge function
const ALLOWED_ORIGINS = [
  'https://taktic.app',
  'https://taktic-1.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeOrigin(origin: string | undefined): string {
  if (!origin) return 'https://taktic.app';
  try {
    const parsed = new URL(origin);
    if (ALLOWED_ORIGINS.includes(parsed.origin)) {
      return parsed.origin;
    }
  } catch {
    // invalid URL
  }
  return 'https://taktic.app';
}

function validateInviteRequest(callerEmail: string, targetEmail: string, origin?: string) {
  if (!targetEmail || !EMAIL_REGEX.test(targetEmail.trim().toLowerCase()) || targetEmail.length > 254) {
    return { valid: false, error: 'Invalid email format' };
  }
  if (callerEmail.toLowerCase() === targetEmail.trim().toLowerCase()) {
    return { valid: false, error: 'Self-invite not allowed' };
  }
  const safeOrigin = sanitizeOrigin(origin);
  return { valid: true, origin: safeOrigin };
}

describe('Invite Partner Security Guardrails', () => {
  it('blocks invalid email formats', () => {
    expect(validateInviteRequest('alice@example.com', 'not-an-email').valid).toBe(false);
    expect(validateInviteRequest('alice@example.com', '@nodomain.com').valid).toBe(false);
    expect(validateInviteRequest('alice@example.com', '').valid).toBe(false);
  });

  it('prevents self-invitation', () => {
    const res = validateInviteRequest('alice@example.com', 'alice@example.com');
    expect(res.valid).toBe(false);
    expect(res.error).toBe('Self-invite not allowed');
  });

  it('whitelists trusted origins and blocks open redirect attempts', () => {
    const trusted = validateInviteRequest('alice@example.com', 'bob@example.com', 'https://taktic.app/login');
    expect(trusted.valid).toBe(true);
    expect(trusted.origin).toBe('https://taktic.app');

    const localTrusted = validateInviteRequest('alice@example.com', 'bob@example.com', 'http://localhost:5173');
    expect(localTrusted.origin).toBe('http://localhost:5173');

    const attackerUrl = validateInviteRequest('alice@example.com', 'bob@example.com', 'https://evil-phishing-domain.com/capture');
    expect(attackerUrl.origin).toBe('https://taktic.app');

    const javascriptScheme = validateInviteRequest('alice@example.com', 'bob@example.com', 'javascript:alert(1)');
    expect(javascriptScheme.origin).toBe('https://taktic.app');
  });
});
