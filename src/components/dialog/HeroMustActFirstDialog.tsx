'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface HeroMustActFirstDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  getDialogClasses: (classes: string) => string;
}

export function HeroMustActFirstDialog({
  open,
  onOpenChange,
  onContinue,
  getDialogClasses
}: HeroMustActFirstDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getDialogClasses("sm:max-w-[400px] max-w-[90vw] w-full")}>
        <DialogHeader>
          <DialogTitle>Choose Hero&apos;s Action First</DialogTitle>
          <DialogDescription>
            You must choose your action before other players can act.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              Since the action is currently before you in the sequence, you need to decide what your hero does first.
              Clicking on seats after your position would mean your hero folded.
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={onContinue}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}