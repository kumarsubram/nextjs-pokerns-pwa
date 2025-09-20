# Poker Notes PWA - Development Guide

## Project Overview
A Progressive Web App for tracking poker sessions, hands, and statistics. Built with Next.js 15, TypeScript, and Tailwind CSS.

## RECENT UPDATES (v2.10) ✅

### Session Page Refactoring Phase 2: Betting Logic Extraction - COMPLETED
✅ **Betting Logic Modularization**
- Successfully extracted betting logic into dedicated `useBettingLogic` hook
- Reduced session page complexity by ~350 lines of betting-related code
- Created `/src/hooks/useBettingLogic.ts` for centralized betting action management
- Moved 8 critical betting functions from session page to reusable hook:
  - `handleBettingAction` - Core betting action processing with auto-fold logic
  - `handleConfirmedHeroFold` - Hero fold confirmation and hand completion
  - `handleAdvanceToNextRound` - Betting round progression and showdown detection
  - `getCurrentBettingRound` - Type-safe betting round info accessor
  - `getCallAmount` - Call amount calculations considering blinds and stack limits
  - `isCallAllIn` - All-in detection logic for hero position
  - `canCheck` - Check availability logic with preflop/postflop rules
  - `autoFoldPlayersBetween` - Auto-fold logic for skipped positions

✅ **Advanced Poker Logic Preservation**
- **Position-Aware Logic**: Maintains proper 6/9-handed action sequences
- **Auto-Fold System**: Preserves complex logic for skipping positions in betting
- **Hero Investment Tracking**: Accurate money tracking for stack management
- **Blind Handling**: Proper preflop logic with BB check rules
- **Showdown Detection**: Complex multi-player vs heads-up showdown logic
- **All-In Logic**: Proper all-in detection and hand completion flows

✅ **Architecture Benefits**
- **Cleaner Session Page**: Reduced from ~1910 to ~1560 lines (18% reduction)
- **Reusable Betting Logic**: Hook can be used across different poker components
- **Type Safety**: Full TypeScript integration with proper interfaces
- **Separation of Concerns**: UI coordination separate from betting business logic
- **Testable in Isolation**: Betting logic can now be unit tested independently
- **No Breaking Changes**: All existing poker functionality preserved

✅ **Technical Implementation**
```typescript
// New betting logic hook structure
const {
  handleBettingAction,
  handleConfirmedHeroFold,
  handleAdvanceToNextRound,
  getCurrentBettingRound,
  getCallAmount,
  isCallAllIn,
  canCheck
} = useBettingLogic({
  session, currentHand, setCurrentHand, stack, heroMoneyInvested,
  setHeroMoneyInvested, completeHand, // ... all necessary state and setters
});

// Clean betting action calls
handleBettingAction('BTN', 'raise', 40); // Simple, reusable betting
handleAdvanceToNextRound(); // Clean round progression
```

✅ **Phase 2 Completion**
- Established pattern for future hook extractions
- Session page now focuses purely on UI coordination and state management
- Ready for Phase 3: Community card logic extraction

## PREVIOUS UPDATES (v2.9) ✅

### Session Page Refactoring Phase 1: Hand Flow Logic Extraction - COMPLETED
✅ **Hand Flow Logic Modularization**
- Successfully extracted hand flow management into dedicated `useHandFlow` hook
- Reduced session page complexity by ~200 lines of business logic
- Created `/src/hooks/useHandFlow.ts` for centralized hand flow management
- Moved 3 critical functions from session page to reusable hook:
  - `startNewHandWithPosition` - Creates new hands with proper poker logic
  - `startNewHand` - Wrapper for starting hands with current session seat
  - `completeHand` - Handles hand completion, validation, and state cleanup
- Extracted validation and calculation utilities:
  - `validateHandRequirements` - Validates stack, blinds, and hero cards
  - `calculateEffectivePotWinnings` - Handles pot distribution logic

✅ **Architecture Improvements**
- **Clean Separation**: Hand flow logic isolated from UI rendering logic
- **Type Safety**: Full TypeScript integration with proper interfaces
- **State Management**: Hook properly manages state setters and dependencies
- **Error Handling**: Preserved validation error dialogs and user feedback
- **No Breaking Changes**: All existing functionality preserved
- **Build Success**: Zero compilation errors or runtime issues

✅ **Benefits Achieved**
- **Maintainability**: Hand flow logic now testable in isolation
- **Reusability**: Hook can be used across different components
- **Clarity**: Session page focused on UI, hook focused on business logic
- **Foundation**: Established pattern for future refactoring phases

✅ **Technical Implementation**
```typescript
// New hook structure
const { startNewHandWithPosition, startNewHand, completeHand } = useHandFlow({
  session, currentHand, setCurrentHand, stack, setStack,
  // ... all necessary state and setters
});

// Replaced ~200 lines of inline logic with clean hook calls
startNewHand(); // Simple, reusable hand creation
completeHand('won', potAmount); // Clean hand completion
```

✅ **Next Phase Preparation**
- Established foundation for extracting betting action logic
- Identified patterns for future state management improvements
- Ready for Phase 2: Betting Action Management extraction

## PREVIOUS UPDATES (v2.8) ✅

### Session Page Modularization & Hero Cards UI Enhancement - COMPLETED
✅ **Hero Cards Display Improvements**
- Moved hero card selection from SimplePokerTable component to dedicated section
- Created larger, more prominent card buttons (16x24 size) for better mobile UX
- Positioned hero cards section below poker table and above action buttons
- Clear visual hierarchy with "Your Cards" header and centered layout
- Proper color coding for suits (red for hearts/diamonds, black for clubs/spades)
- Hover effects and smooth transitions for better interaction feedback

✅ **Session Page Component Modularization**
- Extracted session page functionality into 5 reusable components
- Reduced main session page file by ~300+ lines of code
- Created `/src/components/session/` folder for session-specific components
- Each component has proper TypeScript interfaces and focused responsibility
- Centralized exports via index.ts for clean imports

✅ **New Session Components Created**
- **HeroCards**: Displays hero's card selection with improved UX
- **SessionHeader**: Top navigation bar with session name and end session button
- **HandInfoHeader**: Shows current hand number, betting round, and turn indicators
- **HandSettingsPanel**: Controls for stack, blinds, and ante with profit/loss display
- **ActionButtons**: Comprehensive betting action interface with contextual buttons

✅ **SimplePokerTable Component Cleanup**
- Removed hero card display logic from table component
- Eliminated unnecessary props (userCards, onCardClick, showCardButtons)
- Component now focused solely on table visualization and seat interactions
- Cleaner separation of concerns between table display and card management

✅ **Code Organization Benefits**
- Better maintainability with single-responsibility components
- Easier testing with isolated component logic
- Improved reusability across different parts of the application
- Enhanced readability of main session page
- Type-safe interfaces for all component props

## PREVIOUS UPDATES (v2.7) ✅

### HandHistory Hero Position Fix - COMPLETED
✅ **Fixed Action Logging Display Bug**
- Fixed critical issue where HandHistory showed incorrect hero position in action logs
- Problem: Changing seats between hands affected historical hand display retroactively
- Root cause: HandHistory used current `session.userSeat` for ALL hands instead of original userSeat

✅ **StoredHand Interface Enhancement**
- Added `userSeat: Position` field to StoredHand interface to preserve original user position
- Updated hand completion logic to store userSeat when saving hand data
- Modified URL share service to include userSeat property for compressed hand data
- Ensures each completed hand maintains its original context permanently

✅ **HandHistory Component Improvements**
- Updated `formatPosition` function to accept optional `handUserSeat` parameter
- Modified `renderActionLog` to use hand-specific userSeat for action formatting
- Added logic to determine correct userSeat: `'userSeat' in hand ? hand.userSeat : userSeat`
- Fixed action logs to show correct hero position even after seat changes

✅ **Seat Selection Safety Enhancements**
- Prevented seat selection during active hands to avoid state corruption
- Added safety checks in seat selection logic with console warnings
- Improved seat selector visibility conditions to only show between hands
- Enhanced user experience by preventing accidental seat changes mid-hand

✅ **Technical Implementation Details**
```typescript
// Enhanced StoredHand interface
interface StoredHand {
  handNumber: number;
  timestamp: string;
  userSeat: Position;  // ✅ NEW: Preserves original user position
  userCards: [string, string] | null;
  // ... rest of interface
}

// Hand-specific userSeat determination
const handUserSeat = 'userSeat' in hand ? hand.userSeat : userSeat;

// Updated formatPosition function
const formatPosition = (position: Position, includeOriginalPosition: boolean = false, handUserSeat?: Position) => {
  const effectiveUserSeat = handUserSeat || userSeat;
  if (position === effectiveUserSeat) {
    return includeOriginalPosition ? `Hero (${position})` : 'Hero';
  }
  return position;
};
```

✅ **PWA and Navigation Updates**
- Updated service worker cache version to v140 for deployment
- Fixed navigation references from '/shared' to '/tracked' in header and bottom navigation
- Cleaned up removed shared hand pages and updated routing
- Updated URL share service with proper userSeat property handling

## PREVIOUS UPDATES (v2.6) ✅

### Dialog Component Refactoring - COMPLETED
✅ **Modular Dialog Architecture**
- Extracted all 7 dialog components from main session page into separate, reusable modules
- Organized under `/src/components/dialog/` with centralized exports via `index.ts`
- Each dialog component has comprehensive TypeScript interfaces and proper prop definitions
- Clean separation of concerns with self-contained dialog logic

✅ **Extracted Dialog Components**
- **AllFoldedDialog**: Hand Won - All Opponents Folded scenario with inline card selection
- **ShowdownDialog**: Showdown outcome selection with hero and opponent card inputs
- **AmountModal**: Raise and all-in amount input with validation
- **ConfirmFoldDialog**: Fold confirmation with conditional card selection for invested money
- **HeroMustActFirstDialog**: Simple informational dialog about action sequence
- **AutoActionConfirmDialog**: Confirms auto-folding/checking of skipped players
- **ValidationErrorDialog**: General validation error display with card selection trigger

✅ **Improved Code Organization**
- Main session page significantly cleaner and more focused (removed ~500 lines of inline dialog code)
- Better maintainability with each dialog isolated in its own file
- Enhanced reusability - components can be used across different parts of the application
- Clear visibility of all dialog types for easier development and debugging

✅ **TypeScript Interface Architecture**
```typescript
// Example: Comprehensive prop definitions for each dialog
interface AllFoldedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentHand: CurrentHand | null;
  userSeat?: Position;
  inlineCardSelection: InlineCardSelectionState;
  // ... additional props for full functionality
}
```

✅ **Clean Import Structure**
```typescript
// Centralized dialog imports
import {
  AllFoldedDialog,
  ShowdownDialog,
  AmountModal,
  ConfirmFoldDialog,
  HeroMustActFirstDialog,
  AutoActionConfirmDialog,
  ValidationErrorDialog
} from '@/components/dialog';
```

## PREVIOUS UPDATES (v2.5) ✅

### Smooth Community Card Selection Experience - COMPLETED
✅ **Enhanced Community Card Selection Flow**
- Replaced generic "Betting Round Complete" with specific messages:
  - Preflop: "Select Flop Community Cards to continue"
  - Flop: "Select Turn Card to continue"
  - Turn: "Select River Card to continue"
- Implemented auto-triggered guided progression for community card selection
- Cards automatically progress through First → Second → Third flop card selection
- Smooth card-to-card transitions without closing/reopening card selector

✅ **Eliminated All Visual Blinks and Layout Shifts**
- Fixed Action Buttons blinking when betting round completes
- Added computed `needsCommunityCards` variable for synchronous state evaluation
- Reserved space for community card selector to prevent HandHistory layout shifts
- Implemented stable HandHistory during community card selection using frozen state snapshots
- Fixed timing issues between `isBettingComplete` and auto-trigger useEffect

✅ **Optimized Auto-Trigger Community Card Selection**
- useEffect immediately triggers community card selection when betting completes
- Seamless progression: betting completes → space reserved → card selector appears
- No visual interruptions or flashing during transitions
- HandHistory remains stable and visible throughout entire selection process

✅ **Technical Implementation Details**
```typescript
// Computed variable for synchronous evaluation
const needsCommunityCards = currentHand && isBettingComplete && (
  (currentHand.currentBettingRound === 'preflop' && (!flop_cards_complete)) ||
  (currentHand.currentBettingRound === 'flop' && !currentHand.communityCards.turn) ||
  (currentHand.currentBettingRound === 'turn' && !currentHand.communityCards.river)
);

// Stable HandHistory during selection
const stableCurrentHandRef = useRef<CurrentHand | null>(null);
const handHistoryCurrentHand = showCommunitySelector ? stableCurrentHandRef.current : currentHand;

// Reserved space prevents layout shifts
{!showSeatSelection && (needsCommunityCards || showCommunitySelector) && (
  <div className="mt-4 transition-opacity duration-300" style={{ minHeight: '200px' }}>
    {/* Community card selector */}
  </div>
)}
```

✅ **User Experience Improvements**
- Completely smooth transitions with no visual blinks or jumps
- HandHistory remains stable and visible during community card selection
- Immediate space reservation when last user acts prevents any layout shifts
- Professional, polished feel with 300ms smooth transitions
- Progressive card selection with clear guidance text

## PREVIOUS UPDATES (v2.4) ✅

### Layout and Betting Logic Fixes - COMPLETED
✅ **Fixed SeatSelector Layout Issues**
- Fixed scroll bar appearing when there wasn't enough content to scroll
- Adjusted height calculation to account for AppHeader (64px), session header, and bottom navigation
- Changed from `h-full` to `h-[calc(100dvh-12rem)]` for better mobile viewport handling
- Increased horizontal padding for better button spacing
- Used dynamic viewport height (`100dvh`) for mobile browser compatibility

✅ **Fixed Betting Action Button Layout**
- Made all action buttons (Fold, Call, Raise, All-In, Check) equal width
- Added `flex-1 min-w-[80px]` to all position action buttons and hero action buttons
- Consistent button sizing across both position action selector and hero action sections
- Better visual balance and touch targets on mobile

✅ **Fixed All-In and Hand Completion Logic**
- Fixed bug where all-in actions incorrectly ended hands immediately
- Updated hand completion logic to include both 'active' and 'all-in' players
- All-in players now properly remain in the hand until opponents act
- Only when opponents fold does the hand end with all-in player winning
- Fixed multiple locations: `handleBettingAction`, `handIsOver` calculation, `advanceToNextRound`
- Proper poker logic: all-in doesn't end hand, only player folding does

✅ **Enhanced Poker Logic Integrity**
- All-in players considered active for hand continuation purposes
- Betting can continue after all-in until other players fold or call
- Showdown logic properly handles all-in vs active player scenarios
- Fixed premature hand endings in all-in situations

## PREVIOUS UPDATES (v2.3) ✅

### Input Handling and Mobile UX Fixes - COMPLETED
✅ **Fixed Input Number Handling Issues**
- Fixed buy-in input bug causing "0500" pattern when editing
- Replaced faulty `parseInt(e.target.value) || 0` with proper validation logic
- Added explicit empty string handling and NaN checks
- Applied fix to all number inputs: buy-in, stack, small blind, big blind, ante, amounts

✅ **Updated Default Values**
- Buy-in default changed from 100 to 500
- Small Blind default changed from 10 to 2
- Big Blind default changed from 20 to 5
- Updated placeholder text to reflect new defaults

✅ **Fixed SeatSelector Mobile Positioning**
- Removed extreme `pt-39` padding causing cutoff positioning on iPhone
- Added proper `justify-center` for vertical centering
- Replaced excessive margins with consistent `space-y-6` spacing
- Fixed dialog appearing in top-left corner cut off on mobile

✅ **Session Management Enhancements**
- Added comprehensive "Delete All Sessions" functionality to sessions page
- Double confirmation dialog to prevent accidental deletion
- Complete cleanup of all session-related localStorage data
- Added `deleteAllSessions()` method to SessionService with proper error handling
- Updated PWA service worker cache version for feature deployment

✅ **Comprehensive Number Input Validation**
```typescript
// Improved input handling pattern
onChange={(e) => {
  const value = e.target.value;
  if (value === '') {
    setValue(0);
  } else {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setValue(numValue);
    }
  }
}}
```

## PREVIOUS UPDATES (v2.2) ✅

### Enhanced Hand History and Side Pot Logic - COMPLETED
✅ **Progressive Community Cards Display**
- Hand history now shows community cards progressively per betting round
- Preflop: no cards, Flop: 3 cards, Turn: 4 cards, River: 5 cards
- Cards displayed inline with each betting round's action log

✅ **Opponent Cards in Showdown History**
- Opponent cards are now logged and displayed in hand history during showdowns
- Shows each opponent's hole cards when revealed at showdown
- Clear labeling of opponent positions and their cards

✅ **Proper Stack Tracking Between Hands**
- Stack now correctly tracks wins/losses between hands in same session
- Winning a pot increases stack for next hand's starting amount
- Losing money decreases stack accordingly
- Accurate session-to-session stack continuity

✅ **Side Pot Logic Implementation**
- Proper side pot calculation for all-in scenarios with different stack sizes
- Hero can only win maximum of their investment from each opponent
- Effective winnings limited by actual player investments
- Console logging shows when side pot rules apply

✅ **All-in Call Amount Fixes**
- Call amounts properly limited by remaining stack size
- "Call All-In" button text when call uses entire remaining stack
- Prevents calls for more money than player has

✅ **Code Quality Improvements**
- Reduced excessive console logging to keep only critical messages
- Cleaner debug output focusing on important state changes

## PREVIOUS UPDATES (v2.1) ✅

### Dialog System Improvements - COMPLETED
✅ **Enhanced Fold Confirmation Dialog**
- Improved text structure and labeling
- Hero cards marked as "Required" when not both selected
- "Optional: Add any cards revealed" text for opponent cards
- Removed unnecessary explanatory text
- Disabled "Confirm Fold" button until both hero cards selected when money invested

✅ **Enhanced Showdown Dialog**
- Replaced ugly browser alert with proper dialog interface
- Hero card selection integrated directly in showdown dialog
- "Required for showdown" labeling when hero cards missing
- Disabled outcome buttons ("I Won"/"I Lost") until hero cards selected
- Consistent user experience with fold confirmation dialog

✅ **Technical Fixes**
- Made `SessionService.getSessionMetadata()` public to fix TypeScript build errors
- Updated PWA service worker to v115 for cache invalidation
- Build process now passes without TypeScript errors

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

#### Advanced Betting Logic System
```typescript
// Auto-fold players between next-to-act and caller
function autoFoldPlayersBetween(
  nextToAct: Position,
  callerPosition: Position,
  currentRound: BettingRound,
  playerStates: PlayerState[],
  seats: TableSeats
): BettingRound {
  // Get action sequence for table size
  const actionSequence = getActionSequence(seats);

  // Filter to only active players
  const activePlayers = playerStates.filter(p => p.status === 'active');
  const activePositions = activePlayers.map(p => p.position);
  const activeActionSequence = actionSequence.filter(pos => activePositions.includes(pos));

  // Find positions between nextToAct and caller
  const positionsBetween = getPositionsBetween(nextToAct, callerPosition, activeActionSequence);

  // Auto-fold those positions
  positionsBetween.forEach(position => {
    currentRound.actions.push({
      position,
      action: 'fold',
      timestamp: new Date().toISOString()
    });
  });

  return currentRound;
}

// Circular next-to-act calculation
function getNextToAct(
  bettingRound: string,
  playerStates: PlayerState[],
  currentRound: BettingRound,
  seats: TableSeats
): Position | null {
  const actionSequence = getActionSequence(seats, bettingRound as any);
  const activePlayers = playerStates.filter(p => p.status === 'active');

  // Find next player who needs to act
  for (let i = 0; i < actionSequence.length; i++) {
    const position = actionSequence[i];
    const player = activePlayers.find(p => p.position === position);

    if (player && needsToAct(player, currentRound.currentBet || 0)) {
      return position;
    }
  }

  return null; // Betting round complete
}
```

#### Mobile Keyboard Detection System
```typescript
// Custom hook for viewport height changes
export function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState(0);
  const [initialHeight, setInitialHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      setViewportHeight(currentHeight);

      // Consider keyboard open if viewport is significantly smaller
      const heightDifference = initialHeight - currentHeight;
      setIsKeyboardOpen(heightDifference > 150);
    };

    // Use visualViewport if available (better for mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    }
  }, []);

  return { viewportHeight, initialHeight, isKeyboardOpen, heightDifference };
}

// Dynamic dialog classes based on keyboard state
const getDialogClasses = (baseClasses: string) => {
  return cn(
    baseClasses,
    isKeyboardOpen && "dialog-mobile-keyboard-open"
  );
};
```

#### Inline Card Selection Architecture
```typescript
// Inline card selection state management
const [inlineCardSelection, setInlineCardSelection] = useState<{
  show: boolean;
  position: Position | null;
  cardIndex: 1 | 2;
  title: string;
}>({
  show: false,
  position: null,
  cardIndex: 1,
  title: ''
});

// Embedded CardSelector in dialogs
{inlineCardSelection.show && (
  <div className="mt-4 border-t pt-4">
    <CardSelector
      title={inlineCardSelection.title}
      selectedCards={allSelectedCards}
      onCardSelect={handleInlineCardSelect}
      onCancel={() => setInlineCardSelection({
        show: false,
        position: null,
        cardIndex: 1,
        title: ''
      })}
    />
  </div>
)}
```

#### Showdown Detection Logic
```typescript
// Proper showdown detection in handleAdvanceToNextRound
if (currentHand.currentBettingRound === 'river') {
  // Count active players (including hero if still active)
  const activePlayers = currentHand.playerStates.filter(p => p.status === 'active');
  const heroStillActive = activePlayers.some(p => p.position === session.userSeat);

  // True showdown: 2+ players reach the end
  if (activePlayers.length >= 2) {
    // Validate Hero cards are selected for showdown only if hero is still active
    if (heroStillActive && (!currentHand.userCards || !currentHand.userCards[0] || !currentHand.userCards[1])) {
      alert('Hero cards must be selected before showdown');
      return;
    }
    // Show unified showdown dialog
    setShowOutcomeSelection(true);
    return;
  } else {
    // Not a showdown - only 1 player left, hand ends automatically
    if (heroStillActive) {
      completeHand('won', currentHand.pot || 0);
    } else {
      completeHand('lost', 0);
    }
    return;
  }
}
```

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
9. **Advanced Betting Logic & Auto-Fold System**: Comprehensive poker action flow
   - **Auto-fold logic**: Players between the next-to-act and a caller are automatically folded (simulation of typical poker action)
   - **Proper nextToAct calculation**: Circular search logic for both preflop and post-flop betting rounds
   - **Active player filtering**: All betting logic properly filters out folded players
   - **Raise handling**: Correct resetting of hasActed flags and action sequences when raises occur
   - **Betting round completion**: Accurate detection of when betting rounds are complete
   - **Position-aware logic**: Separate logic for 6-handed vs 9-handed tables throughout all betting functions
10. **Mobile Keyboard Handling**: Intelligent dialog positioning for mobile devices
    - **Viewport detection**: Using Visual Viewport API to detect when mobile keyboard is open
    - **Dynamic dialog positioning**: Dialogs automatically reposition when keyboard appears to prevent overlap
    - **iPhone optimization**: Specific handling for iOS Safari keyboard behavior
    - **Responsive dialog classes**: Conditional CSS classes for keyboard-open states
11. **Unified Card Selection Experience**: Consolidated and streamlined card selection flow
    - **Inline Card Selection**: CardSelector component embedded directly within dialogs instead of navigation
    - **Consolidated Fold Dialog**: Single dialog combining fold confirmation with optional card selection
    - **Smart Card Requirements**: Only shows card selection if user invested money (heroMoneyInvested > 0)
    - **Unified Showdown Dialog**: All showdown card selection and outcome selection in one comprehensive dialog
    - **No Navigation Interruption**: Users remain in dialog context without unexpected page redirects
12. **Proper Showdown Detection**: Accurate logic for when showdowns actually occur
    - **True Showdown Logic**: Only shows showdown dialog when 2+ players reach the river
    - **Auto-completion for Non-showdowns**: Hands automatically complete when only 1 player remains
    - **Fold Logic Cleanup**: Hero folds immediately complete the hand without unnecessary dialogs
    - **Active Player Counting**: Proper detection of remaining active players at hand end

### Architecture & File Structure

```
src/
├── app/
│   ├── create-session/page.tsx    # Session creation (uses SeatSelector)
│   ├── session/[id]/page.tsx      # Main game screen (modularized)
│   └── layout.tsx                 # Root layout
├── components/
│   ├── dialog/                    # Modular dialog components
│   │   ├── AllFoldedDialog.tsx    # Hand won - all opponents folded
│   │   ├── ShowdownDialog.tsx     # Showdown outcome selection
│   │   ├── AmountModal.tsx        # Raise/all-in amount input
│   │   ├── ConfirmFoldDialog.tsx  # Fold confirmation with cards
│   │   ├── HeroMustActFirstDialog.tsx # Action sequence info
│   │   ├── AutoActionConfirmDialog.tsx # Auto-fold confirmation
│   │   ├── ValidationErrorDialog.tsx # Validation errors
│   │   └── index.ts               # Centralized exports
│   ├── session/                   # ✅ NEW: Session page components
│   │   ├── HeroCards.tsx         # Hero card selection display
│   │   ├── SessionHeader.tsx     # Session navigation header
│   │   ├── HandInfoHeader.tsx    # Hand information display
│   │   ├── HandSettingsPanel.tsx # Stack/blinds controls
│   │   ├── ActionButtons.tsx     # Betting action interface
│   │   └── index.ts              # Centralized exports
│   └── poker/
│       ├── SimplePokerTable.tsx   # Fixed position table (cleaned up)
│       ├── SeatSelector.tsx       # Reusable seat selection
│       ├── CardSelector.tsx       # Card selection modal
│       └── HandHistory.tsx        # Hand history display
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

## Development Rules & Best Practices

### Code Quality Standards

#### 1. Poker Logic Integrity
- **Always filter active players**: All betting logic must check `p.status === 'active'` before processing
- **Position-aware calculations**: Use `getActionSequence(seats)` for table-size-specific logic
- **Circular action flow**: Handle wrap-around logic for next-to-act calculations
- **Raise flag resets**: When raises occur, reset `hasActed` flags appropriately
- **Betting round completion**: Check all active players have acted AND call amounts match

#### 2. Dialog and Modal Management
- **Unified dialogs preferred**: Combine related functionality into single dialogs instead of chains
- **Mobile keyboard awareness**: Use `useViewportHeight()` hook and `getDialogClasses()` for responsive positioning
- **Inline components**: Embed complex components (like CardSelector) within dialogs rather than navigation
- **State cleanup**: Always reset dialog states on close/cancel actions
- **Conditional requirements**: Only show mandatory sections when actually required (e.g., hero cards only for showdowns)

#### 3. User Experience Principles
- **No unexpected navigation**: Keep users in context, avoid navigating away from dialogs
- **Smart defaults**: Only show options/requirements when they apply to the current scenario
- **Progressive disclosure**: Show card selection only when user has invested money
- **Clear visual feedback**: Use color coding, animations, and state indicators consistently
- **Error prevention**: Validate states before allowing actions (e.g., hero cards for showdown)

#### 4. State Management Rules
- **Hero money tracking**: Always update `heroMoneyInvested` for blind posts and betting actions
- **Stack synchronization**: Keep stack amounts in sync with investments and winnings
- **Hand state consistency**: Update `currentHand` state immediately when cards are selected
- **Player state accuracy**: Maintain correct active/folded status throughout betting rounds
- **Clean state transitions**: Reset relevant states when moving between hands

### Technical Debt Prevention

#### 1. Avoid These Patterns
```typescript
// ❌ Bad: Hardcoded position sequences
const positions = ['BTN', 'SB', 'BB', 'UTG', 'LJ', 'CO'];

// ✅ Good: Table-size aware sequences
const positions = getActionSequence(seats);

// ❌ Bad: Processing all players
players.forEach(player => processAction(player));

// ✅ Good: Filter active players first
players.filter(p => p.status === 'active').forEach(player => processAction(player));

// ❌ Bad: Dialog chains
setShowDialog1(false);
setShowDialog2(true);

// ✅ Good: Unified dialogs
setShowUnifiedDialog(true);
```

#### 2. Required Validations
- Check active player status before processing any poker logic
- Validate hero cards exist before showdown dialogs
- Confirm table size (6/9) before using position sequences
- Verify current betting round before calculating next-to-act
- Ensure dialog states are properly cleaned up

#### 3. Mobile Optimization Checklist
- [ ] All input fields use minimum 16px font size
- [ ] Dialogs use mobile keyboard detection
- [ ] Card selection works with touch interfaces
- [ ] Button spacing accommodates finger taps
- [ ] Responsive layout for different screen sizes
- [ ] No zoom on input focus

### Testing Guidelines

#### 1. Poker Logic Testing Scenarios
- Test auto-fold logic with different position combinations
- Verify betting round completion with various action sequences
- Test showdown detection with 1, 2, and 3+ remaining players
- Validate raise scenarios reset action flags correctly
- Test both 6-handed and 9-handed table logic

#### 2. UI/UX Testing Scenarios
- Test dialog behavior with mobile keyboard open/closed
- Verify card selection works inline within dialogs
- Test fold logic with/without money invested
- Validate showdown flow for different player counts
- Test seat changes between hands

#### 3. Edge Case Testing
- Hero folds with various investment amounts
- All players fold except hero
- Raise scenarios with circular next-to-act logic
- Community card selection in different betting rounds
- Mobile keyboard behavior with different dialog types

### PWA Maintenance

#### 1. Service Worker Updates
- Update cache version (`CACHE_NAME`) for any significant changes
- Test PWA functionality after major updates
- Verify offline behavior with cached content
- Test service worker update flow

#### 2. Data Migration and User Data Management

The app includes a controlled data migration system to manage user data across updates.

##### Normal PWA Updates (Preserve User Data)
For regular app updates that should **NOT** clear user data:

```bash
npm run update-pwa   # Updates PWA cache version only
npm run build        # Build the updated app
npm run push         # Or manual git commit/push
```

**Result**: Users get new features but keep all their existing sessions and data.

##### Global Data Clearing (Force Reset for All Users)
When you need to clear all user data globally due to breaking changes:

**Step 1**: Update the data version in `src/services/session.service.ts`:
```typescript
// Change this number to force data migration
const CURRENT_DATA_VERSION = 3; // Increment from current value

// Add comment explaining the reason
// Example: v3: New session format incompatible with v2
```

**Step 2**: Deploy the update:
```bash
npm run update-pwa   # Updates PWA cache
npm run build        # Build with new data version
npm run push         # Deploy changes
```

**Result**: All users will have their data cleared once when they load the app, then data persists on future updates.

##### Data Version History
- **v1**: Initial data format
- **v2**: Shared hand cleanup migration (current)
- **v3**: (Future) Use when next breaking change is needed

##### Migration Behavior
- **New users**: Start with current data version, no migration needed
- **Existing users**: Migrate from their stored version to current version
- **Same version**: No migration, data preserved
- **Lower version**: Data cleared and version updated
- **Missing version**: Treated as v0, data cleared

#### 3. Performance Considerations
- Minimize localStorage operations
- Batch state updates where possible
- Use React.memo for expensive components
- Implement proper cleanup in useEffect hooks

#### 4. Deployment Workflow

##### Standard Update (Keep User Data)
```bash
# Make your code changes
git add .
git commit -m "Description of changes"

# Update PWA and deploy
npm run update-pwa
npm run build
git add .
git commit -m "Update PWA cache version"
git push
```

##### Breaking Change Update (Clear User Data)
```bash
# Make your code changes
git add .
git commit -m "Description of changes"

# Update data version in session.service.ts
# Edit CURRENT_DATA_VERSION = X (increment number)
# Add comment explaining why data clearing is needed

# Update PWA and deploy
npm run update-pwa
npm run build
git add .
git commit -m "Breaking change: clear user data for compatibility"
git push
```

##### Emergency Data Clear
If you need to immediately clear all user data:
1. Increment `CURRENT_DATA_VERSION` in `session.service.ts`
2. Add comment explaining emergency reason
3. Deploy using breaking change workflow above

This development guide ensures consistent, high-quality implementation that maintains poker integrity while providing excellent mobile UX and controlled data management.