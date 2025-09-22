'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteAllTrackedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  count: number;
}

export function DeleteAllTrackedDialog({
  open,
  onOpenChange,
  onConfirm,
  count
}: DeleteAllTrackedDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete All Tracked Hands</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete all {count} tracked {count === 1 ? 'hand' : 'hands'}?
            This action cannot be undone and will remove all hands from your tracked collection.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
          >
            Delete All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}