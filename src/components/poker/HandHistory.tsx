'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Share2, Users } from 'lucide-react';
import { CurrentHand, StoredHand, Position } from '@/types/poker-v2';
import { TrackedHandService } from '@/services/tracked-hand.service';
import { SessionService } from '@/services/session.service';
import { useParams } from 'next/navigation';

interface HandHistoryProps {
  currentHand?: CurrentHand | null;
  completedHands: StoredHand[];
  userSeat?: Position;
  className?: string;
  defaultExpanded?: boolean;
  hideShareButtons?: boolean;
  showCustomShareInTracked?: boolean;
}

export function HandHistory({
  currentHand,
  completedHands = [],
  userSeat,
  className,
  defaultExpanded = false,
  hideShareButtons = false,
  showCustomShareInTracked = false
}: HandHistoryProps) {
  const [expandedHands, setExpandedHands] = useState<Set<number>>(() => {
    if (defaultExpanded) {
      // Initialize with all hand numbers expanded
      const allHandNumbers = new Set<number>();
      if (currentHand) allHandNumbers.add(currentHand.handNumber);
      completedHands.forEach(hand => allHandNumbers.add(hand.handNumber));
      return allHandNumbers;
    }
    return new Set();
  });
  const [copiedHandId, setCopiedHandId] = useState<number | null>(null);
  const [trackedHandId, setTrackedHandId] = useState<number | null>(null);
  const [trackedHands, setTrackedHands] = useState<Set<string>>(new Set());
  const params = useParams();
  const sessionId = params?.id as string;

  // Load tracked status on mount
  React.useEffect(() => {
    if (!sessionId) return;

    const tracked = new Set<string>();
    completedHands.forEach(hand => {
      if (TrackedHandService.isHandTracked(sessionId, hand.handNumber)) {
        tracked.add(`${sessionId}_${hand.handNumber}`);
      }
    });
    setTrackedHands(tracked);
  }, [sessionId, completedHands]);

  // Helper function to get card color
  const getCardColor = (card: string) => {
    if (!card || card === '?') return 'text-gray-800';
    const suit = card.slice(-1);
    return suit === '♥' || suit === '♦' ? 'text-red-600' : 'text-gray-800';
  };

  // Helper function to format action concisely
  const formatActionConcise = (action: string, amount?: number) => {
    switch (action) {
      case 'fold': return 'F';
      case 'check': return 'CHK';
      case 'call': return amount ? `C:${amount}` : 'C';
      case 'raise': return amount ? `R:${amount}` : 'R';
      case 'all-in': return amount ? `A:${amount}` : 'A';
      default: return action;
    }
  };

  // Helper function to format position
  const formatPosition = (position: Position, includeOriginalPosition: boolean = false, handUserSeat?: Position) => {
    const effectiveUserSeat = handUserSeat || userSeat;
    if (position === effectiveUserSeat) {
      return includeOriginalPosition ? `Hero (${position})` : 'Hero';
    }
    return position;
  };



  // Handle track - saves the hand for offline viewing
  const handleTrack = async (hand: StoredHand, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!sessionId) return;

    // Get session metadata
    const sessionMetadata = SessionService.getSessionMetadata(sessionId);
    if (!sessionMetadata) return;

    const handKey = `${sessionId}_${hand.handNumber}`;
    const isCurrentlyTracked = trackedHands.has(handKey);

    if (isCurrentlyTracked) {
      // Remove from tracked
      const removed = TrackedHandService.removeTrackedHand(sessionId, hand.handNumber);

      if (removed) {
        const newTracked = new Set(trackedHands);
        newTracked.delete(handKey);
        setTrackedHands(newTracked);
      }
    } else {
      // Track the hand
      const success = TrackedHandService.trackHand(
        hand,
        sessionId,
        sessionMetadata.sessionName,
        hand.userSeat || sessionMetadata.userSeat,
        sessionMetadata.tableSeats
      );

      if (success) {
        const newTracked = new Set(trackedHands);
        newTracked.add(handKey);
        setTrackedHands(newTracked);

        // Show visual feedback
        setTrackedHandId(hand.handNumber);
        setTimeout(() => setTrackedHandId(null), 2000);
      }
    }
  };

  // Handle share - shares the hand publicly
  const handleShare = async (hand: StoredHand, e: React.MouseEvent) => {
    e.stopPropagation();

    // TODO: Implement share functionality
    // For now, just show visual feedback
    setCopiedHandId(hand.handNumber);
    setTimeout(() => setCopiedHandId(null), 2000);
  };

  // Group actions for better display readability
  const groupActionsForDisplay = (actions: Array<{ position: Position; action: string; amount?: number }>, userSeat?: Position) => {
    const groups: Array<Array<{ position: Position; action: string; amount?: number }>> = [];
    let currentGroup: Array<{ position: Position; action: string; amount?: number }> = [];

    actions.forEach((action, index) => {
      const isSignificantAction = action.action === 'raise' || action.action === 'all-in' || action.position === userSeat;
      const isFirstAction = index === 0;
      const prevAction = index > 0 ? actions[index - 1] : null;
      const prevWasSignificant = prevAction && (prevAction.action === 'raise' || prevAction.action === 'all-in' || prevAction.position === userSeat);

      // Start a new group if:
      // 1. This is a significant action (raise, all-in, or hero action)
      // 2. Previous action was significant (so this starts on a new line)
      // 3. This is the first action
      if (isSignificantAction || prevWasSignificant || isFirstAction) {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
          currentGroup = [];
        }
      }

      currentGroup.push(action);

      // If this is significant, close the group so next action starts a new line
      if (isSignificantAction) {
        groups.push([...currentGroup]);
        currentGroup = [];
      }
    });

    // Add remaining actions to final group
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  // Render action log for a hand
  const renderActionLog = (hand: CurrentHand | StoredHand, handUserSeat?: Position) => {
    const actions: Array<{ round: string; position: Position; action: string; amount?: number }> = [];

    // Collect all actions
    ['preflop', 'flop', 'turn', 'river'].forEach(round => {
      const bettingRound = hand.bettingRounds[round as keyof typeof hand.bettingRounds];
      if (bettingRound?.actions) {
        bettingRound.actions.forEach(action => {
          actions.push({ round: round.charAt(0).toUpperCase() + round.slice(1), ...action });
        });
      }
    });


    // Group actions by round and format concisely
    const roundGroups: Record<string, Array<{ position: Position; action: string; amount?: number }>> = {};
    actions.forEach(action => {
      if (!roundGroups[action.round]) {
        roundGroups[action.round] = [];
      }
      roundGroups[action.round].push(action);
    });

    // If no actions found, show a message
    if (actions.length === 0) {
      return (
        <div className="space-y-4 p-4 bg-gray-50 rounded-md mt-2">
          <div className="text-sm text-gray-500 italic">
            No betting actions recorded for this hand
          </div>
        </div>
      );
    }

    // Helper to get community cards for a specific round
    const getCommunityCardsForRound = (round: string) => {
      const cards: string[] = [];

      if (round === 'Preflop') {
        // No community cards for preflop
        return null;
      } else if (round === 'Flop') {
        if (hand.communityCards?.flop) {
          cards.push(...hand.communityCards.flop.filter(card => card));
        }
      } else if (round === 'Turn') {
        if (hand.communityCards?.flop) {
          cards.push(...hand.communityCards.flop.filter(card => card));
        }
        if (hand.communityCards?.turn) {
          cards.push(hand.communityCards.turn);
        }
      } else if (round === 'River') {
        if (hand.communityCards?.flop) {
          cards.push(...hand.communityCards.flop.filter(card => card));
        }
        if (hand.communityCards?.turn) {
          cards.push(hand.communityCards.turn);
        }
        if (hand.communityCards?.river) {
          cards.push(hand.communityCards.river);
        }
      }

      return cards.length > 0 ? cards : null;
    };

    return (
      <div className="space-y-4 p-4 bg-gray-50 rounded-md mt-2">
        {Object.entries(roundGroups).map(([round, roundActions]) => {
          // Group actions intelligently for better readability
          const actionGroups = groupActionsForDisplay(roundActions, handUserSeat || userSeat);
          const communityCards = getCommunityCardsForRound(round);

          return (
            <div key={round}>
              {/* Show community cards for this round */}
              {communityCards ? (
                <div className="mb-3">
                  <div className="text-base font-semibold text-gray-700 mb-2">
                    {round}:
                  </div>
                  <div className="flex gap-1">
                    {communityCards.map((card, i) => (
                      <span key={`${round}-${i}`} className={cn("text-base font-bold px-2 py-1 bg-white border rounded", getCardColor(card))}>
                        {card}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-base font-semibold text-gray-700 mb-2">{round}:</div>
              )}

              {/* Show actions for this round */}
              <div className="space-y-2">
                {actionGroups.map((group, groupIdx) => (
                  <div key={groupIdx} className="flex flex-wrap gap-3">
                    {group.map((action, idx) => (
                      <span key={idx} className="text-sm font-medium">
                        <span className={cn(
                          action.position === (handUserSeat || userSeat) ? "text-blue-600" : "text-gray-700"
                        )}>
                          {formatPosition(action.position, true, handUserSeat)}
                        </span>
                        <span className={cn(
                          "ml-1",
                          action.action === 'fold' ? 'text-red-600' :
                          action.action === 'check' ? 'text-gray-600' :
                          action.action === 'call' ? 'text-blue-600' :
                          action.action === 'raise' ? 'text-green-600' :
                          action.action === 'all-in' ? 'text-purple-600' :
                          'text-gray-600'
                        )}>
                          {formatActionConcise(action.action, action.amount)}
                        </span>
                        {idx < group.length - 1 && <span className="text-gray-400 ml-1">•</span>}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Opponent Cards if available (shown at showdown) */}
        {'result' in hand && hand.result.opponentCards && Object.keys(hand.result.opponentCards).length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-sm font-semibold text-gray-600 mb-2">Showdown Cards:</div>
            <div className="space-y-2">
              {Object.entries(hand.result.opponentCards).map(([position, cards]) =>
                cards && (
                  <div key={position} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">{position}:</span>
                    <div className="flex gap-1">
                      <span className={cn("text-sm font-bold px-1 py-0.5 bg-white border rounded", getCardColor(cards[0]))}>
                        {cards[0]}
                      </span>
                      <span className={cn("text-sm font-bold px-1 py-0.5 bg-white border rounded", getCardColor(cards[1]))}>
                        {cards[1]}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render a single hand entry
  const renderHand = (hand: CurrentHand | StoredHand, isCurrent: boolean = false) => {
    const handNumber = hand.handNumber;
    const isExpanded = expandedHands.has(handNumber);
    const hasCards = hand.userCards && hand.userCards[0] && hand.userCards[1];
    const outcome = 'result' in hand ? hand.result.handOutcome : null;
    const potWon = 'result' in hand ? hand.result.potWon : null;
    const handKey = `${sessionId}_${handNumber}`;
    const isTracked = trackedHands.has(handKey);

    // Use the hand's stored userSeat for completed hands, fallback to current userSeat for current hands
    const handUserSeat = 'userSeat' in hand ? hand.userSeat : userSeat;

    return (
      <div key={handNumber} className="border rounded-lg bg-white shadow-sm overflow-hidden">
        {/* Row 1: Hand info, cards, outcome, amount */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Hand Number */}
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base">
                  Hand #{handNumber}
                </span>
                {isCurrent && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Current
                  </span>
                )}
              </div>

              {/* User Cards */}
              {hasCards ? (
                <div className="flex gap-1">
                  <span className={cn("text-sm font-bold px-2 py-1 bg-white border rounded", getCardColor(hand.userCards![0]))}>
                    {hand.userCards![0]}
                  </span>
                  <span className={cn("text-sm font-bold px-2 py-1 bg-white border rounded", getCardColor(hand.userCards![1]))}>
                    {hand.userCards![1]}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-gray-500 italic">No cards</span>
              )}
            </div>

            {/* Outcome with Amount - Right Side */}
            {outcome && (
              <span className={cn(
                "text-sm font-medium px-3 py-1 rounded",
                outcome === 'won' ? 'bg-green-100 text-green-700' :
                outcome === 'lost' ? 'bg-red-100 text-red-700' :
                outcome === 'folded' ? 'bg-gray-100 text-gray-700' :
                'bg-yellow-100 text-yellow-700'
              )}>
                {outcome === 'won' ? `Won ${potWon || 0}` :
                 outcome === 'lost' ? `Lost ${potWon || 0}` :
                 outcome === 'folded' ? 'Folded' :
                 'Chopped'}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Buttons and Dropdown */}
        <div className="p-4">
          {hideShareButtons ? (
            /* When share buttons are hidden, show only the toggle button centered */
            <div className="flex justify-center">
              <button
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  isExpanded
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                )}
                onClick={() => {
                  const newExpanded = new Set(expandedHands);
                  if (isExpanded) {
                    newExpanded.delete(handNumber);
                  } else {
                    newExpanded.add(handNumber);
                  }
                  setExpandedHands(newExpanded);
                }}
                title={isExpanded ? "Hide details" : "Show details"}
              >
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>
          ) : showCustomShareInTracked ? (
            /* Custom layout for tracked page: Share button on left, dropdown on right */
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  // TODO: Implement share functionality
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm h-10"
                title="Share this hand"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>

              <button
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  isExpanded
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                )}
                onClick={() => {
                  const newExpanded = new Set(expandedHands);
                  if (isExpanded) {
                    newExpanded.delete(handNumber);
                  } else {
                    newExpanded.add(handNumber);
                  }
                  setExpandedHands(newExpanded);
                }}
                title={isExpanded ? "Hide details" : "Show details"}
              >
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              {/* Left Column: Action Buttons (3/4 width) */}
              <div className="flex-1 space-y-2">
                {'result' in hand && (
                  <>
                    {/* Track Button */}
                    <button
                      onClick={(e) => handleTrack(hand as StoredHand, e)}
                      className={cn(
                        "flex items-center justify-center gap-2 px-3 py-3 rounded-md transition-all text-sm h-12 w-full border",
                        isTracked
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                          : trackedHandId === hand.handNumber
                          ? "bg-green-50 border-green-300 text-green-700"
                          : "bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
                      )}
                      title={isTracked ? "Remove from tracked hands" : "Track this hand for offline viewing"}
                    >
                      {trackedHandId === hand.handNumber ? (
                        <>
                          <Share2 className="h-4 w-4" />
                          <span>Tracked!</span>
                        </>
                      ) : isTracked ? (
                        <>
                          <Share2 className="h-4 w-4" />
                          <span>Tracked</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="h-4 w-4" />
                          <span>Track</span>
                        </>
                      )}
                    </button>

                    {/* Share Button */}
                    <button
                      onClick={(e) => handleShare(hand as StoredHand, e)}
                      className={cn(
                        "flex items-center justify-center gap-2 px-3 py-3 rounded-md transition-all text-sm h-12 w-full border",
                        copiedHandId === hand.handNumber
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
                      )}
                      title="Share this hand publicly"
                    >
                      {copiedHandId === hand.handNumber ? (
                        <>
                          <Users className="h-4 w-4" />
                          <span>Shared!</span>
                        </>
                      ) : (
                        <>
                          <Users className="h-4 w-4" />
                          <span>Share</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="w-px bg-gray-200"></div>

              {/* Right Column: Dropdown Toggle (1/4 width) */}
              <div className="w-24 flex items-center justify-center">
                <button
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isExpanded
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  )}
                  onClick={() => {
                    const newExpanded = new Set(expandedHands);
                    if (isExpanded) {
                      newExpanded.delete(handNumber);
                    } else {
                      newExpanded.add(handNumber);
                    }
                    setExpandedHands(newExpanded);
                  }}
                  title={isExpanded ? "Hide details" : "Show details"}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Expandable Action Log */}
        {isExpanded && (
          <div className="border-t px-4 pb-4 pt-3">
            {renderActionLog(hand, handUserSeat)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Current Hand */}
      {currentHand && renderHand(currentHand, true)}

      {/* Completed Hands */}
      {completedHands
        .sort((a, b) => b.handNumber - a.handNumber)
        .map(hand => renderHand(hand, false))}

      {/* Empty State */}
      {!currentHand && completedHands.length === 0 && (
        <div className="text-sm text-gray-500 italic p-4 text-center">
          No hands played yet
        </div>
      )}
    </div>
  );
}
