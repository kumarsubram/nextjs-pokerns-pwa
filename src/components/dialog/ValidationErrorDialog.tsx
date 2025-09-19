'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ValidationErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  onSelectCards: () => void;
  getDialogClasses: (classes: string) => string;
}

export function ValidationErrorDialog({
  open,
  onOpenChange,
  message,
  onSelectCards,
  getDialogClasses
}: ValidationErrorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getDialogClasses("sm:max-w-[425px] max-w-[350px]")}>
        <DialogHeader>
          <DialogTitle>Action Required</DialogTitle>
          <DialogDescription>
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end mt-4">
          <Button
            onClick={() => {
              onOpenChange(false);
              // If the error was about missing hole cards, open the card selector
              if (message.includes('hole cards')) {
                onSelectCards();
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Select Cards
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}