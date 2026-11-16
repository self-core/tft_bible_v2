import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefCallback } from 'react';

export interface DragPayload {
  kind: 'palette-champion' | 'board-unit' | 'bench-unit';
  championId: string;
  unitId?: string;
  label: string;
  cost: number;
  iconUrl?: string | null;
  traits: string[];
}

export interface DndContextValue {
  beginDrag: (payload: DragPayload, event: ReactPointerEvent) => void;
  registerTarget: (element: Element, onDrop: (payload: DragPayload) => void) => () => void;
  overElement: Element | null;
  isDragging: boolean;
  wasDragged: () => boolean;
}

export const DndContext = createContext<DndContextValue>({
  beginDrag: () => {},
  registerTarget: () => () => {},
  overElement: null,
  isDragging: false,
  wasDragged: () => false,
});

export interface DragHandleProps {
  onPointerDown: (event: ReactPointerEvent) => void;
  style: { touchAction: 'none' };
}

export function useDragSource(getPayload: () => DragPayload): {
  isDragging: boolean;
  wasDragged: () => boolean;
  dragHandleProps: DragHandleProps;
} {
  const ctx = useContext(DndContext);
  const payloadRef = useRef(getPayload);
  payloadRef.current = getPayload;

  const onPointerDown = useCallback((event: ReactPointerEvent) => {
    ctx.beginDrag(payloadRef.current(), event);
  }, [ctx]);

  return {
    isDragging: ctx.isDragging,
    wasDragged: ctx.wasDragged,
    dragHandleProps: { onPointerDown, style: { touchAction: 'none' } },
  };
}

export interface DropTargetProps {
  ref: RefCallback<Element>;
  'data-drop-target': 'true';
  'data-drop-registered': 'true';
}

export function useDropTarget(onDrop: (payload: DragPayload) => void): {
  isOver: boolean;
  dropProps: DropTargetProps;
} {
  const ctx = useContext(DndContext);
  const [element, setElement] = useState<Element | null>(null);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  const registerTarget = ctx.registerTarget;

  useEffect(() => {
    if (!element) return;
    return registerTarget(element, (payload) => onDropRef.current(payload));
  }, [element, registerTarget]);

  const ref = useCallback<RefCallback<Element>>((node) => {
    setElement(node);
  }, []);

  return {
    isOver: element !== null && ctx.overElement === element,
    dropProps: {
      ref,
      'data-drop-target': 'true',
      'data-drop-registered': 'true',
    },
  };
}
