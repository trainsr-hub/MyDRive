import React, { useState, useEffect, useRef } from 'react';
import { Search, Check, AlertCircle, X, Sparkles } from 'lucide-react';

export interface CharacterSearchResult {
  id: string;
  char_code: string;
  canonical_name: string;
  short_names?: string[];
  series_ids?: string[];
  series?: string;
  avatar_url?: string;
  hazard_rank?: number;
  hazard_score?: number;
  hazard_class?: string;
}

interface CharacterIdSelectorProps {
  value: string; // The char_code e.g. 'A01'
  displayName?: string;
  avatarUrl?: string;
  onSelect: (character: CharacterSearchResult) => void;
  placeholder?: string;
  disabled?: boolean;
}

const FALLBACK_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%231a1f3a'/%3E%3Ctext x='50' y='55' font-size='32' text-anchor='middle' fill='%23d4af37' font-family='monospace'%3E%3F%3C/text%3E%3C/svg%3E";

export const CharacterIdSelector: React.FC<CharacterIdSelectorProps> = ({
  value,
  displayName,
  avatarUrl,
  onSelect,
  placeholder = 'Type Character ID (e.g. A01)...',
  disabled = false,
}) => {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<CharacterSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isValidMatch, setIsValidMatch] = useState(true);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Search characters with debounce
  useEffect(() => {
    let active = true;
    const fetchMatches = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/characters?q=${encodeURIComponent(query)}&limit=15`);
        if (res.ok && active) {
          const data: CharacterSearchResult[] = await res.json();
          setResults(data);
          setSelectedIndex(0);

          // Validate if exact match exists when query is non-empty
          if (query.trim()) {
            const hasExact = data.some(
              (c) => c.char_code.toUpperCase() === query.trim().toUpperCase()
            );
            setIsValidMatch(hasExact);
          } else {
            setIsValidMatch(true);
          }
        }
      } catch (e) {
        console.error('[CharacterIdSelector] Search error:', e);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchMatches, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (char: CharacterSearchResult) => {
    setQuery(char.char_code);
    setIsValidMatch(true);
    setIsOpen(false);
    onSelect(char);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < results.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {/* Input Box with Character ID, Name preview & Status */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-hazard-void transition ${
          !isValidMatch && query.trim()
            ? 'border-hazard-crimson ring-1 ring-hazard-crimson/50'
            : isOpen
            ? 'border-hazard-gold ring-1 ring-hazard-gold/40'
            : 'border-hazard-border hover:border-hazard-borderHover'
        }`}
      >
        {/* Avatar Thumbnail */}
        <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-hazard-border bg-hazard-card">
          <img
            src={avatarUrl || FALLBACK_AVATAR}
            alt="Avatar"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
            }}
          />
        </div>

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-xs font-mono font-bold text-hazard-gold placeholder:text-hazard-textMuted/40 uppercase outline-none"
        />

        {/* Resolved Name Readout if available */}
        {displayName && (
          <span className="text-[11px] font-bold text-hazard-textBright truncate max-w-[130px] hidden sm:inline">
            {displayName}
          </span>
        )}

        {/* Invalid ID Badge */}
        {!isValidMatch && query.trim() && (
          <span
            title="Character ID not found in SQLite database. Options are strictly restricted to registered characters."
            className="flex items-center gap-1 text-[10px] font-mono font-bold text-hazard-crimson bg-hazard-crimson/15 px-1.5 py-0.5 rounded border border-hazard-crimson/30"
          >
            <AlertCircle className="w-3 h-3" />
            <span>Not in DB</span>
          </span>
        )}
      </div>

      {/* Auto-Suggest Dropdown List (Options restricted strictly to SQLite) */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-60 overflow-y-auto rounded-2xl bg-hazard-card border-2 border-hazard-border shadow-2xl p-1.5 flex flex-col gap-1 animate-fadeIn">
          {isLoading && results.length === 0 ? (
            <div className="p-3 text-center text-xs font-mono text-hazard-textMuted">
              Querying character registry...
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 text-center text-xs font-mono text-hazard-crimson flex flex-col items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              <span>No character found with ID "{query.toUpperCase()}"</span>
              <span className="text-[10px] text-hazard-textMuted/60">
                (Strict constraint: Only pre-registered character IDs can be chosen)
              </span>
            </div>
          ) : (
            results.map((char, idx) => {
              const isSelected = idx === selectedIndex;
              const isExact = char.char_code.toUpperCase() === query.trim().toUpperCase();

              return (
                <div
                  key={char.id}
                  onClick={() => handleSelect(char)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition select-none ${
                    isSelected
                      ? 'bg-hazard-cardHover text-white ring-1 ring-hazard-gold/50'
                      : 'hover:bg-hazard-void/80 text-hazard-textBright'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={char.avatar_url || FALLBACK_AVATAR}
                      alt={char.canonical_name}
                      className="w-8 h-8 rounded-lg object-cover border border-hazard-border shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
                      }}
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-hazard-gold bg-hazard-gold/15 px-1.5 py-0.2 rounded border border-hazard-gold/30">
                          {char.char_code}
                        </span>
                        <span className="text-xs font-bold text-hazard-textBright truncate">
                          {char.canonical_name}
                        </span>
                        {char.short_names && char.short_names.length > 0 && (
                          <span className="text-[10px] font-mono text-hazard-gold/80 bg-hazard-gold/10 px-1 py-0.2 rounded border border-hazard-gold/20">
                            {char.short_names.join(', ')}
                          </span>
                        )}
                      </div>
                      {char.series && (
                        <span className="text-[10px] font-mono text-hazard-textMuted truncate">
                          {char.series}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hazard Rank Pill */}
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {(char.hazard_rank !== undefined || char.hazard_score !== undefined) && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-hazard-void border border-hazard-border text-hazard-cyan">
                        Rank {char.hazard_rank ?? Math.round(Number(char.hazard_score || 0))}
                      </span>
                    )}
                    {isExact && <Check className="w-4 h-4 text-hazard-gold" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
