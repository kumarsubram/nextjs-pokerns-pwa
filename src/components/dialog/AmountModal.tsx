'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Position } from '@/types/poker-v2';

interface AmountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'raise' | 'all-in';
  position: Position | null;
  value: number;
  error: string | null;
  stack: number;
  currentBet: number;
  onValueChange: (value: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
  getDialogClasses: (classes: string) => string;
}

export function AmountModal({
  open,
  onOpenChange,
  action,
  position,
  value,
  error,
  stack,
  currentBet,
  onValueChange,
  onConfirm,
  onCancel,
  getDialogClasses
}: AmountModalProps) {
  const isRaise = action === 'raise';
  const minRaise = (currentBet || 0) * 2;
  const maxAmount = stack;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      onValueChange(newValue);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getDialogClasses("sm:max-w-[425px] max-w-[90vw] w-full")}>
        <DialogHeader>
          <DialogTitle className="text-lg">
            {position} - {isRaise ? 'Raise Amount' : 'All-In'}
          </DialogTitle>
          <DialogDescription>
            {isRaise
              ? `Enter the total amount to raise to (minimum: ${minRaise})`
              : `Going all-in with ${stack} chips`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="amount" className="text-right">
              Amount:
            </label>
            <input
              id="amount"
              type="number"
              value={value}
              onChange={handleInputChange}
              min={isRaise ? minRaise : stack}
              max={maxAmount}
              className="col-span-3 px-3 py-2 border rounded"
              disabled={!isRaise}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          {isRaise && (
            <div className="text-sm text-gray-600">
              Current bet: {currentBet}, Stack: {stack}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className={isRaise ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700"}
          >
            {isRaise ? 'Confirm Raise' : 'Confirm All-In'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}