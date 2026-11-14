/**
 * L3: per-size previews through the real document path.
 *
 * The four atlas size classes are painted side by side by `WidgetDocument`, the
 * same renderer the composition surface uses, so Studio shows what the shell
 * will actually paint at each class instead of a mock.
 */
import type { WidgetSize } from '../contracts/documents'
import { ATLAS_SIZE_CLASSES, resolveWidgetRef } from '../layout/atlas'
import { WidgetDocument } from '../widgets/render'
import { previewSnapshotFor } from '../widgets/preview'

const BOX: Record<WidgetSize, { width: number; height: number }> = {
  small: { width: 132, height: 132 },
  medium: { width: 276, height: 132 },
  large: { width: 276, height: 276 },
  lock: { width: 320, height: 92 },
}

export function StudioSizes({ widgetId = 'weather' }: { widgetId?: string }) {
  return (
    <div data-studio-sizes={widgetId} style={{ display: 'grid', gap: 12 }}>
      <p className="settings-hint">Every class is painted by the widget renderer, not a thumbnail.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        {ATLAS_SIZE_CLASSES.map((size) => (
          <figure key={size} data-studio-size={size} style={{ margin: 0, display: 'grid', gap: 6 }}>
            <div style={{ ...BOX[size], color: 'inherit' }}>
              <WidgetDocument doc={resolveWidgetRef(widgetId, size).doc} snapshot={previewSnapshotFor(widgetId)} />
            </div>
            <figcaption className="settings-hint" data-studio-size-label={size}>
              {size} · {BOX[size].width}×{BOX[size].height}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
