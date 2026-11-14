# Lumen Editions

Private checkpoint of the Lumen Editions launcher and Studio editor work.

## What is here

This repository currently holds the handoff documentation only, written by the
Freebuff session that produced the local checkpoint commit `0ac2630` on branch
`lumen-editions-preview`.

- `plans/handoff-studio-requirement-6.md` - the exact spec for the outstanding
  live history-depth proof: insert point, fixture, selectors, +1/0/-1 deltas,
  clamped no-op case, single-undo restore, full unwind, then the break/restore
  cycle.

## State at checkpoint

Last verified green: `verify:browser` 517 checks / 86 screenshots,
`verify:studio` 220, `verify:gates` 22/22 in 241.7 s, `typecheck` clean.
No assertion removed, skipped, loosened or made conditional. The scene history
cap is 40 and unchanged.

## What is not here

The application sources and the browser harness (`src/os/studio/*`,
`scripts/verify-browser.mjs`, `scripts/verify-studio.mjs`) are still only in the
workspace checkout. Uploading them needs push credentials: add a `GITHUB_TOKEN`
with `contents: write` as a project secret, then the branch can be pushed with
full history instead of a file-by-file snapshot.

## Remaining work

- Requirement 6 harness block (spec in the handoff note).
- Studio symbols, templates, accessibility panel.
- Widget/motion editing, long-press to edit, `.lumenpack` import/export, plugin manager.
- L2 native wrappers (blocked: `android/`) and A1 fresh-session probe (blocked).
