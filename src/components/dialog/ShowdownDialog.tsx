'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CardSelector } from '@/components/poker/CardSelector';
import { CurrentHand, Position } from '@/types/poker-v2';

interface ShowdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentHand: CurrentHand | null;
  userSeat?: Position;
  selectedCard1?: string | null;
  selectedCard2?: string | null;
  opponentCards: Record<Position, [string, string] | null>;
  heroMoneyInvested: number;
  inlineCardSelection: {
    show: boolean;
    position: Position | null;
    cardIndex: number;
    title: string;
  };
  onInlineCardSelect: (card: string) => void;
  onSetInlineCardSelection: (selection: { show: boolean; position: Position | null; cardIndex: number; title: string }) => void;
  onCompleteHandWon: () => void;
  onCompleteHandLost: () => void;
  getDialogClasses: (classes: string) => string;
}

export function ShowdownDialog({
  open,
  onOpenChange,
  currentHand,
  userSeat,
  selectedCard1,
  selectedCard2,
  opponentCards,
  heroMoneyInvested,
  inlineCardSelection,
  onInlineCardSelect,
  onSetInlineCardSelection,
  onCompleteHandWon,
  onCompleteHandLost,
  getDialogClasses
}: ShowdownDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getDialogClasses("sm:max-w-[500px] max-w-[95vw] w-full")}>
        <DialogHeader>
          <DialogTitle>Showdown</DialogTitle>
          <DialogDescription>
            Select your cards and the outcome
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 mt-4 max-h-80 overflow-y-auto">
          <div className="text-center">
            <div className="text-lg font-medium text-gray-700">
              Pot Size: {currentHand?.pot || 0}
            </div>
          </div>

          {/* Hero Cards Section - Always show */}
          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="font-medium mb-3 text-blue-800">
              Your Hole Cards (Required for showdown)
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  onSetInlineCardSelection({
                    show: true,
                    position: userSeat || null,
                    cardIndex: 1,
                    title: 'Select Your Card 1'
                  });
                }}
                className={`w-12 h-16 rounded-lg border-2 text-sm font-bold flex items-center justify-center transition-all hover:scale-105 shadow-md ${
                  currentHand?.userCards?.[0]
                    ? `bg-white border-gray-800 ${
                        currentHand.userCards[0].includes('♥') || currentHand.userCards[0].includes('♦')
                          ? 'text-red-600'
                          : 'text-gray-800'
                      }`
                    : 'bg-gray-100 border-gray-400 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {currentHand?.userCards?.[0] || '?'}
              </button>
              <button
                onClick={() => {
                  onSetInlineCardSelection({
                    show: true,
                    position: userSeat || null,
                    cardIndex: 2,
                    title: 'Select Your Card 2'
                  });
                }}
                className={`w-12 h-16 rounded-lg border-2 text-sm font-bold flex items-center justify-center transition-all hover:scale-105 shadow-md ${
                  currentHand?.userCards?.[1]
                    ? `bg-white border-gray-800 ${
                        currentHand.userCards[1].includes('♥') || currentHand.userCards[1].includes('♦')
                          ? 'text-red-600'
                          : 'text-gray-800'
                      }`
                    : 'bg-gray-100 border-gray-400 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {currentHand?.userCards?.[1] || '?'}
              </button>
            </div>
          </div>

          {/* Opponent Cards Section - Show all active opponents */}
          {currentHand?.playerStates &&
            currentHand.playerStates.filter(p => p.status === 'active' && p.position !== userSeat)
            .length > 0 && (
            <div className="border rounded-lg p-4">
              <div className="font-medium mb-3 text-gray-700">
                Opponent Cards (Optional)
              </div>
              <div className="text-xs text-gray-600 mb-3">
                Add any cards that were revealed during showdown
              </div>
              <div className="grid gap-3">
                {currentHand?.playerStates &&
                  currentHand.playerStates.filter(p => p.status === 'active' && p.position !== userSeat)
                  .map(player => (
                    <div key={player.position} className="border rounded p-3 bg-gray-50">
                      <div className="font-medium mb-2 text-sm">{player.position}</div>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => {
                            onSetInlineCardSelection({
                              show: true,
                              position: player.position,
                              cardIndex: 1,
                              title: `Select ${player.position} Card 1`
                            });
                          }}
                          className={`w-10 h-14 rounded border-2 text-xs font-bold flex items-center justify-center transition-all hover:scale-105 shadow-sm ${
                            opponentCards[player.position]?.[0]
                              ? `bg-white border-gray-700 ${
                                  opponentCards[player.position]![0].includes('♥') || opponentCards[player.position]![0].includes('♦')
                                    ? 'text-red-600'
                                    : 'text-gray-800'
                                }`
                              : 'bg-gray-100 border-gray-400 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {opponentCards[player.position]?.[0] || '?'}
                        </button>
                        <button
                          onClick={() => {
                            onSetInlineCardSelection({
                              show: true,
                              position: player.position,
                              cardIndex: 2,
                              title: `Select ${player.position} Card 2`
                            });
                          }}
                          className={`w-10 h-14 rounded border-2 text-xs font-bold flex items-center justify-center transition-all hover:scale-105 shadow-sm ${
                            opponentCards[player.position]?.[1]
                              ? `bg-white border-gray-700 ${
                                  opponentCards[player.position]![1].includes('♥') || opponentCards[player.position]![1].includes('♦')
                                    ? 'text-red-600'
                                    : 'text-gray-800'
                                }`
                              : 'bg-gray-100 border-gray-400 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {opponentCards[player.position]?.[1] || '?'}
                        </button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* Inline Card Selector for Showdown Dialog */}
        {inlineCardSelection.show && (
          <div className="mt-4 border-t pt-4">
            <CardSelector
              title={inlineCardSelection.title}
              selectedCards={[
                selectedCard1,
                selectedCard2,
                ...(currentHand?.communityCards.flop || []),
                currentHand?.communityCards.turn,
                currentHand?.communityCards.river,
                ...Object.values(opponentCards).flat()
              ].filter(Boolean) as string[]}
              onCardSelect={onInlineCardSelect}
              onCancel={() => onSetInlineCardSelection({ show: false, position: null, cardIndex: 1, title: '' })}
            />
          </div>
        )}

        {/* Outcome Selection */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={onCompleteHandWon}
            disabled={!currentHand?.userCards || !currentHand.userCards[0] || !currentHand.userCards[1]}
          >
            I Won (+{(currentHand?.pot || 0) - heroMoneyInvested})
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={onCompleteHandLost}
            disabled={!currentHand?.userCards || !currentHand.userCards[0] || !currentHand.userCards[1]}
          >
            I Lost (-{heroMoneyInvested})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}