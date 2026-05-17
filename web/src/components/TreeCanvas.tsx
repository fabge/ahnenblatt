import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CARD_W, CARD_H } from '../layout';
import type { TreeLayout } from '../layout';
import { fullName, shortLife, initials } from '../types';
import type { Person } from '../types';
import { useStore } from '../store';

interface Props {
  layout: TreeLayout;
  persons: Record<string, Person>;
  mode: string;
  onPersonTap: (id: string) => void;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 4;

export function TreeCanvas({ layout, persons, mode, onPersonTap }: Props) {
  const { getCanvas, setCanvas, getPhotoUrl, prefs } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // View state (canvas viewport): scale and translation in container px.
  const [vs, setVs] = useState(() => getCanvas(mode));
  // Keep ref of latest vs so pointer handlers don't capture stale state.
  const vsRef = useRef(vs);
  vsRef.current = vs;

  // Persist viewport changes to store.
  useEffect(() => {
    setCanvas(mode, vs);
  }, [vs, mode, setCanvas]);

  // When mode or layout changes, hydrate from store.
  useEffect(() => {
    setVs(getCanvas(mode));
    // intentionally only on mode change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Center on first show.
  useLayoutEffect(() => {
    if (vs.centered) return;
    const el = containerRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (cw === 0 || ch === 0) return;
    const scale = Math.min(cw / layout.width, ch / layout.height, 1) * 0.95;
    const tx = (cw - layout.width * scale) / 2;
    const ty = (ch - layout.height * scale) / 2;
    setVs({ scale, tx, ty, centered: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, mode]);

  // Pointer / pinch handling
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const gesture = useRef<{
    mode: 'none' | 'pan' | 'pinch';
    startTx: number;
    startTy: number;
    startScale: number;
    startCenter: { x: number; y: number };
    startDist: number;
  }>({
    mode: 'none', startTx: 0, startTy: 0, startScale: 1,
    startCenter: { x: 0, y: 0 }, startDist: 0,
  });

  function centerOf(): { x: number; y: number } {
    const pts = Array.from(pointers.current.values());
    if (pts.length === 0) return { x: 0, y: 0 };
    const sum = pts.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / pts.length, y: sum.y / pts.length };
  }
  function distOf(): number {
    const pts = Array.from(pointers.current.values());
    if (pts.length < 2) return 0;
    const dx = pts[0].x - pts[1].x;
    const dy = pts[0].y - pts[1].y;
    return Math.hypot(dx, dy);
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      gesture.current = {
        mode: 'pan',
        startTx: vsRef.current.tx,
        startTy: vsRef.current.ty,
        startScale: vsRef.current.scale,
        startCenter: { x: e.clientX, y: e.clientY },
        startDist: 0,
      };
    } else if (pointers.current.size === 2) {
      gesture.current = {
        mode: 'pinch',
        startTx: vsRef.current.tx,
        startTy: vsRef.current.ty,
        startScale: vsRef.current.scale,
        startCenter: centerOf(),
        startDist: distOf(),
      };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (gesture.current.mode === 'pan' && pointers.current.size === 1) {
      const dx = e.clientX - gesture.current.startCenter.x;
      const dy = e.clientY - gesture.current.startCenter.y;
      setVs((s) => ({ ...s, tx: gesture.current.startTx + dx, ty: gesture.current.startTy + dy }));
    } else if (gesture.current.mode === 'pinch' && pointers.current.size >= 2) {
      const newCenter = centerOf();
      const newDist = distOf();
      if (gesture.current.startDist <= 0) return;
      const ratio = newDist / gesture.current.startDist;
      const newScale = clamp(gesture.current.startScale * ratio, MIN_SCALE, MAX_SCALE);
      // Keep startCenter point stable in world coords; also translate to follow finger center.
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      // Convert start center (screen) to world via start scale/tx
      const worldX = (gesture.current.startCenter.x - rect.left - gesture.current.startTx) / gesture.current.startScale;
      const worldY = (gesture.current.startCenter.y - rect.top - gesture.current.startTy) / gesture.current.startScale;
      const tx = newCenter.x - rect.left - worldX * newScale;
      const ty = newCenter.y - rect.top - worldY * newScale;
      setVs({ scale: newScale, tx, ty, centered: true });
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 1) {
      // Resume single-pointer pan with current finger.
      const remaining = Array.from(pointers.current.values())[0];
      gesture.current = {
        mode: 'pan',
        startTx: vsRef.current.tx,
        startTy: vsRef.current.ty,
        startScale: vsRef.current.scale,
        startCenter: remaining,
        startDist: 0,
      };
    } else if (pointers.current.size === 0) {
      gesture.current.mode = 'none';
    }
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const factor = Math.exp(-e.deltaY * 0.0015);
    const newScale = clamp(vsRef.current.scale * factor, MIN_SCALE, MAX_SCALE);
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const worldX = (px - vsRef.current.tx) / vsRef.current.scale;
    const worldY = (py - vsRef.current.ty) / vsRef.current.scale;
    const tx = px - worldX * newScale;
    const ty = py - worldY * newScale;
    setVs({ scale: newScale, tx, ty, centered: true });
  }

  function onDoubleClick() {
    setVs({ scale: 1, tx: 0, ty: 0, centered: false });
  }

  return (
    <div
      ref={containerRef}
      className="tree-canvas"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      onDoubleClick={onDoubleClick}
    >
      <div
        className="tree-world"
        style={{
          width: layout.width,
          height: layout.height,
          transform: `translate3d(${vs.tx}px, ${vs.ty}px, 0) scale(${vs.scale})`,
          transformOrigin: '0 0',
        }}
      >
        <svg width={layout.width} height={layout.height} className="tree-links">
          {layout.links.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
          ))}
        </svg>
        {layout.nodes.map((n) => {
          const p = persons[n.personId];
          if (!p) return null;
          return (
            <TreeCard
              key={`${n.personId}-${n.x}-${n.y}`}
              person={p}
              x={n.x}
              y={n.y}
              onTap={() => onPersonTap(p.id)}
              getPhotoUrl={getPhotoUrl}
              showLifeData={prefs.showLifeData}
            />
          );
        })}
      </div>
    </div>
  );
}

function TreeCard({
  person,
  x,
  y,
  onTap,
  getPhotoUrl,
  showLifeData,
}: {
  person: Person;
  x: number;
  y: number;
  onTap: () => void;
  getPhotoUrl: (path: string) => Promise<string | null>;
  showLifeData: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (person.photoPath) {
      getPhotoUrl(person.photoPath).then((u) => { if (!cancelled) setUrl(u); });
    } else { setUrl(null); }
    return () => { cancelled = true; };
  }, [person.photoPath, getPhotoUrl]);

  const life = shortLife(person);

  return (
    <button
      className="tree-card"
      style={{ left: x - CARD_W / 2, top: y - CARD_H / 2, width: CARD_W, height: CARD_H }}
      onClick={onTap}
    >
      <div className="tree-card-photo">
        {url ? <img src={url} alt="" /> : <span className="initials">{initials(person)}</span>}
      </div>
      <div className="tree-card-text">
        <div className="tree-card-name">{fullName(person)}</div>
        {showLifeData && life && <div className="tree-card-sub">{life}</div>}
      </div>
    </button>
  );
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
