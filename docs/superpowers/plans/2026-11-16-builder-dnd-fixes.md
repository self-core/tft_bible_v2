# Composition Builder DnD + Bench Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken raw HTML5 drag-and-drop with a pointer-events DnD layer that works on mouse and touch, make every part of a hex a valid drop target with ghost preview and hover highlight, add a bench so overflow units are never silently dropped, and add unit item-assignment UI.

**Architecture:** A small self-contained DnD module (`DndProvider` + two hooks) built on pointer events with an injectable hit-test seam for jsdom testing. `TFTBoard` consumes it: each cell (background + unit) is one drop target, palette sources live in `ImprovedTeamBuilder`. Bench uses `row = -1` so the `BoardChampion` model and persistence stay unchanged.

**Tech Stack:** React 18 + TS, pointer events, vitest + RTL (jsdom), Playwright for touch smoke. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-16-sandbox-combat-simulator-design.md` (Approaches §4). The sandbox (Plan 3) reuses this DnD layer and the bench convention.

## Global Constraints

- Conventional Commits (`feat:`, `fix:`, `test:`, `chore:`).
- Frontend tests: `cd frontend && npm run test` (vitest + jsdom); lint zero warnings; no new dependencies.
- `react-dnd` and `react-dnd-html5-backend` are dead deps — removed in this plan's final task.
- Board grid: 4 rows × 7 cols (`BOARD_ROWS`, `BOARD_COLS` in `TFTBoard.tsx`); bench = 9 slots, `row: -1`, `col: 0..8`.
- `BoardChampion` interface shape stays as-is (new fields only, all optional).
- Do not modify `frontend/src/pages/CompositionBuilder.tsx` (stub with mock data; `ImprovedTeamBuilder` is the real builder).

## Review Focus

1. **Drop coverage** — dropping onto a hex occupied by a unit must swap/place, not fail; the old bug was drop only registering on the exposed sliver. Test: `drops palette champion onto occupied hex` (Task 2).
2. **Touch** — pointer events must fire the same flow for `pointerType: 'touch'`; a user on mobile expects drag to work without HTML5 DnD. Test: `drag works with pointerType touch` (Task 1).
3. **Traits preservation** — placing from palette must carry the champion's `traits` (old bug set `traits: []`), which the trait tracker depends on. Test: `palette drop preserves traits` (Task 2).
4. **Overflow honesty** — the count label says `n / 28`; placing a 29th+ unit must land on the bench, never vanish. Test: `units beyond 28 go to bench` (Task 2).
5. **Click vs drag conflict** — star/remove buttons and the unit-config popover must not be hijacked by drag capture; a click on a button must not start a drag. Test: `click on unit button does not start drag` (Task 1).

---

### Task 1: Pointer-events DnD layer

**Files:**
- Create: `frontend/src/components/dnd/DndProvider.tsx`
- Create: `frontend/src/components/dnd/hooks.ts`
- Test: `frontend/src/components/dnd/DndProvider.test.tsx` (create)

**Interfaces:**
- Produces (Tasks 2–3 and Plan 3 consume):
  ```tsx
  export interface DragPayload {
    kind: 'palette-champion' | 'board-unit' | 'bench-unit';
    championId: string;
    unitId?: string;        // present when kind is board-unit | bench-unit
    label: string;
    cost: number;
    iconUrl?: string | null;
    traits: string[];
  }
  export function DndProvider(props: { children: ReactNode;
    hitTest?: (x: number, y: number) => Element[]; }): JSX.Element
  export function useDragSource(getPayload: () => DragPayload): {
    isDragging: boolean;
    dragHandleProps: {
      onPointerDown: (e: React.PointerEvent) => void;
      style: { touchAction: 'none' };
    };
  }
  export function useDropTarget(onDrop: (payload: DragPayload) => void): {
    isOver: boolean;
    dropProps: { 'data-drop-target': 'true'; 'data-drop-registered': 'true' };
  }
  ```
- Mechanics (the one algorithm that needs spelling out): `onPointerDown` (primary button only) → begin drag, store payload; on `pointermove` over `window` → update ghost position and call `hitTest(e.clientX, e.clientY)` → find the first element whose `closest('[data-drop-target]')` exists → mark that target `isOver`, clear the previous; on `pointerup`/`pointercancel` → if a target is hovered, call its `onDrop(payload)`; end drag. Ghost is a fixed-position `<div>` (48px round image + label) in a portal following the cursor. Dragging is cancelled if the pointer travels < 4px and is released without leaving — that click must not call `onDrop`.

- [ ] **Step 1: Write the failing tests**

```tsx
// frontend/src/components/dnd/DndProvider.test.tsx
// Harness with injected hitTest (jsdom has no layout).
let fakeTargets: Map<Element, { onDrop: (p: DragPayload) => void }>;

function Harness({ payload }: { payload: DragPayload }) {
  const { dragHandleProps } = useDragSource(() => payload);
  const { isOver, dropProps } = useDropTarget((p) => calls.push(p));
  return (
    <div {...dropProps} ref={(el) => { if (el) fakeTargets.set(el, { onDrop: () => {} }); }}>
      <button {...dragHandleProps} data-testid="handle">drag me</button>
      <span data-testid="over">{isOver ? 'over' : 'idle'}</span>
    </div>
  );
}
```

Tests: (a) `pointerdown → move → up calls onDrop with payload`; (b) `pointermove without release does not call onDrop`; (c) `release without movement calls nothing (click passthrough)`; (d) `drag works with pointerType touch`; (e) `ghost preview renders while dragging` (assert `data-testid="dnd-ghost"` present during drag, absent after); (f) `no target under pointer → onDrop not called`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- DndProvider`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** per Mechanics above. Fire RTL events via `fireEvent.pointerDown(handle, { clientX, clientY, pointerId: 1, button: 0, pointerType: 'mouse' })` etc. The provider sets `document.body.style` nothing — all positioning is the ghost div.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test -- DndProvider`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/dnd/DndProvider.tsx frontend/src/components/dnd/hooks.ts frontend/src/components/dnd/DndProvider.test.tsx
git commit -m "feat(dnd): pointer-events drag layer with ghost and touch support"
```

---

### Task 2: TFTBoard consumes the DnD layer + bench

**Files:**
- Modify: `frontend/src/components/TFTBoard.tsx`
- Test: `frontend/src/components/TFTBoard.test.tsx` (extend)

**Interfaces:**
- Consumes: `useDragSource`/`useDropTarget`/`DragPayload` (Task 1).
- Produces: `BoardChampion` gains optional `traits` handling only where already present; bench units are `BoardChampion` with `row: -1`, `col: 0..8`. `autoPlaceChampions` signature unchanged but overflow is appended to bench (`row: -1`) instead of being lost. New optional prop `showBench?: boolean` (default `true` in edit mode).

- [ ] **Step 1: Write the failing tests**

Add to `frontend/src/components/TFTBoard.test.tsx` (mock the dnd hooks module with a controllable fake: `vi.mock('../components/dnd/hooks')` — or drive through the real provider with injected `hitTest`; the test file picks the simplest one that reaches assertions):

```tsx
// (a) drop onto occupied hex swaps units — simulate drop payload {kind:'board-unit', unitId:'u1'} on cell 2,3 which holds 'u2'
expect(boardAfter).toMatchObject([{ id: 'u1', row: 2, col: 3 }, { id: 'u2', row: 1, col: 2 }]);

// (b) palette drop preserves traits
drop({ kind: 'palette-champion', championId: 'TFT18_X', traits: ['Wisp', 'Mage'] });
expect(boardAfter.find(u => u.championId === 'TFT18_X').traits).toEqual(['Wisp', 'Mage']);

// (c) overflow: 30 units → 28 placed, 2 with row: -1
// (d) bench render: 9 bench hexes exist; dragging bench-unit onto board cell moves it (row set), board-unit onto bench sets row: -1
// (e) hover highlight: hovered cell polygon has data-highlight="true" during drag
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- TFTBoard`
Expected: FAIL.

- [ ] **Step 3: Implement**

- Wrap each cell (background polygon + unit `<g>`) in `<g data-drop-target>` registered via `useDropTarget` at the cell level so any point within the cell — including over the unit — resolves to that cell. Hover highlight: `isOver` adds a `stroke="#38bdf8" strokeWidth="3"` overlay polygon.
- Delete all `onDragStart`/`onDrop`/`onDragOver` HTML5 handlers and the invisible drag `rect`; the unit `<g>` itself gets `dragHandleProps` (buttons inside keep `e.stopPropagation()` — see Task 1 constraint 5: buttons check `e.button === 0` and stop propagation before the drag handle's `onPointerDown` sees it; implement by having provider ignore drags started on elements matching `button, [data-no-drag]` via `e.target.closest`).
- Bench: render 9 hexes below the board (same hex geometry, `row = -1`), each a drop target; bench units render with the same unit renderer minus stars-glow.
- `autoPlaceChampions`: after filling the grid, remaining units get `row: -1` and successive free bench cols.
- Count label shows `${placed on grid} / 28` plus bench count when > 0.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test`
Expected: PASS (full suite — existing TFTBoard tests updated in this task's test step).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/TFTBoard.tsx frontend/src/components/TFTBoard.test.tsx
git commit -m "fix(builder): full-cell drop targets, bench, touch DnD on board"
```

---

### Task 3: Builder palette + unit item assignment

**Files:**
- Modify: `frontend/src/pages/ImprovedTeamBuilder.tsx`
- Create: `frontend/src/components/UnitConfigPopover.tsx`
- Test: `frontend/src/pages/ImprovedTeamBuilder.test.tsx` (create)

**Interfaces:**
- Consumes: `useDragSource` (Task 1), `useChampionsStore`, items store (`frontend/src/stores/` — whichever store the Items page uses; confirm the exact export before writing the test).
- Produces: `UnitConfigPopover(props: { unit: BoardChampion; availableItems: Item[]; onChange: (unit: BoardChampion) => void; onClose: () => void })` — star cycle button, three item slots, item picker (searchable list, first 20 by name match), remove button. Max 3 items enforced.

- [ ] **Step 1: Write the failing tests**

```tsx
// frontend/src/pages/ImprovedTeamBuilder.test.tsx
// (a) clicking a placed unit opens UnitConfigPopover (data-testid="unit-config")
// (b) assigning an item updates unit.items to length 1
// (c) assigning a 4th item is prevented (list disabled / no-op)
// (d) palette tile starts drag through DnD layer (assert via mocked hook payload kind 'palette-champion' with traits from store)
// (e) clicking "Clear Board" empties board and bench
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- ImprovedTeamBuilder`
Expected: FAIL.

- [ ] **Step 3: Implement** — palette tiles use `useDragSource` (payload includes `traits: champion.traits`); board `editMode` click on unit opens the popover; popover calls `onChange` and the page maps it into `boardChampions`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/ImprovedTeamBuilder.tsx frontend/src/components/UnitConfigPopover.tsx frontend/src/pages/ImprovedTeamBuilder.test.tsx
git commit -m "feat(builder): unit item assignment and palette DnD payloads"
```

---

### Task 4: Dead-dependency cleanup + e2e smoke

**Files:**
- Modify: `frontend/package.json` (remove `react-dnd`, `react-dnd-html5-backend`, `@types/react-dnd`)
- Create: `frontend/e2e/builder-dnd.spec.ts`
- Modify: `frontend/src/components/ThemeSwitcher.tsx`, `frontend/src/contexts/ThemeContext.tsx`, `frontend/src/pages/CompositionDetail.tsx`, `frontend/src/pages/DetailedChampions.tsx`, `frontend/src/pages/SetDetail.tsx`, `frontend/src/stores/championsStore.ts` — only as needed to keep `npm run lint` green after dep removal (these are already-dirty working-tree files; touch only if lint/type errors implicate the removed deps).

**Interfaces:**
- Consumes: everything above, plus the Playwright config's existing browser projects (desktop + mobile).

- [ ] **Step 1: Write the failing e2e spec**

```ts
// frontend/e2e/builder-dnd.spec.ts
// Desktop: navigate to /builder (mock vite config), wait for champions, drag first palette tile onto a board cell (mouse down/move/up), assert unit appears in board region.
// Mobile project: same flow via touch events (dispatchEvent touchstart/touchmove/touchend on tile, then on board cell) — assert unit placed.
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd frontend && npm run test:e2e -- builder-dnd`
Expected: FAIL (no HTML5-free drag path for touch yet, or palette payload missing).

- [ ] **Step 3: Remove dead deps and fix fallout**

`npm uninstall react-dnd react-dnd-html5-backend @types/react-dnd` in `frontend/`; run `npm run lint` and `npm run test`; fix any imports referencing react-dnd (grep first: expected none).

- [ ] **Step 4: Run e2e to verify it passes**

Run: `cd frontend && npm run test:e2e -- builder-dnd`
Expected: PASS on desktop and mobile projects.

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/e2e/builder-dnd.spec.ts
git commit -m "chore(builder): remove react-dnd dead deps, add drag e2e smoke"
```
