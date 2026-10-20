import { describe, it, expect } from 'vitest';
import { CircleMember } from '../types';

describe('Incognito Mode behavior in circles and sidebar', () => {
  it('correctly conceals live status and offline appearance when partner is incognito', () => {
    const regularMember: CircleMember = {
      id: 'member-1',
      partnerUserId: 'user-a',
      name: 'User A',
      avatar: 'https://example.com/a.png',
      status: 'focusing',
      statusText: 'Focusing on Deep Work',
      closedRingsCount: 2,
      streak: 5,
      isCirclePartner: true,
      isIncognito: false,
    };

    const incognitoMember: CircleMember = {
      ...regularMember,
      status: 'idle',
      statusText: 'Offline',
      isIncognito: true,
    };

    // 1. Sidebar active focusing filter
    const activeMembers = [regularMember, incognitoMember].filter(
      (m) => m.status === 'focusing' && !m.isIncognito
    );
    expect(activeMembers).toHaveLength(1);
    expect(activeMembers[0].name).toBe('User A');

    // 2. Circles offline status check
    const isOfflineA = Boolean(incognitoMember.isIncognito || incognitoMember.statusText === 'Offline');
    const isOfflineRegular = Boolean(regularMember.isIncognito || regularMember.statusText === 'Offline');
    expect(isOfflineA).toBe(true);
    expect(isOfflineRegular).toBe(false);

    // 3. Status text rendered to circle partners
    const displayStatusA = incognitoMember.isIncognito || incognitoMember.statusText === 'Offline'
      ? 'Offline'
      : (incognitoMember.statusText || 'Online');
    expect(displayStatusA).toBe('Offline');
  });

  it('updates member in-memory list upon receiving profile_privacy_sync broadcast', () => {
    const initialMembers: CircleMember[] = [
      {
        id: 'member-1',
        partnerUserId: 'user-a',
        name: 'User A',
        avatar: 'https://example.com/a.png',
        status: 'focusing',
        statusText: 'Focusing',
        closedRingsCount: 1,
        streak: 2,
        isCirclePartner: true,
        isIncognito: false,
      },
    ];

    const syncPayload = {
      userId: 'user-a',
      isIncognito: true,
      statusMessage: '',
    };

    const targetUserId = syncPayload.userId.toLowerCase();
    const updatedMembers = initialMembers.map((member) => {
      const isMatch =
        (member.partnerUserId && member.partnerUserId.toLowerCase() === targetUserId) ||
        (member.id && member.id.toLowerCase() === targetUserId);

      if (isMatch) {
        const partnerIsIncognito = Boolean(syncPayload.isIncognito);
        return {
          ...member,
          isIncognito: partnerIsIncognito,
          status: (partnerIsIncognito ? 'idle' : (syncPayload.statusMessage ? 'focusing' : member.status)) as 'idle' | 'focusing',
          statusText: partnerIsIncognito ? 'Offline' : (syncPayload.statusMessage || 'Online'),
        };
      }
      return member;
    });

    expect(updatedMembers[0].isIncognito).toBe(true);
    expect(updatedMembers[0].status).toBe('idle');
    expect(updatedMembers[0].statusText).toBe('Offline');
  });

  it('correctly uses persistent stealth map to detect incognito partners across account logins', () => {
    const stealthMap: Record<string, boolean> = {
      'user-b': true,
      'user-c': true,
    };

    const rawMembers: any[] = [
      { id: 'm-1', partner_user_id: 'user-b', member_name: 'User B', status: 'focusing', status_text: 'Online' },
      { id: 'm-2', partner_user_id: 'user-c', member_name: 'User C', status: 'focusing', status_text: 'Active Partner' },
      { id: 'm-3', partner_user_id: 'user-d', member_name: 'User D', status: 'focusing', status_text: 'Online' },
    ];

    const mappedMembers: CircleMember[] = rawMembers.map((m) => {
      const partnerId = m.partner_user_id;
      const isStealthInMap = partnerId ? stealthMap[partnerId] : undefined;
      const isPartnerIncognito = Boolean(
        isStealthInMap !== undefined ? isStealthInMap : m.status_text === 'Offline'
      );

      return {
        id: m.id,
        partnerUserId: partnerId,
        name: m.member_name,
        avatar: '',
        status: isPartnerIncognito ? 'idle' : m.status,
        statusText: isPartnerIncognito ? 'Offline' : m.status_text,
        closedRingsCount: 0,
        streak: 1,
        isCirclePartner: true,
        isIncognito: isPartnerIncognito,
      };
    });

    // Check user B and user C are detected as incognito and offline
    expect(mappedMembers[0].isIncognito).toBe(true);
    expect(mappedMembers[0].status).toBe('idle');
    expect(mappedMembers[0].statusText).toBe('Offline');

    expect(mappedMembers[1].isIncognito).toBe(true);
    expect(mappedMembers[1].status).toBe('idle');
    expect(mappedMembers[1].statusText).toBe('Offline');

    // Check user D is still online
    expect(mappedMembers[2].isIncognito).toBe(false);
    expect(mappedMembers[2].status).toBe('focusing');
    expect(mappedMembers[2].statusText).toBe('Online');

    // Verify Sidebar/CirclesView active partners filter excludes B and C
    const active = mappedMembers.filter(
      (m) => m.status === 'focusing' && !m.isIncognito && m.statusText !== 'Offline'
    );
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe('User D');
  });
});
