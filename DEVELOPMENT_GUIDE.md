# Poker Notes PWA - Development Guide

## Project Overview
A Progressive Web App for tracking poker sessions, hands, and statistics. Built with Next.js 15, TypeScript, and Tailwind CSS.

## CURRENT IMPLEMENTATION STATUS (v2.0) ✅ COMPLETED

### Core Philosophy - IMPLEMENTED
✅ **Fixed-position tables** with simplified betting tracking focused on session-based hand history storage for replay functionality.

### Key Features Implemented

#### ✅ COMPLETED: Session Creation & Management
1. **Session Creation Flow**
   - Auto-generated session names (PS1, PS2, etc.)
   - Game type selection (Tournament/Cash Game)
   - Table size selection (6/9 handed)
   - Buy-in amount input
   - Modular seat position selection using `SeatSelector` component

2. **Fixed Position Tables**
   - SimplePokerTable component with fixed seats
   - **6-handed action sequence**: BTN → SB → BB → UTG → LJ → CO (DEALER is visual only, non-clickable)
   - **9-handed action sequence**: BTN → SB → BB → UTG → UTG+1 → UTG+2 → LJ → HJ → CO (DEALER is visual only, non-clickable)
   - Visual position labels and user seat highlighting
   - Action flow follows clockwise order for betting rounds
   - DEALER position is fixed, black, and never participates in actions

3. **Session Management Service**
   - SessionService with localStorage integration
   - Session metadata management
   - Active session tracking
   - Session list with statistics
   - `updateSessionMetadata()` for dynamic seat changes

#### ✅ COMPLETED: Hand Flow & Betting Logic
1. **Complete Betting Round Implementation**
   - ✅ Simple action recording (fold, check, call, raise, all-in)
   - ✅ Contextual action buttons based on current bet
   - ✅ Modal input for raise/all-in amounts (no decimals)
   - ✅ Proper betting round completion logic
   - ✅ Hero money investment tracking

2. **Hand History Storage**
   - ✅ Session-based localStorage structure
   - ✅ Hands saved under session-specific keys
   - ✅ Session metadata updated on each hand
   - ✅ Hand numbering within sessions
   - ✅ Complete hand data with outcomes and stack tracking

3. **Visual Indicators & UX**
   - ✅ **Color-coded action indicators** (no text labels):
     - **Fold**: Red button background
     - **Call**: Blue button background
     - **Check**: Gray button background
     - **Raise**: Green button background
     - **All-In**: Purple button background
   - ✅ **Next-to-act animation**: Subtle 2-second blinking pulse
   - ✅ **Pot size display**: Below community cards (integers only)
   - ✅ **Mobile optimizations**: Card button positioning for SB/BB (left) and HJ/LJ (right)

#### ✅ COMPLETED: Hero Logic & Hand Completion
1. **Hero Fold Confirmation System**
   - ✅ Confirmation dialog when hero clicks fold
   - ✅ Shows invested amount and warns about hand ending
   - ✅ Different logic based on money invested:
     - No money invested + fold → "folded", move to next hand
     - Money invested + fold → "lost", deduct investment from stack
   - ✅ Blind deduction for SB/BB positions

2. **Win/Loss Detection**
   - ✅ All others fold → Hero wins, add pot to stack
   - ✅ Reach showdown → Show outcome selection dialog
   - ✅ Proper stack management with blind deductions
   - ✅ Accurate profit/loss calculations

3. **Between-Hand Seat Selection**
   - ✅ After Hand 1 completes, show seat selection for all subsequent hands
   - ✅ Reusable `SeatSelector` component
   - ✅ Option to keep current seat or select new position
   - ✅ Session metadata updated with new seat selection

### Current Data Architecture

#### Session Metadata Structure
```typescript
interface SessionMetadata {
  sessionId: string;        // 'ps1_2025_09_09_1545'
  sessionName: string;      // 'PS1 - 9 Sep 25 3:45pm'
  sessionNumber: number;    // Auto-incremented
  gameType: 'Tournament' | 'Cash Game';
  tableSeats: 6 | 9;
  buyIn: number;
  userSeat: Position;       // Fixed position label (can change between hands)
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed';
  totalHands: number;
  totalDuration?: string;
  result?: string;          // '+$350' or '-50 BB'
  currentStack?: number;
}
```

#### Hand Storage Structure
```typescript
interface StoredHand {
  handNumber: number;
  timestamp: string;
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
  result: {
    winner?: Position;
    potWon?: number;
    stackAfter?: number;
    handOutcome: 'won' | 'lost' | 'folded';
  };
}
```

#### localStorage Keys Structure
```
'lastSessionNumber': number
'activeSession': string (session ID)
'session_{id}_meta': SessionMetadata
'session_{id}_hands': StoredHand[]
```

### Complete Session Flow

#### Session Creation
1. User taps "Start Session"
2. Auto-generate session name: `PS{n} - {date}`
3. Select game type (Tournament/Cash)
4. Select table size (6/9 seats)
5. Enter buy-in amount
6. Select user's seat position using SeatSelector
7. Create session and start Hand 1

#### Hand Flow (Fully Implemented)
1. **Hand 1**: Starts with initially selected seat
2. **Card Selection**: Select hole cards (2 cards with duplicate prevention)
3. **Betting Rounds**:
   - Preflop betting with contextual action buttons
   - Community card selection (flop/turn/river) when betting complete
   - Post-flop betting rounds
4. **Hand Completion**:
   - Hero fold → Confirmation dialog → Hand ends
   - All others fold → Hero wins automatically
   - Reach showdown → User selects won/lost outcome
5. **Between Hands**:
   - Hand 2+: Show seat selection view
   - User can change position or keep current seat
6. **Next Hand**: Start new hand with selected position

#### Hero-Specific Logic
- **Blind Positions**: Auto-deduct SB/BB from stack when starting hand
- **Money Tracking**: Track all hero investments (blinds + bets)
- **Fold Logic**:
  - No investment → "folded" outcome
  - Has investment → "lost" outcome, stack reduced by investment
- **Win Logic**: Add entire pot to stack (investment already deducted)
- **Stack Management**: Accurate real-time stack updates

### UI/UX Components

#### Core Components
1. **SeatSelector** (`src/components/poker/SeatSelector.tsx`)
   - Reusable seat selection with SimplePokerTable
   - Used in session creation and between-hand selection
   - Props for title, current seat, callbacks

2. **SimplePokerTable** (`src/components/poker/SimplePokerTable.tsx`)
   - Fixed position layout with visual indicators
   - Color-coded action states (no text)
   - Pot size display below community cards
   - Mobile-optimized card button positioning
   - Next-to-act subtle blinking animation

3. **CardSelector** (`src/components/poker/CardSelector.tsx`)
   - Duplicate prevention across hole/community cards
   - Suit-organized grid with rank dropdowns
   - Proper card colors (red hearts/diamonds)

4. **Confirmation Dialogs**
   - Hero fold confirmation with investment warning
   - Showdown outcome selection (won/lost)
   - Raise/All-in amount input modal

### Technical Implementation Details

#### Fixed Position Tables
```typescript
// 6-handed positions (excluding DEALER)
export const POSITION_LABELS_6 = [
  'DEALER', 'BTN', 'SB', 'BB', 'UTG', 'LJ', 'CO'
] as const;

// 9-handed positions (excluding DEALER)
export const POSITION_LABELS_9 = [
  'DEALER', 'BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO'
] as const;

// Action sequences (DEALER excluded):
// 6-handed: BTN → SB → BB → UTG → LJ → CO
// 9-handed: BTN → SB → BB → UTG → UTG+1 → UTG+2 → LJ → HJ → CO
```

#### Session Management Functions
```typescript
// Core SessionService methods
createNewSession(config: SessionConfig): SessionMetadata
getCurrentSession(): SessionMetadata | null
updateSessionMetadata(metadata: SessionMetadata): void
endCurrentSession(): void
saveHandToSession(handData: StoredHand): void
getSessionHands(sessionId: string): StoredHand[]
getCurrentHandNumber(): number
getSessionList(): SessionMetadata[]
```

#### Hero Money Tracking
```typescript
// Track investment throughout hand
const [heroMoneyInvested, setHeroMoneyInvested] = useState<number>(0);

// On hand start (blind positions)
if (session.userSeat === 'SB') {
  setHeroMoneyInvested(smallBlind);
  setStack(prev => prev - smallBlind);
}

// On betting actions
if (position === session.userSeat && amount) {
  const additionalInvestment = amount - currentBet;
  setHeroMoneyInvested(prev => prev + additionalInvestment);
}
```

### Key Features Summary

#### ✅ Fully Implemented
- [x] Session creation with modular seat selection
- [x] Fixed position tables (6/9 handed)
- [x] Complete betting flow with all actions
- [x] Visual action indicators (color-coded, no text)
- [x] Hero fold logic with confirmation
- [x] Win/loss detection and stack management
- [x] Between-hand seat selection
- [x] Hand history storage
- [x] Pot size display with ante calculations
- [x] Modal inputs for raise/all-in amounts
- [x] Mobile-optimized UI
- [x] PWA updates and service worker caching

#### Recent Major Updates (Latest)
1. **Visual Action System**: Color-coded buttons instead of text labels
2. **Hero Fold Logic**: Complete confirmation and outcome tracking
3. **Seat Selection**: Between every hand after the first
4. **Stack Management**: Accurate blind deductions and win/loss tracking
5. **UI Polish**: Pot display, mobile positioning, subtle animations
6. **Blind Logic Fix**: Proper call amount calculations considering already posted blinds
   - SB/BB blind amounts are properly deducted from call calculations
   - BB shows "Check" instead of "Call" when no raises occur
   - Call amounts account for already posted bets (e.g., SB needs only 10 more to call 20 BB)
   - Added `getCallAmount()` and `canCheck()` helper functions for accurate betting logic
7. **Preflop Betting Rules**: Correct poker logic for preflop betting
   - Only BB can check in preflop when no raises occur
   - All other positions must call/raise/fold in preflop
   - Call button hidden when call amount is 0 (showing only Check)
   - Fixed hasActed initialization for proper betting round completion
8. **Community Card Improvements**: Enhanced visual feedback and positioning
   - Raised community cards position on table with better spacing from pot size
   - Sequential card blinking: Turn card blinks after flop, River card blinks after turn
   - Consistent yellow blinking styling for all community card selections
   - Check action now shows blue styling instead of gray for better visibility

### Architecture & File Structure

```
src/
├── app/
│   ├── create-session/page.tsx    # Session creation (uses SeatSelector)
│   ├── session/[id]/page.tsx      # Main game screen
│   └── layout.tsx                 # Root layout
├── components/poker/
│   ├── SimplePokerTable.tsx       # Fixed position table
│   ├── SeatSelector.tsx           # Reusable seat selection
│   ├── CardSelector.tsx           # Card selection modal
│   └── HandTracker.tsx            # Hand history display
├── services/
│   └── session.service.ts         # Session data management
├── types/
│   └── poker-v2.ts               # TypeScript interfaces
└── utils/
    └── poker-logic.ts            # Betting logic utilities
```

### Development Workflow

#### Running the App
```bash
# Kill any existing processes on port 3000 first
lsof -ti:3000 | xargs kill -9 2>/dev/null

npm run dev          # Start development server on port 3000
npm run build        # Build for production
npm run start        # Start production server
```

#### PWA Updates
```bash
npm run update-pwa   # Updates service worker cache version
npm run push         # Runs update-pwa, then git add/commit/push
```

### Benefits of Current Implementation
1. **Simplified Architecture**: Fixed positions, no complex rotation logic
2. **Mobile-First**: Optimized for mobile poker tracking
3. **Hero-Centric**: Focuses on player's experience and results
4. **Flexible Positioning**: Change seats between hands
5. **Accurate Tracking**: Proper money flow and stack management
6. **Visual Clarity**: Color-coded actions, clear pot display
7. **Session Organization**: All hands grouped under sessions

### Future Development Areas

#### Immediate Enhancements
1. **Hand Replay**: Use stored hand data for replay functionality
2. **Statistics Dashboard**: Session analytics and trends
3. **Export Features**: CSV/PDF export of session data
4. **Advanced Filters**: Search and filter hand history

#### Architecture Improvements
1. **Database Integration**: Replace localStorage with proper database
2. **User Authentication**: Multi-user support
3. **Real-time Sync**: Multi-device synchronization
4. **Enhanced PWA**: Push notifications, better offline support

This implementation provides a complete, production-ready poker session tracking PWA with a focus on simplicity, accuracy, and mobile usability.

## Mobile Development Standards

### Input Field Requirements
To prevent unwanted zoom behavior on mobile devices, all input fields MUST follow these standards:

#### 1. Viewport Configuration
The app metadata must include proper viewport settings:
```typescript
viewport: {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}
```

#### 2. Font Size Requirements
- **All input fields** must use a minimum font size of 16px (`text-base` in Tailwind)
- Never use `text-sm` or smaller sizes for inputs on mobile
- This applies to:
  - Text inputs
  - Number inputs
  - Select dropdowns
  - Textareas
  - All custom input components

#### 3. Global CSS Rules
The following CSS rules are enforced in `globals.css`:
```css
/* Prevent zoom on mobile for all input fields */
input[type="text"],
input[type="number"],
input[type="email"],
input[type="tel"],
input[type="password"],
input[type="search"],
select,
textarea {
  font-size: 16px !important;
}

/* iOS-specific fixes */
@media screen and (max-width: 768px) {
  input[type="text"],
  input[type="number"],
  /* ... other input types ... */
  select,
  textarea {
    font-size: 16px !important;
    -webkit-text-size-adjust: 100%;
  }
}
```

#### 4. Component Standards
- The base `Input` component uses `text-base` consistently
- All native HTML inputs must include `text-base` class or inline `font-size: 16px`
- Modal inputs and inline forms follow the same 16px minimum

### Why This Matters
Mobile browsers (especially iOS Safari) automatically zoom in when users tap on input fields with font sizes smaller than 16px. This creates a poor user experience where:
- The viewport zooms in unexpectedly
- The user must manually zoom out after input
- The layout may remain zoomed and distorted

By enforcing these standards, we ensure a smooth, native-like mobile experience without unwanted zoom behaviors.