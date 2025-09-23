# Poker Notes PWA - Sharing Feature Implementation Plan

## 🎯 Implementation To-Do List (In Sequence)

### Phase 0: Username System (✅ COMPLETED)
- [x] 0.1 Create `SetUsernameDialog` component (✅ Done)
- [x] 0.2 Add username prompt on session creation (✅ Done)
- [x] 0.3 Users MUST set username before starting any session (✅ Done)
- [x] 0.4 Username stored in localStorage as `currentUser` (✅ Done)
- [x] 0.5 Existing `/account` page for editing username (✅ Done)

### Phase 1: Setup & Infrastructure
- [ ] 1.1 Install dependencies: `npm install drizzle-orm postgres drizzle-kit nanoid`
- [x] 1.2 PostgreSQL database ready (✅ VPS setup with DATABASE_URL in .env)
- [x] 1.3 pgvector extension enabled (✅ Already done)
- [ ] 1.4 Create `src/types/sharing.ts` for sharing-specific types
- [ ] 1.5 Create `src/lib/db/schema.ts` with 3 tables (shared_hands, comments, likes)
- [ ] 1.6 Create `src/lib/db/index.ts` with connection pool config
- [ ] 1.7 Create `drizzle.config.ts` for migrations
- [ ] 1.8 Test database connection: create test Server Action
- [ ] 1.9 Run migrations: `npx drizzle-kit generate && npx drizzle-kit migrate`

### Phase 2: Username Collision Handling
- [ ] 2.1 Create `src/lib/utils/username-suggestions.ts` (generate alternatives)
- [ ] 2.2 Create `src/components/dialog/UsernameConflictDialog.tsx`
  - Show error: "Username '[username]' is already taken"
  - Input field pre-filled with current username (editable)
  - Display clickable suggestions: username_1, username_2, username123
  - Buttons: "Cancel" | "Save & Retry"
- [ ] 2.3 On save → Update localStorage + auto-retry share/comment action
- [ ] 2.4 (Optional) Add debounced availability check in dialog
- [ ] 2.5 (Optional) Update `/account` page with real-time availability

### Phase 3: Server Actions & Utilities
- [ ] 3.1 Create `src/lib/utils/device-fingerprint.ts` (device ID via cookies)
- [ ] 3.2 Create `src/lib/utils/share-url.ts` (generate share URLs)
- [ ] 3.3 Create `src/actions/sharing/shared-hands.ts`:
  - `shareHand(handData, sessionData, displayName)` - Create shared hand
  - `getSharedHand(shareToken)` - Fetch single hand + increment views
  - `getRecentSharedHands(limit, offset)` - Fetch paginated list
- [ ] 3.4 Create `src/actions/sharing/comments.ts`:
  - `addComment(shareToken, text, displayName)` - Add comment
  - `getComments(shareToken)` - Fetch all comments for hand
- [ ] 3.5 Create `src/actions/sharing/likes.ts`:
  - `toggleLike(shareToken)` - Like/unlike with device ID
  - `getLikeStatus(shareToken)` - Check if user liked
- [ ] 3.6 Test all Server Actions with database (create test file)

### Phase 4: Shared Hands List Page
**Create modular components**:
- [ ] 4.1 Create `src/components/shared/cards/SharedHandCard.tsx` (reusable card)
- [ ] 4.2 Create `src/hooks/useSharedHands.ts` (fetch shared hands hook)
- [ ] 4.3 Create `/app/shared/page.tsx` (main list page - imports above)
- [ ] 4.4 Card shows: username, cards, outcome, timeAgo, view count, like count
- [ ] 4.5 Add empty state component (no shared hands yet)
- [ ] 4.6 Link cards to `/shared/[token]` detail page
- [ ] 4.7 List sorted by most recent first (createdAt DESC)
- [ ] 4.8 Add pagination or infinite scroll logic in hook

### Phase 5: Shared Hand Detail Page
**Reuse existing components from tracked hands**:
- [ ] 5.1 Create `src/components/shared/cards/SharedHandHeader.tsx` (detail header)
- [ ] 5.2 Create `src/hooks/useSharedHand.ts` (fetch single hand + increment views)
- [ ] 5.3 Create `/app/shared/[token]/page.tsx` (copy layout from `/tracked/[id]/page.tsx`)
- [ ] 5.4 Header shows: "Shared by [username]", back button to /shared, replay button
- [ ] 5.5 Session details dropdown (same layout as tracked page)
- [ ] 5.6 **REUSE** existing `HandReplay` component (no modifications needed)
- [ ] 5.7 **REUSE** existing `HandHistory` component for hand details
- [ ] 5.8 Auto-increment view count on mount (in hook)
- [ ] 5.9 No "Remove" button (can't delete shared hands)

### Phase 6: Comments Section
**Create modular comment system**:
- [ ] 6.1 Create `src/components/shared/comments/CommentItem.tsx` (single comment)
- [ ] 6.2 Create `src/components/shared/comments/CommentList.tsx` (list of comments)
- [ ] 6.3 Create `src/components/shared/comments/CommentInput.tsx` (add comment)
- [ ] 6.4 Create `src/components/shared/comments/CommentSection.tsx` (main container)
- [ ] 6.5 Create `src/hooks/useComments.ts` (fetch/add comments with optimistic UI)
- [ ] 6.6 Add CommentSection to shared hand detail page
- [ ] 6.7 Handle username conflicts with UsernameConflictDialog + auto-retry

### Phase 7: Like System
**Create modular like system**:
- [ ] 7.1 Create `src/hooks/useLikes.ts` (toggle like + optimistic UI)
- [ ] 7.2 Create `src/components/shared/buttons/LikeButton.tsx` (heart icon + count)
- [ ] 7.3 Show filled/unfilled heart based on like status
- [ ] 7.4 Add LikeButton to SharedHandCard (list page)
- [ ] 7.5 Add LikeButton to SharedHandHeader (detail page)

### Phase 8: Share Flow
**Create modular share system**:
- [ ] 8.1 Create `src/hooks/useShareHand.ts` (share logic + conflict handling)
- [ ] 8.2 Create `src/components/dialog/ShareSuccessDialog.tsx` (success + copy URL)
- [ ] 8.3 Create `src/components/shared/buttons/ShareButton.tsx`:
  - Reusable share button component
  - Props: `hand` (StoredHand), `onShare` callback, `isShared` boolean
  - Styling: Uses existing button styles from HandHistory.tsx
  - States: Default ("Share" + Users icon) → Success ("Shared!" + Users icon, blue highlight)
  - Full width option for different layouts (w-full or auto)
- [ ] 8.4 Replace existing share buttons in:
  - `/tracked/[id]/page.tsx` - tracked hand detail page
  - `HandHistory.tsx` - hand history component
  - Future: `/session/[id]/history` - session history
- [ ] 8.5 ShareButton checks online status before sharing (use existing `useOnlineStatus`)
- [ ] 8.6 On conflict → Show UsernameConflictDialog → Auto-retry
- [ ] 8.7 On success → Show ShareSuccessDialog with shareable URL

### Phase 9: Integration & Error Handling
- [x] 9.1 Use existing `src/hooks/useOnlineStatus.ts` for online/offline detection (✅ Already exists)
- [ ] 9.2 Add loading states to all async operations (skeletons)
- [ ] 9.3 Add error boundaries for shared pages (`/app/shared/error.tsx`, `/app/shared/[token]/error.tsx`)
- [ ] 9.4 Handle network errors gracefully (show retry button)
- [ ] 9.5 Install and configure toast library: `npm install sonner`
- [ ] 9.6 Add toast notifications for success/error states
- [ ] 9.7 Add "Copy Link" functionality with clipboard API
- [ ] 9.8 Add social share meta tags to shared hand pages (OG tags for Twitter/Facebook)

### Phase 10: Testing & Quality Assurance
- [ ] 10.1 Test username requirement on session creation (✅ Already working)
- [ ] 10.2 Test sharing flows:
  - Username conflicts → Dialog → Auto-retry
  - Success → ShareSuccessDialog → Copy link
  - Offline → Show error toast
- [ ] 10.3 Test comments:
  - Add comment with username
  - Display with timeAgo formatting
  - Username conflict handling
  - Optimistic UI updates
- [ ] 10.4 Test likes:
  - Toggle like/unlike
  - Count increments/decrements
  - Device fingerprint persistence
  - Optimistic UI updates
- [ ] 10.5 Test hand replay on shared hands (reuses existing component)
- [ ] 10.6 Mobile responsiveness:
  - iPhone SE (375px)
  - Standard mobile (390px-428px)
  - Tablet (768px+)
  - Desktop (1024px+)
- [ ] 10.7 Test offline scenarios:
  - Share button disabled when offline
  - Show "You're offline" toast
  - Queue actions for when online (optional)
- [ ] 10.8 Performance testing:
  - Database connection pool health
  - Query optimization (use indexes)
  - Page load times (<3s)
  - Lighthouse score >90
- [ ] 10.9 Accessibility audit:
  - Keyboard navigation (Tab, Enter, Escape)
  - Screen reader labels (ARIA)
  - Focus management in dialogs
  - Color contrast (WCAG AA)

### Phase 11: Deployment & Documentation
- [ ] 11.1 Update PWA cache version in `public/sw.js` (increment CACHE_NAME)
- [ ] 11.2 Update DEVELOPMENT_GUIDE.md:
  - Add v2.20 - Sharing Feature section
  - Document Server Actions structure
  - Update file structure with new folders
  - Add sharing flow diagrams
- [ ] 11.3 Create database migration guide (if needed for existing users)
- [ ] 11.4 Test in production environment:
  - VPS database connection
  - SSL/HTTPS requirements
  - Connection pool behavior under load
- [ ] 11.5 Monitor database performance:
  - Connection pool metrics (max connections, idle time)
  - Query execution times (<100ms average)
  - Index usage verification
- [ ] 11.6 (Optional) Set up error tracking:
  - Sentry for runtime errors
  - Database query logging
- [ ] 11.7 Git commit: `git commit -m "v2.20: Sharing Feature - Public hand sharing with comments & likes"`
- [ ] 11.8 Deploy: `npm run build && npm run push`

---

## Philosophy: Clean, Simple, Efficient

**Key Decisions**:
- ✅ Use **Drizzle ORM** (latest) - Type-safe, lightweight, Next.js 15 optimized
- ✅ **No backward compatibility** - Clean slate, modern architecture
- ✅ **Next.js 15 Server Actions** - All DB operations in `src/actions`
- ✅ **PostgreSQL + pgvector** - For future AI/similarity features
- ✅ **Username ALWAYS set** - Required before any session creation (✅ IMPLEMENTED)
- ✅ **Auth-ready schema** - Add `users` table later without breaking changes

---

## Feature Distinction: Tracked vs Shared

### 📌 Tracked Hands (Personal, Offline)
- **Purpose**: Personal hand library for offline review
- **Storage**: localStorage only
- **Access**: Private, only visible to the user
- **Features**: Save hand, replay, remove, view session
- **UI Location**: `/tracked` and `/tracked/[id]`

### 🌐 Shared Hands (Public, Online)
- **Purpose**: Public hand sharing with community
- **Storage**: PostgreSQL database (online only)
- **Access**: Public, anyone with link can view
- **Features**: Share hand, view, replay, comment, like
- **UI Location**: `/shared` and `/shared/[token]`
- **Requirements**: Username MUST be set to share or comment

---

## Current State Analysis

### localStorage Structure (Current Implementation)
```typescript
// Sessions
'lastSessionNumber': number
'activeSession': sessionId
'session_{id}_meta': SessionMetadata
'session_{id}_hands': StoredHand[]
'current_hand_{id}': CurrentHand

// Tracked hands (personal, offline)
'trackedHands': TrackedHand[]

// User profile (✅ IMPLEMENTED)
'currentUser': string  // REQUIRED before any session creation

// Data versioning
'dataVersion': number
```

**Implementation**:
- ✅ Users MUST set username before creating first session
- ✅ `SetUsernameDialog` prompts on session creation if not set
- ✅ Username stored as `currentUser` in localStorage
- ✅ Can be edited anytime in `/account` page

---

## Database Schema (Drizzle ORM + PostgreSQL)

### Setup Files

**File: `src/lib/db/schema.ts`**
```typescript
import { pgTable, uuid, varchar, text, jsonb, integer, timestamp, vector, index, unique } from 'drizzle-orm/pg-core';

// Future users table (add when auth is ready)
// export const users = pgTable('users', {
//   id: uuid('id').primaryKey().defaultRandom(),
//   email: varchar('email', { length: 255 }).notNull().unique(),
//   username: varchar('username', { length: 50 }).notNull().unique(),
//   displayName: varchar('display_name', { length: 100 }),
//   createdAt: timestamp('created_at').defaultNow().notNull(),
// });

// Shared hands - core MVP table
export const sharedHands = pgTable('shared_hands', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Auth ready (nullable for now)
  userId: uuid('user_id'), // References users.id when auth added

  // User identification (REQUIRED - no anonymous sharing)
  displayName: varchar('display_name', { length: 100 }).notNull().unique(), // Username (unique across all users)
  deviceId: varchar('device_id', { length: 100 }), // For device tracking

  // Share metadata
  shareToken: varchar('share_token', { length: 20 }).notNull().unique(),
  title: varchar('title', { length: 200 }),
  description: text('description'),

  // Hand data (complete JSONB)
  handData: jsonb('hand_data').$type<StoredHand>().notNull(),
  sessionData: jsonb('session_data').$type<{
    sessionName: string;
    gameType: 'Tournament' | 'Cash Game';
    tableSeats: 6 | 9;
    userSeat: Position;
    location?: string;
  }>().notNull(),

  // Engagement metrics
  viewCount: integer('view_count').default(0).notNull(),
  likeCount: integer('like_count').default(0).notNull(),

  // Future AI/similarity (pgvector) - ✅ Extension already enabled in VPS
  handEmbedding: vector('hand_embedding', { dimensions: 384 }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tokenIdx: index('idx_share_token').on(table.shareToken),
  createdIdx: index('idx_created_at').on(table.createdAt.desc()),
  userIdIdx: index('idx_user_id').on(table.userId).where(table.userId.isNotNull()),
  displayNameIdx: index('idx_display_name').on(table.displayName), // For username lookups
}));

// Comments - simple, no threading in MVP
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),

  // What's being commented on
  sharedHandId: uuid('shared_hand_id').notNull().references(() => sharedHands.id, { onDelete: 'cascade' }),

  // Auth ready (nullable for now)
  userId: uuid('user_id'),

  // Commenter identification (REQUIRED - no anonymous comments)
  displayName: varchar('display_name', { length: 100 }).notNull(), // Username from localStorage

  // Content
  text: text('text').notNull(),

  // Timestamp
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  handIdx: index('idx_comments_hand').on(table.sharedHandId, table.createdAt.desc()),
  userIdIdx: index('idx_comments_user').on(table.userId).where(table.userId.isNotNull()),
}));

// Likes - track with device fingerprinting
export const likes = pgTable('likes', {
  id: uuid('id').primaryKey().defaultRandom(),

  // What's being liked
  sharedHandId: uuid('shared_hand_id').notNull().references(() => sharedHands.id, { onDelete: 'cascade' }),

  // Auth ready (nullable for now)
  userId: uuid('user_id'),

  // Anonymous liker (device fingerprint)
  deviceId: varchar('device_id', { length: 100 }),

  // Timestamp
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  handIdx: index('idx_likes_hand').on(table.sharedHandId),
  userIdIdx: index('idx_likes_user').on(table.userId).where(table.userId.isNotNull()),
  // Prevent duplicates (works for both auth and anonymous)
  uniqueLike: unique('unique_like').on(table.sharedHandId, table.userId, table.deviceId).nullsNotDistinct(),
}));

// Types for TypeScript
export type SharedHand = typeof sharedHands.$inferSelect;
export type NewSharedHand = typeof sharedHands.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type Like = typeof likes.$inferSelect;
export type NewLike = typeof likes.$inferInsert;
```

**File: `src/lib/db/index.ts`**
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Connection pool configuration for production
const client = postgres(process.env.DATABASE_URL, {
  max: 10, // Maximum connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false, // SSL in production
  prepare: false, // Disable prepared statements for serverless compatibility
});

export const db = drizzle(client, { schema });
```

**File: `drizzle.config.ts`**
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

---

## Next.js 15 Server Actions (src/actions)

### File: `src/actions/sharing/shared-hands.ts`
```typescript
'use server';

import { db } from '@/lib/db';
import { sharedHands } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';
import type { StoredHand, Position } from '@/types/poker-v2';

function getDeviceId(): string {
  const cookieStore = cookies();
  let deviceId = cookieStore.get('device_id')?.value;

  if (!deviceId) {
    deviceId = nanoid(32);
    cookieStore.set('device_id', deviceId, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return deviceId;
}

export async function shareHand(
  handData: StoredHand,
  sessionData: {
    sessionName: string;
    gameType: 'Tournament' | 'Cash Game';
    tableSeats: 6 | 9;
    userSeat: Position;
    location?: string;
  },
  displayName: string  // REQUIRED - username from localStorage
) {
  // Validate username exists
  if (!displayName || displayName.trim().length === 0) {
    throw new Error('Username is required to share hands');
  }

  const shareToken = nanoid(10); // Short, URL-friendly
  const deviceId = getDeviceId();

  try {
    const [result] = await db.insert(sharedHands).values({
      shareToken,
      displayName: displayName.trim(),
      deviceId,
      handData,
      sessionData,
    }).returning({ shareToken: sharedHands.shareToken });

    return { success: true, shareToken: result.shareToken };
  } catch (error: any) {
    // Check for unique constraint violation on displayName
    if (error?.code === '23505' && error?.constraint?.includes('display_name')) {
      return {
        success: false,
        error: 'USERNAME_TAKEN',
        message: 'This username is already taken. Please choose a different username in Account settings.'
      };
    }
    throw error;
  }
}

export async function getSharedHand(shareToken: string) {
  const [hand] = await db
    .select()
    .from(sharedHands)
    .where(eq(sharedHands.shareToken, shareToken))
    .limit(1);

  if (!hand) return null;

  // Increment view count
  await db
    .update(sharedHands)
    .set({ viewCount: hand.viewCount + 1 })
    .where(eq(sharedHands.shareToken, shareToken));

  return hand;
}

export async function getRecentSharedHands(limit = 20, offset = 0) {
  const hands = await db
    .select({
      id: sharedHands.id,
      shareToken: sharedHands.shareToken,
      displayName: sharedHands.displayName,
      title: sharedHands.title,
      description: sharedHands.description,
      sessionData: sharedHands.sessionData,
      viewCount: sharedHands.viewCount,
      likeCount: sharedHands.likeCount,
      createdAt: sharedHands.createdAt,
    })
    .from(sharedHands)
    .orderBy(desc(sharedHands.createdAt))
    .limit(limit)
    .offset(offset);

  return hands;
}
```

### File: `src/actions/sharing/comments.ts`
```typescript
'use server';

import { db } from '@/lib/db';
import { comments, sharedHands } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function addComment(
  shareToken: string,
  text: string,
  displayName: string  // REQUIRED - username from localStorage
) {
  // Validate username exists
  if (!displayName || displayName.trim().length === 0) {
    throw new Error('Username is required to comment');
  }

  // Get shared_hand_id from token
  const [hand] = await db
    .select({ id: sharedHands.id })
    .from(sharedHands)
    .where(eq(sharedHands.shareToken, shareToken))
    .limit(1);

  if (!hand) throw new Error('Hand not found');

  try {
    const [comment] = await db.insert(comments).values({
      sharedHandId: hand.id,
      text: text.trim(),
      displayName: displayName.trim(),
    }).returning();

    return { success: true, comment };
  } catch (error: any) {
    // Check if username doesn't exist in shared_hands (foreign key-like validation)
    if (error?.code === '23505') {
      return {
        success: false,
        error: 'USERNAME_NOT_FOUND',
        message: 'Username not found. Please share a hand first to register your username.'
      };
    }
    throw error;
  }
}

export async function getComments(shareToken: string) {
  const result = await db
    .select({
      id: comments.id,
      text: comments.text,
      displayName: comments.displayName,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .innerJoin(sharedHands, eq(comments.sharedHandId, sharedHands.id))
    .where(eq(sharedHands.shareToken, shareToken))
    .orderBy(desc(comments.createdAt));

  return result;
}
```

### File: `src/actions/sharing/likes.ts`
```typescript
'use server';

import { db } from '@/lib/db';
import { likes, sharedHands } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';

function getDeviceId(): string {
  const cookieStore = cookies();
  return cookieStore.get('device_id')?.value || '';
}

export async function toggleLike(shareToken: string) {
  const deviceId = getDeviceId();

  // Get shared_hand_id
  const [hand] = await db
    .select({ id: sharedHands.id })
    .from(sharedHands)
    .where(eq(sharedHands.shareToken, shareToken))
    .limit(1);

  if (!hand) throw new Error('Hand not found');

  // Check existing like
  const [existingLike] = await db
    .select()
    .from(likes)
    .where(
      and(
        eq(likes.sharedHandId, hand.id),
        eq(likes.deviceId, deviceId)
      )
    )
    .limit(1);

  if (existingLike) {
    // Unlike
    await db.delete(likes).where(eq(likes.id, existingLike.id));
    await db
      .update(sharedHands)
      .set({ likeCount: Math.max(0, (await db.select({ count: sharedHands.likeCount }).from(sharedHands).where(eq(sharedHands.id, hand.id)))[0].count - 1) })
      .where(eq(sharedHands.id, hand.id));

    return { liked: false };
  } else {
    // Like
    await db.insert(likes).values({
      sharedHandId: hand.id,
      deviceId,
    });
    await db
      .update(sharedHands)
      .set({ likeCount: (await db.select({ count: sharedHands.likeCount }).from(sharedHands).where(eq(sharedHands.id, hand.id)))[0].count + 1 })
      .where(eq(sharedHands.id, hand.id));

    return { liked: true };
  }
}

export async function getLikeStatus(shareToken: string) {
  const deviceId = getDeviceId();

  const [result] = await db
    .select({ id: likes.id })
    .from(likes)
    .innerJoin(sharedHands, eq(likes.sharedHandId, sharedHands.id))
    .where(
      and(
        eq(sharedHands.shareToken, shareToken),
        eq(likes.deviceId, deviceId)
      )
    )
    .limit(1);

  return { liked: !!result };
}
```

---

## UI/UX Design (Based on Tracked Hands Pages)

### Shared Hands List (`/shared/page.tsx`)
**Copy from**: `/tracked/page.tsx`

**Layout Structure**:
```typescript
// Header section
- Title: "Shared Hands" (instead of "Tracked Hands")
- No "Delete All" button (public hands can't be bulk deleted)

// Card layout (same as tracked)
- Card with hand info
- Show: "Shared by [username] • [timeAgo]" (instead of "Tracked [time]")
- Display: hero cards, community cards, outcome badge
- Add: view count badge, like count badge
- Click: navigate to `/shared/[token]`

// Empty state
- Icon: Globe/Share2 icon
- Message: "No shared hands yet"
- Subtext: "Explore hands shared by the community"
```

### Shared Hand Detail (`/shared/[token]/page.tsx`)
**Copy from**: `/tracked/[id]/page.tsx`

**Layout Structure**:
```typescript
// Navigation buttons (same layout)
- Back button → "Back to Shared" (instead of "Back to Tracked")
- Replay button (same functionality)
- No Remove button (can't delete others' hands)

// Session details dropdown (enhanced)
- Session Name: [name]
- Shared by: [username]  // NEW
- Game Type: [6/9 handed]
- Position: [position]
- Shared Time: [formatted date]
- Views: [count]  // NEW

// Hand details
- Use HandHistory component (same)
- Use HandReplay component (same)

// Comments section (NEW)
- Below hand history
- List comments with username, text, timeAgo
- Add comment input (if username set)
- Show "Set username to comment" if not

// Like button (NEW)
- Heart icon with count
- Toggle like/unlike
```

### UsernameConflictDialog Component
**New Component**: `src/components/dialog/UsernameConflictDialog.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface UsernameConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUsername: string;
  onResolve: (newUsername: string) => void; // Auto-retries action with new username
  onCancel: () => void;
  getDialogClasses?: (classes: string) => string;
}

export function UsernameConflictDialog({
  open,
  currentUsername,
  onResolve,
  // ... rest of props
}: UsernameConflictDialogProps) {
  const [newUsername, setNewUsername] = useState(currentUsername);

  // Suggest alternatives
  const suggestions = [
    `${currentUsername}_1`,
    `${currentUsername}_2`,
    `${currentUsername}123`
  ];

  const handleSave = () => {
    // Update localStorage
    localStorage.setItem('currentUser', newUsername.trim());
    // Auto-retry the action (share or comment)
    onResolve(newUsername.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-w-[90vw] w-full max-sm:translate-y-[-72%]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Username Already Taken
          </DialogTitle>
          <DialogDescription>
            The username &quot;{currentUsername}&quot; is already in use. Please choose a different one.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="new-username" className="text-right">
              New Username:
            </label>
            <input
              id="new-username"
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="col-span-3 px-3 py-2 border rounded text-base"
              style={{ fontSize: '16px' }}
              autoFocus
              maxLength={20}
            />
          </div>

          {/* Suggestions */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">Try: </span>
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => setNewUsername(suggestion)}
                className="text-blue-600 hover:underline mr-2"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!newUsername.trim() || newUsername === currentUsername}
          >
            Save & Retry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Usage in Share Flow**:
```typescript
const [showConflictDialog, setShowConflictDialog] = useState(false);

const handleShare = async () => {
  const username = localStorage.getItem('currentUser');
  const result = await shareHand(handData, sessionData, username);

  if (!result.success && result.error === 'USERNAME_TAKEN') {
    setShowConflictDialog(true);
  } else if (result.success) {
    // Show success dialog
  }
};

const handleUsernameResolved = async (newUsername: string) => {
  setShowConflictDialog(false);
  // Auto-retry with new username
  const result = await shareHand(handData, sessionData, newUsername);
  // Show success dialog
};
```

---

## Key Features Summary

### Username System (✅ IMPLEMENTED + Future DB Validation)
- **Storage**: localStorage key `currentUser` (✅ Implemented)
- **UI**:
  - ✅ `SetUsernameDialog` component created
  - ✅ Prompts on session creation if username not set
  - ✅ Existing `/account` page for editing username
- **Validation**:
  - ✅ Local: 3-20 characters, alphanumeric + underscore only
  - ⏳ Database: Check uniqueness on first share/comment (Phase 2)
- **When Username is Set**:
  - ✅ Required BEFORE creating any session (enforced)
  - ✅ Always available for sharing and commenting
  - ✅ No need to check if username exists - it's guaranteed
- **Uniqueness Strategy (Future - Phase 2)**:
  1. Username already set locally before any session
  2. On first share attempt → DB checks uniqueness
  3. If taken → Show error dialog, redirect to `/account` to change
  4. If available → Username "claimed" in DB by creating first shared hand
  5. Future shares/comments use same username (no more checks needed)

### Sharing Flow (With Smart Username Conflict Handling)
1. User clicks "Share" on a hand (tracked or from session)
2. Username is available from localStorage (guaranteed)
3. Call `shareHand()` Server Action with username
4. Server Action responses:
   - **Success**: `{ success: true, shareToken: 'abc123' }`
     - Show success dialog with shareable URL
     - Copy to clipboard button
     - "View Shared Hand" button
   - **Username Conflict** (only on first share): `{ success: false, error: 'USERNAME_TAKEN', currentUsername: '...' }`
     - Show `UsernameConflictDialog` inline:
       - Title: "Username Already Taken"
       - Message: "The username '[username]' is already in use."
       - Input field pre-filled with current username (editable)
       - Suggest alternatives below input: "Try: username_1, username_2, username123"
       - Buttons: "Cancel" | "Save & Retry Share"
     - On save → Update localStorage → Auto-retry share action
     - User sees success dialog without leaving the page

### Commenting System (With Smart Username Conflict Handling)
1. Display all comments on shared hand detail page
2. Show "Add Comment" input field (always - username guaranteed)
3. Submit comment with username from localStorage
4. Server Action responses:
   - **Success**: `{ success: true, comment: {...} }`
     - Optimistic UI update (show comment immediately)
   - **Username Conflict** (rare): Same inline handling as share flow
     - Show `UsernameConflictDialog`
     - User edits username
     - Auto-retry comment submission
     - Comment appears without page reload

### Like System
- Uses device fingerprinting (cookie-based)
- No username required to like
- Toggle like/unlike with optimistic UI
- Show filled heart if user has liked
- Display like count badge

---

## File Structure (Modular Architecture)

```
src/
├── actions/                         # Server Actions (NEW)
│   ├── sharing/                     # Sharing feature actions
│   │   ├── shared-hands.ts          # Share hand, get shared hands
│   │   ├── comments.ts              # Add/get comments
│   │   └── likes.ts                 # Toggle/get likes
│   └── user/                        # Future: User management actions
│       └── profile.ts               # Username, settings (when auth added)
│
├── app/
│   ├── shared/
│   │   ├── page.tsx                 # Shared hands list page
│   │   └── [token]/page.tsx         # Shared hand detail page
│   └── explore/page.tsx             # Public feed (optional)
│
├── components/
│   ├── dialog/                      # Modal dialogs
│   │   ├── SetUsernameDialog.tsx   # ✅ Already created
│   │   ├── UsernameConflictDialog.tsx  # Username collision handler
│   │   ├── ShareSuccessDialog.tsx  # Share success with URL
│   │   └── ShareErrorDialog.tsx    # Generic share errors
│   │
│   └── shared/                      # Sharing feature components (NEW)
│       ├── buttons/                 # Action buttons
│       │   ├── ShareButton.tsx     # Share hand button
│       │   └── LikeButton.tsx      # Like/unlike button
│       │
│       ├── cards/                   # Card components
│       │   ├── SharedHandCard.tsx  # List view card
│       │   └── SharedHandHeader.tsx # Detail page header
│       │
│       └── comments/                # Comment system
│           ├── CommentSection.tsx  # Main comment container
│           ├── CommentList.tsx     # Display comments
│           ├── CommentItem.tsx     # Single comment
│           └── CommentInput.tsx    # Add comment input
│
├── hooks/                           # Custom hooks
│   ├── useOnlineStatus.ts           # ✅ Already exists - online/offline detection
│   ├── useShareHand.ts              # NEW: Share hand logic
│   ├── useSharedHand.ts             # NEW: Fetch single shared hand
│   ├── useSharedHands.ts            # NEW: Fetch shared hands list
│   ├── useComments.ts               # NEW: Comment CRUD
│   └── useLikes.ts                  # NEW: Like/unlike logic
│
├── lib/
│   ├── db/                          # Database layer (NEW)
│   │   ├── schema.ts                # Drizzle schema
│   │   ├── index.ts                 # DB client with connection pool
│   │   └── queries/                 # Reusable queries
│   │       ├── shared-hands.ts      # Hand queries
│   │       ├── comments.ts          # Comment queries
│   │       └── likes.ts             # Like queries
│   │
│   └── utils/                       # Utilities
│       ├── share-url.ts             # Generate share URLs
│       ├── username-suggestions.ts  # Username conflict suggestions
│       └── device-fingerprint.ts    # Device ID generation
│
├── services/                        # localStorage services (keep)
│   ├── session.service.ts
│   ├── tracked-hand.service.ts
│   └── shared-hand.service.ts       # Keep for backward compat
│
└── types/
    ├── poker-v2.ts                  # Existing types
    └── sharing.ts                   # NEW: Sharing-specific types
        └── SharedHand, Comment, Like interfaces

drizzle/                             # Database migrations (NEW)
└── migrations/

drizzle.config.ts                    # Drizzle config (NEW)
```

### Modular Design Principles
1. **Single Responsibility**: Each file has ONE clear purpose
2. **Small Components**: Max 150 lines per component
3. **Reusable Hooks**: Business logic in custom hooks
4. **Organized by Feature**: Group related components together
5. **Clear Naming**: File names match component/function names

---

## Environment Variables

```env
# Database (✅ Already configured in VPS)
DATABASE_URL="postgres://user:***@host:port/dbname"

# Production Best Practices:
# - Connection pooling: max 10 connections, 20s idle timeout
# - SSL enabled in production
# - Prepared statements disabled for serverless compatibility
# - pgvector extension enabled (✅ Already done)

# Future: Authentication (when needed)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="***"  # Generate with: openssl rand -base64 32
```

### Security Notes
- ✅ `.env` file already in `.gitignore`
- ✅ DATABASE_URL configured securely in VPS
- ✅ pgvector extension enabled in VPS database
- ⚠️ **NEVER** commit credentials to git or documentation
- ⚠️ Use environment variables for all secrets

---

## Migration Strategy: Adding Auth Later

### Step 1: Add Users Table
```typescript
// Add to schema.ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Step 2: Link Anonymous Data
```typescript
// Migration action
'use server';

export async function linkDeviceToUser(userId: string, deviceId: string) {
  // Update all anonymous shares from this device
  await db
    .update(sharedHands)
    .set({ userId })
    .where(eq(sharedHands.deviceId, deviceId));

  await db
    .update(comments)
    .set({ userId })
    .where(eq(comments.deviceId, deviceId));

  await db
    .update(likes)
    .set({ userId })
    .where(eq(likes.deviceId, deviceId));
}
```

### Step 3: Add Foreign Keys
```sql
ALTER TABLE shared_hands
  ADD CONSTRAINT fk_shared_hands_user
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE comments
  ADD CONSTRAINT fk_comments_user
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE likes
  ADD CONSTRAINT fk_likes_user
  FOREIGN KEY (user_id) REFERENCES users(id);
```

---

## Success Criteria

### MVP (No Auth)
- ✅ Share any hand → Get unique URL
- ✅ View shared hand with replay
- ✅ Add comments anonymously
- ✅ Like/unlike hands
- ✅ Public feed of recent shares

### Future (With Auth)
- User profiles
- Personal share history
- Follow/unfollow users
- Notifications
- Advanced analytics with pgvector

---

## Next Steps

### Immediate (Phase 1-3)
1. ✅ Review and approve this plan
2. Install dependencies: `npm install drizzle-orm postgres drizzle-kit nanoid sonner`
3. Create database schema (`src/lib/db/schema.ts` with 3 tables)
4. Set up connection pool (`src/lib/db/index.ts` with VPS DATABASE_URL)
5. Configure Drizzle migrations (`drizzle.config.ts`)
6. Run migrations: `npx drizzle-kit generate && npx drizzle-kit migrate`
7. Create Server Actions in `src/actions/sharing/` (shared-hands, comments, likes)
8. Create utility functions (device-fingerprint, share-url, username-suggestions)

### Core Implementation (Phase 4-8)
9. Build shared hands list page (`/app/shared/page.tsx`)
10. Build shared hand detail page (`/app/shared/[token]/page.tsx` - copy from tracked)
11. Create comments system (4 modular components + hook)
12. Create like system (button component + hook)
13. Create reusable ShareButton component
14. Implement username conflict handling dialog
15. Add ShareSuccessDialog with copy-to-clipboard

### Testing & Deployment (Phase 9-11)
16. Add error boundaries, loading states, toast notifications
17. Test all flows: sharing, comments, likes, username conflicts
18. Mobile responsiveness check (375px - 1024px+)
19. Accessibility audit (keyboard, screen readers, ARIA)
20. Update PWA cache, update DEVELOPMENT_GUIDE.md
21. Deploy to production and monitor database performance

**Estimated Timeline**: 3-5 days for MVP (phases 1-8), 1-2 days for testing/deployment (phases 9-11)

**Success Criteria**:
- ✅ Users can share hands publicly with unique URLs
- ✅ Anyone can view, like, and comment on shared hands
- ✅ Username system prevents conflicts gracefully
- ✅ Hand replay works seamlessly (reuses existing component)
- ✅ Mobile-optimized with proper offline handling
- ✅ Database performs well with connection pooling