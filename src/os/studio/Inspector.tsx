/**
 * L3: the inspector is generated from the capability registry.
 *
 * Every capability becomes exactly one row. A row either renders a control for
 * its value type or states why it is not editable in this build — the registry
 * is the promise surface, so silence is not allowed.
 */
import { CAPABILITIES, CAPABILITY_AREAS, type Capability } from '../capabilities'

export type CapabilityValue = string | number | boolean

export interface CapabilityInspectorProps {
  values: Readonly<Record<string, CapabilityValue | undefined>>
  onEdit: (capability: Capability, value: CapabilityValue) => boolean
  /** Areas to show; every capability must still land in a shown area. */
  areas?: readonly string[]
}

const NUMBER = new Set(['number'])
const COLOR = new Set(['color'])
const BOOLEAN = new Set(['boolean'])

function controlFor(capability: Capability, value: CapabilityValue | undefined, onEdit: CapabilityInspectorProps['onEdit']) {
  if (COLOR.has(capability.type)) {
    return (
      <input
        type="color"
        aria-label={capability.id}
        data-capability-control={capability.id}
        value={typeof value === 'string' ? value : String(capability.default ?? '#000000')}
        onChange={(event) => onEdit(capability, event.target.value)}
      />
    )
  }
  if (NUMBER.has(capability.type)) {
    return (
      <input
        type="number"
        aria-label={capability.id}
        data-capability-control={capability.id}
        value={typeof value === 'number' ? value : Number(capability.default ?? 0)}
        onChange={(event) => {
          const next = Number(event.target.value)
          if (Number.isFinite(next)) onEdit(capability, next)
        }}
      />
    )
  }
  if (BOOLEAN.has(capability.type)) {
    return (
      <input
        type="checkbox"
        aria-label={capability.id}
        data-capability-control={capability.id}
        checked={typeof value === 'boolean' ? value : Boolean(capability.default)}
        onChange={(event) => onEdit(capability, event.target.checked)}
      />
    )
  }
  return (
    <p className="settings-hint" data-capability-reason={capability.id}>
      No control: the {capability.inspector} inspector is not connected to this document yet.
    </p>
  )
}

export function CapabilityInspector({ values, onEdit, areas }: CapabilityInspectorProps) {
  const shown = CAPABILITY_AREAS.filter((area) => !areas || areas.includes(area.id))
  return (
    <div className="studio-registry" data-capability-inspector data-capability-count={CAPABILITIES.length}>
      {shown.map((area) => {
        const rows = CAPABILITIES.filter((capability) => capability.area === area.id)
        if (rows.length === 0) return null
        return (
          <section className="studio-registry-area" data-capability-area={area.id} key={area.id}>
            <header className="studio-registry-head">
              <h3>{area.label}</h3>
              <span>{rows.length}</span>
            </header>
            {rows.map((capability) => (
              <div className="studio-registry-row" data-capability={capability.id} key={capability.id}>
                <div className="studio-registry-copy">
                  <p>{capability.id}</p>
                  <span>
                    {capability.scope} · {capability.type} · {capability.inspector}
                  </span>
                </div>
                {controlFor(capability, values[capability.id], onEdit)}
              </div>
            ))}
          </section>
        )
      })}
    </div>
  )
}
