'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CardSelector } from '@/components/poker/CardSelector';
import { CurrentHand, Position } from '@/types/poker-v2';

interface AllFoldedDialogProps {
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
  onCompleteHand: () => void;
  getDialogClasses: (classes: string) => string;
}

export function AllFoldedDialog({
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
  onCompleteHand,
  getDialogClasses
}: AllFoldedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getDialogClasses("sm:max-w-[500px] max-w-[95vw] w-full")}>
        <DialogHeader>
          <DialogTitle>Hand Won - All Opponents Folded</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 mt-4 max-h-80 overflow-y-auto">
          {/* Pot Size Display */}
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              You Win: {currentHand?.pot || 0}
            </div>
            <div className="text-sm text-gray-600">
              All opponents folded
            </div>
          </div>

          {/* Hero Cards Section - Only show if not already selected */}
          {(!currentHand?.userCards || !currentHand.userCards[0] || !currentHand.userCards[1]) && (
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="font-medium mb-3 text-blue-800">
                Select Your Hole Cards (Optional)
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
              <div className="text-xs text-gray-600 mt-2 text-center">
                Recording your cards helps with hand history tracking
              </div>
            </div>
          )}

          {/* If cards are selected, show them */}
          {currentHand?.userCards && currentHand.userCards[0] && currentHand.userCards[1] && (
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Your Cards:</div>
              <div className="flex gap-2 justify-center">
                <span className="text-lg font-bold px-3 py-2 bg-white border rounded">
                  {currentHand.userCards[0]}
                </span>
                <span className="text-lg font-bold px-3 py-2 bg-white border rounded">
                  {currentHand.userCards[1]}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Inline Card Selector for All Folded Dialog */}
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

        {/* Action Button */}
        <div className="flex justify-center mt-6">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={onCompleteHand}
            disabled={!currentHand?.userCards || !currentHand.userCards[0] || !currentHand.userCards[1]}
          >
            Complete Hand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}