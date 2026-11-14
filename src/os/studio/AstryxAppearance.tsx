import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'

import type { ThemeDoc } from '../contracts/documents'

type ThemeMode = ThemeDoc['mode']
type ThemeDirection = NonNullable<ThemeDoc['direction']>

const MODES: { value: ThemeMode; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
]

const DIRECTIONS: { value: ThemeDirection; label: string }[] = [
  { value: 'ltr', label: 'Left to right' },
  { value: 'rtl', label: 'Right to left' },
]

/**
 * Product appearance controls built from Astryx's segmented control. Both
 * values are real ThemeDoc tokens, so they follow the scope, undo history and
 * persisted theme document rather than local inspector state.
 */
export function AstryxAppearance({
  mode,
  direction,
  onMode,
  onDirection,
}: {
  mode: ThemeMode
  direction: ThemeDirection
  onMode: (mode: ThemeMode) => void
  onDirection: (direction: ThemeDirection) => void
}) {
  return (
    <section className="studio-group" data-astryx-appearance>
      <div className="studio-group-head">
        <p className="studio-kicker">Appearance</p>
        <span>Saved in this scope</span>
      </div>
      <div className="studio-field" data-studio-token="mode">
        <div className="studio-field-head">
          <span className="studio-field-label">Color mode</span>
          <span className="studio-field-meta">{mode === 'light' ? 'Light' : 'Dark'}</span>
        </div>
        <SegmentedControl
          label="Color mode"
          value={mode}
          onChange={(value) => {
            if (value === 'dark' || value === 'light') onMode(value)
          }}
          layout="fill"
          size="sm"
        >
          {MODES.map((option) => (
            <SegmentedControlItem key={option.value} value={option.value} label={option.label} />
          ))}
        </SegmentedControl>
      </div>
      <div className="studio-field" data-studio-token="direction">
        <div className="studio-field-head">
          <span className="studio-field-label">Writing direction</span>
          <span className="studio-field-meta">{direction === 'rtl' ? 'RTL' : 'LTR'}</span>
        </div>
        <SegmentedControl
          label="Writing direction"
          value={direction}
          onChange={(value) => {
            if (value === 'ltr' || value === 'rtl') onDirection(value)
          }}
          layout="fill"
          size="sm"
        >
          {DIRECTIONS.map((option) => (
            <SegmentedControlItem key={option.value} value={option.value} label={option.label} />
          ))}
        </SegmentedControl>
      </div>
      <p className="studio-hint">Both choices are saved in this theme document; Undo restores the previous value.</p>
    </section>
  )
}
