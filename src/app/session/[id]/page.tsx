'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSessions } from '@/hooks/useSessions';
import { Session, Action } from '@/types/poker';
import { PokerTable } from '@/components/poker/PokerTable';
import { CommunityCardSelector } from '@/components/poker/CommunityCardSelector';
import { HoleCardSelector } from '@/components/poker/HoleCardSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Play, StopCircle, Clock, Users, ChevronRight } from 'lucide-react';

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const { sessions, updateSession } = useSessions();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentHandNumber, setCurrentHandNumber] = useState(1);
  const [currentBettingRound, setCurrentBettingRound] = useState<'preflop' | 'flop' | 'turn' | 'river' | 'showdown'>('preflop');
  const [currentActionSeat, setCurrentActionSeat] = useState<number | null>(null);
  const [handActions, setHandActions] = useState<Action[]>([]);
  const [potSize, setPotSize] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [showRaiseDialog, setShowRaiseDialog] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState('');
  const [playerFolded, setPlayerFolded] = useState<Set<number>>(new Set());
  const [handInProgress, setHandInProgress] = useState(false);
  const [playerActions, setPlayerActions] = useState<Map<number, { action: 'fold' | 'call' | 'raise' | 'check' | 'bet' | 'all-in'; amount?: number }>>(new Map());
  const [communityCards, setCommunityCards] = useState<(string | null)[]>([null, null, null, null, null]);
  const [waitingForCards, setWaitingForCards] = useState(false);
  const [roundStartSeat, setRoundStartSeat] = useState<number | null>(null);
  const [playersActedThisRound, setPlayersActedThisRound] = useState<Set<number>>(new Set());
  const [playersMatchedBet, setPlayersMatchedBet] = useState<Set<number>>(new Set());
  const [playerBetsThisRound, setPlayerBetsThisRound] = useState<Map<number, number>>(new Map());
  const [heroStack, setHeroStack] = useState<number>(0);
  const [allInPlayers, setAllInPlayers] = useState<Set<number>>(new Set());
  const [showAllInDialog, setShowAllInDialog] = useState(false);
  const [allInSeat, setAllInSeat] = useState<number | null>(null);
  const [allInAmount, setAllInAmount] = useState('');
  const [holeCards, setHoleCards] = useState<(string | null)[]>([null, null]);
  const [waitingForHoleCards, setWaitingForHoleCards] = useState(false);
  const [showdownPlayers, setShowdownPlayers] = useState<Map<number, string>>(new Map());
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
  const [straddleSeat, setStraddleSeat] = useState<number | null>(null);
  const [straddleAmount, setStraddleAmount] = useState(0);
  const [showStraddleDialog, setShowStraddleDialog] = useState(false);
  const [customStraddleAmount, setCustomStraddleAmount] = useState('');
  const [rebuyAmount, setRebuyAmount] = useState('');
  const [effectivePotSize, setEffectivePotSize] = useState(0); // For side pot calculations
  const [allInScenario, setAllInScenario] = useState(false); // Track if we're in an all-in scenario
  const [handResult, setHandResult] = useState<'won' | 'lost' | null>(null);
  const [holeCardsCompleted, setHoleCardsCompleted] = useState(false);

  const sessionId = params.id as string;

  // Initialize hand tracking when session loads
  useEffect(() => {
    if (session && !handInProgress && !loading) {
      // Initialize hero's stack to buy-in amount
      if (heroStack === 0) {
        setHeroStack(session.buyIn);
      }
      startNewHand();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, loading]);

  const startNewHand = () => {
    if (!session) return;
    
    // Reset hand state
    setHandInProgress(true);
    setPlayerFolded(new Set());
    setHandActions([]);
    setPlayerActions(new Map());
    setCommunityCards([null, null, null, null, null]);
    setCurrentBettingRound('preflop');
    setWaitingForCards(false);
    setPlayersActedThisRound(new Set());
    setPlayersMatchedBet(new Set());
    setPlayerBetsThisRound(new Map());
    setAllInPlayers(new Set());
    setHoleCards([null, null]);
    setWaitingForHoleCards(true);
    setShowdownPlayers(new Map());
    setEffectivePotSize(0);
    setAllInScenario(false);
    setHandResult(null);
    setHoleCardsCompleted(false);
    
    // Reset straddle state and ask about straddle
    setStraddleSeat(null);
    setStraddleAmount(0);
    setShowStraddleDialog(true);
    setCurrentActionSeat(null);
    setRoundStartSeat(null);
    
    // Initial pot is just the blinds for now
    setPotSize((session.smallBlind || 0) + (session.bigBlind || 0));
    setCurrentBet(session.bigBlind || 0);
  };
  
  const handleStraddleDecision = (hasStraddle: boolean, seat?: number, amount?: number) => {
    setShowStraddleDialog(false);
    setWaitingForHoleCards(false); // Now hide hole card selector
    
    if (hasStraddle && seat && session) {
      setStraddleSeat(seat);
      const straddleAmt = amount || (session.bigBlind || 0) * 2; // Custom amount or default 2x BB
      setStraddleAmount(straddleAmt);
      
      // Update pot and current bet
      setPotSize((session.smallBlind || 0) + (session.bigBlind || 0) + straddleAmt);
      setCurrentBet(straddleAmt);
      
      // Determine first action seat based on straddle position
      let firstActionSeat;
      if (seat === session.buttonPosition) {
        // Button straddle: action starts with Small Blind
        firstActionSeat = session.smallBlindPosition || 1;
      } else {
        // UTG straddle: action starts with seat after straddle
        firstActionSeat = (seat + 1) % (session.seats + 1);
        // Skip dealer seat
        if (firstActionSeat === 0) {
          firstActionSeat = 1;
        }
      }
      
      setCurrentActionSeat(firstActionSeat);
      setRoundStartSeat(firstActionSeat);
      
      // Log straddle action
      const straddleAction: Action & { seatNumber: number; bettingRound: string; timestamp: Date } = {
        player: seat === session.heroPosition ? 'hero' : 'BTN',
        action: 'raise', // Straddle is technically a blind raise
        amount: straddleAmt,
        totalPot: (session.smallBlind || 0) + (session.bigBlind || 0) + straddleAmt,
        seatNumber: seat,
        bettingRound: 'preflop',
        timestamp: new Date(),
        isStraddle: true
      };
      
      setHandActions([straddleAction]);
      
      // Update player action display
      const actionMap = new Map();
      actionMap.set(seat, { action: 'raise' as const, amount: straddleAmt });
      setPlayerActions(actionMap);
      
      // Initialize matched bet tracking - straddle seat has matched their own bet
      setPlayersMatchedBet(new Set([seat]));
      
      // Initialize bet tracking for this round
      const roundBets = new Map();
      if (session.smallBlindPosition !== undefined) {
        roundBets.set(session.smallBlindPosition, session.smallBlind || 0);
      }
      if (session.bigBlindPosition !== undefined) {
        roundBets.set(session.bigBlindPosition, session.bigBlind || 0);
      }
      roundBets.set(seat, straddleAmt);
      setPlayerBetsThisRound(roundBets);
      
    } else {
      // No straddle: normal UTG start
      const bbPosition = session?.bigBlindPosition || 0;
      const firstActionSeat = ((bbPosition + 1) % ((session?.seats || 0) + 1));
      const actualFirstSeat = firstActionSeat === 0 ? 1 : firstActionSeat;
      
      setCurrentActionSeat(actualFirstSeat);
      setRoundStartSeat(actualFirstSeat);
      
      // Initialize matched bet tracking - big blind has initially matched their blind
      if (session?.bigBlindPosition !== undefined) {
        setPlayersMatchedBet(new Set([session.bigBlindPosition]));
      }
      
      // Initialize bet tracking for this round
      const roundBets = new Map();
      if (session?.smallBlindPosition !== undefined) {
        roundBets.set(session.smallBlindPosition, session.smallBlind || 0);
      }
      if (session?.bigBlindPosition !== undefined) {
        roundBets.set(session.bigBlindPosition, session.bigBlind || 0);
      }
      setPlayerBetsThisRound(roundBets);
    }
  };

  const handlePlayerAction = (action: 'fold' | 'call' | 'raise' | 'check' | 'all-in', amount?: number) => {
    if (currentActionSeat === null || !session) return;
    
    // Handle all-in from other players - prompt for amount
    if (action === 'all-in' && currentActionSeat !== session.heroPosition) {
      setAllInSeat(currentActionSeat);
      setShowAllInDialog(true);
      return;
    }
    
    // Calculate amount needed to call
    const currentPlayerBet = playerBetsThisRound.get(currentActionSeat) || 0;
    const amountNeeded = currentBet - currentPlayerBet;
    
    let actualAmount = amount || 0;
    let actualAction = action;
    
    // Handle different actions
    if (action === 'call') {
      actualAmount = amountNeeded;
    }
    
    // Handle hero's stack limits
    if (currentActionSeat === session.heroPosition) {
      if (action === 'all-in') {
        actualAmount = heroStack;
        // Check if all-in is effectively a raise
        const newTotal = currentPlayerBet + actualAmount;
        if (newTotal > currentBet) {
          actualAction = 'raise';
        }
      } else if (action === 'call' && heroStack < amountNeeded) {
        actualAmount = heroStack;
        actualAction = 'all-in';
        action = 'all-in';
      } else if (action === 'raise' && amount) {
        const totalNeeded = amount - currentPlayerBet;
        if (heroStack < totalNeeded) {
          actualAmount = heroStack;
          actualAction = 'all-in';
          action = 'all-in';
        } else {
          actualAmount = totalNeeded;
        }
      }
    }
    
    // Create detailed action log
    const newAction: Action & { 
      seatNumber: number; 
      bettingRound: string; 
      timestamp: Date 
    } = {
      player: currentActionSeat === session.heroPosition ? 'hero' : 'BTN',
      action: action,
      amount: actualAmount,
      totalPot: potSize + actualAmount,
      seatNumber: currentActionSeat,
      bettingRound: currentBettingRound,
      timestamp: new Date()
    };
    
    setHandActions([...handActions, newAction]);
    
    // Update player action display
    const actionMap = new Map(playerActions);
    actionMap.set(currentActionSeat, { 
      action: action, 
      amount: actualAmount
    });
    setPlayerActions(actionMap);
    
    // Update hero's stack only
    if (currentActionSeat === session.heroPosition && action !== 'fold' && action !== 'check') {
      setHeroStack(heroStack - actualAmount);
    }
    
    // Update bet tracking for this player
    const playerCurrentBet = playerBetsThisRound.get(currentActionSeat) || 0;
    const newBetsThisRound = new Map(playerBetsThisRound);
    
    // Track this player has acted
    setPlayersActedThisRound(new Set([...playersActedThisRound, currentActionSeat]));
    
    if (action === 'fold') {
      setPlayerFolded(new Set([...playerFolded, currentActionSeat]));
      const newMatchedBet = new Set(playersMatchedBet);
      newMatchedBet.delete(currentActionSeat);
      setPlayersMatchedBet(newMatchedBet);
    } else if (action === 'call') {
      // Call means they're adding to their bet to match the current bet
      const newTotalBet = playerCurrentBet + actualAmount;
      newBetsThisRound.set(currentActionSeat, newTotalBet);
      setPotSize(potSize + actualAmount);
      const newMatchedPlayers = new Set([...playersMatchedBet, currentActionSeat]);
      console.log(`Player ${currentActionSeat} called ${actualAmount}, total bet now ${newTotalBet} - matched players:`, Array.from(newMatchedPlayers));
      setPlayersMatchedBet(newMatchedPlayers);
    } else if (action === 'check') {
      // Check means they're staying with their current bet (usually 0)
      setPlayersMatchedBet(new Set([...playersMatchedBet, currentActionSeat]));
    } else if (actualAction === 'raise') {
      // Raise - amount is the total bet they're making this round, actualAmount is just the additional amount
      const totalBetAmount = amount || currentBet;
      setCurrentBet(totalBetAmount);
      newBetsThisRound.set(currentActionSeat, totalBetAmount);
      setPotSize(potSize + actualAmount);
      console.log(`Player ${currentActionSeat} raised to ${totalBetAmount} (added ${actualAmount}) - resetting matched players to only raiser`);
      setPlayersMatchedBet(new Set([currentActionSeat]));
    } else if (action === 'all-in') {
      // All-in - set their bet to their total contribution
      const totalBet = playerCurrentBet + actualAmount;
      newBetsThisRound.set(currentActionSeat, totalBet);
      setPotSize(potSize + actualAmount);
      setPlayersMatchedBet(new Set([...playersMatchedBet, currentActionSeat]));
      setAllInPlayers(new Set([...allInPlayers, currentActionSeat]));
      
      // Check if this creates a side pot scenario
      if (totalBet < currentBet) {
        // Player went all-in for less than the current bet - this creates side pots
        setAllInScenario(true);
        // The effective bet for this all-in player is their total
        // Other players can only win the amount this player contributed
      }
    }
    
    setPlayerBetsThisRound(newBetsThisRound);
    
    // Move to next player
    moveToNextPlayer();
  };

  const handleAllInConfirm = (amount: number) => {
    if (allInSeat === null || !session) return;
    
    setShowAllInDialog(false);
    
    // Process the all-in action with the specified amount
    const newAction: Action & { 
      seatNumber: number; 
      bettingRound: string; 
      timestamp: Date 
    } = {
      player: 'BTN',
      action: 'all-in',
      amount: amount,
      totalPot: potSize + amount,
      seatNumber: allInSeat,
      bettingRound: currentBettingRound,
      timestamp: new Date()
    };
    
    setHandActions([...handActions, newAction]);
    
    // Update player action display
    const actionMap = new Map(playerActions);
    actionMap.set(allInSeat, { 
      action: 'all-in', 
      amount: amount
    });
    setPlayerActions(actionMap);
    
    // Track this player has acted
    setPlayersActedThisRound(new Set([...playersActedThisRound, allInSeat]));
    
    // Update bet tracking
    const currentPlayerBet = playerBetsThisRound.get(allInSeat) || 0;
    const actualAmountAdded = amount - currentPlayerBet;
    const newBetsThisRound = new Map(playerBetsThisRound);
    newBetsThisRound.set(allInSeat, amount);
    setPlayerBetsThisRound(newBetsThisRound);
    
    setPotSize(potSize + actualAmountAdded);
    setPlayersMatchedBet(new Set([...playersMatchedBet, allInSeat]));
    setAllInPlayers(new Set([...allInPlayers, allInSeat]));
    
    // If amount is greater than current bet, it's a raise
    if (amount > currentBet) {
      setCurrentBet(amount);
      setPlayersMatchedBet(new Set([allInSeat]));
    }
    
    setAllInSeat(null);
    setAllInAmount('');
    
    // Move to next player
    moveToNextPlayer();
  };

  const moveToNextPlayer = () => {
    if (!session || currentActionSeat === null) return;
    
    let nextSeat = currentActionSeat;
    const totalSeats = session.seats + 1;
    
    // Find next active player (not folded, not dealer)
    do {
      nextSeat = (nextSeat + 1) % totalSeats;
      // Skip dealer seat (0) and folded players
      if (nextSeat !== 0 && !playerFolded.has(nextSeat)) {
        break;
      }
    } while (nextSeat !== currentActionSeat);
    
    // Check if betting round is complete according to Texas Hold'em rules
    const activePlayerSeats = [];
    for (let i = 1; i <= session.seats; i++) {
      if (!playerFolded.has(i)) {
        activePlayerSeats.push(i);
      }
    }
    
    const activeNonAllInPlayers = activePlayerSeats.filter(seat => !allInPlayers.has(seat));
    
    const isRoundComplete = 
      // Game ends if only one player remains
      playerFolded.size >= session.seats - 1 ||
      // All active players have acted and matched the current bet (or are all-in)
      (playersActedThisRound.size >= activePlayerSeats.length && 
       activePlayerSeats.every(seat => playersMatchedBet.has(seat) || allInPlayers.has(seat))) ||
      // We've gone full circle and everyone who needs to act has matched the bet
      (nextSeat === roundStartSeat && 
       playersActedThisRound.has(nextSeat) && 
       activePlayerSeats.every(seat => playerFolded.has(seat) || playersMatchedBet.has(seat) || allInPlayers.has(seat))) ||
      // All remaining players are all-in (no more betting possible)
      activeNonAllInPlayers.length <= 1;
    
    // Debug logging for betting round completion
    console.log('Betting round check:', {
      activePlayerSeats,
      playersActedThisRound: Array.from(playersActedThisRound),
      playersMatchedBet: Array.from(playersMatchedBet),
      allInPlayers: Array.from(allInPlayers),
      currentBet,
      playerBetsThisRound: Array.from(playerBetsThisRound.entries()),
      nextSeat,
      roundStartSeat,
      isRoundComplete
    });

    if (isRoundComplete) {
      console.log('Round complete - moving to next round');
      moveToNextRound();
    } else {
      setCurrentActionSeat(nextSeat);
    }
  };

  const moveToNextRound = () => {
    if (!session) return;
    
    // Clear only specific round actions, but preserve blind information
    const preservedActions = new Map();
    
    // Keep SB and BB actions visible during community card selection
    if (session.smallBlindPosition !== undefined) {
      const sbAction = playerActions.get(session.smallBlindPosition);
      if (sbAction) {
        preservedActions.set(session.smallBlindPosition, sbAction);
      }
    }
    
    if (session.bigBlindPosition !== undefined) {
      const bbAction = playerActions.get(session.bigBlindPosition);
      if (bbAction) {
        preservedActions.set(session.bigBlindPosition, bbAction);
      }
    }
    
    // Keep straddle action if it exists
    if (straddleSeat !== null) {
      const straddleAction = playerActions.get(straddleSeat);
      if (straddleAction) {
        preservedActions.set(straddleSeat, straddleAction);
      }
    }
    
    // Preserve all-in actions
    allInPlayers.forEach(seat => {
      const action = playerActions.get(seat);
      if (action) {
        preservedActions.set(seat, action);
      }
    });
    
    setPlayerActions(preservedActions);
    setPlayersActedThisRound(new Set());
    setPlayersMatchedBet(new Set());
    setPlayerBetsThisRound(new Map());
    setCurrentBet(0);
    
    // Determine next round
    if (currentBettingRound === 'preflop') {
      setCurrentBettingRound('flop');
      setWaitingForCards(true);
      setCurrentActionSeat(null);
    } else if (currentBettingRound === 'flop') {
      setCurrentBettingRound('turn');
      setWaitingForCards(true);
      setCurrentActionSeat(null);
    } else if (currentBettingRound === 'turn') {
      setCurrentBettingRound('river');
      setWaitingForCards(true);
      setCurrentActionSeat(null);
    } else if (currentBettingRound === 'river') {
      setCurrentBettingRound('showdown');
      setCurrentActionSeat(null);
    }
  };

  const handleCommunityCardSelect = (cardIndex: number, card: string) => {
    // If card selection is from dropdown (existing functionality)
    if (card === '') {
      const newCards = [...communityCards];
      newCards[cardIndex] = null;
      setCommunityCards(newCards);
    } else if (card && !waitingForCards) {
      // If clicking on existing card to edit it
      setEditingCardIndex(cardIndex);
      setShowCardSelector(true);
    } else {
      // New card selection from enhanced selector
      const newCards = [...communityCards];
      newCards[cardIndex] = card || null;
      setCommunityCards(newCards);
    }
  };

  const handleCardSelectorSelect = (cardIndex: number, card: string) => {
    const newCards = [...communityCards];
    newCards[cardIndex] = card || null;
    setCommunityCards(newCards);
  };

  const handleCardSelectorClose = () => {
    setShowCardSelector(false);
    setEditingCardIndex(null);
  };

  const handleHoleCardSelect = (cardIndex: number, card: string) => {
    const newHoleCards = [...holeCards];
    newHoleCards[cardIndex] = card;
    setHoleCards(newHoleCards);
    
    // Check if both hole cards are now selected
    if (newHoleCards[0] && newHoleCards[1]) {
      // Auto-mark as completed to show straddle dialog
      setHoleCardsCompleted(true);
    } else {
      // If cards are being changed and no longer complete, hide straddle dialog
      setHoleCardsCompleted(false);
    }
  };

  const handleHoleCardComplete = () => {
    // This function is no longer needed since we auto-detect completed cards
    // and show straddle dialog automatically
  };

  const handleCommunityCardComplete = () => {
    setWaitingForCards(false);
    
    // Check if all remaining players are all-in - if so, skip betting round
    const activePlayerSeats = [];
    for (let i = 1; i <= (session?.seats || 0); i++) {
      if (!playerFolded.has(i)) {
        activePlayerSeats.push(i);
      }
    }
    const activeNonAllInPlayers = activePlayerSeats.filter(seat => !allInPlayers.has(seat));
    
    if (activeNonAllInPlayers.length <= 1) {
      // All players are all-in or only one active player - proceed to next round
      moveToNextRound();
      return;
    }
    
    // Normal betting round - start from small blind or first active player
    const sbPosition = session?.smallBlindPosition || 1;
    let firstSeat = sbPosition;
    
    // Find first active non-all-in player
    const totalSeats = (session?.seats || 0) + 1;
    let attempts = 0;
    while ((playerFolded.has(firstSeat) || firstSeat === 0 || allInPlayers.has(firstSeat)) && attempts < totalSeats) {
      firstSeat = (firstSeat + 1) % totalSeats;
      attempts++;
    }
    
    if (attempts < totalSeats) {
      setCurrentActionSeat(firstSeat);
      setRoundStartSeat(firstSeat);
    } else {
      // No one can act - proceed to next round
      moveToNextRound();
    }
  };

  const completeHand = () => {
    // Update session total hands and rotate button
    if (session) {
      updateSession(session.id, { totalHands: session.totalHands + 1 });
      
      // Rotate button position clockwise
      const currentButton = session.buttonPosition || 0;
      let nextButton = (currentButton + 1) % (session.seats + 1);
      // Skip dealer seat (0)
      if (nextButton === 0) {
        nextButton = 1;
      }
      
      // Update button and blind positions for next hand
      const nextSmallBlind = nextButton;
      const nextBigBlind = (nextButton + 1) % (session.seats + 1) === 0 ? 1 : (nextButton + 1) % (session.seats + 1);
      
      updateSession(session.id, {
        totalHands: session.totalHands + 1,
        buttonPosition: nextButton,
        smallBlindPosition: nextSmallBlind,
        bigBlindPosition: nextBigBlind
      });
    }
    
    setCurrentHandNumber(currentHandNumber + 1);
    setHandInProgress(false);
  };

  const handleShowdown = (seatNumber: number, cards: string) => {
    const newShowdown = new Map(showdownPlayers);
    newShowdown.set(seatNumber, cards);
    setShowdownPlayers(newShowdown);
  };

  const handleRaise = () => {
    setShowRaiseDialog(true);
  };

  const confirmRaise = () => {
    const amount = parseFloat(raiseAmount);
    if (!isNaN(amount) && amount > currentBet) {
      handlePlayerAction('raise', amount);
      setShowRaiseDialog(false);
      setRaiseAmount('');
    }
  };

  useEffect(() => {
    if (sessions.length > 0 && sessionId) {
      const foundSession = sessions.find(s => s.id === sessionId);
      setSession(foundSession || null);
      setLoading(false);
    }
  }, [sessions, sessionId]);

  const handleEndSession = async () => {
    if (!session) return;
    
    const confirmed = confirm(`Are you sure you want to end "${session.name}"?`);
    if (confirmed) {
      await updateSession(session.id, { endTime: new Date() });
      router.push('/');
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Session not found</h2>
          <p className="text-muted-foreground mb-4">The session you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const isActive = !session.endTime;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="p-2 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:ml-2 sm:inline">Back</span>
              </Button>
              <h1 className="text-lg sm:text-xl font-bold truncate">{session.name}</h1>
              <div className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {isActive ? 'ACTIVE' : 'ENDED'}
              </div>
            </div>
            
            {isActive && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndSession}
                className="shrink-0"
              >
                <StopCircle className="h-4 w-4 mr-2" />
                End Session
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-6">
        {/* Session Stats - Compact Row */}
        <div className="flex items-center justify-center gap-6 sm:gap-8 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <div>
              <span className="font-semibold">{formatDuration(session.startTime, session.endTime)}</span>
              <span className="text-gray-500 ml-1">Duration</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-600" />
            <div>
              <span className="font-semibold">{session.seats}</span>
              <span className="text-gray-500 ml-1">Seats</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-purple-600" />
            <div>
              <span className="font-semibold">{session.totalHands}</span>
              <span className="text-gray-500 ml-1">Hands</span>
            </div>
          </div>
        </div>

        {/* Current Hand */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">
              Hand {currentHandNumber} - {currentBettingRound.charAt(0).toUpperCase() + currentBettingRound.slice(1)}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            <PokerTable
              seats={session.seats}
              showBlindSelection={false}
              showSeatSelection={false}
              smallBlindSeat={session.smallBlindPosition}
              bigBlindSeat={session.bigBlindPosition}
              selectedSeat={session.heroPosition}
              buttonSeat={session.buttonPosition || 0}
              dealerSeat={session.dealerPosition || 0}
              allowHeroAsBlind={true}
              showPositions={true}
              showCommunityCards={isActive}
              communityCards={communityCards}
              onCommunityCardSelect={handleCommunityCardSelect}
              playerActions={playerActions}
              currentActionSeat={currentActionSeat || undefined}
              foldedSeats={playerFolded}
              smallBlindAmount={session.smallBlind}
              bigBlindAmount={session.bigBlind}
              potSize={potSize}
              currency="$"
              heroHoleCards={holeCards}
            />
            
            {/* Stack Management - Only between hands */}
            {isActive && !handInProgress && (
              <div className="mt-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Your Stack</h3>
                      <div className="flex items-center justify-center gap-4">
                        <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg font-semibold">
                          ${heroStack.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Rebuy amount"
                            className="w-32 h-8 text-center text-sm"
                            value={rebuyAmount}
                            onChange={(e) => setRebuyAmount(e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const amount = parseFloat(rebuyAmount) || 0;
                              if (amount > 0) {
                                setHeroStack(heroStack + amount);
                                setRebuyAmount('');
                              }
                            }}
                            className="bg-green-50 hover:bg-green-100 border-green-300"
                          >
                            Rebuy
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Straddle Information */}
            {straddleSeat !== null && straddleAmount > 0 && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  <span className="font-medium">
                    Seat {straddleSeat} {straddleSeat === session.heroPosition && '(You)'} straddled ${straddleAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            
            {/* Hole Card Selection - Must be first */}
            {waitingForHoleCards && isActive && (
              <div className="mt-6">
                <HoleCardSelector
                  holeCards={holeCards}
                  onCardSelect={handleHoleCardSelect}
                  communityCards={communityCards}
                />
              </div>
            )}
            
            {/* Enhanced Community Card Selection */}
            {waitingForCards && isActive && (
              <div className="mt-6">
                <CommunityCardSelector
                  currentBettingRound={currentBettingRound}
                  communityCards={communityCards}
                  onCardSelect={handleCommunityCardSelect}
                  onComplete={handleCommunityCardComplete}
                  holeCards={holeCards}
                />
              </div>
            )}

            {/* Card Editor Dialog */}
            {showCardSelector && editingCardIndex !== null && (
              <div className="mt-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-orange-800">
                      Edit {editingCardIndex === 0 ? 'Flop Card 1' :
                            editingCardIndex === 1 ? 'Flop Card 2' :
                            editingCardIndex === 2 ? 'Flop Card 3' :
                            editingCardIndex === 3 ? 'Turn Card' :
                            editingCardIndex === 4 ? 'River Card' : 'Card'}
                    </h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleCardSelectorClose}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </Button>
                  </div>
                  <CommunityCardSelector
                    currentBettingRound={editingCardIndex <= 2 ? 'flop' : editingCardIndex === 3 ? 'turn' : 'river'}
                    communityCards={communityCards}
                    onCardSelect={handleCardSelectorSelect}
                    onComplete={handleCardSelectorClose}
                  />
                </div>
              </div>
            )}
            
            {/* Straddle Dialog */}
            {showStraddleDialog && holeCardsCompleted && isActive && (
              <div className="mt-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-purple-800">Straddle Option</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => handleStraddleDecision(false)}
                        className="bg-gray-50 hover:bg-gray-100 px-6"
                      >
                        No Straddle
                      </Button>
                    </div>
                    
                    {/* Button Row */}
                    <div className="flex items-center gap-3 justify-center">
                      <span className="text-sm font-medium text-gray-700 w-12">Button</span>
                      <Input
                        type="number"
                        min={(session?.bigBlind || 0) * 2}
                        defaultValue={((session?.bigBlind || 0) * 2)}
                        onChange={(e) => setCustomStraddleAmount(e.target.value)}
                        className="w-20 h-8 text-center text-sm"
                        placeholder="Amount"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const amount = customStraddleAmount ? parseFloat(customStraddleAmount) : (session?.bigBlind || 0) * 2;
                          handleStraddleDecision(true, session?.buttonPosition || 0, amount);
                        }}
                        className="bg-yellow-50 hover:bg-yellow-100 border-yellow-300"
                      >
                        Select
                      </Button>
                    </div>
                    
                    {/* UTG Row */}
                    <div className="flex items-center gap-3 justify-center">
                      <span className="text-sm font-medium text-gray-700 w-12">UTG</span>
                      <Input
                        type="number"
                        min={(session?.bigBlind || 0) * 2}
                        defaultValue={((session?.bigBlind || 0) * 2)}
                        onChange={(e) => setCustomStraddleAmount(e.target.value)}
                        className="w-20 h-8 text-center text-sm"
                        placeholder="Amount"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const amount = customStraddleAmount ? parseFloat(customStraddleAmount) : (session?.bigBlind || 0) * 2;
                          const bbPosition = session?.bigBlindPosition || 0;
                          const utgSeat = ((bbPosition + 1) % ((session?.seats || 0) + 1));
                          const actualUtg = utgSeat === 0 ? 1 : utgSeat;
                          handleStraddleDecision(true, actualUtg, amount);
                        }}
                        className="bg-blue-50 hover:bg-blue-100 border-blue-300"
                      >
                        Select
                      </Button>
                    </div>
                    
                    <p className="text-xs text-purple-500 text-center">
                      ${((session?.bigBlind || 0) * 2)} (2x Big Blind)
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            {handInProgress && currentActionSeat !== null && !waitingForCards && !waitingForHoleCards && !showStraddleDialog && holeCardsCompleted && isActive && (
              <div className="mt-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">Current Action:</p>
                  <p className="text-lg font-semibold">
                    Seat #{currentActionSeat} 
                    {currentActionSeat === session.heroPosition && ' (You)'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Pot: ${potSize.toFixed(2)} | Current Bet: ${currentBet.toFixed(2)}
                  </p>
                  {currentActionSeat === session.heroPosition && (
                    <p className="text-sm font-medium text-blue-600 mt-1">
                      Your Stack: ${heroStack.toFixed(2)}
                    </p>
                  )}
                </div>
                
                <div className="flex justify-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
                    onClick={() => handlePlayerAction('fold')}
                  >
                    Fold
                  </Button>
                  {currentBet === 0 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300"
                      onClick={() => handlePlayerAction('check')}
                    >
                      Check
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                      onClick={() => handlePlayerAction('call')}
                    >
                      {(() => {
                        const currentPlayerBet = playerBetsThisRound.get(currentActionSeat) || 0;
                        const amountNeeded = currentBet - currentPlayerBet;
                        
                        if (currentActionSeat === session.heroPosition) {
                          const callAmount = Math.min(amountNeeded, heroStack);
                          return heroStack < amountNeeded 
                            ? `All-In $${callAmount.toFixed(2)}` 
                            : `Call $${callAmount.toFixed(2)}`;
                        } else {
                          return `Call $${amountNeeded.toFixed(2)}`;
                        }
                      })()}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                    onClick={handleRaise}
                  >
                    {currentBet === 0 ? 'Bet' : 'Raise'}
                  </Button>
                  {/* Only show separate All-In button if hero can afford the call or there's no current bet */}
                  {(() => {
                    const currentPlayerBet = playerBetsThisRound.get(currentActionSeat) || 0;
                    const amountNeeded = currentBet - currentPlayerBet;
                    const heroCanAffordCall = currentActionSeat !== session.heroPosition || heroStack >= amountNeeded;
                    
                    return (heroCanAffordCall || currentBet === 0) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300 font-semibold"
                        onClick={() => handlePlayerAction('all-in')}
                      >
                        {currentActionSeat === session.heroPosition 
                          ? `All-In $${heroStack.toFixed(2)}` 
                          : 'All-In'}
                      </Button>
                    );
                  })()}
                </div>
              </div>
            )}
            
            {/* Showdown */}
            {currentBettingRound === 'showdown' && isActive && (
              <div className="mt-6">
                <div className="text-center mb-4">
                  <p className="text-lg font-semibold text-purple-600">Showdown</p>
                  <p className="text-sm text-gray-600 mt-1">Final Pot: ${potSize.toFixed(2)}</p>
                </div>
                
                {/* Result Selection */}
                <div className="mb-6">
                  <div className="text-center mb-3">
                    <p className="text-sm font-medium text-gray-700">Hand Result:</p>
                  </div>
                  <div className="flex justify-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                      onClick={() => {
                        setHandResult('won');
                        completeHand();
                      }}
                    >
                      Won Hand
                    </Button>
                    <Button
                      variant="outline" 
                      size="sm"
                      className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
                      onClick={() => {
                        setHandResult('lost');
                        completeHand();
                      }}
                    >
                      Lost Hand
                    </Button>
                  </div>
                </div>
                
                {/* Opponent Cards - Optional */}
                <div className="border-t pt-4">
                  <div className="text-center mb-3">
                    <p className="text-sm font-medium text-gray-700">Opponent Cards (Optional)</p>
                    <p className="text-xs text-gray-500">Enter cards that were revealed</p>
                  </div>
                  
                  <div className="space-y-2">
                    {Array.from({ length: session.seats + 1 }).map((_, seatIndex) => {
                      if (seatIndex === 0 || playerFolded.has(seatIndex) || seatIndex === session.heroPosition) return null;
                      return (
                        <div key={seatIndex} className="flex items-center justify-between max-w-md mx-auto">
                          <span className="text-sm font-medium">Seat {seatIndex}:</span>
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              placeholder="e.g., AhKs or folded"
                              className="w-32 h-8 text-sm"
                              onChange={(e) => handleShowdown(seatIndex, e.target.value)}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs px-2 py-1"
                              onClick={() => handleShowdown(seatIndex, 'mucked')}
                            >
                              Mucked
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* Next Hand Button */}
            {!handInProgress && isActive && (
              <div className="flex justify-center mt-6">
                <Button
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                  onClick={startNewHand}
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Start Hand {currentHandNumber}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Details */}
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Game Type</label>
                <div className="text-lg capitalize">{session.type}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Started</label>
                <div className="text-lg">{new Date(session.startTime).toLocaleString()}</div>
              </div>
              {session.location && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Location</label>
                  <div className="text-lg">{session.location}</div>
                </div>
              )}
              {session.endTime && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Ended</label>
                  <div className="text-lg">{new Date(session.endTime).toLocaleString()}</div>
                </div>
              )}
            </div>
            
            {session.notes && (
              <div>
                <label className="text-sm font-medium text-gray-600">Notes</label>
                <div className="text-lg">{session.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Raise Dialog */}
        <Dialog open={showRaiseDialog} onOpenChange={setShowRaiseDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enter Raise Amount</DialogTitle>
            </DialogHeader>
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min={currentBet + 1}
                  placeholder={`Min: $${(currentBet + 1).toFixed(2)}`}
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(e.target.value)}
                  className="h-10"
                />
              </div>
              <Button
                onClick={confirmRaise}
                disabled={!raiseAmount || parseFloat(raiseAmount) <= currentBet}
                className="bg-green-600 hover:bg-green-700"
              >
                Confirm
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Hand History */}
        {isActive && handActions.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Hand {currentHandNumber} Action Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {handActions.map((action: any, index) => (
                  <div key={index} className="flex justify-between items-center text-sm border-b pb-1">
                    <div className="flex-1">
                      <span className="font-medium">
                        {action.bettingRound && `[${action.bettingRound.charAt(0).toUpperCase() + action.bettingRound.slice(1)}] `}
                        Seat {action.seatNumber || (action.player === 'hero' ? session.heroPosition : action.player)}
                        {action.seatNumber === session.heroPosition && ' (You)'}:
                      </span>
                    </div>
                    <span className={`font-medium ${
                      action.action === 'fold' ? 'text-red-600' :
                      action.action === 'call' ? 'text-blue-600' :
                      action.action === 'raise' || action.action === 'bet' ? 'text-green-600' :
                      action.action === 'check' ? 'text-gray-600' :
                      action.action === 'all-in' ? 'text-purple-600' :
                      'text-gray-600'
                    }`}>
                      {action.action.charAt(0).toUpperCase() + action.action.slice(1)}
                      {action.amount && ` $${action.amount.toFixed(2)}`}
                    </span>
                  </div>
                ))}
                <div className="pt-2 text-xs text-gray-500">
                  Total Actions: {handActions.length} | Pot: ${potSize.toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      
      {/* All-In Amount Dialog */}
      <Dialog open={showAllInDialog} onOpenChange={setShowAllInDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>All-In Amount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Seat #{allInSeat} is going all-in. Enter the amount they're betting:
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">$</span>
              <Input
                type="number"
                min={currentBet}
                placeholder="All-in amount"
                className="flex-1"
                value={allInAmount}
                onChange={(e) => setAllInAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const amount = parseFloat(allInAmount) || 0;
                    if (amount > 0) {
                      handleAllInConfirm(amount);
                    }
                  }
                }}
              />
            </div>
            <p className="text-xs text-gray-500">
              Minimum: ${Math.ceil(currentBet)} (current bet)
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAllInDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const amount = parseFloat(allInAmount) || 0;
                  if (amount > 0) {
                    handleAllInConfirm(amount);
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Confirm All-In
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}