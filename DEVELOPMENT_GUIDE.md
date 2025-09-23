# Poker Notes PWA - Development Guide

## Project Overview
A Progressive Web App for tracking poker sessions, hands, and statistics. Built with Next.js 15, TypeScript, and Tailwind CSS.

## Current Version: v2.20
**All-In & Betting Round Fixes** - Fixed critical betting round completion logic to allow players to act after all-ins, proper all-in detection for calls/raises, accurate side pot calculations excluding folded players, and correct hand profit/loss tracking for all-in scenarios.

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
- **Automatic refunds** when opponents go all-in for less

### All-In & Side Pot System
```typescript
// Side pot structure
interface SidePot {
  amount: number;
  eligiblePlayers: Position[];
  maxContribution: number;
}

// Key scenarios handled:
// 1. Hero bets 600, opponent all-in 400 → Hero refunded 200
// 2. Opponent all-in 400, hero all-in 600 → Main pot 800, side pot 200
// 3. Multi-way all-ins → Multiple side pots with correct eligibility
// 4. Hero can edit all-in amount → Stack adjusted accordingly
```

### Hero All-In Flow
1. Button shows remaining stack (total - invested)
2. Modal opens with editable amount
3. Hero can adjust amount (1 to remaining stack)
4. Confirms → Stack reduced by additional investment
5. Side pots calculated automatically
6. Winnings limited to eligible pots only

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
   - Raises reset hasActed flags for active players
   - Auto-fold skipped positions
   - Players with 0 stack after call/raise are marked all-in
   - Calling an all-in with matching amount marks caller as all-in
   - Betting round completes when all active/all-in players have acted and matched current bet

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

### Side Pot Logic
- Only players still in hand (active/all-in) contribute to side pots
- Single all-in amount with everyone matching = no side pots (main pot only)
- Multiple all-in amounts = side pots created by ascending bet order
- Hero winnings limited to eligible pots based on investment

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

### v2.19 - Advanced All-In & Side Pot System
- **Smart All-In Button**: Shows hero's remaining stack, updates with stack changes
- **Editable All-In Amounts**: Hero can adjust all-in amount; non-hero positions fully editable
- **Automatic Refund Logic**: When opponent goes all-in for less than hero's bet, excess is refunded
- **Accurate Side Pot Calculation**: Clean algorithm for multi-way all-in scenarios
- **Side Pot Display**: Shows side pots in showdown dialog with eligibility status
- **Hero-Focused Tracking**: Ensures accurate profit/loss calculation based on actual winnable pots
- **Proper Investment Tracking**: Hero's money invested and stack adjusted correctly in all scenarios

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