'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SimplePokerTable } from './SimplePokerTable';
import { HandHistory } from './HandHistory';
import { TrackedHand } from '@/services/tracked-hand.service';
import { BettingAction, Position, PlayerState } from '@/types/poker-v2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';

interface HandReplayProps {
  trackedHand: TrackedHand;
  onClose: () => void;
}

interface ReplayState {
  currentRound: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  currentActionIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  playerStates: PlayerState[];
  communityCards: {
    flop: [string, string, string] | null;
    turn: string | null;
    river: string | null;
  };
  currentPot: number;
  currentBet: number;
  allActions: (BettingAction & { round: string })[];
}

export function HandReplay({ trackedHand, onClose }: HandReplayProps) {
  const [replayState, setReplayState] = useState<ReplayState>(() => {
    // Initialize all actions from all betting rounds in chronological order
    const allActions: (BettingAction & { round: string })[] = [];

    if (trackedHand.bettingRounds.preflop) {
      trackedHand.bettingRounds.preflop.actions.forEach(action => {
        allActions.push({ ...action, round: 'preflop' });
      });
    }
    if (trackedHand.bettingRounds.flop) {
      trackedHand.bettingRounds.flop.actions.forEach(action => {
        allActions.push({ ...action, round: 'flop' });
      });
    }
    if (trackedHand.bettingRounds.turn) {
      trackedHand.bettingRounds.turn.actions.forEach(action => {
        allActions.push({ ...action, round: 'turn' });
      });
    }
    if (trackedHand.bettingRounds.river) {
      trackedHand.bettingRounds.river.actions.forEach(action => {
        allActions.push({ ...action, round: 'river' });
      });
    }

    // Initialize player states - all active at start
    const playerStates: PlayerState[] = [];
    const positions = trackedHand.tableSeats === 6
      ? ['BTN', 'SB', 'BB', 'UTG', 'LJ', 'CO']
      : ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO'];

    positions.forEach(position => {
      playerStates.push({
        position: position as Position,
        status: 'active',
        stack: 1000, // Default stack size for display
        currentBet: 0,
        hasActed: false
      });
    });

    return {
      currentRound: 'preflop',
      currentActionIndex: -1, // Start before first action
      isPlaying: false,
      playbackSpeed: 1000, // 1 second per action
      playerStates,
      communityCards: { flop: null, turn: null, river: null },
      currentPot: 0,
      currentBet: 0,
      allActions
    };
  });

  const updateGameState = useCallback(() => {
    const currentActionIndex = replayState.currentActionIndex;

    // Initialize player states - all active at start
    const positions = trackedHand.tableSeats === 6
      ? ['BTN', 'SB', 'BB', 'UTG', 'LJ', 'CO']
      : ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO'];

    const newPlayerStates: PlayerState[] = positions.map(position => ({
      position: position as Position,
      status: 'active',
      stack: 1000,
      currentBet: 0,
      hasActed: false
    }));

    const newCommunityCards: {
      flop: [string, string, string] | null;
      turn: string | null;
      river: string | null;
    } = { flop: null, turn: null, river: null };

    // Start with blinds in the pot (SB: 2, BB: 5)
    let currentPot = 7; // Initial blinds (2 + 5)
    let currentBet = 5; // BB is the initial bet
    let currentRound: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' = 'preflop';

    // Set initial blind bets for SB and BB positions
    const sbPlayer = newPlayerStates.find(p => p.position === 'SB');
    const bbPlayer = newPlayerStates.find(p => p.position === 'BB');
    if (sbPlayer) sbPlayer.currentBet = 2;
    if (bbPlayer) bbPlayer.currentBet = 5;

    // Apply actions up to current index
    for (let i = 0; i <= currentActionIndex; i++) {
      const action = replayState.allActions[i];
      if (!action) continue;

      // Update current round
      currentRound = action.round as 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

      // Update player state
      const playerIndex = newPlayerStates.findIndex(p => p.position === action.position);
      if (playerIndex >= 0) {
        const player = newPlayerStates[playerIndex];

        switch (action.action) {
          case 'fold':
            player.status = 'folded';
            break;
          case 'check':
            player.hasActed = true;
            break;
          case 'call':
            const callAmount = action.amount || 0;
            const previousCallBet = player.currentBet;
            const additionalCall = callAmount - previousCallBet;
            player.currentBet = callAmount;
            player.hasActed = true;
            currentPot += additionalCall;
            break;
          case 'raise':
            const raiseAmount = action.amount || 0;
            const previousRaiseBet = player.currentBet;
            const additionalRaise = raiseAmount - previousRaiseBet;
            player.currentBet = raiseAmount;
            player.hasActed = true;
            currentBet = raiseAmount;
            currentPot += additionalRaise;
            // Reset hasActed for other players on raise
            newPlayerStates.forEach(p => {
              if (p.position !== action.position && p.status === 'active') {
                p.hasActed = false;
              }
            });
            break;
          case 'all-in':
            const allInAmount = action.amount || 0;
            const previousAllInBet = player.currentBet;
            const additionalAllIn = allInAmount - previousAllInBet;
            player.status = 'all-in';
            player.currentBet = allInAmount;
            player.hasActed = true;
            currentPot += additionalAllIn;
            break;
        }
      }
    }

    // Set community cards based on current round
    if (currentRound === 'flop' || currentRound === 'turn' || currentRound === 'river') {
      newCommunityCards.flop = trackedHand.communityCards.flop;
    }
    if (currentRound === 'turn' || currentRound === 'river') {
      newCommunityCards.turn = trackedHand.communityCards.turn;
    }
    if (currentRound === 'river') {
      newCommunityCards.river = trackedHand.communityCards.river;
    }

    setReplayState(prev => ({
      ...prev,
      playerStates: newPlayerStates,
      communityCards: newCommunityCards,
      currentPot,
      currentBet,
      currentRound
    }));
  }, [replayState.currentActionIndex, replayState.allActions, trackedHand.communityCards, trackedHand.tableSeats]);

  // Auto-play functionality
  useEffect(() => {
    if (!replayState.isPlaying) return;

    const timer = setTimeout(() => {
      if (replayState.currentActionIndex < replayState.allActions.length - 1) {
        setReplayState(prev => ({
          ...prev,
          currentActionIndex: prev.currentActionIndex + 1
        }));
      } else {
        // End of replay
        setReplayState(prev => ({ ...prev, isPlaying: false }));
      }
    }, replayState.playbackSpeed);

    return () => clearTimeout(timer);
  }, [replayState.isPlaying, replayState.currentActionIndex, replayState.playbackSpeed, replayState.allActions.length]);

  // Update game state based on current action
  useEffect(() => {
    updateGameState();
  }, [updateGameState]);

  // Auto-start replay when component mounts
  useEffect(() => {
    // Start playing automatically at 1x speed
    setReplayState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const handlePlayPause = () => {
    setReplayState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleReset = () => {
    setReplayState(prev => ({
      ...prev,
      currentActionIndex: -1,
      isPlaying: true // Auto-restart playing
    }));
  };

  const handleStepForward = () => {
    if (replayState.currentActionIndex < replayState.allActions.length - 1) {
      setReplayState(prev => ({
        ...prev,
        currentActionIndex: prev.currentActionIndex + 1,
        isPlaying: false
      }));
    }
  };

  const handleStepBackward = () => {
    if (replayState.currentActionIndex > -1) {
      setReplayState(prev => ({
        ...prev,
        currentActionIndex: prev.currentActionIndex - 1,
        isPlaying: false
      }));
    }
  };

  const getCurrentAction = () => {
    if (replayState.currentActionIndex >= 0 && replayState.currentActionIndex < replayState.allActions.length) {
      return replayState.allActions[replayState.currentActionIndex];
    }
    return null;
  };

  const currentAction = getCurrentAction();

  return (
    <div className="space-y-4">
      {/* Header with Close Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Hand Replay</h2>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close Replay
        </Button>
      </div>

      {/* Poker Table */}
      <Card>
        <CardContent className="p-6">
          <SimplePokerTable
            seats={trackedHand.tableSeats}
            userSeat={trackedHand.userSeat}
            playerStates={replayState.playerStates}
            communityCards={replayState.communityCards}
            showCommunityCards={true}
            potSize={replayState.currentPot}
            nextToAct={undefined} // Don't show next to act during replay
            currentBettingRound={{
              actions: [],
              currentBet: replayState.currentBet
            }}
            currentBettingRoundName={replayState.currentRound}
          />
        </CardContent>
      </Card>


      {/* Replay Controls */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Current Action Display */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">
              Round: <span className="font-semibold capitalize">{replayState.currentRound}</span>
              {currentAction && (
                <span className="ml-4">
                  Action: <span className="font-semibold">
                    {currentAction.position === trackedHand.userSeat ? 'Hero' : currentAction.position} {currentAction.action}
                    {currentAction.amount && ` $${currentAction.amount}`}
                  </span>
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Action {Math.max(0, replayState.currentActionIndex + 1)} of {replayState.allActions.length}
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex justify-center items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={replayState.currentActionIndex === -1}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleStepBackward}
              disabled={replayState.currentActionIndex === -1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayPause}
            >
              {replayState.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleStepForward}
              disabled={replayState.currentActionIndex >= replayState.allActions.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setReplayState(prev => ({
                ...prev,
                currentActionIndex: prev.allActions.length - 1,
                isPlaying: false
              }))}
              disabled={replayState.currentActionIndex >= replayState.allActions.length - 1}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Speed Control */}
          <div className="flex justify-center items-center gap-2">
            <span className="text-sm text-gray-600">Speed:</span>
            {[0.5, 1, 2].map(speed => (
              <Button
                key={speed}
                variant={replayState.playbackSpeed === 1000 / speed ? "default" : "outline"}
                size="sm"
                onClick={() => setReplayState(prev => ({ ...prev, playbackSpeed: 1000 / speed }))}
              >
                {speed}x
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hand History Action Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hand History</CardTitle>
        </CardHeader>
        <CardContent>
          <HandHistory
            completedHands={[trackedHand]}
            userSeat={trackedHand.userSeat}
            defaultExpanded={true}
            hideShareButtons={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}