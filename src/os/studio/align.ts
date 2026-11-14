/**
 * L3 authoring: align and distribute real scene-layer geometry.
 *
 * Pure functions over the shared document's `SceneLayer[]` — the caller hands
 * the result to one `writeScene({ layers })` call, so history records a single
 * undoable entry for the whole selection.
 */
import type { SceneLayer } from '../contracts/documents'

export type AlignMode = 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v'
export type DistributeMode = 'horizontal' | 'vertical'

export const ALIGN_MODES: readonly { id: AlignMode; label: string }[] = [
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
  { id: 'top', label: 'Top' },
  { id: 'bottom', label: 'Bottom' },
  { id: 'center-h', label: 'Centre H' },
  { id: 'center-v', label: 'Centre V' },
]
export const DISTRIBUTE_MODES: readonly { id: DistributeMode; label: string }[] = [
  { id: 'horizontal', label: 'Distribute H' },
  { id: 'vertical', label: 'Distribute V' },
]

export const MIN_ALIGN = 2
export const MIN_DISTRIBUTE = 3

const picked = (layers: readonly SceneLayer[], ids: readonly string[]) =>
  layers.filter((layer) => ids.includes(layer.id))

function moved(before: readonly SceneLayer[], after: readonly SceneLayer[]) {
  return after.some((layer, index) => layer.x !== before[index].x || layer.y !== before[index].y)
}

export function alignLayers(layers: readonly SceneLayer[], ids: readonly string[], mode: AlignMode): SceneLayer[] {
  const selection = picked(layers, ids)
  if (selection.length < MIN_ALIGN) return [...layers]
  const left = Math.min(...selection.map((layer) => layer.x))
  const right = Math.max(...selection.map((layer) => layer.x + layer.w))
  const top = Math.min(...selection.map((layer) => layer.y))
  const bottom = Math.max(...selection.map((layer) => layer.y + layer.h))
  const centerH = (left + right) / 2
  const centerV = (top + bottom) / 2
  return layers.map((layer) => {
    if (!ids.includes(layer.id)) return layer
    switch (mode) {
      case 'left': return { ...layer, x: left }
      case 'right': return { ...layer, x: right - layer.w }
      case 'top': return { ...layer, y: top }
      case 'bottom': return { ...layer, y: bottom - layer.h }
      case 'center-h': return { ...layer, x: centerH - layer.w / 2 }
      case 'center-v': return { ...layer, y: centerV - layer.h / 2 }
    }
  })
}

export function distributeLayers(layers: readonly SceneLayer[], ids: readonly string[], mode: DistributeMode): SceneLayer[] {
  const selection = [...picked(layers, ids)]
  if (selection.length < MIN_DISTRIBUTE) return [...layers]
  const horizontal = mode === 'horizontal'
  const start = (layer: SceneLayer) => (horizontal ? layer.x : layer.y)
  const extent = (layer: SceneLayer) => (horizontal ? layer.w : layer.h)
  selection.sort((a, b) => start(a) - start(b))
  const first = selection[0]
  const last = selection[selection.length - 1]
  const span = start(last) + extent(last) - start(first)
  const used = selection.reduce((total, layer) => total + extent(layer), 0)
  const gap = (span - used) / (selection.length - 1)
  const positions = new Map<string, number>()
  let cursor = start(first)
  for (const layer of selection) {
    positions.set(layer.id, cursor)
    cursor += extent(layer) + gap
  }
  return layers.map((layer) => {
    const position = positions.get(layer.id)
    if (position === undefined) return layer
    return horizontal ? { ...layer, x: position } : { ...layer, y: position }
  })
}

export function canAlign(layers: readonly SceneLayer[], ids: readonly string[], mode: AlignMode): boolean {
  if (picked(layers, ids).length < MIN_ALIGN) return false
  const after = alignLayers(layers, ids, mode)
  const before = layers.filter((layer) => ids.includes(layer.id))
  return moved(before, after.filter((layer) => ids.includes(layer.id)))
}

export function canDistribute(layers: readonly SceneLayer[], ids: readonly string[], mode: DistributeMode): boolean {
  if (picked(layers, ids).length < MIN_DISTRIBUTE) return false
  const after = distributeLayers(layers, ids, mode)
  const before = layers.filter((layer) => ids.includes(layer.id))
  return moved(before, after.filter((layer) => ids.includes(layer.id)))
}

export interface MarqueeRect {
  x: number
  y: number
  w: number
  h: number
}

/** Two zero-area-safe rects intersect when their spans overlap on both axes. */
export function intersects(a: MarqueeRect, b: MarqueeRect): boolean {
  if (a.w <= 0 || a.h <= 0 || b.w <= 0 || b.h <= 0) return false
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

/** Scene order, so align always reads the same node set. */
export function marqueeSelection(layers: readonly SceneLayer[], rect: MarqueeRect): string[] {
  return layers.filter((layer) => intersects(rect, { x: layer.x, y: layer.y, w: layer.w, h: layer.h })).map((layer) => layer.id)
}

/** Normalizes a drag in any direction to a positive-extent rect. */
export function normalizeRect(ax: number, ay: number, bx: number, by: number): MarqueeRect {
  return { x: Math.min(ax, bx), y: Math.min(ay, by), w: Math.abs(bx - ax), h: Math.abs(by - ay) }
}

export function extendSelection(current: readonly string[], added: readonly string[]): string[] {
  const next = [...current]
  for (const id of added) if (!next.includes(id)) next.push(id)
  return next
}
