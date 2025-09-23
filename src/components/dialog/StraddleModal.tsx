'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Position } from '@/types/poker-v2';

interface StraddleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: Position | null;
  value: number;
  error: string | null;
  bigBlind: number;
  heroPosition?: Position;
  onValueChange: (value: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
  getDialogClasses: (classes: string) => string;
}

export function StraddleModal({
  open,
  onOpenChange,
  position,
  value,
  error,
  bigBlind,
  heroPosition,
  onValueChange,
  onConfirm,
  onCancel,
  getDialogClasses
}: StraddleModalProps) {
  const isHero = position === heroPosition;
  const minStraddle = bigBlind * 2;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      onValueChange(newValue);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getDialogClasses("sm:max-w-[425px] max-w-[90vw] w-full max-sm:translate-y-[-72%]")}>
        <DialogHeader>
          <DialogTitle className="text-lg">
            {position} - Straddle
          </DialogTitle>
          <DialogDescription>
            {isHero
              ? `Enter your straddle amount (minimum: ${minStraddle})`
              : `Enter the straddle amount for ${position} (minimum: ${minStraddle})`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="straddle-amount" className="text-right">
              Amount:
            </label>
            <input
              id="straddle-amount"
              type="number"
              value={value}
              onChange={handleInputChange}
              min={minStraddle}
              className="col-span-3 px-3 py-2 border rounded text-base"
              style={{ fontSize: '16px' }}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="text-sm text-gray-600">
            Big Blind: {bigBlind}, Minimum Straddle: {minStraddle}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Confirm Straddle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}