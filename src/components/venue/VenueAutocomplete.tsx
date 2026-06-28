'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from '@/i18n/LanguageProvider'

export interface VenueOption {
  id:   string
  name: string
  lat:  number
  lng:  number
  kind: 'registry' | 'geocode'
}

interface VenueAutocompleteProps {
  value:       string
  onChange:    (v: string) => void
  onSelect:    (opt: VenueOption) => void
  placeholder?: string
}

export function VenueAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
}: VenueAutocompleteProps) {
  const { t } = useLanguage()
  const [suggestions, setSuggestions] = useState<VenueOption[]>([])
  const [open, setOpen]               = useState(false)
  const [loading, setLoading]         = useState(false)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); return }
    setLoading(true)
    try {
      const [geoRes, regRes] = await Promise.all([
        fetch(`/api/geocode?q=${encodeURIComponent(q)}`).then(r => r.json()),
        fetch(`/api/registry/search?q=${encodeURIComponent(q)}`).then(r => r.json()),
      ])

      const registry: VenueOption[] = (regRes.matches ?? []).map((m: {
        id: string; name: string; lat: number; lng: number
      }) => ({ id: m.id, name: m.name, lat: m.lat, lng: m.lng, kind: 'registry' as const }))

      const geocoded: VenueOption[] = (geoRes.results ?? []).map((r: {
        place_id: string; display_name: string; lat: number; lng: number
      }) => ({ id: r.place_id, name: r.display_name, lat: r.lat, lng: r.lng, kind: 'geocode' as const }))

      // Registry results first, then geocode; cap total at 8
      setSuggestions([...registry, ...geocoded].slice(0, 8))
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce input changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(value), 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [value, search])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => value.length >= 2 && setOpen(true)}
          placeholder={placeholder ?? t.map.venuePlaceholder}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 pr-8 text-sm text-slate placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-royal-blue"
          autoComplete="off"
          spellCheck={false}
        />
        {loading ? (
          <svg className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted" fill="none" viewBox="0 0 24 24" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="absolute right-2.5 top-2.5 h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        )}
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-[2000] mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-border bg-white shadow-lg"
        >
          {suggestions.map(s => (
            <li key={`${s.kind}-${s.id}`} role="option" aria-selected={false}>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault()
                  onSelect(s)
                  onChange(s.name)
                  setOpen(false)
                  setSuggestions([])
                }}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-surface transition-colors"
              >
                {/* Kind badge */}
                <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold ${
                  s.kind === 'registry'
                    ? 'bg-royal-blue/15 text-royal-blue'
                    : 'bg-teal/15 text-teal'
                }`}>
                  {s.kind === 'registry' ? t.map.registryBadge : t.map.geocodeBadge}
                </span>
                <span className="text-xs leading-snug text-slate line-clamp-2">{s.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
