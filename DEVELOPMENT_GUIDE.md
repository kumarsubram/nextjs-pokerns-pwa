# Poker Notes PWA - Development Guide

## Project Overview
A Progressive Web App for tracking poker sessions, hands, and statistics. Built with Next.js 15, TypeScript, and Tailwind CSS.

## Architecture & Structure

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Storage**: Local storage (with future sync capability)
- **Icons**: Lucide React

### Key Directories
```
src/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout with global navigation
│   ├── page.tsx             # Home page with session overview
│   ├── create-session/      # Session creation wizard
│   ├── session/[id]/        # Individual session view
│   ├── sessions/            # All sessions list
│   ├── history/             # Hand history
│   └── account/             # User account
├── components/
│   ├── poker/
│   │   └── PokerTable.tsx   # Interactive table component
│   ├── navigation/
│   │   ├── AppHeader.tsx    # Top navigation
│   │   └── BottomNav.tsx    # Mobile bottom nav
│   ├── session/
│   │   └── SessionCard.tsx  # Session display cards
│   └── ui/                  # Shadcn UI components
├── hooks/
│   └── useSessions.tsx      # Session management
├── services/
│   └── poker.service.ts     # Data operations
└── types/
    └── poker.ts             # TypeScript interfaces
```

## Key Features Implemented

### 1. Navigation System
**Location**: Root layout with global navigation
- **AppHeader**: Top navigation with page titles, back buttons, online status
- **BottomNav**: Mobile-first bottom navigation
- **Layout**: Moved to `src/app/layout.tsx` for consistency across all pages

### 2. Poker Table Component (`src/components/poker/PokerTable.tsx`)
**Key Features**:
- Supports 2-10 player tables with proper positioning
- **Dealer Button**: Prominent Crown icon with enhanced yellow styling (border-4, shadow-xl, ring effects)
- **Position Labels**: Shows poker abbreviations (UTG, MP, CO, BTN, SB, BB) when dealer is set
- **Blind Selection**: Auto-selects big blind when small blind is clicked
- **Community Cards**: 5 interactive card slots with dropdown selectors (52-card deck)
- **Visual States**: Different colors for dealer, blinds, hero seat, and regular seats

**Usage**:
```tsx
<PokerTable
  seats={9}
  dealerSeat={0}
  smallBlindSeat={1}
  bigBlindSeat={2}
  selectedSeat={5}
  showPositions={true}
  showCommunityCards={true}
  onCommunityCardSelect={(cardIndex, card) => handleCardSelect(cardIndex, card)}
/>
```

### 3. Session Management
**Hook**: `src/hooks/useSessions.tsx`
**Features**:
- Local storage persistence
- CRUD operations for sessions
- Real-time updates across components
- Session state management (active/completed)

**Session Flow**:
1. **Create Session** → Multi-step wizard (details, blinds, seat selection)
2. **Active Sessions** → Show community cards and hand tracking
3. **Session View** → Full session details with poker table layout

### 4. Data Types (`src/types/poker.ts`)
**Key Interfaces**:
- `Session`: Core session data with positions, blinds, timing
- `Hand`: Individual hand tracking with actions and results  
- `User`: User account information
- `Currency`: Multi-currency support with symbols

## Poker Rules & Game Logic Implementation

### Texas Hold'em Betting Rules
**Location**: `src/app/session/[id]/page.tsx`

#### Betting Round Structure
1. **Preflop**: After hole cards are dealt, betting starts UTG (Under the Gun)
2. **Flop**: After 3 community cards, betting starts with player after big blind
3. **Turn**: After 4th community card, betting continues
4. **River**: After 5th community card, final betting round
5. **Showdown**: Remaining players reveal cards

#### Betting Actions & Logic
- **Fold**: Player exits the hand, removed from `playersMatchedBet` tracking
- **Check**: Player stays in without betting (only when current bet is 0)
- **Call**: Player matches the current bet by adding `(currentBet - playerCurrentBet)`
- **Raise**: Player increases the bet to a new amount, resets `playersMatchedBet` to only include raiser
- **All-in**: Player bets their remaining stack, marked in `allInPlayers` set

#### Betting Round Completion Rules
A betting round completes when:
1. Only one player remains (all others folded)
2. All active players have acted AND matched the current bet (or are all-in)
3. We've gone full circle and everyone who can act has matched the bet
4. All remaining players are all-in (no more betting possible)

**Key State Tracking**:
```typescript
const [playersActedThisRound, setPlayersActedThisRound] = useState<Set<number>>(new Set());
const [playersMatchedBet, setPlayersMatchedBet] = useState<Set<number>>(new Set());
const [playerBetsThisRound, setPlayerBetsThisRound] = useState<Map<number, number>>(new Map());
const [currentBet, setCurrentBet] = useState<number>(0);
const [allInPlayers, setAllInPlayers] = useState<Set<number>>(new Set());
```

### Card Selection & Duplicate Prevention

#### Hole Card Selection (`src/components/poker/HoleCardSelector.tsx`)
- **Feature**: Interactive suit buttons + rank dropdown for 2 hole cards
- **Duplicate Prevention**: Cards used in hole cards cannot be selected for community cards
- **State Management**: Auto-advances to straddle selection when both cards selected
- **Validation**: `getUsedCards()` function prevents selecting same card twice

#### Community Card Selection (`src/components/poker/CommunityCardSelector.tsx`)
- **Progressive Reveal**: Shows cards based on betting round (flop=3, turn=1, river=1)
- **Duplicate Prevention**: Cards used in hole cards or other community positions unavailable
- **Visual Feedback**: Unavailable cards shown with opacity reduction and "(used)" label
- **Integration**: Receives `holeCards` prop to enforce cross-component duplicate prevention

#### Card Format & Display
- **Format**: Rank + Suit symbol (e.g., "A♠", "K♥", "Q♦", "J♣")  
- **Suits**: Spades (♠), Hearts (♥), Diamonds (♦), Clubs (♣)
- **Colors**: Hearts and Diamonds display in red (`text-red-600`), Spades and Clubs in black
- **Validation**: 52-card deck with proper suit/rank combinations

### Side Pot & All-In Logic

#### All-In Scenarios (`src/app/session/[id]/page.tsx`)
- **Short Stack All-In**: When player goes all-in for less than current bet, creates side pot scenario
- **Effective Stack**: Other players can only win amount equal to all-in player's contribution
- **State Flag**: `allInScenario` boolean tracks when side pots are needed
- **Action Availability**: All-in button hidden when player can afford to call

#### Pot Calculation
- **Main Pot**: Tracks total chips contributed by all players
- **Side Pot Logic**: When `allInScenario` is true, separate calculations for different stack sizes
- **Bet Tracking**: `playerBetsThisRound` Map tracks each player's total contribution per round

### Session Creation Flow

#### Multi-Step Wizard (`src/app/create-session/page.tsx`)
1. **Step 1**: Session details (name, buy-in, location, blinds)
2. **Step 2**: Blind position selection (auto-advances after small blind selection)
3. **Step 3**: Hero seat selection with animated prompts
4. **Auto-Progression**: Removes manual "Next" clicks for smoother UX

#### Seat & Position Logic
```typescript
// Dealer is always one seat before small blind
const dealerSeat = (smallBlindSeat - 1 + totalSeats) % totalSeats;

// Position abbreviations based on table size and dealer position  
const getPositionAbbreviation = (seatIndex: number, dealerSeat: number, totalSeats: number) => {
  const positionsFromDealer = (seatIndex - dealerSeat + totalSeats) % totalSeats;
  // Returns: UTG, UTG+1, MP, MP+1, CO, BTN, SB, BB
};
```

### Hand Progression & State Management

#### Betting Round State Machine
- **waitingForCards**: Boolean flag when community cards need to be selected
- **waitingForHoleCards**: Initial state before hole cards are chosen  
- **currentActionSeat**: Tracks whose turn it is to act
- **currentBettingRound**: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'

#### Player Action Processing
```typescript
const handlePlayerAction = (action: 'fold' | 'call' | 'raise' | 'check' | 'all-in', amount?: number) => {
  // Calculate actual amounts based on current bet and player's existing bet
  // Update pot size, player actions, and betting tracking state
  // Move to next player or complete betting round
};
```

## Recent Improvements Made

### Critical Betting Logic Bug Fixes
- **Problem**: Betting rounds not completing when all players matched current bet after BB re-raise scenario
- **Root Cause**: React state timing issue - `moveToNextPlayer()` was using stale `currentBet` values from async `setCurrentBet()`
- **Solution**: Modified `moveToNextPlayer()` to accept updated parameters and pass them directly from `handlePlayerAction()`
- **Files Modified**: `src/app/session/[id]/page.tsx` lines 400-450
- **Key Learning**: React state updates are asynchronous - pass updated values directly instead of relying on state

### Immediate Win Detection & State Timing Issues (Major Bug Fix)
#### Problem Symptoms
- **Hand Result Bug**: When hero went all-in and all opponents folded, hand would show "Folded" instead of "Won"
- **Balance Not Updating**: Session profit wouldn't increase after winning the pot
- **Timing Issue**: Immediate win detection worked but `handResult` and `handWinAmount` values weren't persisting

#### Root Cause Analysis
Using enhanced debugging logs, discovered that:
1. **Immediate Win Logic Worked**: `🏆 HANDLE_PLAYER_ACTION: Only one player remains after action - hand ends immediately!`
2. **Winner Calculation Correct**: `{winner: 5, heroPosition: 5, isHeroWinner: true, finalPot: 108}`  
3. **State Timing Failure**: `📝 COMPLETE_HAND: {handResult: null, handWinAmount: 0, finalResult: 'folded'}`

**Issue**: `setHandResult('won')` and `setHandWinAmount(finalPot)` were called but React state didn't update before `completeHand()` was invoked, causing the hand to be saved with default `null` values that became "folded".

#### Technical Solution Implemented
Modified `completeHand` function to accept direct value overrides:
```typescript
// BEFORE (buggy)
setHandResult('won');
setHandWinAmount(finalPot);
setTimeout(() => {
  completeHand(); // Uses stale state values!
}, 100);

// AFTER (fixed)
setHandResult('won');  
setHandWinAmount(finalPot);
setTimeout(() => {
  completeHand('won', finalPot); // Pass values directly!
}, 100);
```

**Function Signature Update**:
```typescript
const completeHand = async (
  overrideResult?: 'won' | 'lost' | 'folded' | 'chopped', 
  overrideWinAmount?: number
) => {
  const effectiveResult = overrideResult || handResult || 'folded';
  const effectiveWinAmount = overrideWinAmount !== undefined ? overrideWinAmount : handWinAmount;
  
  // Use effective values for hand saving and profit calculation
  const hand: Hand = {
    result: effectiveResult,
    amountWon: effectiveResult === 'won' ? effectiveWinAmount : undefined,
    // ...
  };
  
  // Profit calculation now uses effective values
  if (effectiveResult === 'won' && effectiveWinAmount > 0) {
    const heroContribution = playerBetsThisRound.get(session.heroPosition || 1) || 0;
    profitChange = effectiveWinAmount - heroContribution;
  }
}
```

#### Files Modified
- `src/app/session/[id]/page.tsx` lines 460-503 (handlePlayerAction immediate win)
- `src/app/session/[id]/page.tsx` lines 733-743 (moveToNextPlayer immediate win)  
- `src/app/session/[id]/page.tsx` lines 918-1008 (completeHand function signature and logic)

#### Key Learning
**React State Anti-Pattern**: Never rely on React state updates to complete before subsequent function calls. Always pass critical values directly when timing matters.

#### Verification Results
- ✅ **Hand Result**: Now correctly shows "Won +$108" instead of "Folded"
- ✅ **Balance Updates**: Session profit increases by net amount (e.g., +$8 for $108 pot - $100 contribution)  
- ✅ **HandTracker Display**: Shows completed hands with correct win amounts and results
- ✅ **Dual Path Support**: Both `handlePlayerAction` and `moveToNextPlayer` immediate win paths work correctly

### HandTracker Component & History Persistence
#### Problem
- **HandTracker Reset**: After completing a hand, the HandTracker would disappear instead of showing history
- **Duplicate Display**: Current hand and completed hand with same number showing simultaneously
- **No Historical View**: Users couldn't see progression of completed hands

#### Solution Implemented
1. **Persistent History Display**: 
   ```typescript
   // Show both current hand AND completed hands history
   {(handInProgress || completedHands.length > 0) && (
     <div className="space-y-3">
       {/* Current Hand */}
       {handInProgress && <HandTracker ... />}
       
       {/* Completed Hands History */}
       {completedHands
         .filter(hand => !handInProgress || hand.handNumber !== currentHandNumber)
         .sort((a, b) => b.handNumber - a.handNumber)
         .map(hand => <HandTracker key={hand.id} ... />)}
     </div>
   )}
   ```

2. **State Management**: Added `completedHands` state with proper loading and updating
3. **Duplicate Prevention**: Filter prevents showing current hand in completed history
4. **Auto-Reload**: `completeHand()` reloads hands from database after saving

#### Files Modified
- `src/app/session/[id]/page.tsx` lines 35, 91-104 (state and loading)
- `src/app/session/[id]/page.tsx` lines 956-962, 982-990 (reload logic)
- `src/app/session/[id]/page.tsx` lines 1667-1682 (display logic)
- `src/components/poker/HandTracker.tsx` lines 21, 25-32 (optional currentBettingRound)

### Enhanced All-In & Immediate Win Logic
#### Minimum Raise Rules Implementation
```typescript
// All-in scenarios with minimum raise validation
if (action === 'all-in') {
  const totalBet = playerCurrentBet + actualAmount;
  const raiseAmount = totalBet - currentBet;
  const minRaise = Math.max(currentBet, (lastRaiserSeat !== null ? minRaise : session.bigBlind));
  
  if (totalBet > currentBet && raiseAmount >= minRaise) {
    // All-in RAISE: Updates current bet, allows re-raises
    setCurrentBet(totalBet);
  } else if (totalBet > currentBet) {
    // All-in CALL: Less than min raise, counts as call only  
  }
}
```

#### Immediate Win Detection (Two Paths)
1. **handlePlayerAction Path**: Immediately after player folds/acts
2. **moveToNextPlayer Path**: During round progression logic

Both paths now correctly:
- Detect when only one player remains (`activePlayerSeats.length === 1`)
- Calculate final pot including all contributions
- Set correct winner and amounts
- Pass values directly to `completeHand()` to avoid timing issues

### Hero Fold Logic & Hand Completion (Critical Fix)
#### Problem
When hero folded during a hand, several issues occurred:
- **Hand didn't end immediately**: Play would continue to community cards instead of ending
- **Incorrect result tracking**: Hero fold marked as "lost" instead of "folded"
- **Wrong profit calculation**: Hero would lose entire pot instead of just their contribution

#### Solution Implemented
Added comprehensive hero fold detection in both immediate win detection paths:

```typescript
// In both handlePlayerAction and moveToNextPlayer
const heroFolded = session.heroPosition !== undefined && playerFolded.has(session.heroPosition);
if (heroFolded) {
  // Check if hero contributed any money this hand
  const heroContribution = (playerBetsThisRound.get(session.heroPosition!) || 0);
  const amountLost = heroContribution; // Only lose what was contributed
  
  console.log('💸 Hero folded', {
    heroPosition: session.heroPosition,
    contribution: heroContribution,
    amountLost
  });
  
  setHandResult('folded');
  completeHand('folded', -amountLost); // Negative to indicate loss
}
```

#### Key Logic Rules
1. **Immediate Hand End**: When hero folds, hand ends immediately regardless of position
2. **Correct Result Tracking**: Hero fold marked as "folded" (not "lost")
3. **Accurate Loss Calculation**: Hero loses only actual contribution (blinds + any bets/raises)
4. **Contribution Tracking**: Uses `playerBetsThisRound.get(session.heroPosition!)` for precise amounts

#### Files Modified
- `src/app/session/[id]/page.tsx` lines 501-522 (handlePlayerAction hero fold detection)
- `src/app/session/[id]/page.tsx` lines 753-773 (moveToNextPlayer hero fold detection)

#### TypeScript Fixes
- Added null checks: `session.heroPosition !== undefined` before accessing position
- Fixed variable references: Used `playerBetsThisRound` instead of non-existent `playerBets`
- Fixed onClick handlers: Changed `onClick={completeHand}` to `onClick={() => completeHand()}`

#### Verification Results
- ✅ **Immediate End**: Hero fold ends hand immediately, no community card selection
- ✅ **Correct Result**: Shows "Folded" instead of "Lost" in hand tracker
- ✅ **Accurate Loss**: Hero loses only contributed amount (e.g., $5 SB, not entire pot)
- ✅ **Build Success**: No TypeScript errors, clean production build

### Build & TypeScript Issues Resolution
#### JSX Syntax Error Fix  
- **Problem**: Parsing error around header closing tag due to malformed whitespace
- **Solution**: Fixed JSX structure and proper div closing hierarchy
- **Result**: Clean production build with no syntax errors

#### TypeScript & ESLint Compliance
- **HandTracker Component**: Fixed `any` type usage, added proper `Session` type import
- **Unused Variables**: Fixed `_currentBettingRound` parameter warnings
- **Optional Parameters**: Made `currentBettingRound` optional for completed hands
- **Result**: Clean build with no TypeScript or ESLint errors

### Advanced Card Selection System
#### Enhanced Community Card Selection (`src/components/poker/CommunityCardSelector.tsx`)
- **Duplicate Prevention**: Cannot select cards already used in hole cards or other community cards
- **Visual Feedback**: Unavailable suit buttons disabled with grayed-out styling and cursor-not-allowed
- **Dropdown Filtering**: Rank dropdown shows "(used)" indicator for unavailable ranks
- **Cross-Component Integration**: Receives `holeCards` prop to enforce duplicate prevention

#### Opponent Card Selection for Showdown (`src/components/poker/OpponentCardSelector.tsx`)
- **Professional Interface**: Matches styling of hole card and community card selectors  
- **Comprehensive Duplicate Prevention**: Prevents selection across hero cards, community cards, and other opponents' cards
- **State Management**: `opponentCards` Map tracks each opponent's selected cards
- **Mucked Cards**: "Mucked" button for opponents who don't reveal cards
- **Integration**: Replaces simple text inputs with sophisticated card selection UI

### Accessibility & Form Standards Implementation
- **Dialog Accessibility**: Added `DialogDescription` to all dialogs to fix "Missing Description" warnings
- **Form Field Standards**: Added `id`, `name`, and `aria-label` attributes to all input fields
- **Card Selector Labels**: Comprehensive `aria-label` attributes for all suit buttons and rank dropdowns
- **Screen Reader Support**: All interactive elements properly labeled for accessibility compliance
- **Files Modified**: All card selector components + main session page

### Re-Raise Button & Event Tracking System
#### Smart Button Display Logic
- **Dynamic Button Text**: Shows "Bet", "Raise", or "Re-Raise" based on betting round state
- **Logic**: `{currentBet === 0 ? 'Bet' : (lastRaiserSeat !== null ? 'Re-Raise' : 'Raise')}`
- **State Tracking**: `lastRaiserSeat` tracks who raised first in current round

#### Enhanced Action Tracking for Hand Replay
- **Extended Action Types**: Added 're-raise' to Action interface in `src/types/poker.ts`
- **Smart Event Logging**: Distinguishes between 'raise' and 're-raise' in `handActions` array
- **Timestamp Tracking**: All actions logged with precise timestamps for future replay functionality
- **Sequential Tracking**: Actions maintain proper order within betting rounds for accurate replay

### Hero Stack Management & Blind Deduction (Critical Fix)
#### Problem
When starting a new hand, hero's stack was initialized to the full buy-in amount but wasn't being reduced when posting blinds. This caused incorrect call button amounts.

**Example Bug**: Hero with $144 stack posts SB $1, but call button showed "Call $200" instead of "All-in $143" when they couldn't afford the full call.

#### Solution Implemented (`src/app/session/[id]/page.tsx` lines 176-183)
Added automatic blind deduction in `startNewHand()` function:
```typescript
// Deduct blind amounts from hero's stack if hero is in blind position
if (session.heroPosition === session.smallBlindPosition) {
  setHeroStack(prev => prev - (session.smallBlind || 0));
} else if (session.heroPosition === session.bigBlindPosition) {
  setHeroStack(prev => prev - (session.bigBlind || 0));
}
```

#### Call Button Logic Verification
The call button logic was already correct but now works properly with accurate stack tracking:
```typescript
const callAmount = Math.min(amountNeeded, heroStack);
return heroStack < amountNeeded 
  ? `All-In $${callAmount.toFixed(2)}` 
  : `Call $${callAmount.toFixed(2)}`;
```

**Result**: Hero stack correctly reflects available chips after posting blinds, and call buttons show accurate amounts.

### Enhanced HandTracker Component (Major UX Improvement)
#### Problem
The previous HandTracker used a confusing table format that was hard to read and didn't show community cards or emphasize hero actions clearly.

#### Solution Implemented (`src/components/poker/HandTracker.tsx`)
**1. Sequential Action Display**
- Reverted from table format back to chronological action sequence
- Clear betting round separation (Preflop, Flop, Turn, River)
- Community cards displayed between betting rounds with proper suit colors

**2. Hero Action Highlighting**
```typescript
const formatted = formatActionText(action);
return (
  <div className={cn(
    formatted.isHero && "text-blue-800 font-semibold", // Hero actions in dark blue
    !formatted.isHero && action.action === 'fold' && "text-gray-500",
    // ... other color coding
  )}>
    {formatted.text}
  </div>
);
```

**3. Enhanced Card Display**
- **Hole Cards**: Displayed with proper suit colors in bordered containers
- **Community Cards**: Show between rounds (Flop: 3 cards, Turn: +1, River: +1)
- **Card Colors**: Red for hearts/diamonds, black for spades/clubs
- **Format**: Consistent with hole card selector styling

**4. Prominent Share Buttons**
```typescript
<Button
  variant="outline"
  size="sm"
  className="h-8 px-2 text-xs font-medium border-blue-200 text-blue-700 hover:bg-blue-50"
  onClick={handleShareText}
>
  <MessageSquare className="h-3.5 w-3.5 mr-1" />
  Text
</Button>
```

**5. Community Cards Integration**
- Added `communityCards?: (string | null)[]` prop to HandTracker interface
- Community cards saved to Hand type when completing hands: `communityCards: communityCards`
- Both current and completed hands display community cards properly

#### Files Modified
- `src/components/poker/HandTracker.tsx` - Complete redesign of display format
- `src/types/poker.ts` - Added `communityCards` field to Hand interface
- `src/app/session/[id]/page.tsx` - Pass community cards to HandTracker components

#### Visual Improvements
- **Action Colors**: Hero (dark blue), Folds (gray), All-ins (purple), Raises (orange)
- **Share Buttons**: Visible outlined buttons instead of hidden ghost icons
- **Card Display**: Professional bordered cards matching hole card selector style
- **Layout**: Clean sequential narrative of hand progression

### Post-Flop Betting Order Fix (Critical Bug Fix)
#### Problem
After flop/turn/river community cards were dealt, the action was incorrectly starting with the button position instead of the first active player after the button (typically small blind).

#### Root Cause
The `handleCommunityCardComplete()` function was using incorrect seat calculation logic that included a phantom "dealer seat 0" instead of properly cycling through seats 1-N.

#### Solution Implemented (`src/app/session/[id]/page.tsx` lines 957-982)
**Fixed Post-Flop Action Start**:
```typescript
// Post-flop betting starts from first active player after the button
const buttonPosition = session?.buttonPosition || 0;
let firstSeat = buttonPosition;

// Start from the player immediately after the button and find first active player
const totalSeats = session?.seats || 9;
let attempts = 0;

do {
  firstSeat = (firstSeat % totalSeats) + 1; // Move to next seat (1-based)
  attempts++;
  
  // Check if this player is active (not folded and not all-in)
  if (!playerFolded.has(firstSeat) && !allInPlayers.has(firstSeat)) {
    console.log(`Post-flop action starts with Seat ${firstSeat}`);
    break;
  }
} while (attempts < totalSeats);
```

**Fixed moveToNextPlayer Logic** (lines 812-837):
```typescript
// Find next active player (seats are numbered 1 to session.seats)
let nextSeat = currentActionSeat;
const totalSeats = session.seats;

let attempts = 0;
do {
  // Move to next seat, wrapping from session.seats to 1
  nextSeat = (nextSeat % totalSeats) + 1;
  attempts++;
  
  // If this player is not folded, they can act
  if (!effectivePlayerFolded.has(nextSeat)) {
    break;
  }
  
  // Safety check to prevent infinite loop
  if (attempts > totalSeats) {
    console.error('Unable to find next active player');
    break;
  }
} while (nextSeat !== currentActionSeat);
```

#### Key Changes
- Removed phantom "seat 0" dealer position logic
- Proper 1-based seat numbering (seats 1 through session.seats)
- Correct post-flop action order: first active player clockwise from button
- Button acts last in post-flop betting rounds (Texas Hold'em rule)

#### Files Modified
- `src/app/session/[id]/page.tsx` lines 939-982 (handleCommunityCardComplete)
- `src/app/session/[id]/page.tsx` lines 812-837 (moveToNextPlayer)

### All-In Raise Logic Fix (Critical Betting Bug)
#### Problem Discovered
When a player went all-in after another player checked, the betting round was ending immediately instead of giving other players the option to call, fold, or re-raise the all-in amount.

**Example Bug**: Turn betting - Seat 4 checks, Seat 5 goes all-in for $67, but Seat 4 never gets the option to respond to the all-in.

#### Root Cause Analysis
The `playersActedThisRound` tracking wasn't being reset when a new bet/raise occurred. The logic was checking if "everyone has acted" but wasn't accounting for the fact that previous actions were on a DIFFERENT bet amount.

#### Technical Solution (`src/app/session/[id]/page.tsx` lines 538-552)
When any raise occurs (including all-in raises), reset `playersActedThisRound` to only include the raiser:

```typescript
// Move to next player - pass updated values if we raised or went all-in for more than current bet
let updatedCurrentBet = undefined;
let updatedPlayersActed = newPlayersActedThisRound;

if (actualAction === 'raise') {
  updatedCurrentBet = amount || currentBet;
  // When raising, reset who has acted (only the raiser has acted on new bet)
  updatedPlayersActed = new Set([currentActionSeat]);
} else if (action === 'all-in') {
  const totalBet = playerCurrentBet + actualAmount;
  if (totalBet > currentBet) {
    updatedCurrentBet = totalBet;
    // All-in raise also resets who has acted
    updatedPlayersActed = new Set([currentActionSeat]);
  }
}
moveToNextPlayer(updatedCurrentBet, newBetsThisRound, updatedPlayersActed, newPlayerFolded);
```

#### Key Learning
**Texas Hold'em Rule**: When the betting amount changes (via raise/all-in raise), all players who haven't folded must have the opportunity to act on the new bet amount, regardless of their previous actions in that round.

### State Management Improvements
- **Proper State Resets**: `lastRaiserSeat` properly reset in new hands and betting rounds
- **React State Timing**: Learned to pass updated values directly instead of relying on async state updates
- **Cross-Component State**: `opponentCards` Map properly managed and reset between hands
- **Stack Tracking**: Hero stack properly maintained with blind deductions and action costs
- **Betting Round Logic**: Proper tracking of who needs to act on current bet amounts

## Development Workflow

### Running the App
```bash
# Kill any existing processes on port 3000 first
lsof -ti:3000 | xargs kill -9 2>/dev/null

npm run dev          # Start development server on port 3000
npm run build        # Build for production
npm run start        # Start production server
```

### Key Commands
- **Server**: http://localhost:3000 (always use port 3000 for consistency)
- **Build Output**: `.next/` directory
- **Static Assets**: `public/` directory
- **Port Conflicts**: Always kill existing processes on port 3000 before starting dev server

### PWA Updates & Deployment
```bash
npm run update-pwa   # Updates service worker cache version
npm run push         # Runs update-pwa, then git add/commit/push
```

#### PWA Update Process
The app includes a PWA update mechanism that automatically increments the service worker cache version:

**Manual PWA Update**:
```bash
npm run update-pwa
```
- Runs `node scripts/update-sw-version.js`
- Increments cache version (e.g., v55 → v56)
- Users get update notification within 30 seconds
- Forces app refresh for PWA users

**Automated Git Workflow**:
```bash
npm run push
```
- Runs PWA update first
- Adds all changes to git
- Creates commit
- Pushes to remote repository

#### Service Worker Cache Strategy
- **Cache Version**: Stored in service worker file, auto-incremented
- **Update Notification**: PWA users see update prompt automatically
- **Offline Support**: Critical app files cached for offline use
- **Auto-Refresh**: Service worker forces refresh when new version detected

## Component Patterns

### Form Handling
```tsx
const [formData, setFormData] = useState<FormType>({
  // Default values for quick setup
});

const handleSubmit = async (data: FormType) => {
  // Validation and submission
};
```

### Local Storage Integration  
```tsx
const { sessions, createSession, updateSession, deleteSession } = useSessions();
```

### Table Position Logic
```tsx
// Dealer is always one seat before small blind
const dealerSeat = (smallBlindSeat - 1 + totalSeats) % totalSeats;

// Position calculation from dealer
const getPositionAbbreviation = (seatIndex: number) => {
  const positionsFromDealer = (seatIndex - dealerSeat + seats) % seats;
  // Return UTG, MP, CO, BTN, SB, BB based on table size
};
```

## Future Development Areas

### Immediate Next Steps
1. **Hand Tracking**: Implement actual hand recording during sessions
2. **Community Card Persistence**: Save selected cards to session data
3. **Statistics Dashboard**: Advanced analytics and charts
4. **Export Features**: CSV/PDF export of session data

### Architecture Improvements
1. **Database Integration**: Replace local storage with proper database
2. **User Authentication**: Add login/signup functionality  
3. **Real-time Sync**: Multi-device synchronization
4. **PWA Features**: Offline support, push notifications

### UI/UX Enhancements
1. **Animations**: Smooth transitions for card dealing, position changes
2. **Responsive Design**: Better tablet and desktop layouts
3. **Accessibility**: ARIA labels, keyboard navigation
4. **Theming**: Dark mode support

## Troubleshooting

### Common Issues
1. **Navigation Duplication**: Check if pages still have individual AppHeader/BottomNav
2. **Dealer Button Missing**: Ensure `dealerSeat` prop is passed to PokerTable
3. **Fast Refresh Warnings**: Normal during development, ignore unless persistent
4. **TypeScript Errors**: Check interface imports and prop types

### Development Tips
1. **Use TodoWrite tool** for tracking multi-step tasks
2. **Test on mobile** - this is a mobile-first PWA
3. **Check console** for any runtime errors
4. **Validate forms** before submission

## Code Style Guidelines
- **Components**: PascalCase (PokerTable.tsx)
- **Hooks**: camelCase with 'use' prefix (useSessions)  
- **Types**: PascalCase interfaces in poker.ts
- **Styling**: Tailwind CSS classes, mobile-first responsive
- **Icons**: Lucide React components with consistent sizing

This guide should provide all the context needed to continue development efficiently!