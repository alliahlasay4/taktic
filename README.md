# 🎯 Taktic

<div align="center">
  <p align="center">
    <strong>Tactical Focus & Daily Rhythm Workspace</strong><br />
    Turn scattered to-do lists into 3–5 sharp daily focus priorities, streak-protected habits, and deep flow sessions.
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

## 🌟 Key Highlights

- ⏱️ **Focus Hub & Top 3–5 Priorities**: Curate daily focus items with drag-and-drop ordering and time estimations.
- 🔄 **Habit Triple Rings & Freeze Shields**: Authentic streak calculation algorithms with missed-day shield protections.
- 🧘 **Ambient Soundscape Engine**: Built-in soundscapes (Gentle Rain, Ocean Waves, Coffee Shop, Warm Chords) for deep focus.
- 👥 **Social Accountability Circles**: Real-time partner presence, focus sharing, and encouragement pings.
- 📱 **Progressive Web App (PWA)**: Full offline support, mobile install prompts, and standalone display.
- ⚡ **1-Click Interactive Demo**: Immediate sandboxed demo mode for evaluation without requiring an account.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/) with curated organic palettes (Terracotta, Ochre, Sage, Rose)
- **State & Backend**: [Supabase](https://supabase.com/) (Auth, PostgreSQL, Row-Level Security) + Local Storage Sync
- **Animations & UI**: [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/), Canvas Confetti
- **Charts & Data**: [Recharts](https://recharts.org/)
- **Testing**: [Vitest](https://vitest.dev/) (Unit & Component tests) + [Playwright](https://playwright.dev/) (E2E Browser testing)

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/alliahlasay4/taktic.git
cd taktic
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [`http://localhost:5173`](http://localhost:5173) in your browser.

---

## 🧪 Automated Testing Suite

Taktic is equipped with automated tests covering unit logic, auth token parsing, streak algorithms, and end-to-end browser journeys.

### ⚡ Unit & Logic Tests (Vitest)
Runs sub-second unit tests for streak math, date helpers, and authentication state handlers:
```bash
# Run all unit tests once
npm run test

# Run unit tests in interactive watch mode
npm run test:watch
```

### 🌐 End-to-End Browser Tests (Playwright)
Executes automated browser tests across Desktop and Mobile viewports with automatic screenshot capture and traces:
```bash
# Run all E2E tests in headless browser
npm run test:e2e

# Run E2E tests in the interactive visual test runner UI
npm run test:e2e:ui

# View the detailed HTML test execution report and traces
npm run test:e2e:report
```

---

## 📸 Automated Test Artifacts

When E2E tests execute, high-resolution screenshots are automatically saved to `/screenshots`:
- `landing-page.png`: Hero header and landing page elements
- `demo-dashboard.png`: Focus Hub dashboard loaded in 1-Click demo mode
- `core-app-dashboard.png`: Habit rings and task tracking state

---

## 📜 License

MIT License &copy; 2026 Taktic. Built for builders who execute every single day.
