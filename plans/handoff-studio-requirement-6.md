# Handoff - Studio requirement 6 (live history-depth proof)

## State at handoff

Last verified green: `verify:browser` 517 checks / 86 screenshots,
`verify:studio` 220, `verify:gates` 22/22 in 241.7 s, `typecheck` clean.
No assertion removed, skipped, loosened or conditional. History cap still 40.

App side is believed correct already: one scene-history array in `StudioApp`,
trimmed to 40, reported via `data-studio-history` (~line 579), popped by undo
(~line 480); `SceneEditor.commitMoved` refuses before `writeScene` when computed
geometry equals current geometry. Requirement 6 is unproven, not unimplemented.

## Insert point

`scripts/verify-browser.mjs`, Studio section (~2575). Insert after the
Studio-open checks (~2714) and before the first `setStudioColour('color.surface', ...)`
(~2745). Must stay below the 40-entry cap: later colour/type/pack edits fill all
slots, after which depth is pinned and deltas read as 0.

## Fixture (self-contained, once)

1. `[data-scene-clear]` - clears layers.
2. `[data-scene-add="<kind>"]` x3 (e.g. text, card, metric).
3. Shift-click `[data-scene-layer-select="<id>"]` for each; verify
   `[data-scene-selection-count]` reads `3 selected`.

Read baseline `data-studio-history` and require it to exist, so deltas cannot
pass on a missing attribute.

## Controls

- Align: `[data-scene-align="left|right|top|bottom|centre-h|centre-v"]`
- Distribute: `[data-scene-distribute="h|v"]`
- Stage drag-move: `[data-scene-stage]`; nodes `[data-scene-node="<id>"]`
- Marquee: drag on stage; overlay `[data-scene-marquee]`
- Geometry: `[data-scene-field="x|y|w|h"] input[type=range]`
- Undo: `[data-studio-undo]`; depth: `data-studio-history`

## Assertions

Per row (six aligns, both distributes, drag-move, marquee):
- geometry changed -> delta exactly +1
- repeated identical action -> delta exactly 0
- one entry per action regardless of how many nodes moved

Extra: clamped node (set `x` to the bound so the clamp makes geometry
identical) records nothing; single undo restores every affected node and drops
depth by 1; full unwind returns the fixture geometry.

Names unique and legible: `align left: change records 1 (got N)`.

## Then

1. `bun run verify:browser` -> green, total > 517.
2. Deliberate break (record on no-op, or two writes per action) -> capture named
   failures and broken counts, quote in summary, no tracked artifact.
3. Restore exactly (`cmp` against a copy), confirm clean diff, re-run green.
4. `verify:studio` 220, `typecheck` clean. No commit, no push.

## Remaining work map

- L3 Studio: symbols, templates, accessibility panel - not built.
- Widget/motion editing, long-press to edit, `.lumenpack` import/export,
  plugin manager UI - not built.
- L2 native wrappers - blocked, `android/` out of scope.
- A1 fresh-session probe - blocked, no authenticated non-interactive runtime.
- Update `plans/PLAN.md` only once the block is verified green.
