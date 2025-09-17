'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimplePokerTable } from '@/components/poker/SimplePokerTable';
import { SessionService } from '@/services/session.service';
import { SessionMetadata, CurrentHand, Position, RANKS, SUITS } from '@/types/poker-v2';

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionMetadata | null>(null);
  const [currentHand, setCurrentHand] = useState<CurrentHand | null>(null);
  const [selectedCard1, setSelectedCard1] = useState<string | null>(null);
  const [selectedCard2, setSelectedCard2] = useState<string | null>(null);
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [selectingCard, setSelectingCard] = useState<1 | 2>(1);
  const [showRankSelector, setShowRankSelector] = useState(true);
  const [selectedRank, setSelectedRank] = useState<string | null>(null);
  // Hand settings
  const [stack, setStack] = useState<number>(1000);
  const [smallBlind, setSmallBlind] = useState<number>(10);
  const [bigBlind, setBigBlind] = useState<number>(20);
  const [ante, setAnte] = useState<number>(0);

  useEffect(() => {
    // Load session
    const loadSession = () => {
      const metadata = SessionService.getCurrentSession();
      if (!metadata || metadata.sessionId !== sessionId) {
        // Try to load from session list
        const sessions = SessionService.getSessionList();
        const found = sessions.find(s => s.sessionId === sessionId);
        if (found) {
          setSession(found);
          // Set as active if not completed
          if (found.status === 'active') {
            SessionService.setActiveSession(found.sessionId);
          }
        } else {
          router.push('/');
        }
      } else {
        setSession(metadata);
      }
    };

    loadSession();
  }, [sessionId, router]);

  // Auto-start Hand 1 when session loads
  useEffect(() => {
    if (session && !currentHand) {
      startNewHand();
      // Initialize stack from session
      setStack(session.currentStack || session.buyIn || 1000);
    }
  }, [session]);

  const startNewHand = () => {
    if (!session) return;

    const handNumber = SessionService.getCurrentHandNumber();
    const newHand: CurrentHand = {
      handNumber,
      userCards: null,
      communityCards: {
        flop: null,
        turn: null,
        river: null
      },
      currentBettingRound: 'preflop',
      currentBet: 0,
      pot: 0,
      actions: [],
      activePlayers: session.tableSeats === 6
        ? ['BTN', 'SB', 'BB', 'UTG', 'LJ', 'CO']
        : ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO']
    };

    setCurrentHand(newHand);
    setSelectedCard1(null);
    setSelectedCard2(null);
    // Don't auto-show card selector - let user click on card buttons
  };

  const handleRankSelect = (rank: string) => {
    setSelectedRank(rank);
    // Keep rank selector visible - suit cards will slide in above
  };

  const handleSuitSelect = (suit: string) => {
    const card = `${selectedRank}${suit}`;

    if (selectingCard === 1) {
      setSelectedCard1(card);
      // Update current hand immediately for card 1
      if (currentHand) {
        setCurrentHand({
          ...currentHand,
          userCards: [card, selectedCard2] as [string, string] | null
        });
      }
    } else {
      setSelectedCard2(card);
      // Update current hand with both cards
      if (currentHand) {
        setCurrentHand({
          ...currentHand,
          userCards: [selectedCard1!, card] as [string, string]
        });
      }
    }

    // Reset states
    setShowCardSelector(false);
    setShowRankSelector(true);
    setSelectedRank(null);
  };

  const endSession = () => {
    SessionService.endCurrentSession();
    router.push('/');
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="p-1 flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-base font-semibold truncate">{session.sessionName}</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={endSession}
            className="text-red-600 text-sm px-3 py-1.5 flex-shrink-0 font-medium"
          >
            End Session
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 max-w-lg mx-auto">
        {/* Hand Info - Top */}
        {currentHand && (
          <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <div className="text-center mb-3">
              <h2 className="text-lg font-semibold">Hand #{currentHand.handNumber}</h2>
              <p className="text-sm font-semibold text-blue-600 capitalize">{currentHand.currentBettingRound}</p>
            </div>

            {/* Stack and Blinds */}
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1 text-center">Stack</label>
                <input
                  type="number"
                  value={stack}
                  onChange={(e) => setStack(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-sm border rounded text-center"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 text-center">SB</label>
                <input
                  type="number"
                  value={smallBlind}
                  onChange={(e) => setSmallBlind(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-sm border rounded text-center"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 text-center">BB</label>
                <input
                  type="number"
                  value={bigBlind}
                  onChange={(e) => setBigBlind(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-sm border rounded text-center"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 text-center">Ante</label>
                <input
                  type="number"
                  value={ante}
                  onChange={(e) => setAnte(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-sm border rounded text-center"
                />
              </div>
            </div>
          </div>
        )}

        {/* Table Display */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <SimplePokerTable
            seats={session.tableSeats}
            userSeat={session.userSeat}
            userCards={currentHand?.userCards || null}
            onCardClick={(cardIndex) => {
              setSelectingCard(cardIndex);
              setShowRankSelector(true);
              setSelectedRank(null);
              setShowCardSelector(true);
            }}
            showCardButtons={!!currentHand}
          />
        </div>

        {/* Inline Card Selector */}
        {showCardSelector && (
          <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <h3 className="text-md font-semibold mb-3 text-center">
              Select Card {selectingCard}
            </h3>

            {/* Suit Selection Container - Always present but only shows cards when rank selected */}
            <div className="mb-4 min-h-[60px]">
              {selectedRank && (
                <div className="grid grid-cols-4 gap-2">
                  {SUITS.map((suit, index) => {
                    const card = `${selectedRank}${suit}`;
                    const isSelected = card === selectedCard1 || card === selectedCard2;
                    return (
                      <button
                        key={suit}
                        onClick={() => !isSelected && handleSuitSelect(suit)}
                        disabled={isSelected}
                        style={{ animationDelay: `${index * 40}ms` }}
                        className={`card-slide-in
                          p-3 text-xl font-bold rounded border-2 transition-all flex items-center justify-center
                          ${isSelected
                            ? 'bg-gray-200 border-gray-400 opacity-50 cursor-not-allowed'
                            : 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                          }
                          ${suit === '♥' || suit === '♦' ? 'text-red-600' : 'text-gray-800'}
                        `}
                      >
                        {selectedRank}{suit}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Rank Selection - Always visible */}
            <div>
              <div className="grid grid-cols-7 gap-2">
                {RANKS.map(rank => (
                  <button
                    key={rank}
                    onClick={() => handleRankSelect(rank)}
                    className={`
                      p-2 text-sm font-bold rounded border-2 transition-all
                      ${rank === selectedRank
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                      }
                    `}
                  >
                    {rank}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCardSelector(false);
                  setShowRankSelector(true);
                  setSelectedRank(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {currentHand && !showCardSelector && (
          <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <h3 className="text-md font-semibold mb-3 text-center">Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                Fold
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Call
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Raise
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                All-In
              </Button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}