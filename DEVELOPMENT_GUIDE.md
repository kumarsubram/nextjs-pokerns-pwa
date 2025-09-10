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

### Betting Logic Bug Fixes
- **Problem**: Betting rounds not completing when all players matched current bet
- **Root Cause**: Call action was incorrectly setting total bet instead of adding to existing bet
- **Solution**: Fixed `handlePlayerAction` to properly track cumulative bet amounts
- **Files Modified**: `src/app/session/[id]/page.tsx` lines 291-308

### Streamlined Hole Card Selection  
- **Problem**: Manual "Continue to Straddle" button slowing down gameplay
- **Solution**: Auto-show straddle dialog when both hole cards selected
- **UX Improvement**: Combined hole card and straddle selection into single step
- **Files Modified**: `src/components/poker/HoleCardSelector.tsx`

### Duplicate Card Prevention
- **Feature**: Cross-component validation preventing same card selection
- **Implementation**: `getUsedCards()` and `isCardAvailable()` functions
- **Scope**: Works across hole cards and community cards
- **Visual Feedback**: Disabled state and "(used)" labels for unavailable cards

### All-In Action Availability  
- **Problem**: Duplicate all-in buttons when hero couldn't afford to call
- **Solution**: Hide separate all-in button when call action forces all-in
- **Logic**: Smart button availability based on stack size vs. call amount

## Development Workflow

### Running the App
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### Key Commands
- **Server**: http://localhost:3000
- **Build Output**: `.next/` directory
- **Static Assets**: `public/` directory

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