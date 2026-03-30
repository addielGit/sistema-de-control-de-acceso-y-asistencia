// src/app/dashboard/appearance/page.tsx
'use client'
import { useI18n } from '@/lib/i18n-context'
import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { PRESET_THEMES, getTheme, ThemeColors } from '@/lib/themes'
import { Palette, RotateCcw, Check, Sun, Moon, Sliders } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const COLOR_FIELDS: { key: keyof ThemeColors; label: string; desc: string }[] = [
  { key: 'bgBase',       label: 'Fondo principal',   desc: 'Color de fondo de la página' },
  { key: 'bgSurface',    label: 'Superficies',        desc: 'Cards, paneles, modales' },
  { key: 'bgElevated',   label: 'Elevado',            desc: 'Header, sidebar' },
  { key: 'bgInput',      label: 'Inputs',             desc: 'Campos de texto y selects' },
  { key: 'borderBase',   label: 'Bordes',             desc: 'Bordes visibles' },
  { key: 'textPrimary',  label: 'Texto principal',    desc: 'Títulos y contenido' },
  { key: 'textSecondary',label: 'Texto secundario',   desc: 'Descripciones, labels' },
  { key: 'textMuted',    label: 'Texto atenuado',     desc: 'Placeholders, hints' },
  { key: 'accent',       label: 'Color de acento',    desc: 'Botones, links, activos' },
  { key: 'accentHover',  label: 'Acento hover',       desc: 'Hover de botones primarios' },
]

export default function AppearancePage() {
  const { t } = useI18n()
  const { themeId, customColors, setThemeId, setCustomColors, resetCustomColors } = useAppStore()
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets')
  const [localColors, setLocalColors] = useState<Partial<ThemeColors>>({})

  const baseTheme = getTheme(themeId)
  const effectiveColors = { ...baseTheme.colors, ...customColors }

  useEffect(() => { setLocalColors(customColors) }, [themeId])

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    const updated = { ...localColors, [key]: value }
    setLocalColors(updated)
    setCustomColors({ [key]: value })
  }

  const handleReset = () => {
    resetCustomColors()
    setLocalColors({})
    toast.success(t('appearance.resetDone'))
  }

  const hasCustom = Object.keys(customColors).length > 0

  const darkThemes  = PRESET_THEMES.filter(t =>  t.isDark)
  const lightThemes = PRESET_THEMES.filter(t => !t.isDark)

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <Palette className="w-5 h-5" style={{ color: 'var(--accent-text)' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('appearance.title')}</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('appearance.subtitle')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-muted)' }}>
        {([['presets', 'Temas predefinidos', Palette], ['custom', 'Personalizar colores', Sliders]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: activeTab === id ? 'var(--bg-elevated)' : 'transparent',
              color: activeTab === id ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === id ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
            }}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* PRESETS TAB */}
      {activeTab === 'presets' && (
        <div className="space-y-6">
          {/* Dark themes */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Moon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('appearance.dark')}</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {darkThemes.map(theme => (
                <ThemeCard key={theme.id} theme={theme} active={themeId === theme.id}
                  onSelect={() => { setThemeId(theme.id); toast.success(t('appearance.applied').replace('{name}', theme.name)) }} />
              ))}
            </div>
          </div>

          {/* Light themes */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sun className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('appearance.light')}</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {lightThemes.map(theme => (
                <ThemeCard key={theme.id} theme={theme} active={themeId === theme.id}
                  onSelect={() => { setThemeId(theme.id); toast.success(t('appearance.applied').replace('{name}', theme.name)) }} />
              ))}
            </div>
          </div>

          {/* Current theme info */}
          <div className="rounded-2xl p-5 glass">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Tema activo
            </p>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {[baseTheme.colors.bgBase, baseTheme.colors.bgSurface, baseTheme.colors.accent, baseTheme.colors.textPrimary].map((c, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border border-black/20" style={{ backgroundColor: c }} />
                ))}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{baseTheme.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {baseTheme.isDark ? 'Tema oscuro' : 'Tema claro'}
                  {hasCustom && ' · Con personalizaciones'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM TAB */}
      {activeTab === 'custom' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Edita colores individuales sobre el tema base <strong style={{ color: 'var(--text-primary)' }}>{baseTheme.name}</strong>
            </p>
            {hasCustom && (
              <button onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-base)', backgroundColor: 'transparent' }}>
                <RotateCcw className="w-3 h-3" /> Restablecer
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COLOR_FIELDS.map(({ key, label, desc }) => {
              const current = (localColors[key] ?? effectiveColors[key]) as string
              const isCustom = !!localColors[key] && localColors[key] !== baseTheme.colors[key]
              // Skip rgba values (not compatible with color input)
              const isRgba = current?.startsWith('rgba')
              if (isRgba) return null
              return (
                <div key={key} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-muted)' }}>
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl border-2 overflow-hidden"
                      style={{ borderColor: isCustom ? 'var(--accent)' : 'var(--border-base)', backgroundColor: current }}>
                      <input type="color" value={current}
                        onChange={e => handleColorChange(key, e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                    {isCustom && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--accent)' }}>
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{current}</p>
                  </div>
                  {isCustom && (
                    <button onClick={() => {
                      const next = { ...localColors }
                      delete next[key]
                      setLocalColors(next)
                      setCustomColors({ [key]: baseTheme.colors[key] })
                    }} title="Restaurar" className="shrink-0" style={{ color: 'var(--text-muted)' }}>
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Live preview strip */}
          <div className="rounded-2xl p-5 glass space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('appearance.colorPreview')}</p>
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>{t('appearance.primaryBtn')}</button>
              <button className="px-4 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-base)' }}>{t('appearance.secondaryBtn')}</button>
              <span className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent-text)', border: '1px solid var(--accent)' }}>Badge</span>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-base)' }}>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{t('appearance.mainText')}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{t('appearance.secondText')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ThemeCard({ theme, active, onSelect }: { theme: any; active: boolean; onSelect: () => void }) {
  const c = theme.colors
  return (
    <button onClick={onSelect}
      className="relative rounded-2xl p-4 text-left transition-all hover:scale-[1.02]"
      style={{
        backgroundColor: c.bgSurface,
        border: active ? `2px solid ${c.accent}` : `1px solid ${c.borderBase}`,
        boxShadow: active ? `0 0 0 3px ${c.accent}30` : 'none',
      }}>
      {active && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: c.accent }}>
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
      {/* Mini preview */}
      <div className="rounded-lg overflow-hidden mb-3" style={{ backgroundColor: c.bgBase, border: `1px solid ${c.borderMuted}` }}>
        {/* Fake sidebar + content */}
        <div className="flex h-14">
          <div className="w-8 flex flex-col gap-1 p-1.5" style={{ backgroundColor: c.bgElevated }}>
            {[c.accent, c.textMuted, c.textMuted].map((col, i) => (
              <div key={i} className="h-1.5 rounded-full" style={{ backgroundColor: i === 0 ? col : c.borderBase, width: i === 0 ? '100%' : '75%' }} />
            ))}
          </div>
          <div className="flex-1 p-2 space-y-1.5">
            <div className="h-1.5 rounded-full" style={{ backgroundColor: c.textPrimary, width: '60%', opacity: 0.8 }} />
            <div className="h-1.5 rounded-full" style={{ backgroundColor: c.borderBase, width: '90%' }} />
            <div className="h-1.5 rounded-full" style={{ backgroundColor: c.borderBase, width: '70%' }} />
            <div className="flex gap-1 mt-1">
              <div className="h-4 rounded px-1.5 flex items-center" style={{ backgroundColor: c.accent }}>
                <div className="h-1 rounded-full bg-white w-6 opacity-80" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Color dots */}
      <div className="flex gap-1 mb-2">
        {[c.bgBase, c.bgSurface, c.accent, c.textPrimary].map((col, i) => (
          <div key={i} className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: col }} />
        ))}
      </div>
      <p className="text-xs font-semibold" style={{ color: c.textPrimary }}>{theme.name}</p>
      <p className="text-[10px]" style={{ color: c.textSecondary }}>{theme.isDark ? 'Oscuro' : 'Claro'}</p>
    </button>
  )
}
