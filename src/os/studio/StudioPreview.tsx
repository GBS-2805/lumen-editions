/**
 * The Studio artboard: the real HomeScreen rendered at 948 design pixels and
 * scaled to the stage. It is driven by a ThemeDoc through the same CSS-variable
 * resolver the shell uses, and by a read-only OS view so editing an inactive
 * scope (cover from the inner screen, or an app layer) still previews that
 * document instead of the screen Studio is currently running on.
 *
 * There is no copied home-screen markup here. The overlay is the only Studio
 * chrome added on top of the real screen.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

import type { ThemeDoc } from '../contracts/documents'
import { chartCssVars } from '../lib/charts'
import { motionCssVars } from '../lib/motion'
import { DEFAULT_SETTINGS } from '../defaults'
import { OSViewProvider, useOS, type OSValue } from '../store'
import { HomeScreen } from '../screens/HomeScreen'
import { LockScreen } from '../screens/LockScreen'
import { themeAttributes, themeVariables } from '../theme/apply'
import { effectiveSettings, readSurfaceSettings } from '../theme/store'
import type { Surface } from '../types'
import { Wallpaper } from '../components/Wallpaper'

const DESIGN_WIDTH = 948

export type PreviewRegion = 'wallpaper' | 'status' | 'widgets' | 'apps' | 'dock' | 'gesture'

export const PREVIEW_REGIONS: { id: PreviewRegion; label: string; left: string; top: string; width: string; height: string }[] = [
  { id: 'status', label: 'Status', left: '0%', top: '0%', width: '92%', height: '10%' },
  { id: 'widgets', label: 'Widgets', left: '0%', top: '10%', width: '92%', height: '34%' },
  { id: 'apps', label: 'Apps', left: '0%', top: '44%', width: '92%', height: '34%' },
  { id: 'dock', label: 'Dock', left: '0%', top: '78%', width: '92%', height: '13%' },
  { id: 'gesture', label: 'Gesture', left: '0%', top: '91%', width: '92%', height: '9%' },
]

function designHeight(surface: Surface): number {
  return surface === 'main' ? 1500 : 1048
}

function useArtboardScale(ref: React.RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(0.34)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => {
      // clientWidth is pre-transform. The artboard's on-screen rect is already
      // inside the device's fit-scale, so using it here would scale twice and
      // leave a black gutter around the real screen.
      const width = element.clientWidth
      if (width > 0) setScale(width / DESIGN_WIDTH)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return scale
}

export function StudioPreview({
  doc,
  surface,
  label,
  mapOpen = false,
  activeRegion,
  onRegion,
  compact = false,
  screen = 'home',
}: {
  doc: ThemeDoc
  surface: Surface
  label?: string
  mapOpen?: boolean
  activeRegion?: PreviewRegion | null
  onRegion?: (region: PreviewRegion) => void
  compact?: boolean
  screen?: 'home' | 'lock'
}) {
  const base = useOS()
  const artboard = useRef<HTMLDivElement>(null)
  const scale = useArtboardScale(artboard)
  const height = designHeight(surface)
  const settings = useMemo(() => {
    // Non-appearance layout (labels, icon size, label scale, app order) lives in
    // the target surface's Settings, not in this artboard. Use the mounted
    // store for its own surface; read the other surface's persisted key exactly
    // as that surface's provider will when it mounts.
    const fallback = surface === 'main' ? { ...DEFAULT_SETTINGS, home: [], dock: [] } : DEFAULT_SETTINGS
    const stored =
      surface === base.surface || typeof window === 'undefined'
        ? null
        : readSurfaceSettings(window.localStorage, surface)
    const source = surface === base.surface ? base.s : stored ? { ...fallback, ...stored } : fallback
    return effectiveSettings(source, doc)
  }, [base.s, base.surface, doc, surface])

  const overrides = useMemo<Partial<OSValue>>(
    () => ({
      s: settings,
      theme: doc,
      // HomeScreen branches on the physical display for rows and starter
      // layout, so an Inner artboard must not inherit the mounted cover value.
      surface,
      focusReturn: null,
      clearFocusReturn: () => undefined,
    }),
    [doc, settings, surface],
  )
  const attrs = themeAttributes(doc)
  const style = {
    ...motionCssVars(doc.motion.speed, doc.motion.reduced),
    ...themeVariables(doc),
    ...chartCssVars(doc.mode),
    '--app-label-scale': String(settings.appLabelScale ?? 1.4),
    '--focus-ring': doc.color.accent,
    width: DESIGN_WIDTH,
    height,
  } as CSSProperties

  return (
    <div
      className={`studio-preview ${compact ? 'is-compact' : ''}`}
      data-studio-preview
      data-preview-surface={surface}
      data-preview-grid-cols={String(settings.gridCols)}
      data-preview-grid-gap={String(settings.gridGap)}
      data-preview-icon-size={settings.iconSize}
      data-preview-icon-shape={settings.iconShape}
      data-preview-app-labels={settings.appLabels ? 'on' : 'off'}
      data-preview-screen={screen}
    >
      {label && (
        <div className="studio-preview-head">
          <span>{label}</span>
          <span>{surface === 'main' ? 'Inner' : 'Cover'} · 948 × {height}</span>
        </div>
      )}
      <div
        ref={artboard}
        className={`studio-artboard ${mapOpen && screen === 'home' ? 'has-map' : ''}`}
        style={{ aspectRatio: `${DESIGN_WIDTH} / ${height}` }}
      >
        <OSViewProvider overrides={overrides}>
          <div className="studio-preview-scale" style={{ width: DESIGN_WIDTH, height, transform: `scale(${scale})` }}>
            <div
              className="os studio-preview-os"
              data-surface={surface}
              data-theme={attrs['data-theme']}
              data-corner={attrs['data-corner']}
              data-font={attrs['data-font']}
              data-contrast={attrs['data-contrast']}
              data-density={attrs['data-density']}
              data-icon-style={doc.icons === 'pixel' ? 'pixel' : 'soft'}
              data-icon-size={settings.iconSize}
              data-icon-shape={settings.iconShape}
              data-preview-label-scale={String(settings.appLabelScale)}
              data-preview-app-label-count={String(settings.appLabels ? 1 : 0)}
              data-theme-preset="studio-preview"
              data-motion={doc.motion.reduced || doc.motion.speed === 0 ? 'off' : 'on'}
              data-preview-accent={doc.color.accent}
              data-preview-surface-colour={doc.color.surface}
              data-preview-radius={String(doc.geometry.radii.tile)}
              data-preview-scale={String(doc.type.scale)}
              data-preview-motion={String(doc.motion.speed)}
              data-preview-composition={screen === 'lock' ? doc.lock?.layout ?? 'classic' : doc.scene ? 'scene' : 'legacy'}
              style={style}
              dir={attrs.dir}
              aria-hidden="true"
              inert
            >
              <Wallpaper
                id={doc.wallpaper.id}
                dim={doc.wallpaper.dim}
                custom={doc.wallpaper.custom}
                variant={surface === 'main' ? 'inner' : 'cover'}
              />
              {screen === 'lock' ? <LockScreen /> : <HomeScreen />}
            </div>
          </div>
        </OSViewProvider>

        {mapOpen && screen === 'home' && (
          <div className="studio-region-map" role="group" aria-label="Preview areas">
            <button
              type="button"
              className={`studio-region is-wallpaper ${activeRegion === 'wallpaper' ? 'is-on' : ''}`}
              data-studio-region="wallpaper"
              aria-pressed={activeRegion === 'wallpaper'}
              onClick={() => onRegion?.('wallpaper')}
            >
              <span>Wallpaper</span>
            </button>
            {PREVIEW_REGIONS.map((region) => (
              <button
                key={region.id}
                type="button"
                className={`studio-region ${activeRegion === region.id ? 'is-on' : ''}`}
                data-studio-region={region.id}
                aria-pressed={activeRegion === region.id}
                style={{ left: region.left, top: region.top, width: region.width, height: region.height }}
                onClick={() => onRegion?.(region.id)}
              >
                <span>{region.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
