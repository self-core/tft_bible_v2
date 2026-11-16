import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useContext } from 'react';
import { DndProvider } from './DndProvider';
import { DndContext, useDragSource, useDropTarget } from './hooks';
import type { DragPayload } from './hooks';

const payload: DragPayload = {
  kind: 'palette-champion',
  championId: 'TFT18_Akali',
  label: 'Akali',
  cost: 1,
  iconUrl: null,
  traits: ['Inferno', 'Ravager'],
};

interface HarnessProps {
  onDrop: (p: DragPayload) => void;
  onProbe?: (dragged: boolean) => void;
  handleTag?: 'div' | 'button';
  noDrag?: boolean;
}

function Harness({ onDrop, onProbe, handleTag = 'div', noDrag = false }: HarnessProps) {
  const { wasDragged } = useContext(DndContext);
  const { dragHandleProps } = useDragSource(() => payload);
  const { isOver, dropProps } = useDropTarget(onDrop);
  const handle = handleTag === 'button'
    ? <button data-testid="handle" {...dragHandleProps}>drag me</button>
    : (
      <div
        data-testid="handle"
        role="button"
        {...(noDrag ? { 'data-no-drag': true } : {})}
        {...dragHandleProps}
        onClick={() => onProbe?.(wasDragged())}
      >
        drag me
      </div>
    );

  return (
    <div data-testid="box" {...dropProps}>
      {handle}
      <span data-testid="over">{isOver ? 'over' : 'idle'}</span>
    </div>
  );
}

function renderHarness(props: HarnessProps, hitTest: () => Element[]) {
  return render(
    <DndProvider hitTest={hitTest}>
      <Harness {...props} />
    </DndProvider>,
  );
}

function boxHitTest(): Element[] {
  const box = screen.queryByTestId('box');
  return box ? [box] : [];
}

function pointerDown(x = 10, y = 10, pointerType = 'mouse') {
  fireEvent.pointerDown(screen.getByTestId('handle'), {
    button: 0, clientX: x, clientY: y, pointerId: 1, pointerType,
  });
}

function pointerMove(x: number, y: number, pointerType = 'mouse') {
  fireEvent.pointerMove(window, {
    clientX: x, clientY: y, pointerId: 1, pointerType,
  });
}

function pointerUp(x: number, y: number, pointerType = 'mouse') {
  fireEvent.pointerUp(window, {
    clientX: x, clientY: y, pointerId: 1, pointerType,
  });
}

describe('DndProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('pointerdown, move and up calls onDrop with the payload', () => {
    const onDrop = vi.fn();
    renderHarness({ onDrop }, boxHitTest);

    pointerDown();
    pointerMove(40, 40);
    expect(screen.getByTestId('over').textContent).toBe('over');

    pointerUp(40, 40);
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledWith(payload);
  });

  it('moving without release does not drop', () => {
    const onDrop = vi.fn();
    renderHarness({ onDrop }, boxHitTest);

    pointerDown();
    pointerMove(40, 40);
    pointerMove(60, 60);

    expect(onDrop).not.toHaveBeenCalled();
  });

  it('a click without movement does not drop (click passthrough)', () => {
    const onDrop = vi.fn();
    renderHarness({ onDrop }, boxHitTest);

    pointerDown(10, 10);
    pointerMove(11, 11);
    pointerUp(11, 11);

    expect(onDrop).not.toHaveBeenCalled();
  });

  it('works with pointerType touch', () => {
    const onDrop = vi.fn();
    renderHarness({ onDrop }, boxHitTest);

    pointerDown(10, 10, 'touch');
    pointerMove(50, 50, 'touch');
    pointerUp(50, 50, 'touch');

    expect(onDrop).toHaveBeenCalledWith(payload);
  });

  it('renders a ghost preview while dragging and removes it on release', () => {
    renderHarness({ onDrop: vi.fn() }, boxHitTest);

    expect(screen.queryByTestId('dnd-ghost')).toBeNull();
    pointerDown();
    pointerMove(40, 40);
    expect(screen.getByTestId('dnd-ghost')).toBeInTheDocument();

    pointerUp(40, 40);
    expect(screen.queryByTestId('dnd-ghost')).toBeNull();
  });

  it('does not drop when no target is under the pointer', () => {
    const onDrop = vi.fn();
    renderHarness({ onDrop }, () => []);

    pointerDown();
    pointerMove(40, 40);
    pointerUp(40, 40);

    expect(onDrop).not.toHaveBeenCalled();
  });

  it('does not start a drag from a button control', () => {
    const onDrop = vi.fn();
    renderHarness({ onDrop, handleTag: 'button' }, boxHitTest);

    pointerDown();
    pointerMove(40, 40);
    pointerUp(40, 40);

    expect(onDrop).not.toHaveBeenCalled();
    expect(screen.queryByTestId('dnd-ghost')).toBeNull();
  });

  it('does not start a drag from a data-no-drag control', () => {
    const onDrop = vi.fn();
    renderHarness({ onDrop, noDrag: true }, boxHitTest);

    pointerDown();
    pointerMove(40, 40);
    pointerUp(40, 40);

    expect(onDrop).not.toHaveBeenCalled();
  });

  it('suppresses the click synthesized by a drag but allows the next real click', () => {
    const onProbe = vi.fn();
    renderHarness({ onDrop: vi.fn(), onProbe }, boxHitTest);

    pointerDown();
    pointerMove(40, 40);
    pointerUp(40, 40);
    fireEvent.click(screen.getByTestId('handle'));
    expect(onProbe).toHaveBeenLastCalledWith(true);

    pointerDown(10, 10);
    pointerUp(10, 10);
    fireEvent.click(screen.getByTestId('handle'));
    expect(onProbe).toHaveBeenLastCalledWith(false);
  });
});
