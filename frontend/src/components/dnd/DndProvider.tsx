import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { DndContext } from './hooks';
import type { DragPayload, DndContextValue } from './hooks';
import { proxyUrl } from '../../lib/imageProxy';

interface DragSession {
  payload: DragPayload;
  startX: number;
  startY: number;
  moved: boolean;
  over: Element | null;
}

interface GhostState {
  payload: DragPayload;
  x: number;
  y: number;
  over: Element | null;
}

export interface DndProviderProps {
  children: ReactNode;
  hitTest?: (x: number, y: number) => Element[];
}

function defaultHitTest(x: number, y: number): Element[] {
  if (typeof document.elementsFromPoint !== 'function') return [];
  return document.elementsFromPoint(x, y);
}

const GHOST_SIZE = 48;

export function DndProvider({ children, hitTest }: DndProviderProps) {
  const targets = useRef(new Map<Element, (payload: DragPayload) => void>());
  const session = useRef<DragSession | null>(null);
  // A real drag is followed by a synthetic click; ignore that one but not later clicks.
  const suppressClickUntil = useRef(0);
  const hitTestRef = useRef(hitTest ?? defaultHitTest);
  hitTestRef.current = hitTest ?? defaultHitTest;

  const [ghost, setGhost] = useState<GhostState | null>(null);

  const registerTarget = useCallback((element: Element, onDrop: (payload: DragPayload) => void) => {
    targets.current.set(element, onDrop);
    return () => {
      targets.current.delete(element);
    };
  }, []);

  const beginDrag = useCallback((payload: DragPayload, event: React.PointerEvent) => {
    if (session.current) return;
    if (event.button != null && event.button !== 0) return;

    // A new pointerdown is a fresh interaction; only the click synthesized
    // right after a drag ends (no pointerdown in between) stays suppressed.
    suppressClickUntil.current = 0;

    const target = event.target as Element | null;
    if (target?.closest?.('button, [data-no-drag], input, textarea, select')) return;

    session.current = {
      payload,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      over: null,
    };
    setGhost({ payload, x: event.clientX, y: event.clientY, over: null });
  }, []);

  const wasDragged = useCallback(() => Date.now() < suppressClickUntil.current, []);

  useEffect(() => {
    const resolveTarget = (x: number, y: number): Element | null => {
      const elements = hitTestRef.current(x, y) ?? [];
      for (const element of elements) {
        const candidate = element.closest?.('[data-drop-target]');
        if (candidate && targets.current.has(candidate)) return candidate;
      }
      return null;
    };

    const onPointerMove = (event: PointerEvent) => {
      const current = session.current;
      if (!current) return;

      const distance = Math.hypot(event.clientX - current.startX, event.clientY - current.startY);
      if (distance >= 4) current.moved = true;

      const over = current.moved ? resolveTarget(event.clientX, event.clientY) : null;
      current.over = over;
      setGhost({ payload: current.payload, x: event.clientX, y: event.clientY, over });
    };

    const finish = (drop: boolean) => {
      const current = session.current;
      if (!current) return;

      session.current = null;
      if (current.moved) suppressClickUntil.current = Date.now() + 250;
      setGhost(null);

      if (drop && current.moved && current.over) {
        targets.current.get(current.over)?.(current.payload);
      }
    };

    const onPointerUp = () => finish(true);
    const onPointerCancel = () => finish(false);

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
    };
  }, []);

  const value = useMemo<DndContextValue>(() => ({
    beginDrag,
    registerTarget,
    overElement: ghost?.over ?? null,
    isDragging: ghost !== null,
    wasDragged,
  }), [beginDrag, registerTarget, ghost?.over, ghost !== null, wasDragged]);

  return (
    <DndContext.Provider value={value}>
      {children}
      {ghost && createPortal(
        <div
          data-testid="dnd-ghost"
          style={{
            position: 'fixed',
            left: ghost.x + 14,
            top: ghost.y + 14,
            width: GHOST_SIZE,
            height: GHOST_SIZE,
            pointerEvents: 'none',
            zIndex: 9999,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid #38bdf8',
            background: '#0f172a',
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
          }}
        >
          <span style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            color: 'white',
            fontSize: 12,
            fontWeight: 700,
          }}>
            {ghost.payload.label.slice(0, 3)}
          </span>
          {ghost.payload.iconUrl && (
            <img
              src={proxyUrl(ghost.payload.iconUrl)}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              draggable={false}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
        </div>,
        document.body,
      )}
    </DndContext.Provider>
  );
}

export default DndProvider;
