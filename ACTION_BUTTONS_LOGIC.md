# Action Buttons Logic - Comprehensive Guide

## Overview
The action buttons system in the poker session is one of the most complex parts of the application. It handles all betting decisions, validates poker rules, manages different UI states, and coordinates multiple player actions. This document explains every aspect of how it works.

## Main Action Buttons Section

### When Action Buttons Are Shown
The action buttons only appear when ALL of these conditions are met:
1. **There's an active hand** (`currentHand` exists)
2. **Not selecting community cards** (`!showCommunitySelector`)
3. **Not showing position-specific actions** (`!showPositionActions`)
4. **Not selecting cards for opponents** (complex condition checking card selector state)
5. **No community cards are needed** (`!needsCommunityCards`)

If any of these conditions are false, the action buttons section is completely hidden.

## Two Main States: Betting vs. Round Complete

### State 1: Betting Round Complete (`isBettingComplete = true`)
When betting is complete, the UI shows progression controls instead of betting buttons.

#### Sub-state 1A: Need Community Cards
If community cards are missing for the current round:
- **Preflop complete but missing flop**: "Select Flop Community Cards to continue"
- **Flop complete but missing turn**: "Select Turn Card to continue"
- **Turn complete but missing river**: "Select River Card to continue"
- **Button**: "Proceed" (disabled until cards are selected)

#### Sub-state 1B: Community Cards Selected
When all required community cards are present:
- **After preflop**: "Flop cards selected" → "Proceed to Flop Betting"
- **After flop**: "Turn card selected" → "Proceed to Turn Betting"
- **After turn**: "River card selected" → "Proceed to River Betting"
- **After river**: "All cards dealt" → "Proceed to Showdown"

### State 2: Active Betting (`isBettingComplete = false`)
This is where the actual poker action happens.

#### Who Can See Action Buttons?
The system determines if a player should see action buttons using this logic:

```
shouldShowActions = isHerosTurn OR !heroHasActed
```

**Meaning:**
- **Hero's turn**: Always show buttons (it's their turn to act)
- **Not hero's turn but hero hasn't acted**: Show buttons (they can act out of turn)
- **Not hero's turn and hero already acted**: Hide buttons ("Waiting for other players...")

## The Four Action Buttons

### 1. Fold Button (Red)
**Always Available** - Every player can always fold their hand.

**Special Logic for Hero:**
- If it's the hero folding, shows a **confirmation dialog** instead of immediate action
- The confirmation dialog asks if they want to select their cards before folding
- Other players fold immediately without confirmation

**Code Path:**
```
Hero Fold → setFoldPosition() → setShowFoldConfirmation(true)
Other Fold → handleBettingAction(position, 'fold')
```

### 2. Check/Call Button (Orange/Blue)
This is the most complex button because it changes based on poker rules.

#### Check Button (Orange)
Appears when the player can check (no additional money required).

**Poker Rules for Checking:**
- **Preflop**: Only Big Blind (BB) can check, and only if no one raised above the big blind
- **Post-flop**: Anyone can check if they already match the current bet amount

**Validation Logic:**
```typescript
canCheck(position) {
  // Preflop: Only BB can check if current bet equals big blind
  if (preflop && position === 'BB' && currentBet === bigBlind && alreadyBet === bigBlind) {
    return true;
  }

  // Post-flop: Can check if already matching current bet
  if (!preflop && alreadyBet >= currentBet) {
    return true;
  }

  return false;
}
```

#### Call Button (Blue)
Appears when the player needs to add money to match the current bet.

**Call Amount Calculation:**
```typescript
callAmount = currentBet - alreadyBet
```

**Examples:**
- Current bet is $20, player has bet $5 → Call $15
- Current bet is $50, player has bet $0 → Call $50
- Current bet is $10, player has bet $10 → Can check (call amount = $0)

**Special Cases:**
- **All-In Call**: If call amount >= remaining stack, shows "Call All-In $X"
- **Hero Stack Limit**: Hero's call amount is limited by their remaining stack
- **Zero Call**: If call amount is 0, shows Check button instead

#### No Action Button (Gray)
Appears when neither check nor call is possible (rare edge case).

### 3. All-In Button (Purple)
**Always Available** - Every player can always go all-in.

**Behavior:**
- Opens the **Amount Modal** with action set to 'all-in'
- Pre-fills the amount with the player's current stack size
- Goes through amount validation before executing

### 4. Raise Button (Green)
**Always Available** - Every player can always attempt to raise.

**Behavior:**
- Opens the **Amount Modal** with action set to 'raise'
- Pre-fills with 2x the current bet as a default raise amount
- User can modify the amount before confirming
- Goes through amount validation (minimum raise rules, etc.)

## Advanced Features

### Auto-Action Preview System
When a player acts out of turn, the system shows which other players will be automatically acted for.

**How It Works:**
1. **Determine Action Sequence**: Get the proper order of players (preflop vs post-flop)
2. **Find Active Players**: Filter out folded players
3. **Calculate Skipped Players**: Find players between "next to act" and the selected player
4. **Show Preview**: Display what will happen to skipped players

**Auto-Action Rules:**
- **If there's a bet to call**: Skipped players will auto-fold
- **If no bet (can check)**: Skipped players will auto-check

**Example:**
- Next to act: UTG
- Current bet: $20 (someone raised)
- Hero clicks to call from LJ position
- Preview shows: "UTG, UTG+1, UTG+2 will auto-fold"

### Target Position System
The action buttons work for both the hero and other positions.

**Target Position Logic:**
```typescript
targetPosition = showPositionActions && selectedPosition ? selectedPosition : session.userSeat
```

**Meaning:**
- If user clicked on another player's seat → target that position
- Otherwise → target the hero's position

This allows users to record actions for any player at the table.

## Helper Functions Explained

### `getCallAmount(position)`
Calculates exactly how much money a player needs to add to call.

**Algorithm:**
```typescript
1. Get current bet amount for the round
2. Get how much the player has already bet this round
3. Calculate difference: requiredCall = currentBet - alreadyBet
4. For hero: limit by remaining stack to prevent impossible calls
5. Return Math.max(0, callAmount)
```

**Stack Limiting for Hero:**
```typescript
remainingStack = stack - heroMoneyInvested
maxCallAmount = Math.min(requiredCallAmount, remainingStack)
```

### `canCheck(position)`
Determines if a player can check instead of calling.

**Preflop Special Rules:**
- Only BB can check in preflop
- BB can only check if no one raised above the big blind
- Everyone else must call, raise, or fold

**Post-flop Rules:**
- Anyone can check if they've already matched the current bet
- Much simpler than preflop

### `isCallAllIn(position)`
Determines if calling would put the hero all-in.

**Logic:**
```typescript
requiredCallAmount = currentBet - alreadyBet
remainingStack = stack - heroMoneyInvested

return requiredCallAmount > 0 && remainingStack <= requiredCallAmount
```

**Used For:**
- Changing button text to "Call All-In $X"
- Visual feedback to show this is a critical decision

## Betting Action Processing

### `handleBettingAction(position, action, amount?)`
This is the main function that processes all betting actions.

**Step-by-Step Process:**

#### 1. Special Case: Hero Fold
```typescript
if (action === 'fold' && position === session.userSeat) {
  // Show confirmation dialog instead of immediate fold
  setFoldPosition(position);
  setShowFoldConfirmation(true);
  return;
}
```

#### 2. Auto-Action Processing
If the acting player is not the "next to act", the system auto-acts for skipped players:

```typescript
if (currentHand.nextToAct !== position) {
  updatedHand = autoFoldPlayersBetween(updatedHand, currentHand.nextToAct, position);
}
```

**What `autoFoldPlayersBetween` does:**
- Finds all players between "next to act" and the acting player
- If there's a bet: auto-folds those players
- If no bet: auto-checks those players
- Adds their actions to the betting round history

#### 3. Hero Money Tracking
```typescript
if (position === session.userSeat && amount) {
  const currentBet = playerState.currentBet || 0;
  const additionalInvestment = amount - currentBet;
  setHeroMoneyInvested(prev => prev + additionalInvestment);
}
```

**Purpose:**
- Track how much money the hero has put into the pot
- Used for validation (hero cards required if money invested)
- Used for profit/loss calculations

#### 4. Apply Betting Action
```typescript
updatedHand = processBettingAction(updatedHand, bettingAction);
```

This calls the poker logic utilities to:
- Update player states
- Update pot size
- Update betting round data
- Determine next player to act

#### 5. Special Preflop Logic
```typescript
if (currentBettingRound === 'preflop' && position === 'BB' && action === 'check') {
  currentRound.isComplete = true;
  updatedHand.canAdvanceToFlop = true;
  // Auto-fold any remaining players who haven't acted
}
```

**Why This Exists:**
- In preflop, if BB checks, it means no one raised
- This should complete the betting round immediately
- Any players who haven't acted yet (like SB) get auto-folded

#### 6. Update Next-to-Act
Complex logic to determine who should act next:
- Filter active players only
- Check if betting round is complete
- Calculate next player in sequence
- Handle wrap-around (after last player, go to first)

#### 7. Hand End Detection
```typescript
const activePlayers = updatedHand.playerStates.filter(p => p.status === 'active' || p.status === 'all-in');

if (activePlayers.length === 1) {
  // Only one player left - hand ends
  if (heroIsLastPlayer) {
    setShowAllFoldedDialog(true); // Hero won
  } else {
    completeHand('lost', 0); // Hero lost earlier
  }
}
```

## Modal Integration

### Amount Modal
When user clicks Raise or All-In:

```typescript
setAmountModalAction('raise' | 'all-in');
setAmountModalPosition(targetPosition);
setAmountModalValue(defaultAmount);
setShowAmountModal(true);
```

**Default Amounts:**
- **Raise**: 2x current bet
- **All-In**: Player's entire stack

The modal handles:
- Amount validation
- Minimum raise rules
- Stack size limits
- Confirmation and execution

### Fold Confirmation Dialog
Only for hero folds:

```typescript
setFoldPosition(session.userSeat);
setShowFoldConfirmation(true);
```

The dialog shows:
- How much money hero has invested
- Option to select hero cards before folding
- Confirmation to proceed with fold

## Error States and Edge Cases

### 1. No Valid Actions
When neither check nor call is possible:
```html
<Button disabled className="bg-gray-400">No Action</Button>
```

This is rare but can happen in complex betting scenarios.

### 2. Waiting State
When hero has acted and it's not their turn:
```html
<div>Waiting for other players to act...</div>
```

### 3. Stack Limitations
All calculations respect hero's remaining stack:
- Call amounts limited by remaining money
- All-in option always available as fallback
- Visual indicators when actions would go all-in

### 4. Preflop Special Cases
- BB can check only if no raises
- SB must complete to big blind or fold
- Action starts from UTG (Under The Gun)

## UI States Summary

| Condition | UI State | Buttons Shown |
|-----------|----------|---------------|
| `isBettingComplete && needsCommunityCards` | Need Cards | "Proceed" (disabled) |
| `isBettingComplete && !needsCommunityCards` | Round Complete | "Proceed to X Betting" |
| `!isBettingComplete && shouldShowActions` | Active Betting | Fold, Check/Call, All-In, Raise |
| `!isBettingComplete && !shouldShowActions` | Waiting | "Waiting for other players..." |
| Overall conditions not met | Hidden | No action section |

## Integration with Other Systems

### Community Card System
- Action buttons hide when community card selector is open
- Auto-community card selection prevents action buttons from showing
- Betting must complete before community cards can be selected

### Hand History
- All actions are logged to the current hand's betting rounds
- Actions include timestamps and position information
- Used for hand replay and statistics

### Session Management
- Hero money tracking integrates with session stack management
- Actions update session metadata for profit/loss tracking
- Hand completion triggers session data updates

This action buttons system is the heart of the poker game logic, handling the complex rules and edge cases that make poker work correctly while providing a clean, intuitive interface for users.