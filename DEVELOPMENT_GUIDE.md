# Poker Notes PWA - Development Guide

## Project Overview
A Progressive Web App for tracking poker sessions, hands, and statistics. Built with Next.js 15, TypeScript, and Tailwind CSS.

## Architecture & Structure

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Storage**: Local storage (with future sync capability)
- **Icons**: Lucide React

### Key Directories
```
src/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout with global navigation
│   ├── page.tsx             # Home page with session overview
│   ├── create-session/      # Session creation wizard
│   ├── session/[id]/        # Individual session view
│   ├── sessions/            # All sessions list
│   ├── history/             # Hand history
│   └── account/             # User account
├── components/
│   ├── poker/
│   │   └── PokerTable.tsx   # Interactive table component
│   ├── navigation/
│   │   ├── AppHeader.tsx    # Top navigation
│   │   └── BottomNav.tsx    # Mobile bottom nav
│   ├── session/
│   │   └── SessionCard.tsx  # Session display cards
│   └── ui/                  # Shadcn UI components
├── hooks/
│   └── useSessions.tsx      # Session management
├── services/
│   └── poker.service.ts     # Data operations
└── types/
    └── poker.ts             # TypeScript interfaces
```

## Key Features Implemented

### 1. Navigation System
**Location**: Root layout with global navigation
- **AppHeader**: Top navigation with page titles, back buttons, online status
- **BottomNav**: Mobile-first bottom navigation
- **Layout**: Moved to `src/app/layout.tsx` for consistency across all pages

### 2. Poker Table Component (`src/components/poker/PokerTable.tsx`)
**Key Features**:
- Supports 2-10 player tables with proper positioning
- **Dealer Button**: Prominent Crown icon with enhanced yellow styling (border-4, shadow-xl, ring effects)
- **Position Labels**: Shows poker abbreviations (UTG, MP, CO, BTN, SB, BB) when dealer is set
- **Blind Selection**: Auto-selects big blind when small blind is clicked
- **Community Cards**: 5 interactive card slots with dropdown selectors (52-card deck)
- **Visual States**: Different colors for dealer, blinds, hero seat, and regular seats

**Usage**:
```tsx
<PokerTable
  seats={9}
  dealerSeat={0}
  smallBlindSeat={1}
  bigBlindSeat={2}
  selectedSeat={5}
  showPositions={true}
  showCommunityCards={true}
  onCommunityCardSelect={(cardIndex, card) => handleCardSelect(cardIndex, card)}
/>
```

### 3. Session Management
**Hook**: `src/hooks/useSessions.tsx`
**Features**:
- Local storage persistence
- CRUD operations for sessions
- Real-time updates across components
- Session state management (active/completed)

**Session Flow**:
1. **Create Session** → Multi-step wizard (details, blinds, seat selection)
2. **Active Sessions** → Show community cards and hand tracking
3. **Session View** → Full session details with poker table layout

### 4. Data Types (`src/types/poker.ts`)
**Key Interfaces**:
- `Session`: Core session data with positions, blinds, timing
- `Hand`: Individual hand tracking with actions and results  
- `User`: User account information
- `Currency`: Multi-currency support with symbols

## Recent Improvements Made

### Navigation Refactor
- **Problem**: Duplicate navigation components on each page
- **Solution**: Moved AppHeader and BottomNav to root layout
- **Files Modified**: All page components, `layout.tsx`

### Dealer Button Enhancement  
- **Problem**: Dealer button not visible or prominent enough
- **Solution**: Enhanced styling with ring effects, proper positioning logic
- **Key Changes**: 
  - Added `dealerSeat` prop to create-session page
  - Enhanced CSS with `ring-4 ring-yellow-200`, `border-4`, `shadow-xl`
  - Crown icon for clear identification

### Community Cards System
- **Feature**: 5 interactive card slots in table center
- **Implementation**: Dropdown menus with full 52-card deck
- **Cards**: Proper suit symbols (♠♥♦♣) with red/black coloring
- **Integration**: Only shows on active sessions

### Quick Session Creation
- **Problem**: Too many required fields slowing down session creation
- **Solution**: Smart defaults for common values
- **Defaults**:
  - Name: "Poker Session [Date]"
  - Buy-in: $100
  - Location: "Home Game"
  - Blinds: $1/$2
  - Seats: 9 players

## Development Workflow

### Running the App
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### Key Commands
- **Server**: http://localhost:3000
- **Build Output**: `.next/` directory
- **Static Assets**: `public/` directory

## Component Patterns

### Form Handling
```tsx
const [formData, setFormData] = useState<FormType>({
  // Default values for quick setup
});

const handleSubmit = async (data: FormType) => {
  // Validation and submission
};
```

### Local Storage Integration  
```tsx
const { sessions, createSession, updateSession, deleteSession } = useSessions();
```

### Table Position Logic
```tsx
// Dealer is always one seat before small blind
const dealerSeat = (smallBlindSeat - 1 + totalSeats) % totalSeats;

// Position calculation from dealer
const getPositionAbbreviation = (seatIndex: number) => {
  const positionsFromDealer = (seatIndex - dealerSeat + seats) % seats;
  // Return UTG, MP, CO, BTN, SB, BB based on table size
};
```

## Future Development Areas

### Immediate Next Steps
1. **Hand Tracking**: Implement actual hand recording during sessions
2. **Community Card Persistence**: Save selected cards to session data
3. **Statistics Dashboard**: Advanced analytics and charts
4. **Export Features**: CSV/PDF export of session data

### Architecture Improvements
1. **Database Integration**: Replace local storage with proper database
2. **User Authentication**: Add login/signup functionality  
3. **Real-time Sync**: Multi-device synchronization
4. **PWA Features**: Offline support, push notifications

### UI/UX Enhancements
1. **Animations**: Smooth transitions for card dealing, position changes
2. **Responsive Design**: Better tablet and desktop layouts
3. **Accessibility**: ARIA labels, keyboard navigation
4. **Theming**: Dark mode support

## Troubleshooting

### Common Issues
1. **Navigation Duplication**: Check if pages still have individual AppHeader/BottomNav
2. **Dealer Button Missing**: Ensure `dealerSeat` prop is passed to PokerTable
3. **Fast Refresh Warnings**: Normal during development, ignore unless persistent
4. **TypeScript Errors**: Check interface imports and prop types

### Development Tips
1. **Use TodoWrite tool** for tracking multi-step tasks
2. **Test on mobile** - this is a mobile-first PWA
3. **Check console** for any runtime errors
4. **Validate forms** before submission

## Code Style Guidelines
- **Components**: PascalCase (PokerTable.tsx)
- **Hooks**: camelCase with 'use' prefix (useSessions)  
- **Types**: PascalCase interfaces in poker.ts
- **Styling**: Tailwind CSS classes, mobile-first responsive
- **Icons**: Lucide React components with consistent sizing

This guide should provide all the context needed to continue development efficiently!