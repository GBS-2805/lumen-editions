/**
 * A small, non-interactive Home + Lock composition for a preset tile.
 *
 * This deliberately does not mount HomeScreen/LockScreen: eleven presets would
 * mean twenty-two live screens, their timers and their per-tile font fitting.
 * The miniature uses the same ThemeDoc resolver, wallpaper assets, app icons
 * and layout tokens, so it still shows the look a preset will actually apply.
 */
import type { CSSProperties } from 'react'

import type { ThemeDoc } from '../contracts/documents'
import type { AppDef, Settings } from '../types'
import { AppIcon } from '../components/ui'
import { Wallpaper } from '../components/Wallpaper'
import { themeVariables } from '../theme/apply'
import { effectiveSettings } from '../theme/store'

const WIDGET_LABELS: Record<string, string> = {
  today: 'Today',
  weather: 'Weather',
  music: 'Now playing',
  battery: 'Battery',
  calendar: 'Next up',
  fitness: 'Activity',
  note: 'Pinned',
  quick: 'Controls',
  world: 'World clock',
}

function iconRadius(doc: ThemeDoc, settings: Settings): string {
  if (settings.iconShape === 'circle') return '50%'
  if (settings.iconShape === 'square') return '2px'
  if (settings.iconShape === 'rounded') return '7px'
  if (doc.icons === 'pixel') return '3px'
  return `${Math.max(3, Math.min(8, Math.round(doc.geometry.radii.tile / 3)))}px`
}

function screenTime(now: Date, time24: boolean): string {
  const hours = time24 ? String(now.getHours()).padStart(2, '0') : String(now.getHours() % 12 || 12)
  return `${hours}:${String(now.getMinutes()).padStart(2, '0')}`
}

function screenDate(now: Date, long = false): string {
  return new Intl.DateTimeFormat('en-US', {
    ...(long
      ? { weekday: 'long', month: 'long', day: 'numeric' }
      : { weekday: 'short', month: 'short', day: 'numeric' }),
  }).format(now)
}

function MiniIcon({ app, radius }: { app: AppDef; radius: string }) {
  return (
    <span className="studio-preset-icon" style={{ borderRadius: radius }}>
      <AppIcon app={app} size="sm" />
    </span>
  )
}

export function PresetThumb({
  doc,
  settings,
  apps,
  now,
  notice,
}: {
  doc: ThemeDoc
  settings: Settings
  apps: AppDef[]
  now: Date
  notice?: { title: string; body: string }
}) {
  const effective = effectiveSettings(settings, doc)
  const radius = iconRadius(doc, effective)
  const cols = effective.gridCols
  const homeApps = apps.slice(0, Math.min(8, cols * 2))
  const dockApps = apps.slice(8, 12)
  const widget = effective.homeWidgets[0] ?? 'today'
  const widgetLabel = WIDGET_LABELS[widget] ?? widget
  const widgetValue =
    widget === 'today'
      ? new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now)
      : widget === 'weather'
        ? '22°'
        : widget === 'music'
          ? 'Soft Focus'
          : widget === 'battery'
            ? '78%'
            : screenDate(now)
  const widgetCaption =
    widget === 'today'
      ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(now)
      : widget === 'weather'
        ? 'Lisbon · clear'
        : widget === 'music'
          ? 'Nocturne'
          : widget === 'battery'
            ? 'On battery'
            : 'Today'
  const vars = themeVariables(doc) as CSSProperties
  const lockLayout = doc.lock?.layout ?? 'classic'
  const clockScale = doc.lock?.clockScale ?? 1
  const time = screenTime(now, effective.time24)

  return (
    <span className="studio-preset-pair" aria-hidden="true">
      <span
        className="os studio-preset-os studio-preset-home"
        data-theme={doc.mode}
        data-icon-style={doc.icons === 'pixel' ? 'pixel' : 'soft'}
        data-icon-shape={effective.iconShape}
        data-preset-screen="home"
        style={vars}
      >
        <Wallpaper id={doc.wallpaper.id} dim={doc.wallpaper.dim} custom={doc.wallpaper.custom} />
        <span className="studio-preset-scrim" />
        <span className="studio-preset-status">
          <span>{time}</span>
          <span className="studio-preset-status-dots">• • •</span>
        </span>
        <span className="studio-preset-widget">
          <span className="studio-preset-widget-label">{widgetLabel}</span>
          <strong>{widgetValue}</strong>
          <small>{widgetCaption}</small>
        </span>
        <span
          className="studio-preset-apps"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {homeApps.map((app) => (
            <MiniIcon key={app.id} app={app} radius={radius} />
          ))}
        </span>
        <span className="studio-preset-dock">
          {dockApps.map((app) => (
            <MiniIcon key={app.id} app={app} radius={radius} />
          ))}
        </span>
        <span className="studio-preset-screen-label">Home</span>
      </span>

      <span
        className="os studio-preset-os studio-preset-lock"
        data-theme={doc.mode}
        data-lock-layout={lockLayout}
        data-preset-screen="lock"
        style={{ ...vars, '--preset-clock-scale': String(clockScale) } as CSSProperties}
      >
        <Wallpaper id={doc.wallpaper.id} dim={doc.wallpaper.dim} custom={doc.wallpaper.custom} />
        <span className="studio-preset-scrim" />
        <span className="studio-preset-status">
          <span>{time}</span>
          <span className="studio-preset-status-dots">• • •</span>
        </span>
        <span className="studio-preset-lock-body">
          <span className="studio-preset-lock-clock">{time}</span>
          <span className="studio-preset-lock-date">{screenDate(now, true)}</span>
          <span className="studio-preset-notice">
            <span className="studio-preset-notice-mark" />
            <span className="studio-preset-notice-copy">
              <strong>{notice?.title ?? 'Lumen'}</strong>
              <small>{notice?.body ?? 'No notifications waiting'}</small>
            </span>
          </span>
        </span>
        <span className="studio-preset-lock-bottom">
          <span className="studio-preset-shortcut" />
          <span className="studio-preset-unlock" />
          <span className="studio-preset-shortcut" />
        </span>
        <span className="studio-preset-screen-label">Lock</span>
      </span>
    </span>
  )
}
