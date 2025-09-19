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