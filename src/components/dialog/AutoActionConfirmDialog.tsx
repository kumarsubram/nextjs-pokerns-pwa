'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Position } from '@/types/poker-v2';

interface AutoActionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affectedSeats: Position[];
  currentBet: number;
  onConfirm: () => void;
  onCancel: () => void;
  getDialogClasses: (classes: string) => string;
}

export function AutoActionConfirmDialog({
  open,
  onOpenChange,
  affectedSeats,
  currentBet,
  onConfirm,
  onCancel,
  getDialogClasses
}: AutoActionConfirmDialogProps) {
  const hasBet = currentBet && currentBet > 0;
  const autoAction = hasBet ? 'fold' : 'check';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getDialogClasses("sm:max-w-[500px] max-w-[95vw] w-full")}>
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>
            This action will skip other players&apos; turns.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {affectedSeats.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-2">
                The following players will automatically <strong>{autoAction}</strong>:
              </p>
              <div className="flex flex-wrap gap-2">
                {affectedSeats.map(seat => (
                  <span key={seat} className="px-2 py-1 bg-yellow-200 rounded text-xs font-medium">
                    {seat}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {hasBet
                  ? 'They will fold because they need to call a bet.'
                  : 'They will check because there is no bet to call.'
                }
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-orange-600 hover:bg-orange-700 text-white">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}