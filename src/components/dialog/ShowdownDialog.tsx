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
            Add any cards that were revealed at showdown, then select the outcome
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 mt-4 max-h-80 overflow-y-auto">
          <div className="text-center text-sm font-medium text-gray-700 mb-2">
            Pot Size: {currentHand?.pot || 0}
          </div>

          {/* Hero Cards Section - Only show if not already selected */}
          {(!currentHand?.userCards || !currentHand.userCards[0] || !currentHand.userCards[1]) && (
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="font-medium mb-3 text-blue-800">
                Your Hole Cards (Required for showdown)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onSetInlineCardSelection({
                      show: true,
                      position: userSeat || null,
                      cardIndex: 1,
                      title: 'Select Your Card 1'
                    });
                  }}
                  className="text-xs border-blue-300 hover:bg-blue-100"
                >
                  {currentHand?.userCards?.[0] || 'Card 1'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onSetInlineCardSelection({
                      show: true,
                      position: userSeat || null,
                      cardIndex: 2,
                      title: 'Select Your Card 2'
                    });
                  }}
                  className="text-xs border-blue-300 hover:bg-blue-100"
                >
                  {currentHand?.userCards?.[1] || 'Card 2'}
                </Button>
              </div>
            </div>
          )}

          {/* Opponent Cards Section - Show all active opponents */}
          {currentHand?.playerStates &&
            currentHand.playerStates.filter(p => p.status === 'active' && p.position !== userSeat)
            .length > 0 && (
            <div className="border rounded-lg p-4">
              <div className="font-medium mb-3 text-gray-700">
                Opponent Cards (Optional - add any cards that were shown)
              </div>
              <div className="grid gap-3">
                {currentHand?.playerStates &&
                  currentHand.playerStates.filter(p => p.status === 'active' && p.position !== userSeat)
                  .map(player => (
                    <div key={player.position} className="border rounded p-3 bg-gray-50">
                      <div className="font-medium mb-2 text-sm">{player.position}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onSetInlineCardSelection({
                              show: true,
                              position: player.position,
                              cardIndex: 1,
                              title: `Select ${player.position} Card 1`
                            });
                          }}
                          className="text-xs"
                        >
                          {opponentCards[player.position]?.[0] || 'Card 1'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onSetInlineCardSelection({
                              show: true,
                              position: player.position,
                              cardIndex: 2,
                              title: `Select ${player.position} Card 2`
                            });
                          }}
                          className="text-xs"
                        >
                          {opponentCards[player.position]?.[1] || 'Card 2'}
                        </Button>
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
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={onCompleteHandWon}
            disabled={!currentHand?.userCards || !currentHand.userCards[0] || !currentHand.userCards[1]}
          >
            I Won
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={onCompleteHandLost}
            disabled={!currentHand?.userCards || !currentHand.userCards[0] || !currentHand.userCards[1]}
          >
            I Lost
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}