'use client';

import { Card, CardContent } from '@/components/ui/card';
import { User, Clock } from 'lucide-react';

export default function AccountPage() {

  return (
    <main className="container max-w-7xl mx-auto px-4 py-6">
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="bg-muted rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Account Settings Coming Soon</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            User profiles, preferences, data sync, and account management features will be available here. 
            Customize your poker tracking experience.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Clock className="h-4 w-4" />
            <span>Feature in development</span>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}