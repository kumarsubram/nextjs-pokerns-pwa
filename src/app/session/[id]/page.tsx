'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSessions } from '@/hooks/useSessions';
import { Session, Action, Hand, Position } from '@/types/poker';
import { HandsService } from '@/services/hands.service';
import { PokerTable } from '@/components/poker/PokerTable';
import { CommunityCardSelector } from '@/components/poker/CommunityCardSelector';
import { HoleCardSelector } from '@/components/poker/HoleCardSelector';
import { OpponentCardSelector } from '@/components/poker/OpponentCardSelector';
import { HandTracker } from '@/components/poker/HandTracker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const [completedHands, setCompletedHands] = useState<Hand[]>([]);
  const [potSize, setPotSize] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [showRaiseDialog, setShowRaiseDialog] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState('');
  const [playerFolded, setPlayerFolded] = useState<Set<number>>(new Set());
  const [handInProgress, setHandInProgress] = useState(false);
  const [playerActions, setPlayerActions] = useState<Map<number, { action: 'fold' | 'call' | 'raise' | 'check' | 'bet' | 'all-in'; amount?: number }>>(new Map());
  const [communityCards, setCommunityCards] = useState<(string | null)[]>([null, null, null, null, null]);
  const [waitingForCards, setWaitingForCards] = useState(false);
  // const [roundStartSeat, setRoundStartSeat] = useState<number | null>(null); // For future use
  const [playersActedThisRound, setPlayersActedThisRound] = useState<Set<number>>(new Set());
  // Removed playersMatchedBet - now tracking actual bet amounts in playerBetsThisRound
  const [playerBetsThisRound, setPlayerBetsThisRound] = useState<Map<number, number>>(new Map());
  const [lastRaiserSeat, setLastRaiserSeat] = useState<number | null>(null);
  const [minRaise, setMinRaise] = useState<number>(0); // Track minimum raise size
  const [playerTotalContributions, setPlayerTotalContributions] = useState<Map<number, number>>(new Map()); // Total across all rounds
  const [heroStack, setHeroStack] = useState<number>(0);
  const [allInPlayers, setAllInPlayers] = useState<Set<number>>(new Set());
  const [allInPlayerAmounts, setAllInPlayerAmounts] = useState<Map<number, number>>(new Map());
  const [showAllInDialog, setShowAllInDialog] = useState(false);
  const [allInSeat, setAllInSeat] = useState<number | null>(null);
  const [handResult, setHandResult] = useState<'won' | 'lost' | 'folded' | 'chopped' | null>(null);
  const [handWinAmount, setHandWinAmount] = useState<number>(0);
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
  // const [effectivePotSize, setEffectivePotSize] = useState(0); // For side pot calculations
  // const [allInScenario, setAllInScenario] = useState(false); // Track if we're in an all-in scenario
  // const [handResult, setHandResult] = useState<'won' | 'lost' | null>(null); // For showdown results
  const [holeCardsCompleted, setHoleCardsCompleted] = useState(false);
  const [opponentCards, setOpponentCards] = useState<Map<number, (string | null)[]>>(new Map());

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

  // Load completed hands for this session
  useEffect(() => {
    const loadCompletedHands = async () => {
      if (session) {
        try {
          const hands = await HandsService.getHandsForSession(session.id);
          setCompletedHands(hands);
        } catch (error) {
          console.error('Error loading completed hands:', error);
        }
      }
    };

    loadCompletedHands();
  }, [session]);

  const startNewHand = () => {
    if (!session) return;
    
    // Reset hand state
    setHandInProgress(true);
    setPlayerFolded(new Set());
    setHandActions([]);
    // Initialize playerActions with blind amounts
    const initialActions = new Map();
    if (session.smallBlindPosition !== undefined) {
      initialActions.set(session.smallBlindPosition, { action: 'bet' as const, amount: session.smallBlind || 0 });
    }
    if (session.bigBlindPosition !== undefined) {
      initialActions.set(session.bigBlindPosition, { action: 'bet' as const, amount: session.bigBlind || 0 });
    }
    setPlayerActions(initialActions);
    setCommunityCards([null, null, null, null, null]);
    setCurrentBettingRound('preflop');
    setWaitingForCards(false);
    // Initialize with blind positions having "acted" (posted blinds)
    const initialActedPlayers = new Set<number>();
    if (session.smallBlindPosition !== undefined) {
      initialActedPlayers.add(session.smallBlindPosition);
    }
    if (session.bigBlindPosition !== undefined) {
      initialActedPlayers.add(session.bigBlindPosition);
    }
    setPlayersActedThisRound(initialActedPlayers);
    // Initialize bet tracking with blind amounts
    const initialBets = new Map();
    if (session.smallBlindPosition !== undefined) {
      initialBets.set(session.smallBlindPosition, session.smallBlind || 0);
    }
    if (session.bigBlindPosition !== undefined) {
      initialBets.set(session.bigBlindPosition, session.bigBlind || 0);
    }
    setPlayerBetsThisRound(initialBets);
    setMinRaise(session.bigBlind || 2); // Min raise starts as big blind size
    // Initialize total contributions with blind amounts
    const initialContributions = new Map();
    if (session.smallBlindPosition !== undefined) {
      initialContributions.set(session.smallBlindPosition, session.smallBlind || 0);
    }
    if (session.bigBlindPosition !== undefined) {
      initialContributions.set(session.bigBlindPosition, session.bigBlind || 0);
    }
    setPlayerTotalContributions(initialContributions);
    setAllInPlayers(new Set());
    setAllInPlayerAmounts(new Map());
    setHoleCards([null, null]);
    setWaitingForHoleCards(true);
    setShowdownPlayers(new Map());
    // setEffectivePotSize(0);
    // setAllInScenario(false);
    // setHandResult(null);
    setHoleCardsCompleted(false);
    setOpponentCards(new Map());
    
    // Reset straddle state and ask about straddle
    setStraddleSeat(null);
    setStraddleAmount(0);
    setShowStraddleDialog(true);
    setCurrentActionSeat(null);
    setLastRaiserSeat(null);
    // setRoundStartSeat(null);
    
    // Initial pot is just the blinds for now
    setPotSize((session.smallBlind || 0) + (session.bigBlind || 0));
    setCurrentBet(session.bigBlind || 0);
    
    // Deduct blind amounts from hero's stack if hero is in blind position
    if (session.heroPosition === session.smallBlindPosition) {
      setHeroStack(prev => prev - (session.smallBlind || 0));
      console.log(`🃏 Hero posted SB $${session.smallBlind}, stack reduced to $${heroStack - (session.smallBlind || 0)}`);
    } else if (session.heroPosition === session.bigBlindPosition) {
      setHeroStack(prev => prev - (session.bigBlind || 0));
      console.log(`🃏 Hero posted BB $${session.bigBlind}, stack reduced to $${heroStack - (session.bigBlind || 0)}`);
    }
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
      // setRoundStartSeat(firstActionSeat);
      
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
      
      // Straddle seat has made their bet
      
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
      // setRoundStartSeat(actualFirstSeat);
      
      // Big blind has made their initial blind bet
      
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
        console.log(`🎰 Hero All-in: heroStack=${heroStack}, currentPlayerBet=${currentPlayerBet}, currentBet=${currentBet}`);
        actualAmount = heroStack;
        // Check if all-in is effectively a raise
        const newTotal = currentPlayerBet + actualAmount;
        console.log(`🎰 Hero All-in calculation: newTotal=${newTotal} (${currentPlayerBet} + ${actualAmount})`);
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
    
    // Create detailed action log - distinguish raise vs re-raise for tracking
    const trackedAction = action === 'raise' && lastRaiserSeat !== null ? 're-raise' : action;
    
    const newAction: Action & { 
      seatNumber: number; 
      bettingRound: string; 
      timestamp: Date 
    } = {
      player: currentActionSeat === session.heroPosition ? 'hero' : 'BTN',
      action: trackedAction as Action['action'],
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
    const newPlayersActedThisRound = new Set([...playersActedThisRound, currentActionSeat]);
    setPlayersActedThisRound(newPlayersActedThisRound);
    
    // Handle folded players - capture updated state to pass to moveToNextPlayer
    const newPlayerFolded = new Set([...playerFolded]); // Always create a new Set
    if (action === 'fold') {
      newPlayerFolded.add(currentActionSeat); // Add the current player to folded set
      setPlayerFolded(newPlayerFolded);
      // Player folded - they're out of the hand
    } else if (action === 'call') {
      // Call means they're adding to their bet to match the current bet
      const newTotalBet = playerCurrentBet + actualAmount;
      newBetsThisRound.set(currentActionSeat, newTotalBet);
      setPotSize(potSize + actualAmount);
    } else if (action === 'check') {
      // Check means they're staying with their current bet (should equal currentBet already)
    } else if (actualAction === 'raise' && action === 'raise') {
      // Regular raise (not all-in that became a raise)
      const totalBetAmount = amount || currentBet;
      const raiseAmount = totalBetAmount - currentBet;
      
      // Enforce minimum raise rule
      if (raiseAmount < minRaise) {
        console.error(`Invalid raise: ${raiseAmount} < minimum ${minRaise}`);
        return; // Invalid raise
      }
      
      setCurrentBet(totalBetAmount);
      setMinRaise(raiseAmount); // Update minimum raise for next player
      newBetsThisRound.set(currentActionSeat, totalBetAmount);
      setPotSize(potSize + actualAmount);
      setLastRaiserSeat(currentActionSeat);
    } else if (action === 'all-in') {
      // All-in - set their bet to their total contribution
      const totalBet = playerCurrentBet + actualAmount;
      newBetsThisRound.set(currentActionSeat, totalBet);
      setPotSize(potSize + actualAmount);
      
      // Track this player as all-in with their total amount
      const newAllInPlayers = new Set([...allInPlayers, currentActionSeat]);
      setAllInPlayers(newAllInPlayers);
      
      // Store all-in amounts for side pot calculation
      const allInAmounts = new Map(allInPlayerAmounts);
      allInAmounts.set(currentActionSeat, totalBet);
      setAllInPlayerAmounts(allInAmounts);
      
      // Check if all-in qualifies as a raise or just a call
      const raiseAmount = totalBet - currentBet;
      if (totalBet > currentBet) {
        // Check if raise is valid (meets minimum)
        if (raiseAmount >= minRaise) {
          // Valid raise via all-in
          console.log(`🚀 All-in RAISE: Player ${currentActionSeat} all-in for $${totalBet} (raise of $${raiseAmount}, min was $${minRaise})`);
          setCurrentBet(totalBet);
          setMinRaise(raiseAmount); // Update minimum for next raise
          setLastRaiserSeat(currentActionSeat);
        } else {
          // All-in for less than minimum raise - counts as call only
          console.log(`📍 All-in CALL only: Player ${currentActionSeat} all-in for $${totalBet} (raise of $${raiseAmount} < min $${minRaise})`);
          // Do NOT update current bet or allow re-raises
        }
        
        // Check if we need to cap the effective bet for existing all-in players
        // If there's already an all-in player with less chips, they can only win up to their amount from each player
        const existingAllInAmounts = Array.from(allInAmounts.values()).filter(amt => amt < totalBet);
        if (existingAllInAmounts.length > 0) {
          const minAllIn = Math.min(...existingAllInAmounts);
          console.log(`💰 Side pot scenario: Shortest all-in is $${minAllIn}, current all-in is $${totalBet}`);
          // This creates side pots - the short-stacked player can only win their amount × number of players
        }
      } else if (totalBet < currentBet) {
        // Player went all-in for less than the current bet - this creates side pots
        console.log(`💰 All-in short: Player ${currentActionSeat} all-in for $${totalBet} (less than $${currentBet})`);
        // This player can only win up to their all-in amount from each other player
        // Example: If hero all-in for $100, and another player all-in for $500
        // Hero can only win $100 from the other player (total pot for hero = $200)
        // The remaining $400 goes to a side pot between other players
      }
    }
    
    setPlayerBetsThisRound(newBetsThisRound);
    
    // Update total contributions for this player
    const newTotalContributions = new Map(playerTotalContributions);
    const existingTotal = newTotalContributions.get(currentActionSeat) || 0;
    newTotalContributions.set(currentActionSeat, existingTotal + actualAmount);
    setPlayerTotalContributions(newTotalContributions);
    
    // IMMEDIATE WIN CHECK: Before moving to next player, check if only one player remains
    const activePlayerSeats = [];
    for (let i = 1; i <= session.seats; i++) {
      if (!newPlayerFolded.has(i)) {
        activePlayerSeats.push(i);
      }
    }
    
    console.log('🎯 IMMEDIATE WIN CHECK after action:', {
      action: action,
      currentActionSeat,
      newPlayerFolded: Array.from(newPlayerFolded),
      oldPlayerFolded: Array.from(playerFolded),
      activePlayerSeats,
      activeCount: activePlayerSeats.length,
      willEndHand: activePlayerSeats.length <= 1,
      totalSeats: session.seats,
      shouldTriggerWin: activePlayerSeats.length === 1
    });
    
    // If only one player remains after this action, hand ends immediately
    if (activePlayerSeats.length === 1) {
      console.log('🏆 HANDLE_PLAYER_ACTION: Only one player remains after action - hand ends immediately!');
      
      const winner = activePlayerSeats[0]; // Should be only one player left
      let finalPot = potSize + (action === 'fold' ? 0 : actualAmount); // Include last action in pot if not fold
      
      // Calculate effective pot if winner was all-in for less than others
      if (allInPlayerAmounts.has(winner)) {
        const winnerAllInAmount = allInPlayerAmounts.get(winner) || 0;
        console.log(`💰 Winner was all-in for $${winnerAllInAmount}`);
        
        // Calculate the maximum the winner can win based on their all-in amount
        let effectivePot = 0;
        
        // The winner can win up to their all-in amount from each player who contributed
        for (const betAmount of newBetsThisRound.values()) {
          const contribution = Math.min(betAmount, winnerAllInAmount);
          effectivePot += contribution;
        }
        
        console.log(`💰 Effective pot for winner: $${effectivePot} (full pot was $${finalPot})`);
        finalPot = effectivePot;
      }
      
      console.log('🎯 Winner details:', {
        winner,
        heroPosition: session.heroPosition,
        isHeroWinner: winner === session.heroPosition,
        finalPot
      });
      
      // Set hand result based on who won and how hero exited the hand
      if (winner === session.heroPosition) {
        setHandResult('won');
        setHandWinAmount(finalPot);
        console.log('🏆 HANDLE_PLAYER_ACTION: Hero won the hand!');
        // Pass values directly to completeHand to avoid React state timing issues
        setTimeout(() => {
          completeHand('won', finalPot);
        }, 100);
      } else {
        // Check if hero folded or lost at showdown
        const heroFolded = session.heroPosition !== undefined && newPlayerFolded.has(session.heroPosition);
        if (heroFolded) {
          // Check if hero contributed any money this hand
          const heroContribution = (playerBetsThisRound.get(session.heroPosition!) || 0);
          const isSmallBlind = session.heroPosition === session.smallBlindPosition;
          const isBigBlind = session.heroPosition === session.bigBlindPosition;
          
          // Hero loses what they contributed (blinds + any bets)
          const amountLost = heroContribution;
          
          console.log('💸 HANDLE_PLAYER_ACTION: Hero folded', {
            heroPosition: session.heroPosition,
            contribution: heroContribution,
            isSmallBlind,
            isBigBlind,
            amountLost
          });
          
          setHandResult('folded');
          setTimeout(() => {
            completeHand('folded', -amountLost); // Negative to indicate loss
          }, 100);
        } else {
          setHandResult('lost'); // Hero stayed in but lost at showdown
          console.log('💸 HANDLE_PLAYER_ACTION: Hero lost at showdown');
          setTimeout(() => {
            completeHand('lost', 0);
          }, 100);
        }
      }
      return;
    }
    
    // Move to next player - pass updated values if we raised or went all-in for more than current bet
    let updatedCurrentBet = undefined;
    let updatedPlayersActed = newPlayersActedThisRound;
    
    if (actualAction === 'raise') {
      updatedCurrentBet = amount || currentBet;
      // When raising, reset who has acted (only the raiser has acted on new bet)
      updatedPlayersActed = new Set([currentActionSeat]);
      console.log('🎯 RAISE: Resetting playersActed to only raiser', { raiser: currentActionSeat });
    } else if (action === 'all-in') {
      const totalBet = playerCurrentBet + actualAmount;
      if (totalBet > currentBet) {
        updatedCurrentBet = totalBet;
        // All-in raise also resets who has acted
        updatedPlayersActed = new Set([currentActionSeat]);
        console.log('🎯 ALL-IN RAISE: Resetting playersActed to only raiser', { raiser: currentActionSeat });
      }
    }
    moveToNextPlayer(updatedCurrentBet, newBetsThisRound, updatedPlayersActed, newPlayerFolded);
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
    const newPlayersActedThisRound = new Set([...playersActedThisRound, allInSeat]);
    setPlayersActedThisRound(newPlayersActedThisRound);
    
    // Update bet tracking
    const currentPlayerBet = playerBetsThisRound.get(allInSeat) || 0;
    const actualAmountAdded = amount - currentPlayerBet;
    const newBetsThisRound = new Map(playerBetsThisRound);
    newBetsThisRound.set(allInSeat, amount);
    setPlayerBetsThisRound(newBetsThisRound);
    
    setPotSize(potSize + actualAmountAdded);
    // All-in player has made their bet
    setAllInPlayers(new Set([...allInPlayers, allInSeat]));
    
    // If amount is greater than current bet, it's a raise
    if (amount > currentBet) {
      setCurrentBet(amount);
      // All-in created a new high bet
    }
    
    setAllInSeat(null);
    setAllInAmount('');
    
    // Move to next player - pass updated values for all-in scenarios
    const updatedCurrentBet = amount > currentBet ? amount : undefined;
    moveToNextPlayer(updatedCurrentBet, newBetsThisRound, newPlayersActedThisRound, playerFolded);
  };

  const moveToNextPlayer = (updatedCurrentBet?: number, updatedPlayerBets?: Map<number, number>, updatedPlayersActed?: Set<number>, updatedPlayerFolded?: Set<number>) => {
    if (!session || currentActionSeat === null) return;
    
    console.log('🔄 MOVE TO NEXT PLAYER called:', {
      currentActionSeat,
      updatedPlayerFolded: updatedPlayerFolded ? Array.from(updatedPlayerFolded) : 'none',
      currentPlayerFolded: Array.from(playerFolded)
    });
    
    // Use updated values if provided, otherwise use current state
    const effectiveCurrentBet = updatedCurrentBet ?? currentBet;
    const effectivePlayerBets = updatedPlayerBets ?? playerBetsThisRound;
    const effectivePlayersActed = updatedPlayersActed ?? playersActedThisRound;
    const effectivePlayerFolded = updatedPlayerFolded ?? playerFolded;
    
    // First, check if betting round is complete according to Texas Hold'em rules
    const activePlayerSeats = [];
    for (let i = 1; i <= session.seats; i++) {
      if (!effectivePlayerFolded.has(i)) {
        activePlayerSeats.push(i);
      }
    }
    
    const activeNonAllInPlayers = activePlayerSeats.filter(seat => !allInPlayers.has(seat));
    
    // Check if everyone has matched the current bet OR is all-in
    const allActivePlayersSettled = activePlayerSeats.every(seat => {
      const playerBet = effectivePlayerBets.get(seat) || 0;
      const hasMatchedCurrentBet = playerBet >= effectiveCurrentBet;
      const isAllIn = allInPlayers.has(seat);
      
      // A player is "settled" if they've matched the current bet OR they're all-in
      const isSettled = hasMatchedCurrentBet || isAllIn;
      
      if (!isSettled) {
        console.log(`❌ Player ${seat} has NOT settled:`, {
          playerBet,
          currentBet: effectiveCurrentBet,
          needsToAdd: effectiveCurrentBet - playerBet,
          isAllIn
        });
      }
      
      return isSettled;
    });
    
    // Check if everyone who can act has acted at least once
    const allPlayersHaveActed = activePlayerSeats.every(seat => {
      const hasActed = effectivePlayersActed.has(seat);
      const isAllIn = allInPlayers.has(seat);
      return hasActed || isAllIn;
    });
    
    console.log('Round completion check details:', {
      activePlayerSeats,
      activeNonAllInPlayers,
      playerFoldedSize: effectivePlayerFolded.size,
      totalSeats: session.seats,
      playersActedThisRound: Array.from(effectivePlayersActed),
      allInPlayers: Array.from(allInPlayers),
      currentBet: effectiveCurrentBet,
      lastRaiserSeat,
      allActivePlayersSettled,
      allPlayersHaveActed,
      currentBettingRound,
      bbPosition: session.bigBlindPosition,
      playerBets: Array.from(effectivePlayerBets.entries())
    });
    
    // Log each active player's status explicitly
    console.log('=== PER-PLAYER STATUS CHECK ===');
    activePlayerSeats.forEach(seat => {
      const hasActed = effectivePlayersActed.has(seat);
      const isAllIn = allInPlayers.has(seat);
      const playerBet = effectivePlayerBets.get(seat) || 0;
      const hasMatchedBet = playerBet >= effectiveCurrentBet;
      
      console.log(`Player ${seat}:`, {
        hasActed,
        isAllIn,
        playerBet,
        currentBet: effectiveCurrentBet,
        hasMatchedBet,
        needsToAdd: hasMatchedBet ? 0 : (effectiveCurrentBet - playerBet),
        isSettled: hasMatchedBet || isAllIn
      });
    });
    
    // Texas Hold'em Betting Round Completion Rules:
    // A betting round ends when all active players have matched the highest bet (or gone all-in)
    // and no further raises are possible.
    
    // Case 1: Only one player remains (everyone else folded) - hand ends immediately
    const onlyOnePlayerRemains = activePlayerSeats.length <= 1;
    
    // Case 2: All remaining players are all-in except possibly one - no more betting possible  
    const allButOneAllIn = activeNonAllInPlayers.length <= 1;
    
    // Case 3: All active players have matched the current bet AND everyone has acted at least once
    const everyoneHasMatchedBet = allActivePlayersSettled;
    const everyoneHasActed = allPlayersHaveActed;
    
    // Special case for preflop: Big Blind gets option
    let bbHasOption = true; // Default to true for non-preflop rounds
    if (currentBettingRound === 'preflop' && session.bigBlindPosition !== undefined) {
      // BB has option means they must act at least once
      bbHasOption = effectivePlayersActed.has(session.bigBlindPosition);
    }
    
    // Don't complete round if nobody has acted yet (start of new betting round)
    const nobodyHasActedYet = effectivePlayersActed.size === 0;
    
    const allBetsMatched = everyoneHasMatchedBet && everyoneHasActed && bbHasOption && !nobodyHasActedYet;
    
    console.log('Round completion conditions:', {
      onlyOnePlayerRemains,
      allButOneAllIn,
      allBetsMatched,
      everyoneHasMatchedBet,
      everyoneHasActed,
      bbHasOption,
      nobodyHasActedYet,
      currentActionSeat,
      lastRaiserSeat,
      effectiveCurrentBet,
      willCompleteRound: allBetsMatched || (allButOneAllIn && allActivePlayersSettled),
      willEndHandImmediately: onlyOnePlayerRemains
    });
    
    // Round is complete only if:
    // 1. All bets matched AND everyone has acted, OR
    // 2. All but one player is all-in AND all active players have settled their bets
    const isRoundComplete = allBetsMatched || (allButOneAllIn && allActivePlayersSettled);
    
    // Special case: Only one player remains - hand ends immediately (Texas Hold'em rule)
    if (onlyOnePlayerRemains) {
      console.log('🏆 MOVE_TO_NEXT_PLAYER: Only one player remains - hand ends immediately!');
      
      // Find the winner (the only remaining active player)
      const winner = activePlayerSeats[0]; // Should be only one player left
      
      // Use potSize as the total pot - it should include all contributions
      const totalPot = potSize;
      
      console.log('🏆 MOVE_TO_NEXT_PLAYER Winner details:', {
        winner,
        heroPosition: session.heroPosition,
        isHeroWinner: winner === session.heroPosition,
        potSize,
        totalPot,
        playerBets: Object.fromEntries(effectivePlayerBets)
      });
      
      // Set hand result based on who won and how hero exited the hand
      if (winner === session.heroPosition) {
        setHandResult('won');
        setHandWinAmount(totalPot);
        console.log('🏆 MOVE_TO_NEXT_PLAYER: Hero won!', { totalPot });
        // Pass values directly to completeHand to avoid React state timing issues
        completeHand('won', totalPot);
      } else {
        // Check if hero folded or lost at showdown
        const heroFolded = session.heroPosition !== undefined && effectivePlayerFolded.has(session.heroPosition);
        if (heroFolded) {
          // Check if hero contributed any money this hand
          const heroContribution = (effectivePlayerBets.get(session.heroPosition!) || 0);
          const isSmallBlind = session.heroPosition === session.smallBlindPosition;
          const isBigBlind = session.heroPosition === session.bigBlindPosition;
          
          // Hero loses what they contributed (blinds + any bets)
          const amountLost = heroContribution;
          
          console.log('💸 MOVE_TO_NEXT_PLAYER: Hero folded', {
            heroPosition: session.heroPosition,
            contribution: heroContribution,
            isSmallBlind,
            isBigBlind,
            amountLost
          });
          
          setHandResult('folded');
          completeHand('folded', -amountLost); // Negative to indicate loss
        } else {
          setHandResult('lost'); // Hero stayed in but lost at showdown
          console.log('💸 MOVE_TO_NEXT_PLAYER: Hero lost at showdown');
          completeHand('lost', 0);
        }
      }
      return;
    }
    
    // If normal round is complete, move to next round
    if (isRoundComplete) {
      moveToNextRound(effectivePlayerFolded);
      return;
    }
    
    
    // Find next active player (seats are numbered 1 to session.seats)
    let nextSeat = currentActionSeat;
    const totalSeats = session.seats;
    
    let attempts = 0;
    do {
      // Move to next seat, wrapping from session.seats to 1
      nextSeat = (nextSeat % totalSeats) + 1;
      attempts++;
      
      console.log(`Checking seat ${nextSeat}: folded=${effectivePlayerFolded.has(nextSeat)}, acted=${effectivePlayersActed.has(nextSeat)}, bet=${effectivePlayerBets.get(nextSeat) || 0}, currentBet=${effectiveCurrentBet}`);
      
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
    

    setCurrentActionSeat(nextSeat);
  };

  const moveToNextRound = (updatedPlayerFolded?: Set<number>) => {
    if (!session) return;
    
    // Use updated folded players if provided, otherwise use current state
    const effectiveFolded = updatedPlayerFolded ?? playerFolded;
    
    // Check if only one player remains before moving to next round
    const activePlayerSeats = [];
    for (let i = 1; i <= session.seats; i++) {
      if (!effectiveFolded.has(i)) {
        activePlayerSeats.push(i);
      }
    }
    
    // Texas Hold'em rule: If only one player remains, hand ends immediately
    if (activePlayerSeats.length <= 1) {
      console.log('🏆 Only one player remains after betting round - hand ends immediately!');
      
      const winner = activePlayerSeats[0]; // Should be only one player left
      
      // Set hand result based on who won
      if (winner === session.heroPosition) {
        setHandResult('won');
        setHandWinAmount(potSize);
      } else {
        setHandResult('lost'); // Hero folded, opponent won
      }
      
      // Complete the hand immediately
      completeHand();
      return;
    }
    
    // Clear all actions for new betting round - no amounts should show
    setPlayerActions(new Map());
    setPlayersActedThisRound(new Set());
    // Reset for new betting round
    setPlayerBetsThisRound(new Map());
    setCurrentBet(0);
    setLastRaiserSeat(null);
    
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

  // const handleHoleCardComplete = () => {
  //   // This function is no longer needed since we auto-detect completed cards
  //   // and show straddle dialog automatically
  // }; // For future use

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
    
    // Post-flop betting starts from first active player after the button
    // The button position is the last to act post-flop
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
        console.log(`Post-flop action starts with Seat ${firstSeat} (first active after button at Seat ${buttonPosition})`);
        break;
      }
    } while (attempts < totalSeats);
    
    if (attempts < totalSeats) {
      setCurrentActionSeat(firstSeat);
    } else {
      // No one can act - proceed to next round
      moveToNextRound();
    }
  };

  const completeHand = async (overrideResult?: 'won' | 'lost' | 'folded' | 'chopped', overrideWinAmount?: number) => {
    // Use override values if provided, otherwise use state values
    const effectiveResult = overrideResult || handResult || 'folded';
    const effectiveWinAmount = overrideWinAmount !== undefined ? overrideWinAmount : handWinAmount;
    
    // Save hand history before completing
    if (session) {
      try {
        // Get hero's position based on heroPosition in session
        const heroPos = session.heroPosition || 1;
        const positionMap: Record<number, Position> = {
          1: 'UTG', 2: 'UTG+1', 3: 'UTG+2', 4: 'MP', 5: 'MP+1', 6: 'CO', 7: 'BTN', 8: 'SB', 9: 'BB'
        };
        
        const hand: Hand = {
          id: `${session.id}-hand-${currentHandNumber}`,
          sessionId: session.id,
          handNumber: currentHandNumber,
          timestamp: new Date(),
          heroPosition: positionMap[heroPos] || 'UTG',
          villainPositions: [],
          holeCards: holeCards.filter(card => card !== null) as string[],
          communityCards: communityCards,
          board: {
            flop: communityCards.slice(0, 3).filter(card => card !== null) as string[] || undefined,
            turn: communityCards[3] || undefined,
            river: communityCards[4] || undefined,
          },
          preflop: handActions.filter(() => currentBettingRound === 'preflop'),
          flop: currentBettingRound === 'flop' ? handActions : undefined,
          turn: currentBettingRound === 'turn' ? handActions : undefined,
          river: currentBettingRound === 'river' ? handActions : undefined,
          heroActions: {
            preflop: getHeroAction() as 'raise' | 'call' | 'fold' | 'check' | 'bet' | 'all-in' | 'straddle',
            flop: currentBettingRound === 'flop' ? getHeroAction() as 'raise' | 'call' | 'fold' | 'check' | 'bet' | 'all-in' | undefined : undefined,
            turn: currentBettingRound === 'turn' ? getHeroAction() as 'raise' | 'call' | 'fold' | 'check' | 'bet' | 'all-in' | undefined : undefined,
            river: currentBettingRound === 'river' ? getHeroAction() as 'raise' | 'call' | 'fold' | 'check' | 'bet' | 'all-in' | undefined : undefined,
          },
          stagesReached: {
            preflop: true,
            flop: communityCards.slice(0, 3).some(card => card !== null),
            turn: communityCards[3] !== null,
            river: communityCards[4] !== null,
            showdown: currentBettingRound === 'showdown',
          },
          foldedAt: handResult === 'folded' ? (currentBettingRound === 'showdown' ? 'river' : currentBettingRound) : undefined,
          potSize: potSize,
          result: effectiveResult,
          amountWon: effectiveResult === 'won' ? effectiveWinAmount : undefined,
          showdown: currentBettingRound === 'showdown',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        console.log('📝 COMPLETE_HAND: About to save hand with result:', {
          handResult,
          handWinAmount,
          overrideResult,
          overrideWinAmount,
          effectiveResult,
          effectiveWinAmount,
          potSize
        });
        
        await HandsService.addHand(session.id, hand);
        console.log('Hand saved:', hand);
        
        // Reload completed hands to include the newly saved hand
        try {
          const updatedHands = await HandsService.getHandsForSession(session.id);
          setCompletedHands(updatedHands);
        } catch (error) {
          console.error('Error reloading completed hands:', error);
        }
      } catch (error) {
        console.error('Error saving hand:', error);
      }
      
      // Calculate profit change for this hand
      let profitChange = 0;
      if (effectiveResult === 'won' && effectiveWinAmount > 0) {
        // Hero won the pot - net profit is pot won minus what they put in
        // In this case: Won $108 pot, put in $100, net profit = +$8
        const heroContribution = playerBetsThisRound.get(session.heroPosition || 1) || 0;
        profitChange = effectiveWinAmount - heroContribution;
        console.log(`🏆 Hand won: Won $${effectiveWinAmount}, contributed $${heroContribution}, net profit: +$${profitChange}`);
      } else if (effectiveResult === 'lost' || effectiveResult === 'folded') {
        // Hero lost - they lose whatever they contributed to the pot
        const heroContribution = playerBetsThisRound.get(session.heroPosition || 1) || 0;
        profitChange = -heroContribution;
        console.log(`💸 Hand lost: Lost $${heroContribution}, net profit: -$${Math.abs(profitChange)}`);
      }
      
      // Update session with new totals including profit
      const currentProfit = session.profit || 0;
      const newProfit = currentProfit + profitChange;
      
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
      
      await updateSession(session.id, {
        totalHands: session.totalHands + 1,
        profit: newProfit,
        buttonPosition: nextButton,
        smallBlindPosition: nextSmallBlind,
        bigBlindPosition: nextBigBlind
      });

      // Manually update the local session state to immediately reflect changes in UI
      setSession(prev => prev ? {
        ...prev,
        totalHands: prev.totalHands + 1,
        profit: newProfit,
        buttonPosition: nextButton,
        smallBlindPosition: nextSmallBlind,
        bigBlindPosition: nextBigBlind
      } : null);
    }
    
    // Reset hand state for next hand
    setHandResult(null);
    setHandWinAmount(0);
    setCurrentHandNumber(currentHandNumber + 1);
    setHandInProgress(false);
  };

  // Helper function to get the most significant hero action for a betting round
  const getHeroAction = (): 'raise' | 'call' | 'fold' | 'check' | 'bet' | 'all-in' | 'straddle' => {
    // Filter actions for the specific round and hero
    const roundActions = handActions.filter(action => action.player === 'hero');
    if (roundActions.length > 0) {
      const lastAction = roundActions[roundActions.length - 1];
      return lastAction.action as 'raise' | 'call' | 'fold' | 'check' | 'bet' | 'all-in' | 'straddle';
    }
    return 'fold'; // Default if no action found
  };

  const handleShowdown = (seatNumber: number, cards: string) => {
    const newShowdown = new Map(showdownPlayers);
    newShowdown.set(seatNumber, cards);
    setShowdownPlayers(newShowdown);
  };

  const handleOpponentCardSelect = (seatNumber: number, cardIndex: number, card: string) => {
    const newOpponentCards = new Map(opponentCards);
    const currentCards = newOpponentCards.get(seatNumber) || [null, null];
    currentCards[cardIndex] = card;
    newOpponentCards.set(seatNumber, [...currentCards]);
    setOpponentCards(newOpponentCards);
    
    // Also update showdown players for consistency
    const cardString = currentCards.filter(c => c !== null).join(' ');
    if (cardString) {
      handleShowdown(seatNumber, cardString);
    }
  };

  const handleOpponentMucked = (seatNumber: number) => {
    const newOpponentCards = new Map(opponentCards);
    newOpponentCards.set(seatNumber, [null, null]);
    setOpponentCards(newOpponentCards);
    handleShowdown(seatNumber, 'mucked');
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
          <p className="text-muted-foreground mb-4">The session you&apos;re looking for doesn&apos;t exist.</p>
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
      <header className="w-full bg-background">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="py-2 sm:py-4 space-y-1.5 sm:space-y-3">
            {/* Session Name Row */}
            <div className="text-center">
              <h1 className="text-lg sm:text-2xl font-bold">{session.name}</h1>
            </div>
            
            {/* Status and Actions Row */}
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              {/* Player Balance */}
              <div className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                (session.profit || 0) > 0 
                  ? 'bg-green-100 text-green-800'   // Winning
                  : (session.profit || 0) < 0 
                  ? 'bg-red-100 text-red-800'       // Losing  
                  : 'bg-blue-100 text-blue-800'     // Breaking even (initial buy-in)
              }`}>
                ${(session.buyIn + (session.profit || 0)).toFixed(0)}
              </div>
              
              <div className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {isActive ? 'Active' : 'Ended'}
              </div>
              
              {isActive && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEndSession}
                  className="h-7 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
                >
                  <StopCircle className="h-3 w-3 mr-1 sm:h-4 sm:w-4 sm:mr-2" />
                  End
                </Button>
              )}
            </div>
          </div>
        </div>

      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-3 sm:py-6">


        {/* Current Hand */}
        <Card className="mb-3">
          <CardHeader className="pb-0">
            <CardTitle className="text-center text-lg">
              Hand {currentHandNumber} - <span className={`font-bold ${
                currentBettingRound === 'preflop' ? 'text-gray-700' :
                currentBettingRound === 'flop' ? 'text-blue-600' :
                currentBettingRound === 'turn' ? 'text-orange-600' :
                currentBettingRound === 'river' ? 'text-purple-600' :
                currentBettingRound === 'showdown' ? 'text-green-600' : 'text-gray-700'
              }`}>
                {currentBettingRound.charAt(0).toUpperCase() + currentBettingRound.slice(1)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
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
                            id="rebuy-amount"
                            name="rebuyAmount"
                            type="number"
                            min="1"
                            placeholder="Rebuy amount"
                            className="w-32 h-8 text-center text-sm"
                            value={rebuyAmount}
                            onChange={(e) => setRebuyAmount(e.target.value)}
                            aria-label="Rebuy amount"
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
                    holeCards={holeCards}
                  />
                </div>
              </div>
            )}
            
            {/* Straddle Dialog */}
            {showStraddleDialog && holeCardsCompleted && isActive && (
              <div className="mt-6">
                <div className="bg-purple-50 border-2 animate-pulse border-purple-300 rounded-lg p-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-purple-800">Straddle Option</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => handleStraddleDecision(false)}
                        className="bg-green-50 hover:bg-green-100 text-green-700 border-2 border-green-300 hover:border-green-400 w-full max-w-xs min-h-[3rem] h-12 text-lg font-semibold shadow-sm"
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:justify-center gap-3 max-w-sm mx-auto lg:max-w-none">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300 h-12 font-medium"
                    onClick={() => handlePlayerAction('fold')}
                  >
                    Fold
                  </Button>
                  {currentBet === 0 ? (
                    <Button
                      variant="outline"
                      size="lg"
                      className="bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300 h-12 font-medium"
                      onClick={() => handlePlayerAction('check')}
                    >
                      Check
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="lg"
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300 h-12 font-medium"
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
                    size="lg"
                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300 h-12 font-medium"
                    onClick={handleRaise}
                  >
                    {currentBet === 0 ? 'Bet' : (lastRaiserSeat !== null ? 'Re-Raise' : 'Raise')}
                  </Button>
                  {/* Only show separate All-In button if hero can afford the call or there's no current bet */}
                  {(() => {
                    const currentPlayerBet = playerBetsThisRound.get(currentActionSeat) || 0;
                    const amountNeeded = currentBet - currentPlayerBet;
                    const heroCanAffordCall = currentActionSeat !== session.heroPosition || heroStack >= amountNeeded;
                    
                    return (heroCanAffordCall || currentBet === 0) && (
                      <Button
                        variant="outline"
                        size="lg"
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300 h-12 font-medium"
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
                      }}
                    >
                      Lost Hand
                    </Button>
                    <Button
                      variant="outline" 
                      size="sm"
                      className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300"
                      onClick={() => {
                        setHandResult('chopped');
                      }}
                    >
                      Chopped
                    </Button>
                  </div>
                  
                  {/* Win Amount Input */}
                  {handResult === 'won' && (
                    <div className="mt-4 text-center">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount Won:
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Enter amount won"
                        value={handWinAmount || ''}
                        onChange={(e) => setHandWinAmount(parseFloat(e.target.value) || 0)}
                        className="w-32 mx-auto text-center"
                      />
                    </div>
                  )}
                  
                  {/* Complete Hand Button */}
                  {handResult && (
                    <div className="mt-4 text-center">
                      <Button
                        onClick={() => completeHand()}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Complete Hand & Continue
                      </Button>
                    </div>
                  )}
                </div>

                {/* Opponent Cards Section */}
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 mb-3">Opponent Cards (Optional)</p>
                  </div>
                  <div className="grid gap-4">
                    {Array.from({ length: session.seats }, (_, index) => {
                      const seatNumber = index + 1;
                      if (seatNumber === session.heroPosition) return null;
                      
                      const isPlayerFolded = playerFolded.has(seatNumber);
                      if (isPlayerFolded) return null;
                      
                      return (
                        <OpponentCardSelector
                          key={seatNumber}
                          seatNumber={seatNumber}
                          opponentCards={opponentCards.get(seatNumber) || [null, null]}
                          onCardSelect={(cardIndex, card) => handleOpponentCardSelect(seatNumber, cardIndex, card)}
                          onMucked={() => handleOpponentMucked(seatNumber)}
                          holeCards={holeCards}
                          communityCards={communityCards}
                          allOpponentCards={opponentCards}
                        />
                      );
                    })}
                  </div>
                </div>
                
                {/* Opponent Cards - Optional */}
                <div className="pt-2">
                  <div className="text-center mb-4">
                    <p className="text-sm font-medium text-gray-700">Opponent Cards (Optional)</p>
                    <p className="text-xs text-gray-500">Select cards that were revealed</p>
                  </div>
                  
                  <div className="space-y-4">
                    {Array.from({ length: session.seats + 1 }).map((_, seatIndex) => {
                      if (seatIndex === 0 || playerFolded.has(seatIndex) || seatIndex === session.heroPosition) return null;
                      return (
                        <OpponentCardSelector
                          key={seatIndex}
                          seatNumber={seatIndex}
                          opponentCards={opponentCards.get(seatIndex) || [null, null]}
                          onCardSelect={(cardIndex, card) => handleOpponentCardSelect(seatIndex, cardIndex, card)}
                          onMucked={() => handleOpponentMucked(seatIndex)}
                          holeCards={holeCards}
                          communityCards={communityCards}
                          allOpponentCards={opponentCards}
                        />
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

        {/* Hand Tracker - Show current hand when in progress, and completed hands history */}
        {(handInProgress || completedHands.length > 0) && (
          <div className="space-y-3">
            {/* Current Hand */}
            {handInProgress && (
              <HandTracker
                handNumber={currentHandNumber}
                holeCards={holeCards}
                handResult={handResult}
                handWinAmount={handWinAmount}
                handActions={handActions}
                currentBettingRound={currentBettingRound}
                session={session}
                communityCards={communityCards}
              />
            )}
            
            {/* Completed Hands History - only show hands that are actually completed */}
            {completedHands
              .filter(hand => !handInProgress || hand.handNumber !== currentHandNumber)
              .sort((a, b) => b.handNumber - a.handNumber) // Most recent first
              .map((hand) => (
                <HandTracker
                  key={hand.id}
                  handNumber={hand.handNumber}
                  holeCards={hand.holeCards}
                  handResult={hand.result}
                  handWinAmount={hand.amountWon || 0}
                  handActions={hand.preflop}
                  session={session}
                  communityCards={hand.communityCards || []}
                />
              ))}
          </div>
        )}

        {/* Session Details */}
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Session Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex flex-col items-center text-center">
                <Clock className="h-6 w-6 text-blue-600 mb-2" />
                <span className="text-xl font-bold text-gray-900">{formatDuration(session.startTime, session.endTime)}</span>
                <span className="text-sm text-gray-600">Duration</span>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <Users className="h-6 w-6 text-green-600 mb-2" />
                <span className="text-xl font-bold text-gray-900">{session.seats}</span>
                <span className="text-sm text-gray-600">Seats</span>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <Play className="h-6 w-6 text-purple-600 mb-2" />
                <span className="text-xl font-bold text-gray-900">{session.totalHands}</span>
                <span className="text-sm text-gray-600">Hands</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Game Type</label>
                <div className="text-lg capitalize">{session.type}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Buy-In</label>
                <div className="text-lg">${session.buyIn.toFixed(2)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Small Blind</label>
                <div className="text-lg">${session.smallBlind?.toFixed(2) || '0.00'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Big Blind</label>
                <div className="text-lg">${session.bigBlind?.toFixed(2) || '0.00'}</div>
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
              <DialogDescription>
                Enter the amount you want to raise to (minimum: ${(currentBet + 1).toFixed(2)})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                id="raise-amount"
                name="raiseAmount"
                type="number"
                step="0.01"
                min={currentBet + 1}
                placeholder={`Min: $${(currentBet + 1).toFixed(2)}`}
                value={raiseAmount}
                onChange={(e) => setRaiseAmount(e.target.value)}
                className="h-10"
                aria-label="Raise amount"
              />
              <Button
                onClick={confirmRaise}
                disabled={!raiseAmount || parseFloat(raiseAmount) <= currentBet}
                className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
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
                {handActions.map((action, index) => {
                  const extAction = action as Action & { seatNumber?: number; bettingRound?: string; timestamp?: Date };
                  return (
                  <div key={index} className="flex justify-between items-center text-sm border-b pb-1">
                    <div className="flex-1">
                      <span className="font-medium">
                        {extAction.bettingRound && `[${extAction.bettingRound.charAt(0).toUpperCase() + extAction.bettingRound.slice(1)}] `}
                        Seat {extAction.seatNumber || (action.player === 'hero' ? session.heroPosition : action.player)}
                        {extAction.seatNumber === session.heroPosition && ' (You)'}:
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
                      {action.amount && action.action !== 'fold' && action.action !== 'check' ? ` $${action.amount.toFixed(2)}` : ''}
                    </span>
                  </div>
                  )
                })}
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
            <DialogDescription>
              Enter the amount for the all-in bet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Seat #{allInSeat} is going all-in. Enter the amount they&apos;re betting:
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">$</span>
              <Input
                id="allin-amount"
                name="allInAmount"
                type="number"
                min={currentBet}
                placeholder="All-in amount"
                className="flex-1"
                value={allInAmount}
                onChange={(e) => setAllInAmount(e.target.value)}
                aria-label="All-in bet amount"
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