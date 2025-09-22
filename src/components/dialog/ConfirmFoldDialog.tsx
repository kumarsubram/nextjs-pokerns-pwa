'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CardSelector } from '@/components/poker/CardSelector';
import { CurrentHand, Position } from '@/types/poker-v2';

interface ConfirmFoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: Position | null;
  heroMoneyInvested: number;
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
  onConfirmFold: () => void;
  onCancel: () => void;
  getDialogClasses: (classes: string) => string;
}

export function ConfirmFoldDialog({
  open,
  onOpenChange,
  position,
  heroMoneyInvested,
  currentHand,
  userSeat,
  selectedCard1,
  selectedCard2,
  opponentCards,
  inlineCardSelection,
  onInlineCardSelect,
  onSetInlineCardSelection,
  onConfirmFold,
  onCancel,
  getDialogClasses
}: ConfirmFoldDialogProps) {
  const needsCards = heroMoneyInvested > 0 && (!currentHand?.userCards || !currentHand.userCards[0] || !currentHand.userCards[1]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getDialogClasses("sm:max-w-[500px] max-w-[95vw] w-full")}>
        <DialogHeader>
          <DialogTitle>Confirm Fold</DialogTitle>
          <DialogDescription>
            Are you sure you want to fold {position}?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700">
              {heroMoneyInvested > 0
                ? `You have invested ${heroMoneyInvested} chips in this hand. This will be lost if you fold.`
                : 'You have not invested any money in this hand yet.'
              }
            </p>
          </div>

          {/* Hero Cards Section - Only show if money invested and cards not selected */}
          {needsCards && (
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 mb-4">
              <div className="font-medium mb-3 text-blue-800">
                Select Your Hole Cards (Required since you invested money)
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
              <div className="text-xs text-gray-600 mt-2 text-center">
                Recording your cards helps with hand history tracking
              </div>
            </div>
          )}
        </div>

        {/* Inline Card Selector */}
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

        <div className="flex gap-2 mt-4">
          <Button
            className="flex-1"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            onClick={onConfirmFold}
            disabled={needsCards}
          >
            Confirm Fold
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}