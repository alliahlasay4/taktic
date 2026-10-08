# Taktic

<div align="center">
  <p align="center">
    <strong>Tactical Focus and Daily Rhythm Workspace</strong><br />
    Turn scattered task lists into structured daily focus priorities, habit tracking, and flow sessions.
  </p>

  <p align="center">
    <a href="https://github.com/alliahlasay4/taktic"><img src="https://img.shields.io/badge/Vite-6.1-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" /></a>
    <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" /></a>
    <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="TailwindCSS" /></a>
    <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" /></a>
    <a href="https://vitest.dev"><img src="https://img.shields.io/badge/Vitest-Unit%20Tests%20Passing-729B1B?style=flat-square&logo=vitest&logoColor=white" alt="Vitest" /></a>
    <a href="https://playwright.dev"><img src="https://img.shields.io/badge/Playwright-E2E%20Verified-2EAD33?style=flat-square&logo=playwright&logoColor=white" alt="Playwright" /></a>
  </p>
</div>

---

## Overview

Taktic is a productivity workspace designed to eliminate task overwhelm. Rather than managing endless backlogs, it structures daily execution into top focus priorities, streak-protected habit routines, and ambient focus sessions within a unified interface.

---

## Key Capabilities

- **Focus Hub**: Prioritize 3 to 5 core daily tasks with estimation and queue management.
- **Habit Tracking & Streaks**: Consecutive completion algorithms with freeze shield protection against missed days.
- **Ambient Audio Engine**: Integrated background soundscapes (Rain, Ocean, Cafe, Chords) for sustained deep work.
- **Social Circles**: Real-time accountability, presence indicators, and activity feeds.
- **Progressive Web App (PWA)**: Standalone desktop and mobile installation with offline data synchronization.
- **Interactive Demo Mode**: Full guest access for platform evaluation without registration requirements.

---

## Tech Stack

- **Frontend**: [React 19](https://react.dev/) with TypeScript and [Vite](https://vitejs.dev/)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/)
- **Backend & Persistence**: [Supabase](https://supabase.com/) (PostgreSQL, Authentication, Row-Level Security) with LocalStorage fallback
- **State & Animations**: [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Testing**: [Vitest](https://vitest.dev/) (Unit and Logic) + [Playwright](https://playwright.dev/) (End-to-End Browser Automation)

---

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/alliahlasay4/taktic.git
   cd taktic
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env.local` file in the project root:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Start the local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## Testing Suite

Taktic includes automated unit testing for core algorithms and end-to-end browser testing for critical user workflows.

### Unit & Logic Tests (Vitest)

Validates streak calculations, date math, and authentication token parsing:

```bash
# Run unit tests
npm run test

# Run in watch mode during active development
npm run test:watch
```

### End-to-End Browser Tests (Playwright)

Runs automated headless browser tests across desktop and mobile viewports:

```bash
# Run end-to-end tests in headless mode
npm run test:e2e

# Run tests with the interactive visual UI runner
npm run test:e2e:ui

# Generate and inspect the HTML test report
npm run test:e2e:report
```

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
