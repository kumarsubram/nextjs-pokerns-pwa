# Poker Notes PWA - Development Guide

## Project Overview
A Progressive Web App for tracking poker sessions, hands, and statistics. Built with Next.js 15, TypeScript, and Tailwind CSS.

## Current Version: v2.18
**Hand Replay System** - Complete interactive replay functionality for tracked hands with step-by-step visualization, variable speed controls, and accurate pot calculations.

## Core Architecture

### Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks and Context
- **Data Storage**: localStorage (client-side)
- **PWA**: Service Worker with offline support

### Key Features

#### Session Management
- Auto-generated session names (PS1, PS2, etc.)
- Tournament/Cash game selection
- 6/9 handed table support
- Buy-in and stack tracking
- Real-time profit/loss calculation
- Session history with statistics

#### Hand Tracking System
- Complete hand history storage
- Hero and opponent card tracking
- All betting actions logged
- Community cards by round
- Pot calculations with side pot logic
- Hand outcomes (won/lost/folded)

#### Hand Replay Feature (v2.18)
- Interactive step-by-step replay
- Variable playback speeds (0.5x, 1x, 2x)
- Auto-play functionality
- Visual poker table updates
- Accurate pot calculations including blinds
- Mobile-responsive design

#### Tracked Hands System
- Save hands to localStorage for offline viewing
- Individual hand detail pages
- Quick navigation to full session
- Delete tracked hands individually or all at once
- Seamless integration with hand replay

### File Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── create-session/page.tsx     # Session creation
│   ├── session/[id]/page.tsx       # Main game screen
│   ├── sessions/page.tsx           # Session list
│   ├── tracked/
│   │   ├── page.tsx                # Tracked hands list
│   │   └── [id]/page.tsx           # Tracked hand detail
│   └── layout.tsx                  # Root layout with navigation
├── components/
│   ├── dialog/                     # Modal dialogs
│   │   ├── AllFoldedDialog.tsx
│   │   ├── ShowdownDialog.tsx
│   │   ├── AmountModal.tsx
│   │   ├── ConfirmFoldDialog.tsx
│   │   └── ValidationErrorDialog.tsx
│   ├── session/                    # Session page components
│   │   ├── HeroCards.tsx
│   │   ├── SessionHeader.tsx
│   │   ├── HandInfoHeader.tsx
│   │   ├── HandSettingsPanel.tsx
│   │   ├── ActionButtonsSection.tsx
│   │   └── PositionActionSelector.tsx
│   ├── poker/
│   │   ├── SimplePokerTable.tsx    # Main table component
│   │   ├── SeatSelector.tsx        # Seat selection UI
│   │   ├── CardSelector.tsx        # Card selection modal
│   │   ├── HandHistory.tsx         # Hand history display
│   │   └── HandReplay.tsx          # Interactive replay component
│   └── ui/                         # Base UI components
├── hooks/                          # Custom React hooks
│   ├── useHandFlow.ts              # Hand creation/completion
│   ├── useBettingLogic.ts          # Betting action management
│   ├── useCommunityCards.ts        # Community card logic
│   └── useHeroCards.ts             # Hero/opponent cards
├── services/
│   ├── session.service.ts          # Session data management
│   ├── TrackedHandService.ts       # Tracked hands storage
│   └── URLShareService.ts          # Hand sharing via URL
├── types/
│   └── poker.ts                    # TypeScript interfaces
└── utils/
    └── poker-logic.ts              # Game logic utilities
```

## Data Models

### Session Structure
```typescript
interface SessionMetadata {
  sessionId: string;
  sessionName: string;
  sessionNumber: number;
  gameType: 'Tournament' | 'Cash Game';
  tableSeats: 6 | 9;
  buyIn: number;
  userSeat: Position;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed';
  totalHands: number;
  currentStack?: number;
}
```

### Hand Storage Structure
```typescript
interface StoredHand {
  handNumber: number;
  timestamp: string;
  userSeat: Position;  // Preserves original position
  userCards: [string, string] | null;
  communityCards: {
    flop: [string, string, string] | null;
    turn: string | null;
    river: string | null;
  };
  bettingRounds: {
    preflop: BettingRound;
    flop?: BettingRound;
    turn?: BettingRound;
    river?: BettingRound;
  };
  playerStates: PlayerState[];
  result: {
    winner?: Position;
    potWon?: number;
    stackAfter?: number;
    handOutcome: 'won' | 'lost' | 'folded';
  };
}
```

### Tracked Hand Structure
```typescript
interface TrackedHand extends StoredHand {
  trackId: string;
  sessionId: string;
  sessionName: string;
  trackedAt: string;
  tableSeats: 6 | 9;
}
```

## Key Implementation Details

### Betting Logic System
- **Position-aware action sequences** for 6/9 handed tables
- **Auto-fold logic** for players between next-to-act and caller
- **Circular action flow** with proper wrap-around handling
- **Betting round completion** detection
- **All-in handling** with side pot calculations
- **Blind posting** logic for SB/BB positions

### Community Card System
- **Progressive reveal** by betting round
- **Auto-trigger** when betting completes
- **Guided selection** for flop cards (1→2→3)
- **Round-specific validation** (can't select turn during preflop)
- **Stable UI** during card selection

### Hero Money Tracking
- **Investment tracking** throughout hand
- **Blind deductions** at hand start
- **Stack updates** in real-time
- **Profit/loss calculation** per hand
- **Side pot logic** for all-in scenarios

### Hand Replay Implementation
```typescript
// Core replay state
interface ReplayState {
  currentRound: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  currentActionIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  playerStates: PlayerState[];
  communityCards: CommunityCards;
  currentPot: number;
  allActions: (BettingAction & { round: string })[];
}

// Pot calculation with blinds
let currentPot = 7; // SB: 2, BB: 5
currentPot += additionalAmount; // Add bets progressively
```

## Development Workflow

### Running the Application
```bash
# Development
npm run dev          # Start on port 3000

# Production
npm run build        # Build for production
npm run start        # Start production server

# PWA Updates
npm run update-pwa   # Update service worker cache
npm run push         # Update PWA + git commit/push
```

### localStorage Keys
```
'lastSessionNumber': number
'activeSession': string (session ID)
'session_{id}_meta': SessionMetadata
'session_{id}_hands': StoredHand[]
'trackedHands': TrackedHand[]
'dataVersion': number (for migrations)
```

## Mobile Standards

### Input Requirements
- **Minimum 16px font size** on all inputs (prevents zoom)
- **Viewport settings** prevent user scaling
- **Touch-optimized** button sizes and spacing
- **Responsive layouts** for different screen sizes

### Dialog Positioning
- **Mobile keyboard detection** using Visual Viewport API
- **Dynamic repositioning** when keyboard appears
- **iOS-specific handling** for Safari behavior

## Key Business Rules

### Poker Logic
1. **Action Sequences**:
   - 6-handed: BTN → SB → BB → UTG → LJ → CO
   - 9-handed: BTN → SB → BB → UTG → UTG+1 → UTG+2 → LJ → HJ → CO

2. **Betting Rules**:
   - Only BB can check preflop with no raises
   - Call amounts account for posted blinds
   - Raises reset hasActed flags
   - Auto-fold skipped positions

3. **Hand Completion**:
   - All fold → Hero wins automatically
   - Showdown → Outcome selection required
   - Hero fold → Confirmation dialog
   - Stack updates immediately

### Data Management

#### Service Worker Cache
- Update `CACHE_NAME` version for deployments
- Test offline functionality after updates

#### Data Migrations
```typescript
// Force data reset for breaking changes
const CURRENT_DATA_VERSION = 2; // Increment for migrations
```

## Testing Checklist

### Core Functionality
- [ ] Session creation and management
- [ ] Hand tracking and storage
- [ ] Betting action flows
- [ ] Community card selection
- [ ] Hero money tracking
- [ ] Hand replay functionality
- [ ] Tracked hands system

### Edge Cases
- [ ] All-in with different stack sizes
- [ ] Auto-fold logic with various positions
- [ ] Showdown with 2+ players
- [ ] Hero fold with/without investment
- [ ] Session switching and data persistence

### Mobile Testing
- [ ] No zoom on input focus
- [ ] Dialog positioning with keyboard
- [ ] Touch interactions on table
- [ ] Responsive layout breakpoints
- [ ] Offline functionality

## Recent Major Updates

### v2.18 - Hand Replay System
- Interactive hand replay with playback controls
- Variable speed options (0.5x, 1x, 2x)
- Accurate pot calculations including blinds
- Auto-start functionality at 1x speed
- Mobile-responsive replay interface

### v2.17 - Hand Tracking & Sharing
- Track hands to localStorage
- Individual tracked hand pages
- Delete tracked hands feature
- Integration with session navigation
- Offline viewing capability

### v2.16 - Enhanced Card Selection
- Auto-advance after community cards
- Contextual card editing by round
- Improved selector UI/UX
- Reduced clicks in game flow

### Previous Versions
- Session page modularization (extracted 6 components, 5 hooks)
- Dialog system improvements
- Mobile keyboard handling
- Proper showdown detection
- Stack reduction fixes
- Visual action indicators

## Future Considerations

### Immediate Enhancements
- Statistics dashboard with session analytics
- Export features (CSV/PDF)
- Advanced hand filtering/search
- Multi-device sync

### Architecture Improvements
- Database integration (replace localStorage)
- User authentication system
- Real-time synchronization
- Enhanced PWA features (push notifications)

## Important Notes

### Performance
- Minimize localStorage operations
- Batch state updates where possible
- Use React.memo for expensive components
- Implement proper cleanup in useEffect hooks

### Code Quality
- Always filter active players in betting logic
- Validate hero cards before showdown
- Clean state transitions between hands
- Proper TypeScript interfaces for all data

### User Experience
- No unexpected navigation during dialogs
- Progressive disclosure of features
- Clear visual feedback for all actions
- Error prevention over error handling

This guide provides the essential information for understanding and developing the Poker Notes PWA while maintaining code quality and user experience standards.