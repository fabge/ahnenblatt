import type { Person, Family } from './types';

export interface LayoutNode {
  personId: string;
  x: number;
  y: number;
}

export interface LayoutLink {
  x1: number; y1: number; x2: number; y2: number;
}

export interface TreeLayout {
  nodes: LayoutNode[];
  links: LayoutLink[];
  width: number;
  height: number;
}

export function invertLayoutY(layout: TreeLayout): TreeLayout {
  const h = layout.height;
  return {
    width: layout.width,
    height: layout.height,
    nodes: layout.nodes.map((n) => ({ ...n, y: h - n.y })),
    links: layout.links.map((l) => ({ x1: l.x1, y1: h - l.y1, x2: l.x2, y2: h - l.y2 })),
  };
}

export const CARD_W = 150;
export const CARD_H = 90;
const HG = 18;
const VG = 60;

export function ancestorLayout(
  persons: Record<string, Person>,
  families: Record<string, Family>,
  rootId: string,
  generations: number,
): TreeLayout {
  const nodes: LayoutNode[] = [];
  const links: LayoutLink[] = [];

  type Item = { id: string; ahnNr: number; gen: number };
  const all: Item[] = [];
  const queue: Item[] = [{ id: rootId, ahnNr: 1, gen: 0 }];

  while (queue.length) {
    const item = queue.shift()!;
    all.push(item);
    if (item.gen >= generations - 1) continue;
    const p = persons[item.id];
    if (!p) continue;
    for (const fid of p.familiesAsChild) {
      const fam = families[fid];
      if (!fam) continue;
      if (fam.husbandId && persons[fam.husbandId]) {
        queue.push({ id: fam.husbandId, ahnNr: item.ahnNr * 2, gen: item.gen + 1 });
      }
      if (fam.wifeId && persons[fam.wifeId]) {
        queue.push({ id: fam.wifeId, ahnNr: item.ahnNr * 2 + 1, gen: item.gen + 1 });
      }
      break;
    }
  }

  const maxGen = all.reduce((m, i) => Math.max(m, i.gen), 0);
  const totalHeight = maxGen * (CARD_H + VG) + CARD_H;

  const byGen = new Map<number, Item[]>();
  for (const it of all) {
    if (!byGen.has(it.gen)) byGen.set(it.gen, []);
    byGen.get(it.gen)!.push(it);
  }
  const maxCount = Math.max(1, ...Array.from(byGen.values()).map((a) => a.length));
  const totalWidth = maxCount * (CARD_W + HG) + HG;

  const nodePos = new Map<number, { x: number; y: number }>();
  for (let gen = 0; gen <= maxGen; gen++) {
    const items = byGen.get(gen);
    if (!items) continue;
    const sorted = items.slice().sort((a, b) => a.ahnNr - b.ahnNr);
    const y = totalHeight - gen * (CARD_H + VG) - CARD_H / 2;
    const spacing = totalWidth / sorted.length;
    sorted.forEach((it, i) => {
      const x = spacing * (i + 0.5);
      nodePos.set(it.ahnNr, { x, y });
      nodes.push({ personId: it.id, x, y });
    });
  }

  for (const it of all) {
    const childPos = nodePos.get(it.ahnNr);
    if (!childPos) continue;
    for (const parentNr of [it.ahnNr * 2, it.ahnNr * 2 + 1]) {
      const parentPos = nodePos.get(parentNr);
      if (!parentPos) continue;
      const childTop = childPos.y - CARD_H / 2;
      const parentBottom = parentPos.y + CARD_H / 2;
      const midY = (childTop + parentBottom) / 2;
      links.push({ x1: childPos.x, y1: childTop, x2: childPos.x, y2: midY });
      links.push({ x1: childPos.x, y1: midY, x2: parentPos.x, y2: midY });
      links.push({ x1: parentPos.x, y1: midY, x2: parentPos.x, y2: parentBottom });
    }
  }

  return {
    nodes,
    links,
    width: Math.max(totalWidth, 400),
    height: Math.max(totalHeight, 200),
  };
}

interface DescNode {
  personId: string;
  generation: number;
  spouseId?: string;
  children: DescNode[];
  subtreeWidth: number;
  x: number;
  y: number;
}

export function descendantLayout(
  persons: Record<string, Person>,
  families: Record<string, Family>,
  rootId: string,
  generations: number,
): TreeLayout {
  const visited = new Set<string>();

  function build(id: string, gen: number): DescNode {
    const node: DescNode = { personId: id, generation: gen, children: [], subtreeWidth: 0, x: 0, y: 0 };
    visited.add(id);
    const p = persons[id];
    if (!p || gen >= generations) return node;
    for (const fid of p.familiesAsSpouse) {
      const fam = families[fid];
      if (!fam) continue;
      const spouseId = p.id === fam.husbandId ? fam.wifeId : fam.husbandId;
      if (!node.spouseId && spouseId) node.spouseId = spouseId;
      for (const cid of fam.childrenIds) {
        if (visited.has(cid) || !persons[cid]) continue;
        node.children.push(build(cid, gen + 1));
      }
    }
    return node;
  }

  const root = build(rootId, 0);
  const coupleWidth = CARD_W * 2 + HG;

  function computeWidth(n: DescNode) {
    if (n.children.length === 0) {
      n.subtreeWidth = (n.spouseId ? coupleWidth : CARD_W) + HG;
    } else {
      n.children.forEach(computeWidth);
      n.subtreeWidth = n.children.reduce((s, c) => s + c.subtreeWidth, 0);
    }
  }
  computeWidth(root);

  function assignPositions(n: DescNode, leftEdge: number) {
    n.y = n.generation * (CARD_H + VG) + CARD_H / 2;
    if (n.children.length === 0) {
      n.x = leftEdge + (n.spouseId ? coupleWidth : CARD_W) / 2;
    } else {
      let cursor = leftEdge;
      for (const child of n.children) {
        assignPositions(child, cursor);
        cursor += child.subtreeWidth;
      }
      const firstX = n.children[0].x;
      const lastX = n.children[n.children.length - 1].x;
      n.x = (firstX + lastX) / 2;
    }
  }
  assignPositions(root, HG);

  const nodes: LayoutNode[] = [];
  const links: LayoutLink[] = [];
  const flat: DescNode[] = [];
  (function flatten(n: DescNode) {
    flat.push(n);
    n.children.forEach(flatten);
  })(root);

  for (const n of flat) {
    nodes.push({ personId: n.personId, x: n.x, y: n.y });
    if (n.spouseId && persons[n.spouseId]) {
      nodes.push({ personId: n.spouseId, x: n.x + CARD_W + HG, y: n.y });
    }
    const parentY = n.y + CARD_H / 2;
    for (const child of n.children) {
      const childY = child.y - CARD_H / 2;
      const midY = (parentY + childY) / 2;
      links.push({ x1: n.x, y1: parentY, x2: n.x, y2: midY });
      links.push({ x1: n.x, y1: midY, x2: child.x, y2: midY });
      links.push({ x1: child.x, y1: midY, x2: child.x, y2: childY });
    }
  }

  const maxX = nodes.reduce((m, n) => Math.max(m, n.x), 0);
  const maxY = nodes.reduce((m, n) => Math.max(m, n.y), 0);

  return {
    nodes,
    links,
    width: maxX + CARD_W + HG * 2,
    height: maxY + CARD_H / 2 + VG,
  };
}
