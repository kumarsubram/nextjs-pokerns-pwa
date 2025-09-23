'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

interface SetUsernameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (username: string) => void;
  onCancel: () => void;
  getDialogClasses?: (classes: string) => string;
}

export function SetUsernameDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  getDialogClasses
}: SetUsernameDialogProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setUsername('');
      setError(null);
    }
  }, [open]);

  const validateUsername = (value: string): string | null => {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return 'Username is required';
    }

    if (trimmed.length < 3) {
      return 'Username must be at least 3 characters';
    }

    if (trimmed.length > 20) {
      return 'Username must be at most 20 characters';
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return 'Username can only contain letters, numbers, and underscores';
    }

    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);

    const validationError = validateUsername(value);
    setError(validationError);
  };

  const handleConfirm = () => {
    const validationError = validateUsername(username);

    if (validationError) {
      setError(validationError);
      return;
    }

    onConfirm(username.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !error && username.trim().length >= 3) {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const defaultGetDialogClasses = (classes: string) => classes;
  const dialogClassesFn = getDialogClasses || defaultGetDialogClasses;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogClassesFn("sm:max-w-[425px] max-w-[90vw] w-full max-sm:translate-y-[-72%]")}>
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Set Username
          </DialogTitle>
          <DialogDescription>
            Choose a username to share hands and comment. This will be visible to others.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="username" className="text-right">
              Username:
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g. poker_pro"
              className="col-span-3 px-3 py-2 border rounded text-base"
              style={{ fontSize: '16px' }}
              autoFocus
              maxLength={20}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="text-sm text-gray-600">
            3-20 characters, letters, numbers, and underscores only
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!!error || username.trim().length < 3}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Set Username
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}