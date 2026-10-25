export interface LegalSection {
  title: string;
  content: string[];
}

export interface LegalDocument {
  title: string;
  lastUpdated: string;
  summaryHighlights: {
    icon: string;
    title: string;
    desc: string;
  }[];
  sections: LegalSection[];
}

export const PRIVACY_POLICY: LegalDocument = {
  title: 'Privacy Policy',
  lastUpdated: 'October 26, 2026',
  summaryHighlights: [
    {
      icon: 'Shield',
      title: 'Zero Data Broker Selling',
      desc: 'We never sell, rent, or trade your personal or productivity data to third-party ad networks.',
    },
    {
      icon: 'Lock',
      title: 'End-to-End Security',
      desc: 'Data is protected via encrypted SSL/TLS in transit and industry-standard AES-256 at rest.',
    },
    {
      icon: 'HardDrive',
      title: 'Offline-First & Local Control',
      desc: 'Your active tasks and timers cache in your local browser storage for speed and resilience.',
    },
    {
      icon: 'UserCheck',
      title: 'Your Right to be Forgotten',
      desc: 'You can export all your data or permanently delete your account and associated circle records at any time.',
    },
  ],
  sections: [
    {
      title: '1. Overview & Commitment',
      content: [
        'Welcome to Taktic. Your privacy and personal sovereignty over your time and focus are fundamental to our mission.',
        'This Privacy Policy outlines the information we collect, how we store and synchronize it across your devices, and your explicit rights under applicable global standards (including GDPR and CCPA).',
      ],
    },
    {
      title: '2. Information We Collect',
      content: [
        'Account Credentials: When creating an account, we collect your email address and display name. If you sign in via Google OAuth, we receive your verified Google email and avatar.',
        'Productivity & Rhythm Data: Priorities, tasks, notes, habit logs, streak records, and deep focus timer intervals created while using the application.',
        'Circle & Accountability Data: If you join or create a Circle, members can see your display name, milestone achievements, and public focus hours unless you engage Incognito (Stealth) mode.',
        'Technical & Sync Telemetry: Anonymous client crash logs, local sync timestamps, and device offline-cache metadata necessary to guarantee data consistency between local storage and cloud sync.',
      ],
    },
    {
      title: '3. How We Use and Store Your Data',
      content: [
        'To deliver personalized rhythm analytics, streak calculations, and focus tracking.',
        'To synchronize seamlessly across your offline devices via local caching and secure cloud replicas (Supabase).',
        'We do not train external generative models on your personal notes or habit data.',
      ],
    },
    {
      title: '4. Privacy Controls & Incognito Mode',
      content: [
        'Taktic provides granular privacy toggles directly in your Profile Settings:',
        '• Incognito Mode (Stealth): Masks your active presence and focus status from accountability partners.',
        '• Selective Sharing: Choose whether deep focus hours, streak numbers, and ring completions are visible to circle members.',
      ],
    },
    {
      title: '5. Data Retention, Export & Account Deletion',
      content: [
        'You own your data. You may request an export of all your productivity data in structured format.',
        'Upon deleting your account, all associated tasks, focus history, habits, and circle memberships are permanently and irreversibly purged from our primary database.',
      ],
    },
    {
      title: '6. Contact & Data Protection Officer',
      content: [
        'If you have questions regarding this policy or wish to exercise your data rights, please contact our privacy team at privacy@taktic.app.',
      ],
    },
  ],
};

export const TERMS_OF_SERVICE: LegalDocument = {
  title: 'Terms of Service',
  lastUpdated: 'October 26, 2026',
  summaryHighlights: [
    {
      icon: 'Compass',
      title: 'Calm & Intentional Use',
      desc: 'Taktic is built for personal productivity, mindfulness, and accountable teamwork.',
    },
    {
      icon: 'Users',
      title: 'Respectful Circles',
      desc: 'Members agree to foster supportive, harassment-free accountability communities.',
    },
    {
      icon: 'ShieldAlert',
      title: 'Account Security',
      desc: 'You are responsible for keeping your login credentials confidential.',
    },
  ],
  sections: [
    {
      title: '1. Agreement to Terms',
      content: [
        'By accessing or registering with Taktic, you agree to be bound by these Terms of Service. If you do not agree, you may not use the service.',
      ],
    },
    {
      title: '2. Acceptable Use',
      content: [
        'You agree to use Taktic only for lawful personal or team productivity.',
        'You must not attempt to disrupt the service, reverse-engineer proprietary synchronizers, or transmit abusive content to other circle participants.',
      ],
    },
    {
      title: '3. Account Responsibilities',
      content: [
        'You are responsible for maintaining the security of your password and credentials. Taktic cannot and will not be liable for any loss resulting from unauthorized access caused by your failure to protect your login.',
      ],
    },
    {
      title: '4. Service Availability & Modifications',
      content: [
        'We continuously enhance Taktic. While we aim for 99.9% uptime, we may occasionally suspend service for maintenance, feature upgrades, or security enhancements.',
      ],
    },
    {
      title: '5. Termination',
      content: [
        'You can terminate your account at any time in Profile Settings. We reserve the right to suspend or terminate accounts that violate our terms or engage in abusive conduct.',
      ],
    },
  ],
};
