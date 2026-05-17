import { useEffect, useMemo, useRef, useState } from 'react';
import { CARD_W, CARD_H } from '../layout';
import type { TreeLayout } from '../layout';
import { fullName, shortLife, initials } from '../types';
import type { Person } from '../types';
import { useStore } from '../store';
import type { CanvasState } from '../store';

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
  const worldRef = useRef<HTMLDivElement>(null);

  // Settled view state — drives initial render & is persisted to store.
  const [vs, setVs] = useState(() => getCanvas(mode));
  // Live view state — mutated on every pointer/wheel event without re-rendering.
  const liveVsRef = useRef<CanvasState>(vs);

  function applyTransform(s: CanvasState) {
    liveVsRef.current = s;
    const w = worldRef.current;
    if (w) w.style.transform = `translate3d(${s.tx}px, ${s.ty}px, 0) scale(${s.scale})`;
  }

  // Sync live ref + DOM whenever state-driven vs changes (initial, hydration, centering).
  useEffect(() => {
    applyTransform(vs);
  }, [vs]);

  // Persist settled viewport.
  useEffect(() => {
    setCanvas(mode, vs);
  }, [vs, mode, setCanvas]);

  // When mode or layout dimensions change, hydrate from store.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setVs(getCanvas(mode));
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, layout.width, layout.height]);

  // Reset centered flag whenever the layout changes (new root, mode, generations, or dimensions).
  const prevLayoutRef = useRef<TreeLayout | null>(null);
  useEffect(() => {
    if (prevLayoutRef.current !== layout) {
      prevLayoutRef.current = layout;
      setVs((s) => ({ ...s, centered: false }));
    }
  }, [layout]);

  // Center on first show.
  useEffect(() => {
    if (vs.centered) return;
    const el = containerRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (cw === 0 || ch === 0) return;
    const scale = Math.min(cw / layout.width, ch / layout.height, 1) * 0.95;
    const tx = (cw - layout.width * scale) / 2;
    const ty = (ch - layout.height * scale) / 2;
    const id = requestAnimationFrame(() => {
      setVs({ scale, tx, ty, centered: true });
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, mode]);

  // Precompute the link path string once per layout (one DOM node instead of N).
  const linksPath = useMemo(
    () => layout.links.map((l) => `M${l.x1} ${l.y1}L${l.x2} ${l.y2}`).join(''),
    [layout.links],
  );

  // Debounced commit for wheel events (no clean pointerup signal).
  const wheelCommitRef = useRef<number | null>(null);
  function scheduleCommit() {
    if (wheelCommitRef.current != null) window.clearTimeout(wheelCommitRef.current);
    wheelCommitRef.current = window.setTimeout(() => {
      wheelCommitRef.current = null;
      setVs(liveVsRef.current);
    }, 200);
  }
  useEffect(() => () => {
    if (wheelCommitRef.current != null) window.clearTimeout(wheelCommitRef.current);
  }, []);

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
  const pannedRef = useRef(false);

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
    pannedRef.current = false;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const cur = liveVsRef.current;
    if (pointers.current.size === 1) {
      gesture.current = {
        mode: 'pan',
        startTx: cur.tx,
        startTy: cur.ty,
        startScale: cur.scale,
        startCenter: { x: e.clientX, y: e.clientY },
        startDist: 0,
      };
    } else if (pointers.current.size === 2) {
      gesture.current = {
        mode: 'pinch',
        startTx: cur.tx,
        startTy: cur.ty,
        startScale: cur.scale,
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
      if (Math.hypot(dx, dy) > 5) pannedRef.current = true;
      applyTransform({
        ...liveVsRef.current,
        tx: gesture.current.startTx + dx,
        ty: gesture.current.startTy + dy,
      });
    } else if (gesture.current.mode === 'pinch' && pointers.current.size >= 2) {
      pannedRef.current = true;
      const newCenter = centerOf();
      const newDist = distOf();
      if (gesture.current.startDist <= 0) return;
      const ratio = newDist / gesture.current.startDist;
      const newScale = clamp(gesture.current.startScale * ratio, MIN_SCALE, MAX_SCALE);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const worldX = (gesture.current.startCenter.x - rect.left - gesture.current.startTx) / gesture.current.startScale;
      const worldY = (gesture.current.startCenter.y - rect.top - gesture.current.startTy) / gesture.current.startScale;
      const tx = newCenter.x - rect.left - worldX * newScale;
      const ty = newCenter.y - rect.top - worldY * newScale;
      applyTransform({ scale: newScale, tx, ty, centered: true });
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 1) {
      const remaining = Array.from(pointers.current.values())[0];
      const cur = liveVsRef.current;
      gesture.current = {
        mode: 'pan',
        startTx: cur.tx,
        startTy: cur.ty,
        startScale: cur.scale,
        startCenter: remaining,
        startDist: 0,
      };
    } else if (pointers.current.size === 0) {
      gesture.current.mode = 'none';
      // Commit the final viewport to state/store once the gesture ends.
      setVs(liveVsRef.current);
      window.setTimeout(() => { pannedRef.current = false; }, 0);
    }
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cur = liveVsRef.current;
    const factor = Math.exp(-e.deltaY * 0.0015);
    const newScale = clamp(cur.scale * factor, MIN_SCALE, MAX_SCALE);
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const worldX = (px - cur.tx) / cur.scale;
    const worldY = (py - cur.ty) / cur.scale;
    const tx = px - worldX * newScale;
    const ty = py - worldY * newScale;
    applyTransform({ scale: newScale, tx, ty, centered: true });
    scheduleCommit();
  }

  function onDoubleClick() {
    const el = containerRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (cw === 0 || ch === 0 || layout.width === 0 || layout.height === 0) return;
    const scale = Math.min(cw / layout.width, ch / layout.height, 1) * 0.95;
    const tx = (cw - layout.width * scale) / 2;
    const ty = (ch - layout.height * scale) / 2;
    setVs({ scale, tx, ty, centered: true });
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
        ref={worldRef}
        className="tree-world"
        style={{
          width: layout.width,
          height: layout.height,
          transformOrigin: '0 0',
        }}
      >
        <svg width={layout.width} height={layout.height} className="tree-links">
          <path d={linksPath} />
        </svg>
        {layout.nodes.map((n) => {
          const p = persons[n.personId];
          if (!p) return null;
          return (
            <TreeCard
              key={n.id}
              person={p}
              x={n.x}
              y={n.y}
              onTap={() => {
                if (pannedRef.current) return;
                onPersonTap(p.id);
              }}
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
    getPhotoUrl(person.photoPath).then((u) => { if (!cancelled) setUrl(u); });
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
