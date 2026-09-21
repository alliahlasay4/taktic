# Taktic — Tactical Focus & Social Rhythm Hub
## Project Implementation Plan

**Target Location**: `C:\Users\Alliah Cassandra\Desktop\Taktic`  
**Stack**: React + Vite + TypeScript, Tailwind CSS + Shadcn UI, Framer Motion, Recharts, Supabase Backend.  
**Design Aesthetic**: Warm Earth Tones & Dusty Rose (`#1C1917` Dark Espresso / `#FAF7F2` Light Oat).

---

## 🎨 1. Design System & Color Palette

### Dark Mode (`#1C1917` Espresso Stone)
- **Main Background**: `#1C1917` (Deep Warm Charcoal)
- **Card / Surface**: `#282421` (Dark Warm Clay)
- **Borders & Dividers**: `#3D3631` (Muted Earth Slate)
- **Primary Text**: `#F5F0EB` (Warm Cream Linen)
- **Secondary Text**: `#A89F95` (Muted Sand Slate)

### Light Mode (`#FAF7F2` Warm Oat)
- **Main Background**: `#FAF7F2` (Warm Oat Linen)
- **Card / Surface**: `#FFFFFF` (Porcelain White)
- **Borders & Dividers**: `#E7DFD5` (Desert Sand Border)
- **Primary Text**: `#2D2623` (Deep Espresso Clay)
- **Secondary Text**: `#786E65` (Muted Warm Taupe)

### Functional Accents
- 🌸 **Primary Brand & Habit Rings**: `#C87D87` (Dusty Rose)
- 🏺 **Streak Flames & Priorities**: `#C06C4C` (Terracotta Clay)
- 🌾 **Focus Timer & Time Blocks**: `#CFA052` (Warm Sand Ochre)
- 🌿 **Tasks Completed Ring**: `#6B8E6E` (Botanical Sage)
- 🪵 **Circle Feed & Social Badges**: `#B08B9E` (Dusty Earth Mauve)

---

## 🏗️ 2. Architecture & Tech Stack

- **Frontend Framework**: React + Vite + TypeScript
- **Styling & UI Components**: Tailwind CSS + Shadcn UI + Lucide Icons
- **Animations & Interaction**: Framer Motion + canvas-confetti + dnd-kit (drag & drop)
- **Analytics & Heatmaps**: Recharts / @nivo/heatmap
- **State & Data Fetching**: TanStack Query + Zustand
- **Backend & Realtime**: Supabase (PostgreSQL + Auth + WebSockets Realtime)

---

## 🚀 3. Core Feature Breakdown

### A. To-Do List & Today's Selection System
1. **Master To-Do Inbox**: Full backlog with tag filtering (#work, #personal), due dates, and priority flags.
2. **Today's Focus Queue**: Star 3–5 top priority tasks for today with constraint safeguard against task overload.

### B. Time-Blocking & Focus Timer Engine
1. **Time-Block Schedule Grid**: Drag-and-drop today's priority tasks into Morning, Afternoon, and Evening slots.
2. **Pomodoro & Stopwatch Focus Timer**: Immersive focus overlay with selectable ambient soundscapes (rain, ocean waves, lo-fi beats).

### C. Habit Engine & Rhythm Analytics
1. **Recurring Habit Checklist**: Track daily/weekly routine items with streak counts and monthly streak shields.
2. **Triple Progress Rings**:
   - 🌿 Botanical Sage (#6B8E6E): Tasks Completed
   - 🌸 Dusty Rose (#C87D87): Habits Maintained
   - 🌾 Warm Ochre (#CFA052): Focus Time Logged
3. **GitHub-Style Contribution Grid**: 30/90/365-day visual consistency heatmap.

### D. Rewarding UI & Gamification Engine
1. **Satisfying Check-Offs**: Micro-animations, haptic sound feedback, and strike-through FX.
2. **100% Ring Confetti Celebration**: Full-screen particle celebration when all three rings close.
3. **End-of-Day Reflection Summary Card**: Visual card highlighting total focus time, tasks finished, and active streaks.

### E. Circles & Multi-User Collaboration
1. **Privacy-First Circle Feed**: Share progress rings and streak badges while keeping exact task titles private.
2. **Shared Workspaces & Task Lists**: Real-time collaborative task boards with live WebSocket status sync.
3. **Live Synchronous Focus Rooms**: Silent 25-minute synchronous timer rooms for virtual co-working.

---

## 📁 4. Project File Structure Plan

```
Taktic/
├── implementation_plan.md
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css                  # Custom Earth & Dusty Rose CSS variables
    ├── components/
    │   ├── ui/                    # Custom Shadcn primitives
    │   ├── layout/                # Sidebar, Navigation header, Theme toggle
    │   ├── inbox/                 # Master To-Do Inbox, Priority queue selector
    │   ├── focus/                 # Today's Focus, Time blocking grid, Pomodoro overlay
    │   ├── habits/                # Habit checklist, Triple progress rings, Heatmap
    │   ├── circles/               # Circle feed, Shared boards, Live focus rooms
    │   └── rewards/               # Confetti burst trigger, End-of-day summary card
    ├── lib/
    │   ├── supabase.ts            # Supabase auth & realtime listeners
    │   ├── colors.ts              # Earth theme hex tokens
    │   └── utils.ts               # Helper functions & date formatters
    ├── hooks/                     # Custom hooks (useAuth, useTasks, useHabits, useRealtime)
    └── types/                     # TypeScript definitions for Tasks, Habits, Circles
```

---

## 🧪 5. Verification Plan

### Automated Verification
- Run `npm run build` to verify clean TypeScript compilation and bundle packaging.
- Run `npm run test` for habit streak calculations and priority queue constraints.

### Manual Verification
- Test light/dark theme switching between Warm Espresso and Warm Oat.
- Test drag-and-drop task movement into time blocks.
- Test multi-user real-time task update synchronization across separate browser windows using Supabase Realtime.