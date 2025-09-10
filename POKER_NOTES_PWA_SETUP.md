# Poker Notes PWA - Complete Setup Guide

## Project Overview
A Progressive Web App for tracking poker sessions, hands, and sharing game history.

## Core Features
1. **Session Management**: Create/manage sessions for tournaments or cash games
2. **Hand Tracking**: Record positions, actions, board cards, outcomes
3. **Player Positions**: Visual table position selector (UTG, MP, CO, BTN, SB, BB)
4. **Hand History**: Save and view past hands with filtering
5. **Share Functionality**: Export hands as formatted text via Web Share API
6. **Offline Support**: Full PWA with offline capabilities
7. **Mobile-First Design**: Optimized for mobile devices

## Tech Stack (Latest 2025)
- **Next.js 15.5**: Latest stable version with Turbopack
- **TypeScript**: Type safety throughout
- **Tailwind CSS v4**: Simplified configuration, faster builds
- **shadcn/ui**: Component library with React 19 support
- **Dexie.js**: IndexedDB wrapper for offline storage
- **React Hook Form + Zod**: Form handling and validation
- **Lucide React**: Icons
- **date-fns**: Date manipulation

## Setup Instructions

### 1. Create Next.js Project
```bash
npx create-next-app@latest nextjs-pokerns-pwa \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --turbopack \
  --src-dir \
  --import-alias "@/*"
```

### 2. Initialize shadcn/ui
```bash
npx shadcn@latest init

# Select options:
# - Style: Default
# - Base color: Neutral (or your preference)
# - CSS variables: Yes
```

### 3. Install Dependencies
```bash
npm install dexie react-hook-form @hookform/resolvers zod lucide-react date-fns
```

### 4. Add shadcn Components
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add tabs
npx shadcn@latest add dialog
npx shadcn@latest add sheet
npx shadcn@latest add toast
npx shadcn@latest add dropdown-menu
```

## PWA Configuration (Next.js Native Approach)

### 1. Create Web App Manifest
Create `src/app/manifest.ts`:
```typescript
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Poker Notes Tracker',
    short_name: 'PokerNotes',
    description: 'Track your poker sessions and hands',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
```

### 2. Create Service Worker
Create `public/sw.js`:
```javascript
const CACHE_NAME = 'poker-notes-v1';
const urlsToCache = [
  '/',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

### 3. Register Service Worker
Add to `src/app/layout.tsx`:
```typescript
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}, []);
```

## Data Models

### TypeScript Interfaces
```typescript
// src/types/poker.ts

export interface Session {
  id: string;
  name: string;
  type: 'tournament' | 'cash';
  buyIn: number;
  startTime: Date;
  endTime?: Date;
  location?: string;
  notes?: string;
  totalHands: number;
  profit?: number;
}

export interface Hand {
  id: string;
  sessionId: string;
  handNumber: number;
  timestamp: Date;
  
  // Positions
  heroPosition: Position;
  villainPositions: VillainPosition[];
  
  // Cards
  holeCards: string[]; // e.g., ['As', 'Kh']
  board: {
    flop?: string[];
    turn?: string;
    river?: string;
  };
  
  // Actions
  preflop: Action[];
  flop?: Action[];
  turn?: Action[];
  river?: Action[];
  
  // Result
  potSize: number;
  result: 'won' | 'lost' | 'folded';
  amountWon?: number;
  showdown?: boolean;
  
  // Notes
  notes?: string;
}

export type Position = 'UTG' | 'UTG+1' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB';

export interface VillainPosition {
  position: Position;
  playerId?: string;
  notes?: string;
}

export interface Action {
  player: 'hero' | Position;
  action: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';
  amount?: number;
}
```

## Database Schema (Dexie/IndexedDB)

```typescript
// src/lib/db.ts
import Dexie, { Table } from 'dexie';

export class PokerDatabase extends Dexie {
  sessions!: Table<Session>;
  hands!: Table<Hand>;

  constructor() {
    super('PokerNotesDB');
    
    this.version(1).stores({
      sessions: '++id, name, type, startTime',
      hands: '++id, sessionId, timestamp, heroPosition, result'
    });
  }
}

export const db = new PokerDatabase();
```

## Project Structure
```
nextjs-pokerns-pwa/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── manifest.ts
│   │   ├── globals.css
│   │   ├── sessions/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   └── hands/
│   │       ├── new/
│   │       │   └── page.tsx
│   │       └── [id]/
│   │           └── page.tsx
│   ├── components/
│   │   ├── ui/           (shadcn components)
│   │   ├── session/
│   │   │   ├── SessionCard.tsx
│   │   │   ├── SessionForm.tsx
│   │   │   └── SessionList.tsx
│   │   ├── hand/
│   │   │   ├── HandForm.tsx
│   │   │   ├── HandCard.tsx
│   │   │   ├── PositionSelector.tsx
│   │   │   └── BoardInput.tsx
│   │   ├── layout/
│   │   │   ├── Navigation.tsx
│   │   │   └── MobileNav.tsx
│   │   └── InstallPrompt.tsx
│   ├── lib/
│   │   ├── db.ts
│   │   ├── utils.ts
│   │   └── share.ts
│   ├── hooks/
│   │   ├── useSession.ts
│   │   ├── useHands.ts
│   │   └── useOffline.ts
│   └── types/
│       └── poker.ts
├── public/
│   ├── sw.js
│   ├── offline.html
│   ├── icon-192x192.png
│   └── icon-512x512.png
└── package.json
```

## Key Components to Build

### 1. Position Selector
- Visual poker table with clickable positions
- Mobile-optimized touch interface
- Clear position indicators

### 2. Hand Input Form
- Step-by-step wizard (positions → cards → actions → result)
- Card picker with visual cards
- Action buttons with bet sizing
- Board card input

### 3. Session Manager
- Create/edit/archive sessions
- Session statistics dashboard
- Quick session switcher

### 4. Hand History List
- Filterable by position, result, date
- Searchable notes
- Compact mobile view
- Swipe actions for edit/delete

### 5. Share Feature
```typescript
// src/lib/share.ts
export async function shareHand(hand: Hand) {
  const text = formatHandForSharing(hand);
  
  if (navigator.share) {
    await navigator.share({
      title: 'Poker Hand',
      text: text,
    });
  } else {
    // Fallback to clipboard
    await navigator.clipboard.writeText(text);
  }
}

function formatHandForSharing(hand: Hand): string {
  // Format hand data as readable text
  return `
Hand #${hand.handNumber}
Position: ${hand.heroPosition}
Cards: ${hand.holeCards.join(' ')}
Board: ${formatBoard(hand.board)}
Result: ${hand.result}
Pot: $${hand.potSize}
${hand.notes ? `Notes: ${hand.notes}` : ''}
  `.trim();
}
```

## Mobile-First Design Principles

1. **Touch-Optimized**: Large tap targets (min 44x44px)
2. **Thumb-Friendly**: Important actions in bottom nav
3. **Responsive**: Stack layouts on mobile, grid on tablet+
4. **Performance**: Lazy load components, optimize images
5. **Offline First**: Cache everything, sync when online

## Testing Checklist

- [ ] PWA installs on mobile devices
- [ ] Works offline after first load
- [ ] Session creation and management
- [ ] Hand tracking with all positions
- [ ] Card input works smoothly
- [ ] Share functionality works on mobile
- [ ] Data persists across sessions
- [ ] Responsive on all screen sizes

## Development Commands

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## Additional Features (Future)

- Player profiles and stats
- Hand range charts
- Bankroll tracking
- Export to CSV/JSON
- Cloud sync
- Hand replay animation
- GTO solver integration
- Multi-table support

## Notes
- Always test on real mobile devices
- Use Chrome DevTools PWA audit
- Test offline mode thoroughly
- Ensure fast initial load (< 3s)
- Keep bundle size small (< 200KB initial JS)