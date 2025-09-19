'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface UnshareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UnshareDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel
}: UnshareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-w-[90vw] w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Unshare Hand
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to unshare this hand? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="text-sm text-gray-600">
            <p className="mb-2">This will:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Remove the hand from the shared list</li>
              <li>Delete all comments on this hand</li>
              <li>Make the hand no longer accessible to others</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Unshare Hand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}