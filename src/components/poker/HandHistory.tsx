'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Share2, Trash2, Copy, ExternalLink } from 'lucide-react';
import { CurrentHand, StoredHand, Position } from '@/types/poker-v2';
import { SharedHandService } from '@/services/shared-hand.service';
import { SessionService } from '@/services/session.service';
import { URLShareService } from '@/services/url-share.service';
import { useParams } from 'next/navigation';

interface HandHistoryProps {
  currentHand?: CurrentHand | null;
  completedHands: StoredHand[];
  userSeat?: Position;
  className?: string;
  defaultExpanded?: boolean;
  hideShareButtons?: boolean;
}

export function HandHistory({
  currentHand,
  completedHands = [],
  userSeat,
  className,
  defaultExpanded = false,
  hideShareButtons = false
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
  const [sharedHands, setSharedHands] = useState<Set<number>>(new Set());
  const [copiedHandId, setCopiedHandId] = useState<number | null>(null);
  const params = useParams();
  const sessionId = params?.id as string;

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
      case 'check': return 'X';
      case 'call': return amount ? `C:${amount}` : 'C';
      case 'raise': return amount ? `R:${amount}` : 'R';
      case 'all-in': return amount ? `A:${amount}` : 'A';
      default: return action;
    }
  };

  // Helper function to format position
  const formatPosition = (position: Position) => {
    if (position === userSeat) return `Hero`;
    return position;
  };


  // Handle share button click - now uses URL sharing for universal access
  const handleShare = async (hand: StoredHand, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!sessionId) return;

    const sessionMetadata = SessionService.getSessionMetadata(sessionId);
    if (!sessionMetadata) return;

    // Generate URL-based share link (works for everyone, no local storage needed)
    const username = SharedHandService.getCurrentUsername();
    const shareUrl = URLShareService.generateShareableURL(hand, {
      ...sessionMetadata,
      username
    });

    // Also save locally for the "Shared" list (local only)
    const isLocallyShared = SharedHandService.isHandShared(sessionId, hand.handNumber);

    if (!isLocallyShared) {
      SharedHandService.shareHand(hand, sessionId, sessionMetadata);
      setSharedHands(prev => {
        const newShared = new Set(prev);
        newShared.add(hand.handNumber);
        return newShared;
      });
    }

    // Copy to clipboard silently (no message needed as requested)
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        // Silently handle clipboard errors
      }
    }
  };

  // Handle unshare (local only)
  const handleUnshare = async (hand: StoredHand, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!sessionId) return;

    const handId = SharedHandService.generateHandId(sessionId, hand.handNumber);
    if (SharedHandService.unshareHand(handId)) {
      setSharedHands(prev => {
        const newShared = new Set(prev);
        newShared.delete(hand.handNumber);
        return newShared;
      });
      // Hand removed silently (no message needed as requested)
    }
  };

  // Handle create link (just copy URL without sharing locally)
  const handleCreateLink = async (hand: StoredHand, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!sessionId) return;

    const sessionMetadata = SessionService.getSessionMetadata(sessionId);
    if (!sessionMetadata) return;

    const username = SharedHandService.getCurrentUsername();
    const shareUrl = URLShareService.generateShareableURL(hand, {
      ...sessionMetadata,
      username
    });

    // Copy to clipboard with feedback
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedHandId(hand.handNumber);
        setTimeout(() => setCopiedHandId(null), 2000);
      } catch {
        // Silently handle clipboard errors
      }
    }
  };

  // Handle open link in new tab
  const handleOpenLink = (hand: StoredHand, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!sessionId) return;

    const sessionMetadata = SessionService.getSessionMetadata(sessionId);
    if (!sessionMetadata) return;

    const username = SharedHandService.getCurrentUsername();
    const shareUrl = URLShareService.generateShareableURL(hand, {
      ...sessionMetadata,
      username
    });

    window.open(shareUrl, '_blank');
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
  const renderActionLog = (hand: CurrentHand | StoredHand) => {
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
          const actionGroups = groupActionsForDisplay(roundActions, userSeat);
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
                          action.position === userSeat ? "text-blue-600" : "text-gray-700"
                        )}>
                          {formatPosition(action.position)}
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
              <div className="w-24 flex flex-col items-center justify-center">
                <button
                  className="flex flex-col items-center justify-center w-full bg-gray-50 hover:bg-gray-100 rounded-md transition-colors py-2"
                  onClick={() => {
                    const newExpanded = new Set(expandedHands);
                    if (isExpanded) {
                      newExpanded.delete(handNumber);
                    } else {
                      newExpanded.add(handNumber);
                    }
                    setExpandedHands(newExpanded);
                  }}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-5 w-5 text-blue-600 mb-1" />
                      <span className="text-xs text-gray-600 text-center">
                        Hide Details
                      </span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-5 w-5 text-gray-600 mb-1" />
                      <span className="text-xs text-gray-600 text-center">
                        Show Details
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-4">
              {/* Left Column: Action Buttons (3/4 width) */}
              <div className="flex-1">
                {'result' in hand && (
                  <>
                    {sharedHands.has(hand.handNumber) || SharedHandService.isHandShared(sessionId, hand.handNumber) ? (
                      /* Show Unshare, Copy Link, Open Link when hand is shared */
                      <div className="space-y-2">
                        <button
                          onClick={(e) => handleUnshare(hand as StoredHand, e)}
                          className="flex items-center justify-center gap-2 px-3 py-3 rounded-md bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 transition-all text-xs h-12 w-full"
                          title="Remove from your shared list"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Unshare</span>
                        </button>

                        <button
                          onClick={(e) => handleCreateLink(hand as StoredHand, e)}
                          className={cn(
                            "flex items-center justify-center gap-2 px-3 py-3 rounded-md border transition-all text-xs h-12 w-full",
                            copiedHandId === hand.handNumber
                              ? "bg-green-50 border-green-200 text-green-700"
                              : "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                          )}
                          title="Copy share link to clipboard"
                        >
                          <Copy className="h-3 w-3" />
                          <span>{copiedHandId === hand.handNumber ? 'Copied!' : 'Copy Link'}</span>
                        </button>

                        <button
                          onClick={(e) => handleOpenLink(hand as StoredHand, e)}
                          className="flex items-center justify-center gap-2 px-3 py-3 rounded-md bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 transition-all text-xs h-12 w-full"
                          title="Open hand in shared view"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Open</span>
                        </button>
                      </div>
                    ) : (
                      /* Show Share Hand when hand is not shared */
                      <div className="space-y-2">
                        <button
                          onClick={(e) => handleShare(hand as StoredHand, e)}
                          className="flex flex-col items-center justify-center px-3 py-2 rounded-md bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 transition-all text-xs h-12 w-full"
                          title="Share hand for review and feedback"
                        >
                          <div className="flex items-center gap-1">
                            <Share2 className="h-3 w-3" />
                            <span>Share Hand</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">Visible to All</div>
                        </button>

                        <button
                          onClick={(e) => handleCreateLink(hand as StoredHand, e)}
                          className={cn(
                            "flex items-center justify-center gap-2 px-3 py-3 rounded-md border transition-all text-xs h-12 w-full",
                            copiedHandId === hand.handNumber
                              ? "bg-green-50 border-green-200 text-green-700"
                              : "bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                          )}
                          title="Copy share link to clipboard"
                        >
                          <Copy className="h-3 w-3" />
                          <span>{copiedHandId === hand.handNumber ? 'Copied!' : 'Copy Link'}</span>
                        </button>

                        <button
                          onClick={(e) => handleOpenLink(hand as StoredHand, e)}
                          className="flex items-center justify-center gap-2 px-3 py-3 rounded-md bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 transition-all text-xs h-12 w-full"
                          title="Open hand in shared view"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Open Link</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="w-px bg-gray-200"></div>

              {/* Right Column: Dropdown Toggle (1/4 width) */}
              <div className="w-24 flex flex-col items-center justify-center">
                <button
                  className="flex flex-col items-center justify-center w-full bg-gray-50 hover:bg-gray-100 rounded-md transition-colors py-2"
                  onClick={() => {
                    const newExpanded = new Set(expandedHands);
                    if (isExpanded) {
                      newExpanded.delete(handNumber);
                    } else {
                      newExpanded.add(handNumber);
                    }
                    setExpandedHands(newExpanded);
                  }}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-5 w-5 text-blue-600 mb-1" />
                      <span className="text-xs text-gray-600 text-center">
                        Hide Details
                      </span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-5 w-5 text-gray-600 mb-1" />
                      <span className="text-xs text-gray-600 text-center">
                        Show Details
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Expandable Action Log */}
        {isExpanded && (
          <div className="border-t px-4 pb-4 pt-3">
            {renderActionLog(hand)}
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
