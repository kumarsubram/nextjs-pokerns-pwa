'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  heroMoneyInvested: number;
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
  heroMoneyInvested,
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
          <DialogTitle>Hand Won</DialogTitle>
          <DialogDescription>
            All opponents folded
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 mt-4 max-h-80 overflow-y-auto">
          {/* Profit Display */}
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              You Win: {(currentHand?.pot || 0) - (heroMoneyInvested || 0)}
            </div>
          </div>

          {/* Hero Cards Section - Always show */}
          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="font-medium mb-3 text-blue-800">
              Your Hole Cards (Required)
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