import { describe, it, expect } from 'vitest';
import { sanitizeAvatarUrl, DEFAULT_AVATAR } from '../lib/profileSupabase';
import { sanitizeCsvField } from '../lib/csvSecurity';

describe('Slice 4 Security Hardening: Avatar & CSV Safety', () => {
  describe('Avatar URI Sanitization', () => {
    it('allows valid HTTPS image URLs', () => {
      const valid = 'https://images.unsplash.com/photo-1234?w=150';
      expect(sanitizeAvatarUrl(valid)).toBe(valid);
    });

    it('rejects javascript: and dangerous URI schemes', () => {
      expect(sanitizeAvatarUrl('javascript:alert(1)')).toBe(DEFAULT_AVATAR);
      expect(sanitizeAvatarUrl('vbscript:msgbox(1)')).toBe(DEFAULT_AVATAR);
      expect(sanitizeAvatarUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe(DEFAULT_AVATAR);
    });

    it('rejects oversized base64 data URIs (>500KB)', () => {
      // 600KB dummy base64 string
      const hugeDataUri = 'data:image/png;base64,' + 'A'.repeat(600 * 1024);
      expect(sanitizeAvatarUrl(hugeDataUri)).toBe(DEFAULT_AVATAR);
    });

    it('allows reasonable sized base64 image data URIs (<500KB)', () => {
      const smallDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      expect(sanitizeAvatarUrl(smallDataUri)).toBe(smallDataUri);
    });
  });

  describe('CSV Formula Injection Defense', () => {
    it('prefixes formula triggers (=, +, -, @) with single quote', () => {
      expect(sanitizeCsvField('=cmd|"/C calc"!A0')).toBe(`"'=cmd|""/C calc""!A0"`);
      expect(sanitizeCsvField('+SUM(A1:A10)')).toBe(`"'+SUM(A1:A10)"`);
      expect(sanitizeCsvField('-10+20')).toBe(`"'-10+20"`);
      expect(sanitizeCsvField('@SUM(1,2)')).toBe(`"'@SUM(1,2)"`);
    });

    it('handles normal strings and internal double quotes safely', () => {
      expect(sanitizeCsvField('Normal Task Title')).toBe(`"Normal Task Title"`);
      expect(sanitizeCsvField('Task with "quotes"')).toBe(`"Task with ""quotes"""`);
    });

    it('handles numbers and null/undefined values', () => {
      expect(sanitizeCsvField(42)).toBe(`"42"`);
      expect(sanitizeCsvField(null)).toBe(`""`);
      expect(sanitizeCsvField(undefined)).toBe(`""`);
    });
  });
});
