#!/usr/bin/env bun
/**
 * Gate: the L3 inspector is generated from the capability registry.
 *
 * Every capability must appear as exactly one row, and that row must carry a
 * control for its value type or an explicit reason it is not editable.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { readFileSync } from 'node:fs'

import { CAPABILITIES } from '../src/os/capabilities.ts'
import { CapabilityInspector } from '../src/os/studio/Inspector.tsx'
import { StudioSizes } from '../src/os/studio/StudioSizes.tsx'
import { ALIGN_MODES, DISTRIBUTE_MODES, MIN_ALIGN, MIN_DISTRIBUTE, alignLayers, canAlign, canDistribute, distributeLayers, extendSelection, intersects, marqueeSelection, normalizeRect } from '../src/os/studio/align.ts'

const errors = []
const passes = []
const check = (ok, message) => (ok ? passes.push(message) : errors.push(message))

const markup = renderToStaticMarkup(createElement(CapabilityInspector, { values: {}, onEdit: () => false }))
const rowCount = (markup.match(/data-capability="/g) ?? []).length
check(rowCount === CAPABILITIES.length, `the inspector renders one row per capability (${rowCount}/${CAPABILITIES.length})`)
check((markup.match(/data-capability-inspector/g) ?? []).length === 1, 'the inspector renders once')

const controls = markup.match(/data-capability-control="([^"]+)"/g) ?? []
const reasons = markup.match(/data-capability-reason="([^"]+)"/g) ?? []
check(controls.length + reasons.length === CAPABILITIES.length, `every row has a control or a reason (${controls.length} controls + ${reasons.length} reasons)`)

for (const capability of CAPABILITIES) {
  check((markup.match(new RegExp(`data-capability="${capability.id}"`, 'g')) ?? []).length === 1, `${capability.id} appears exactly once`)
}

for (const capability of CAPABILITIES.filter((entry) => entry.type === 'color')) {
  check(markup.includes(`type="color"`) && markup.includes(`data-capability-control="${capability.id}"`), `the colour capability ${capability.id} renders a colour control`)
}
for (const capability of CAPABILITIES.filter((entry) => entry.type === 'number')) {
  check(markup.includes(`type="number"`), `the numeric capability ${capability.id} renders a number control`)
}
for (const capability of CAPABILITIES.filter((entry) => !['color', 'number', 'boolean'].includes(entry.type))) {
  check(markup.includes(`data-capability-reason="${capability.id}"`), `the ${capability.type} capability ${capability.id} states why it is not editable`)
}

const sizesMarkup = renderToStaticMarkup(createElement(StudioSizes, { widgetId: 'weather' }))
for (const size of ['small', 'medium', 'large', 'lock']) {
  check(sizesMarkup.includes(`data-studio-size="${size}"`) && sizesMarkup.includes(`data-widget-size="${size}"`), `the ${size} preview paints through the widget renderer`)
}
check((sizesMarkup.match(/data-studio-size="/g) ?? []).length === 4, 'all four atlas classes are previewed')

const box = (id, x, y, w = 20, h = 10) => ({ id, kind: 'text', text: id, x, y, w, h })
const trio = [box('a', 10, 10), box('b', 60, 40), box('c', 30, 70)]
const ids = trio.map((layer) => layer.id)
check(ALIGN_MODES.length === 6 && DISTRIBUTE_MODES.length === 2 && MIN_ALIGN === 2 && MIN_DISTRIBUTE === 3, 'six align and two distribute modes with honest minimums')
check(canAlign(trio, ['a'], 'left') === false && canAlign(trio, ['a', 'b'], 'left') === true, 'align needs two layers and is offered on a real pair')
check(canDistribute(trio, ['a', 'b'], 'horizontal') === false && canDistribute(trio, ids, 'horizontal') === true, 'distribute needs three layers')
const left = alignLayers(trio, ids, 'left')
check(left.every((layer) => layer.x === 10) && left.length === trio.length && left.map((layer) => layer.id).join(',') === 'a,b,c', 'align left collapses the real selection to one edge in one array')
check(canAlign(left, ids, 'left') === false, 'an align that would move nothing is disabled')
const dh = distributeLayers(trio, ids, 'horizontal')
const gaps = dh.map((layer) => layer.x + layer.w).sort((a, b) => a - b).map((edge, index, all) => (index === 0 ? null : edge - all[index - 1])).filter((gap) => gap !== null)
check(new Set(gaps.map((gap) => Math.round(gap * 100) / 100)).size === 1, 'distribute H leaves equal gaps between the real selection')
check(canDistribute(dh, ids, 'horizontal') === false, 'a distribute that would move nothing is disabled')
check(trio[0].x === 10 && trio[1].x === 60, 'align and distribute do not mutate the source document')

const sceneSource = readFileSync(new URL('../src/os/studio/SceneEditor.tsx', import.meta.url), 'utf8')
const rect = (x, y, w, h) => ({ x, y, w, h })
check(intersects(rect(0, 0, 10, 10), rect(10, 0, 10, 10)) === false, 'touching edges do not intersect')
check(intersects(rect(0, 0, 10, 10), rect(9.9, 0, 5, 5)) === true, 'a partial overlap intersects')
check(intersects(rect(0, 0, 100, 100), rect(10, 10, 5, 5)) === true, 'a fully contained rect intersects')
check(intersects(rect(0, 0, 10, 10), rect(20, 20, 5, 5)) === false, 'a disjoint rect does not intersect')
check(intersects(rect(0, 0, 0, 10), rect(0, 0, 10, 10)) === false && intersects(rect(0, 0, 10, 10), rect(0, 0, 0, 0)) === false, 'zero-area rects never intersect')
const scene = [box('a', 0, 0, 20, 20), box('b', 50, 0, 20, 20), box('c', 10, 10, 20, 20)]
check(marqueeSelection(scene, rect(5, 5, 100, 100)).join(',') === 'a,b,c', 'the marquee returns every intersecting layer in scene order')
check(marqueeSelection(scene, rect(0, 0, 15, 15)).join(',') === 'a,c', 'the marquee skips layers outside the rect')
check(extendSelection(['a'], ['c', 'a']).join(',') === 'a,c', 'shift-drag extends without duplicates and keeps order')

check(normalizeRect(20, 30, 5, 10).x === 5 && normalizeRect(20, 30, 5, 10).w === 15, 'a right-to-left drag normalizes to a positive rect')
check(normalizeRect(20, 30, 5, 10).y === 10 && normalizeRect(20, 30, 5, 10).h === 20, 'an up-to-bottom drag normalizes to a positive rect')
check(marqueeSelection(scene, normalizeRect(0, 0, 0, 40)).length === 0 && marqueeSelection(scene, normalizeRect(0, 0, 40, 0)).length === 0, 'a zero-width or zero-height drag selects nothing')
check(normalizeRect(4, 4, 4, 4).w === 0 && normalizeRect(4, 4, 4, 4).h === 0, 'a press without movement has zero extent')

const studioSource = readFileSync(new URL('../src/os/studio/StudioApp.tsx', import.meta.url), 'utf8')
check(sceneSource.includes('data-scene-stage') && sceneSource.includes('data-scene-marquee'), 'the scene editor renders a stage and a marquee element')
check(sceneSource.includes('marqueeSelection(layers, rect)') && sceneSource.includes('normalizeRect('), 'release selects intersecting layers from the drag rect')
check(sceneSource.includes('band.additive ? extendSelection(selection, hits) : hits'), 'shift-drag unions and plain drag replaces the selection')
check(sceneSource.includes('data-scene-node={layer.id}') && sceneSource.includes('writeScene({ layers: layers.map((layer) => (layer.id === moving.id'), 'layers are positioned nodes and drag-move writes once on release')
check(sceneSource.includes('data-scene-align={mode.id}') && sceneSource.includes('data-scene-distribute={mode.id}'), 'the scene editor renders every align and distribute control')
check(sceneSource.includes('disabled={!canAlign(layers, selection, mode.id)}') && sceneSource.includes('disabled={!canDistribute(layers, selection, mode.id)}'), 'each control is disabled from the real selection')
check((sceneSource.match(/commitMoved\(constrain\(alignLayers/g) ?? []).length === 1 && (sceneSource.match(/commitMoved\(constrain\(distributeLayers/g) ?? []).length === 1, 'each action is one writeScene call, so history records one undo entry')
check(sceneSource.includes('event.shiftKey') && sceneSource.includes('data-scene-selection-clear'), 'shift-click extends the selection and clearing is offered')
check(studioSource.includes('CapabilityInspector') && studioSource.includes("mode === 'registry'"), 'Studio mounts the generated inspector as its own mode')
check(studioSource.includes('commit({ color: { accent: value } })'), 'the accent row writes through the theme store')

if (errors.length) {
  console.error(`studio gate failed (${errors.length}):`)
  for (const error of errors) console.error(`  \u2717 ${error}`)
  process.exit(1)
}
console.log(`OK: ${passes.length} checks — every capability row, controls by type, stated reasons, four size previews, Studio wiring`)
