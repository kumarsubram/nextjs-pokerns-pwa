'use client';

import { Users } from 'lucide-react';

export default function SharedPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
      {/* Page Title */}
      <div className="bg-white border-b px-4 py-4">
        <h1 className="text-xl font-bold">Shared Hands</h1>
      </div>

      <main className="container max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <Users className="h-16 w-16 text-emerald-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Shared Hands
          </h1>

          <p className="text-gray-600 mb-6">
            View hands shared by the poker community. These hands are publicly available for everyone to review and learn from.
          </p>

          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500">
              Coming soon: Browse and analyze hands shared by other players
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}