import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Search, Loader2, Check, X } from 'lucide-react';
import { POPULAR_LOCATIONS } from '../../data/taxonomyData';

interface LocationAutocompleteProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}

export function LocationAutocomplete({
  label,
  placeholder = 'e.g. Hyderabad, Telangana, India',
  value,
  onChange,
  required = false,
  disabled = false,
  helperText,
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch from OpenStreetMap Nominatim with debounce
  const searchNominatim = useCallback(async (text: string) => {
    if (!text || text.trim().length < 2) {
      // Default to curated locations matching text
      const filteredPresets = POPULAR_LOCATIONS.filter(loc => 
        loc.toLowerCase().includes((text || '').toLowerCase())
      );
      setResults(filteredPresets.slice(0, 8));
      return;
    }

    setLoading(true);
    try {
      const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&addressdetails=1&limit=6`;
      const res = await fetch(endpoint, {
        headers: { 'Accept-Language': 'en' },
      });
      if (res.ok) {
        const data = await res.json();
        const apiPlaces = data.map((item: any) => item.display_name).filter(Boolean);
        
        // Also combine with offline popular locations matching the query
        const localMatches = POPULAR_LOCATIONS.filter(loc => 
          loc.toLowerCase().includes(text.toLowerCase())
        );

        const combined = Array.from(new Set([...localMatches, ...apiPlaces]));
        setResults(combined.slice(0, 8));
      } else {
        // Fallback to offline presets
        const filteredPresets = POPULAR_LOCATIONS.filter(loc => 
          loc.toLowerCase().includes(text.toLowerCase())
        );
        setResults(filteredPresets);
      }
    } catch {
      // Offline fallback
      const filteredPresets = POPULAR_LOCATIONS.filter(loc => 
        loc.toLowerCase().includes(text.toLowerCase())
      );
      setResults(filteredPresets);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      searchNominatim(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, isOpen, searchNominatim]);

  const handleSelect = (loc: string) => {
    onChange(loc);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', opacity: disabled ? 0.45 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label} {required && <span style={{ color: 'var(--accent-primary)' }}>*</span>}
        </label>
      )}

      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(prev => !prev);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }
        }}
        className="input-field"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '0.55rem 0.85rem',
          minHeight: '40px',
          borderColor: isOpen ? 'var(--accent-primary)' : undefined,
          boxShadow: isOpen ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : undefined,
          background: disabled ? 'var(--bg-surface)' : 'var(--bg-elevated)',
          transition: 'all 0.15s ease'
        }}
      >
        <MapPin size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
        
        <span style={{ 
          color: value ? 'var(--text-primary)' : 'var(--text-muted)', 
          fontSize: '0.84375rem', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          flex: 1
        }}>
          {value || placeholder}
        </span>

        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setQuery('');
            }}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {helperText && (
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
          {helperText}
        </span>
      )}

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div
          className="animate-fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
            maxHeight: '270px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Search Header */}
          <div style={{ padding: '0.5rem 0.65rem', borderBottom: 'var(--micro-border)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {loading ? <Loader2 size={14} className="animate-spin" color="var(--accent-primary)" /> : <Search size={14} color="var(--text-muted)" />}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search city, state, or country..."
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                width: '100%',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem'
              }}
            />
          </div>

          {/* List items */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '0.25rem' }}>
            {results.length > 0 ? (
              results.map((loc, idx) => {
                const isSelected = loc === value;
                return (
                  <div
                    key={`${loc}-${idx}`}
                    onClick={() => handleSelect(loc)}
                    style={{
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isSelected ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                      fontWeight: isSelected ? 600 : 400,
                      gap: '0.5rem',
                      transition: 'background 0.1s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-elevated)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                      <MapPin size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {loc}
                      </span>
                    </div>
                    {isSelected && <Check size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />}
                  </div>
                );
              })
            ) : query.trim() ? (
              <div
                onClick={() => handleSelect(query.trim())}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  color: 'var(--accent-primary)',
                  background: 'rgba(37, 99, 235, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <MapPin size={14} />
                <span>Use custom:</span>
                <span style={{ fontWeight: 700 }}>"{query.trim()}"</span>
              </div>
            ) : (
              <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Type to search worldwide locations
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
