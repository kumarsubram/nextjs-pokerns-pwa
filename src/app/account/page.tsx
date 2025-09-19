'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Edit2, Check, X, MessageCircle, Clock } from 'lucide-react';
import { SharedHandService } from '@/services/shared-hand.service';

export default function AccountPage() {
  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [tempUsername, setTempUsername] = useState('');

  useEffect(() => {
    // Load current username on mount
    const currentUsername = SharedHandService.getCurrentUsername();
    setUsername(currentUsername);
  }, []);

  const handleEditStart = () => {
    setTempUsername(username);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setTempUsername('');
    setIsEditing(false);
  };

  const handleEditSave = () => {
    const trimmedUsername = tempUsername.trim();
    if (trimmedUsername) {
      SharedHandService.setUsername(trimmedUsername);
      setUsername(trimmedUsername);
      setIsEditing(false);
      setTempUsername('');
    }
  };

  return (
    <main className="container max-w-7xl mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Username Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Username Section */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              {!isEditing ? (
                <div className="flex items-center justify-between">
                  <p className="text-lg font-medium">
                    {username === 'Anonymous' ? (
                      <span className="text-gray-500">Not set</span>
                    ) : (
                      username
                    )}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditStart}
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    id="username"
                    type="text"
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditSave();
                      if (e.key === 'Escape') handleEditCancel();
                    }}
                    placeholder="Enter username"
                    className="flex-1"
                    maxLength={20}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleEditSave}
                    disabled={!tempUsername.trim()}
                    className="px-3"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditCancel}
                    className="px-3"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Your username is displayed when you share hands and post comments.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    About Usernames
                  </p>
                  <p className="text-sm text-gray-700">
                    Your username is stored locally and used for:
                  </p>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-0.5">
                    <li>Identifying your shared hands</li>
                    <li>Displaying your name on comments</li>
                    <li>Showing who shared a hand in the community</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Future Features Card */}
        <Card className="border-dashed border-2">
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-muted rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">More Features Coming Soon</h3>
              <p className="text-muted-foreground max-w-md">
                Additional account features like data sync, preferences, statistics,
                and profile customization will be available in future updates.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}