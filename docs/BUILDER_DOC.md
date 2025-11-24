# TFT Team Builder Component Documentation

## Overview
The TFT Team Builder is the core interactive component of the TFT Bible application. It allows users to visually construct team compositions for Teamfight Tactics, with support for different game sets including the upcoming Lore & Legends (Set 16).

## Features
- Interactive game board (4x7 grid) for placing champions
- Bench (9 slots) for spare champions
- Set-specific champion selection
- Real-time trait calculation and visualization
- Composition statistics
- Responsive and modern UI/UX

## Component Structure

### File Location
`/frontend/src/components/Builder/Builder.tsx`

### Dependencies
- React (v18+)
- TypeScript
- Tailwind CSS
- Lucide React (for icons)
- React Query (for data fetching)

## State Management

### Board State
```typescript
interface BoardSlot {
  champion: Champion | null;
  position: { row: number; col: number };
}
```
- Tracks champions placed on the 4x7 game board
- Manages positioning and interactions

### Bench State
```typescript
const [bench, setBench] = useState<Champion[]>(Array(9).fill(null));
```
- Tracks champions on the bench
- Allows for 9 spare champions

### Selected Champion
```typescript
const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null);
```
- Tracks the currently selected champion in the picker

### Selected Set
```typescript
const [selectedSet, setSelectedSet] = useState<Set | null>(null);
```
- Tracks the currently active TFT set
- Filters champions and traits by set

## API Integration

### Endpoints Used
- `/api/v1/sets` - Fetch available TFT sets
- `/api/v1/sets/active` - Fetch the currently active set
- `/api/v1/champions?set={set_name}` - Fetch champions for selected set
- `/api/v1/traits?set={set_name}` - Fetch traits for selected set

### Data Fetching
Uses React Query for efficient data fetching and caching:
```typescript
const { data: sets, isLoading: setsLoading } = useQuery<Set[]>({
  queryKey: ['sets'],
  queryFn: () => api.get('/api/v1/sets'),
});

const { data: champions, isLoading: championsLoading } = useQuery<Champion[]>({
  queryKey: ['champions', selectedSet?.id],
  queryFn: () => {
    const params = selectedSet ? { set: selectedSet.name } : {};
    return api.get('/api/v1/champions', { params });
  },
});
```

## UI/UX Features

### Responsive Layout
- 3-column layout on large screens (lg+)
- Single column layout on smaller screens
- Adapts to different device sizes

### Champion Picker
- Grid layout showing all available champions for the selected set
- Color-coded star ratings (1-5 stars)
- Hover and selection states
- Scrollable container for large champion lists

### Trait Display
- Visual indicators for active traits
- Shows trait name, count, and active status
- Green background for active traits, gray for inactive

### Composition Statistics
- Champions on board count
- Champions on bench count
- Active traits count
- Total cost calculation

### Interactive Elements
- Click to place/remove champions on board
- Visual feedback for selections
- Smooth transitions and hover effects
- Rotation option for champion images

## Functionality

### Champion Placement
1. User selects a champion from the picker
2. The champion becomes "selected" with visual highlighting
3. User clicks on an empty board slot
4. Champion is placed on the board at that position
5. If user clicks on a slot with a champion, it removes the champion

### Trait Calculation
The component continuously calculates active traits based on:
1. Champions placed on the board
2. Champions placed on the bench
3. Trait activation thresholds from the API data

```typescript
const calculateTraits = useCallback(() => {
  const championTraits = new Map<string, number>();

  // Count traits from board
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const slot = board[row][col];
      if (slot.champion) {
        slot.champion.traits?.forEach(traitName => {
          championTraits.set(traitName, (championTraits.get(traitName) || 0) + 1);
        });
      }
    }
  }
  // ... rest of calculation
}, [board, bench, traits]);
```

### Set Filtering
- Dropdown selector for choosing the TFT set
- Dynamically loads champions and traits for the selected set
- Maintains compatibility with new sets like Lore & Legends (Set 16)

## Component Architecture

### Main Rendering
```jsx
return (
  <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
    {/* Header */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left panel - Set selector and champion picker */}
      <div className="lg:col-span-3 space-y-4">
        {renderSetSelector()}
        {renderChampionPicker()}
        {renderTraitsPanel()}
      </div>

      {/* Center panel - Board and bench */}
      <div className="lg:col-span-6 flex flex-col items-center space-y-6">
        {/* Game board */}
      </div>

      {/* Right panel - Stats and instructions */}
      <div className="lg:col-span-3 space-y-4">
        {/* Stats display */}
      </div>
    </div>
  </div>
);
```

## Styling

### CSS Framework
- Tailwind CSS for rapid UI development
- Custom component classes for consistent styling
- Responsive utility classes for different screen sizes

### Color Scheme
- Primary: Blue for active/hover states
- Secondary: Green for positive actions
- Tertiary: Red for destructive actions
- Neutrals: Grays for backgrounds and text

### Interactive States
- Hover effects on buttons and selectable items
- Focus states for accessibility
- Active/selected states for chosen champions
- Loading states for API requests

## Accessibility

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Focus indicators for selection
- Logical tab order

### Screen Reader Support
- Proper heading hierarchy (h1, h2, h3)
- Semantic HTML elements
- ARIA labels where necessary

## Performance Optimization

### React Query Caching
- Automatic caching of API responses
- Background updates
- Optimistic updates

### Memoization
- `useCallback` for stable function references
- Dependency arrays to prevent unnecessary re-renders

### Virtualization
- Scrollable areas for champion lists
- Efficient rendering of board grid

## Future Enhancements

### Planned Features
- Drag and drop for champion placement
- Import/export of compositions
- Champion ability information
- Item assignment to champions
- Advanced trait visualization
- Composition sharing
- Version history for compositions

### Potential Improvements
- Mobile touch optimization
- Keyboard shortcuts
- Undo/redo functionality
- Multiple board save states
- Champion synergy highlighting
- Champion ability visualization