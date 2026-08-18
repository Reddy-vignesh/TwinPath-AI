import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface AutocompleteDropdownProps {
  label?: string;
  placeholder?: string;
  value: string;
  options: string[] | { name: string; shortName?: string; location?: string; subtitle?: string }[];
  onChange: (val: string) => void;
  disabled?: boolean;
  required?: boolean;
  allowCustom?: boolean;
  helperText?: string;
}

export function AutocompleteDropdown({
  label,
  placeholder = 'Select or search...',
  value,
  options,
  onChange,
  disabled = false,
  required = false,
  allowCustom = true,
  helperText,
}: AutocompleteDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
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

  // Format options
  const normalizedOptions: { label: string; sub?: string }[] = options.map(opt => {
    if (typeof opt === 'string') {
      return { label: opt };
    }
    const sub = [opt.shortName, opt.location, opt.subtitle].filter(Boolean).join(' • ');
    return { label: opt.name, sub };
  });

  // Filter options based on query
  const filtered = query.trim()
    ? normalizedOptions.filter(o => 
        o.label.toLowerCase().includes(query.toLowerCase()) || 
        (o.sub && o.sub.toLowerCase().includes(query.toLowerCase()))
      )
    : normalizedOptions;

  const handleSelect = (selectedLabel: string) => {
    onChange(selectedLabel);
    setQuery('');
    setIsOpen(false);
  };

  const handleCustomSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      if (allowCustom) {
        onChange(query.trim());
        setQuery('');
        setIsOpen(false);
      } else if (filtered.length > 0) {
        handleSelect(filtered[0].label);
      }
    }
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
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '0.55rem 0.85rem',
          minHeight: '40px',
          borderColor: isOpen ? 'var(--accent-primary)' : undefined,
          boxShadow: isOpen ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : undefined,
          background: disabled ? 'var(--bg-surface)' : 'var(--bg-elevated)',
          transition: 'all 0.15s ease'
        }}
      >
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.5rem', flexShrink: 0 }}>
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
          <ChevronDown size={14} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
        </div>
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
            maxHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Search Header */}
          <div style={{ padding: '0.5rem 0.65rem', borderBottom: 'var(--micro-border)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleCustomSubmit}
              placeholder="Search or type custom..."
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
            {filtered.length > 0 ? (
              filtered.map((item, idx) => {
                const isSelected = item.label === value;
                return (
                  <div
                    key={`${item.label}-${idx}`}
                    onClick={() => handleSelect(item.label)}
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
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.label}
                      </span>
                      {item.sub && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.sub}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />}
                  </div>
                );
              })
            ) : query.trim() && allowCustom ? (
              <div
                onClick={() => {
                  onChange(query.trim());
                  setQuery('');
                  setIsOpen(false);
                }}
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
                <span>Use custom:</span>
                <span style={{ fontWeight: 700 }}>"{query.trim()}"</span>
              </div>
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                No options found matching "{query}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
