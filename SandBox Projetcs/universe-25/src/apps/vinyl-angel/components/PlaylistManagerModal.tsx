// path: src/apps/vinyl-angel/components/PlaylistManagerModal.tsx

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ModalContainer } from '../../../components/shared/ModalContainer';
import { SharedButton } from '../../../components/shared/SharedButton';
import { executeOrder } from '../../../services/api';
import {
  saveCustomPlaylist,
  deleteCustomPlaylist,
  purgeChannelSongs,
  searchFullCatalog,
  parseQuarter,
  formatQuarterRange,
  fetchChannelMeta,
} from '../services/engine';
import { useVinylStore } from '../store/useVinylStore';
import type { CustomPlaylist, ChannelOriginItem, PlaylistType } from '../types';
import {
  Crown,
  Plus,
  Trash2,
  Edit3,
  Search,
  Check,
  CheckSquare,
  Square,
  Layers,
  Radio,
  Sparkles,
  ArrowLeft,
  X,
  Disc3,
  ListMusic,
  ChevronDown,
  FolderPlus,
} from 'lucide-react';

interface PlaylistManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  channelList: ChannelOriginItem[];
  onSelectPlaylist?: (playlistId: string) => void;
  initialEditPlaylistId?: string | null;
  initialSelectedChannels?: string[];
  initialSelectedSongIds?: string[];
}

const PRESET_EMOJIS = ['🎵', '🎧', '⚔️', '🌙', '⚡', '🚀', '🌊', '🪶', '☕', '🔥', '💎', '🌸', '🌌', '👑'];

const TIMEBLOCK_OPTIONS = [
  { id: 'Arc Zero ~ Kick Starter', label: 'Arc Zero ~ Kick Starter', emoji: '🌊' },
  { id: 'Arc 01 ~ Morning Star - Raye', label: 'Arc 01 ~ Morning Star - Raye', emoji: '🚀' },
  { id: 'Arc 02 ~ Battle Phase - Racheal', label: 'Arc 02 ~ Battle Phase - Racheal', emoji: '⚔️' },
  { id: 'Arc 03 ~ Night Hours Melody', label: 'Arc 03 ~ Night Hours Melody', emoji: '🌙' },
  { id: 'Arc 04 ~ Sacred Pragma', label: 'Arc 04 ~ Sacred Pragma', emoji: '🪶' },
];

const TYPE_OPTIONS: { id: PlaylistType; label: string; emoji: string; hint: string }[] = [
  { id: 'genre', label: 'Genre', emoji: '🎸', hint: 'Whole channels (+ songs from diverse channels)' },
  { id: 'genre_compilation', label: 'Genre Compilation', emoji: '🗂️', hint: 'Merges multiple Genre playlists' },
  { id: 'album', label: 'Album', emoji: '💿', hint: 'Handpicked songs of one period' },
  { id: 'collection', label: 'Album Compilation', emoji: '📚', hint: 'Merges multiple Albums' },
];

interface SongMeta {
  title: string;
  channel: string;
}

const DROPDOWN_CLASS =
  'absolute left-0 right-0 top-full mt-1 z-50 max-h-44 overflow-y-auto bg-[#140f1c] border border-[#d4af37]/60 rounded-xl shadow-2xl py-1';
const FIELD_CLASS =
  'w-full bg-[#171320] border border-[#3b2b4d] focus:border-[#ffd86b] rounded-xl px-3 py-2 text-sm text-white focus:outline-none transition';

const QUARTER_OPTIONS = ['1', '2', '3', '4'];
const YEAR_OPTIONS: string[] = (() => {
  const cy = new Date().getFullYear();
  const years: string[] = [];
  for (let y = cy + 10; y >= 1990; y--) years.push(String(y));
  // Closest to the current year first
  return years.sort((a, b) => Math.abs(+a - cy) - Math.abs(+b - cy) || +a - +b);
})();

// Year field with search-as-you-type suggestions (any 4-digit year is accepted)
const YearSuggest: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const q = value.trim();
  const options = YEAR_OPTIONS.filter((y) => !q || y.includes(q)).slice(0, 12);
  return (
    <div className="relative flex-1 min-w-0">
      <input
        type="text"
        inputMode="numeric"
        maxLength={4}
        placeholder="Year"
        value={value}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          onChange(e.target.value.replace(/\D/g, ''));
          setOpen(true);
        }}
        className={FIELD_CLASS}
      />
      {open && options.length > 0 && (
        <ul className={DROPDOWN_CLASS}>
          {options.map((y) => (
            <li
              key={y}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(y);
                setOpen(false);
              }}
              className={`px-3 py-1.5 text-sm cursor-pointer transition ${
                y === value ? 'bg-[#291e0a] text-[#ffd86b]' : 'text-[#cbd5e1] hover:bg-[#1f1730]'
              }`}
            >
              {y}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Quarter field with the 4 suggestions (Q1-Q4)
const QuarterSuggest: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative w-24 flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className={`${FIELD_CLASS} flex items-center justify-between cursor-pointer`}
      >
        <span>Q{value}</span>
        <ChevronDown className="w-3.5 h-3.5 text-[#8c7a9e]" />
      </button>
      {open && (
        <ul className={DROPDOWN_CLASS}>
          {QUARTER_OPTIONS.map((q) => (
            <li
              key={q}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(q);
                setOpen(false);
              }}
              className={`px-3 py-1.5 text-sm cursor-pointer transition ${
                q === value ? 'bg-[#291e0a] text-[#ffd86b]' : 'text-[#cbd5e1] hover:bg-[#1f1730]'
              }`}
            >
              Q{q}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Year + quarter picker (quarter on the right, default Q1).
// Emits 'YYYY-Qn' once a valid year is set, or '' while the year is empty/incomplete.
const QuarterPicker: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({
  label,
  value,
  onChange,
}) => {
  const parsed = parseQuarter(value);
  const [year, setYear] = useState(parsed ? String(parsed.year) : '');
  const [quarter, setQuarter] = useState(parsed ? String(parsed.quarter) : '1');

  const compose = (y: string, q: string) => (/^\d{4}$/.test(y) ? `${y}-Q${q}` : '');

  // Re-sync when the parent changes the value (loading a playlist, or mirroring the start)
  useEffect(() => {
    if (value !== compose(year, quarter)) {
      const p = parseQuarter(value);
      setYear(p ? String(p.year) : '');
      setQuarter(p ? String(p.quarter) : '1');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="space-y-1">
      <label className="text-xs font-mono text-[#8c7a9e]">{label}</label>
      <div className="flex items-start gap-1.5">
        <YearSuggest
          value={year}
          onChange={(y) => {
            setYear(y);
            onChange(compose(y, quarter));
          }}
        />
        <QuarterSuggest
          value={quarter}
          onChange={(q) => {
            setQuarter(q);
            onChange(compose(year, q));
          }}
        />
      </div>
    </div>
  );
};

export const PlaylistManagerModal: React.FC<PlaylistManagerModalProps> = ({
  isOpen,
  onClose,
  projectId,
  channelList,
  onSelectPlaylist,
  initialEditPlaylistId = null,
  initialSelectedChannels,
  initialSelectedSongIds,
}) => {
  const { customPlaylists, addCustomPlaylist, updateCustomPlaylist, removeCustomPlaylist, setChannelMetaMap } =
    useVinylStore();

  const [mode, setMode] = useState<'list' | 'edit'>(initialEditPlaylistId ? 'edit' : 'list');
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(initialEditPlaylistId);

  // Form fields
  const [type, setType] = useState<PlaylistType>('genre');
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎵');
  const [description, setDescription] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<string[]>([]);
  const [selectedParentCompilationIds, setSelectedParentCompilationIds] = useState<string[]>([]);
  const [selectedTimeblocks, setSelectedTimeblocks] = useState<string[]>([]);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  // While false, the end quarter mirrors the start quarter
  const [endTouched, setEndTouched] = useState(false);
  const [channelSearchQuery, setChannelSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handpicked-song picker state
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [songResults, setSongResults] = useState<{ id: string; title: string; channel: string }[]>([]);
  const [isSongSearching, setIsSongSearching] = useState(false);
  const [songMeta, setSongMeta] = useState<Record<string, SongMeta>>({});
  const songSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const albums = useMemo(
    () =>
      customPlaylists
        .filter((p) => p.type === 'album')
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [customPlaylists]
  );
  const genres = useMemo(
    () =>
      customPlaylists
        .filter((p) => p.type === 'genre')
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [customPlaylists]
  );
  const availableParentCompilations = useMemo(() => {
    if (type === 'album') {
      return customPlaylists
        .filter((p) => p.type === 'collection')
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    }
    if (type === 'genre') {
      return customPlaylists
        .filter((p) => p.type === 'genre_compilation')
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    }
    return [];
  }, [customPlaylists, type]);

  const resetPicker = () => {
    setSongSearchQuery('');
    setSongResults([]);
  };

  const loadPlaylistIntoForm = (pl: CustomPlaylist) => {
    setEditingPlaylistId(pl.id);
    setType(pl.type);
    setName(pl.name);
    setEmoji(pl.emoji || '🎵');
    setDescription(pl.description || '');
    setSelectedChannels([...pl.include_channels]);
    setSelectedSongIds([...pl.include_songs]);
    setSelectedAlbumIds([...pl.include_playlists]);
    const isDateType = pl.type === 'album' || pl.type === 'collection';
    const isTimeblockType = pl.type === 'genre' || pl.type === 'genre_compilation';
    setSelectedTimeblocks(isTimeblockType ? [...(pl.compatible_timeblocks || [])] : []);
    setDateStart(isDateType ? (pl.date_start || '') : '');
    setDateEnd(isDateType ? (pl.date_end || '') : '');
    setEndTouched(isDateType && !!pl.date_end);
    setChannelSearchQuery('');
    resetPicker();
    setErrorMessage(null);

    const parentType = pl.type === 'album' ? 'collection' : pl.type === 'genre' ? 'genre_compilation' : null;
    if (parentType) {
      const parentIds = customPlaylists
        .filter((p) => p.type === parentType && p.include_playlists.includes(pl.id))
        .map((p) => p.id);
      setSelectedParentCompilationIds(parentIds);
    } else {
      setSelectedParentCompilationIds([]);
    }

    setMode('edit');
  };

  useEffect(() => {
    if (!isOpen) return;

    if (initialEditPlaylistId) {
      const pl = customPlaylists.find((p) => p.id === initialEditPlaylistId);
      if (pl) {
        loadPlaylistIntoForm(pl);
        return;
      }
    }

    const hasChannels = !!initialSelectedChannels && initialSelectedChannels.length > 0;
    const hasSongs = !!initialSelectedSongIds && initialSelectedSongIds.length > 0;
    if (hasChannels || hasSongs) {
      setEditingPlaylistId(null);
      setType('genre');
      setName('');
      setEmoji('🎵');
      setDescription('');
      setSelectedChannels(hasChannels ? [...initialSelectedChannels!] : []);
      setSelectedSongIds(hasSongs ? [...initialSelectedSongIds!] : []);
      setSelectedAlbumIds([]);
      setSelectedParentCompilationIds([]);
      setSelectedTimeblocks([]);
      setDateStart('');
      setDateEnd('');
      setEndTouched(false);
      setChannelSearchQuery('');
      resetPicker();
      setErrorMessage(null);
      setMode('edit');
      return;
    }

    setMode('list');
    setEditingPlaylistId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialEditPlaylistId, initialSelectedChannels, initialSelectedSongIds, customPlaylists]);

  // Resolve titles for selected song IDs we have no metadata for (e.g. when editing)
  useEffect(() => {
    if (mode !== 'edit') return;
    const missing = selectedSongIds.filter((id) => !songMeta[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    executeOrder<Record<string, Record<string, unknown>>>({
      project_id: projectId,
      tier: '1',
      order: { action: 'batch_read', data: missing },
    })
      .then((res) => {
        if (cancelled || !res.data) return;
        const patch: Record<string, SongMeta> = {};
        Object.entries(res.data).forEach(([id, row]) => {
          patch[id] = {
            title: (row.title as string) || `Track ${id}`,
            channel: (row.channel_name as string) || (row.channel as string) || 'Unknown Origin',
          };
        });
        setSongMeta((prev) => ({ ...prev, ...patch }));
      })
      .catch((err) => console.warn('[PlaylistManager] Failed to resolve song titles:', err));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedSongIds, projectId]);

  // Debounced catalog search for handpicking songs
  const handleSongSearchChange = (q: string) => {
    setSongSearchQuery(q);
    if (songSearchTimerRef.current) clearTimeout(songSearchTimerRef.current);
    if (q.trim().length < 2) {
      setSongResults([]);
      setIsSongSearching(false);
      return;
    }
    setIsSongSearching(true);
    songSearchTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchFullCatalog(projectId, q, 30);
        setSongResults(res.map((r) => ({ id: r.id, title: r.title, channel: r.channel })));
        setSongMeta((prev) => {
          const next = { ...prev };
          res.forEach((r) => {
            next[r.id] = { title: r.title, channel: r.channel };
          });
          return next;
        });
      } catch (err) {
        console.warn('[PlaylistManager] Song search failed:', err);
        setSongResults([]);
      } finally {
        setIsSongSearching(false);
      }
    }, 350);
  };

  const startCreating = () => {
    setEditingPlaylistId(null);
    setType('genre');
    setName('');
    setEmoji('🎵');
    setDescription('');
    setSelectedChannels([]);
    setSelectedSongIds([]);
    setSelectedAlbumIds([]);
    setSelectedParentCompilationIds([]);
    setSelectedTimeblocks([]);
    setDateStart('');
    setDateEnd('');
    setEndTouched(false);
    setChannelSearchQuery('');
    resetPicker();
    setErrorMessage(null);
    setMode('edit');
  };

  const toggleChannel = (chName: string) => {
    setSelectedChannels((prev) =>
      prev.includes(chName) ? prev.filter((c) => c !== chName) : [...prev, chName]
    );
  };

  const toggleSong = (id: string) => {
    setSelectedSongIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const toggleAlbum = (id: string) => {
    setSelectedAlbumIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const toggleParentCompilation = (colId: string) => {
    setSelectedParentCompilationIds((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  };

  const toggleTimeblock = (tbId: string) => {
    setSelectedTimeblocks((prev) =>
      prev.includes(tbId) ? prev.filter((t) => t !== tbId) : [...prev, tbId]
    );
  };

  const filteredChannels = useMemo(() => {
    if (!channelSearchQuery.trim()) return channelList;
    const q = channelSearchQuery.toLowerCase().trim();
    return channelList.filter((ch) => ch.name.toLowerCase().includes(q));
  }, [channelList, channelSearchQuery]);

  const totalTracksInSelection = useMemo(() => {
    const chSet = new Set(selectedChannels);
    return channelList
      .filter((ch) => chSet.has(ch.name))
      .reduce((sum, ch) => sum + ch.count, 0);
  }, [channelList, selectedChannels]);

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMessage('Playlist title is required');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const existing = editingPlaylistId
        ? customPlaylists.find((p) => p.id === editingPlaylistId)
        : undefined;
      const saved = await saveCustomPlaylist(projectId, {
        id: editingPlaylistId || undefined,
        created_at: existing?.created_at,
        type,
        name: name.trim(),
        emoji,
        description: description.trim(),
        include_channels: selectedChannels,
        include_songs: selectedSongIds,
        include_playlists: selectedAlbumIds,
        compatible_timeblocks: type === 'genre' || type === 'genre_compilation' ? selectedTimeblocks : [],
        date_start: type === 'album' || type === 'collection' ? dateStart : '',
        date_end: type === 'album' || type === 'collection' ? dateEnd : '',
      });

      if (editingPlaylistId) {
        updateCustomPlaylist(saved);
      } else {
        addCustomPlaylist(saved);
      }

      // Sync parent compilations if this is an album or genre
      const targetParentType = type === 'album' ? 'collection' : type === 'genre' ? 'genre_compilation' : null;
      if (targetParentType) {
        const relevantParents = customPlaylists.filter((p) => p.type === targetParentType);
        await Promise.all(
          relevantParents.map(async (parent) => {
            const shouldInclude = selectedParentCompilationIds.includes(parent.id);
            const currentlyIncludes = parent.include_playlists.includes(saved.id);
            if (shouldInclude && !currentlyIncludes) {
              const updatedParent = await saveCustomPlaylist(projectId, {
                ...parent,
                include_playlists: [...parent.include_playlists, saved.id],
              });
              updateCustomPlaylist(updatedParent);
            } else if (!shouldInclude && currentlyIncludes) {
              const updatedParent = await saveCustomPlaylist(projectId, {
                ...parent,
                include_playlists: parent.include_playlists.filter((id) => id !== saved.id),
              });
              updateCustomPlaylist(updatedParent);
            }
          })
        );
      }

      // If saving an album, refresh channel metadata for auto-approval updates
      if (type === 'album') {
        try {
          const freshMeta = await fetchChannelMeta(projectId);
          setChannelMetaMap(freshMeta);
        } catch (e) {
          console.warn('[PlaylistManagerModal] Failed to refresh channel meta:', e);
        }
      }

      setMode('list');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save playlist');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (plId: string) => {
    const playlist = customPlaylists.find((p) => p.id === plId);
    if (!playlist) return;

    // Only Genre playlists own channels; Albums/Collections/Genre Compilations never purge any data
    const channelsToPurge = playlist.type === 'genre' ? playlist.include_channels : [];
    const usedBy = customPlaylists.filter(
      (p) => (p.type === 'collection' || p.type === 'genre_compilation') && p.include_playlists.includes(plId)
    );

    let message: string;
    if (channelsToPurge.length > 0) {
      const totalSongs = channelsToPurge.reduce((sum, chName) => {
        const ch = channelList.find((c) => c.name === chName);
        return sum + (ch?.count || 0);
      }, 0);
      message =
        `⚠️ PLAYLIST DELETION WITH CHANNEL PURGE\n\n` +
        `Delete playlist "${playlist.name}"?\n\n` +
        `This will:\n` +
        `• Delete the playlist\n` +
        `• PURGE all ${totalSongs.toLocaleString()} songs from ${channelsToPurge.length} channel(s):\n` +
        `  ${channelsToPurge.join(', ')}\n\n` +
        `This is a soft-reboot: you can re-curl these channels with refined filters.\n\n` +
        `Proceed?`;
    } else {
      message = `Delete ${playlist.type} playlist "${playlist.name}"? Songs and channels are not deleted.`;
    }
    if (usedBy.length > 0) {
      message += `\n\nNote: it is part of compilation(s): ${usedBy.map((p) => p.name).join(', ')}.`;
    }

    if (!confirm(message)) return;

    try {
      if (channelsToPurge.length > 0) {
        await Promise.all(
          channelsToPurge.map(async (chName) => {
            const ch = channelList.find((c) => c.name === chName);
            if (ch) {
              try {
                await purgeChannelSongs(projectId, ch.name, ch.channel_id);
              } catch (err) {
                console.warn(`[PlaylistDelete] Failed to purge channel ${chName}:`, err);
              }
            }
          })
        );
      }

      await deleteCustomPlaylist(projectId, plId);
      removeCustomPlaylist(plId);

      // If deleted playlist was an album, refresh channel metadata
      if (playlist.type === 'album') {
        try {
          const freshMeta = await fetchChannelMeta(projectId);
          setChannelMetaMap(freshMeta);
        } catch (e) {}
      }

      // Drop dangling references from compilations
      await Promise.all(
        usedBy.map(async (col) => {
          const cleaned = await saveCustomPlaylist(projectId, {
            ...col,
            include_playlists: col.include_playlists.filter((id) => id !== plId),
          });
          updateCustomPlaylist(cleaned);
        })
      );

      if (mode === 'edit' && editingPlaylistId === plId) {
        setMode('list');
      }
    } catch (err) {
      console.error('[PlaylistDelete] Failed to delete playlist:', err);
    }
  };

  const describeContent = (pl: CustomPlaylist): string => {
    if (pl.type === 'genre') {
      return `${pl.include_channels.length} ch + ${pl.include_songs.length} picked`;
    }
    if (pl.type === 'album') return `${pl.include_songs.length} songs`;
    if (pl.type === 'genre_compilation') {
      return `${pl.include_playlists.length} genre${pl.include_playlists.length === 1 ? '' : 's'}`;
    }
    return `${pl.include_playlists.length} album${pl.include_playlists.length === 1 ? '' : 's'}`;
  };

  const typeMeta = TYPE_OPTIONS.find((t) => t.id === type)!;

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'list' ? 'Custom Playlists' : editingPlaylistId ? 'Edit Playlist' : 'New Playlist'}
      subtitle={
        mode === 'list'
          ? 'Genres, Albums, and Compilations'
          : `${typeMeta.label}: ${typeMeta.hint}`
      }
      icon={<Crown className="w-5 h-5 text-[#ffd86b]" />}
      maxWidth="xl"
    >
      {mode === 'list' ? (
        <div className="space-y-4 text-left">
          {/* Top Action */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#8c7a9e]">
              Active Playlists ({customPlaylists.length})
            </span>
            <SharedButton variant="primary" size="sm" onClick={startCreating} className="flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-black" />
              <span>New Playlist</span>
            </SharedButton>
          </div>

          {/* List of Playlists */}
          {customPlaylists.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#140f1c] border border-[#2b2238] text-center space-y-2">
              <Sparkles className="w-8 h-8 text-[#ffd86b] mx-auto opacity-70" />
              <p className="text-sm font-cinzel font-bold text-[#f5f0e8]">No Custom Playlists Yet</p>
              <p className="text-xs text-[#8c7a9e] max-w-sm mx-auto">
                Create a Genre (Rock, Pop), handpick an Album, or merge Albums into a Compilation.
              </p>
            </div>
          ) : (
            (() => {
              const modalCollections = customPlaylists
                .filter((p) => p.type === 'collection')
                .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
              const modalAlbums = customPlaylists
                .filter((p) => p.type === 'album')
                .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
              const modalGenreCompilations = customPlaylists
                .filter((p) => p.type === 'genre_compilation')
                .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
              const modalGenres = customPlaylists
                .filter((p) => p.type === 'genre')
                .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

              const renderPlaylistItem = (pl: CustomPlaylist) => (
                <div
                  key={pl.id}
                  className="p-3 rounded-xl bg-[#15101f] hover:bg-[#1c152a] border border-[#2e243d] hover:border-[#d4af37]/60 transition flex items-center justify-between gap-3 group"
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    onClick={() => {
                      if (onSelectPlaylist) {
                        onSelectPlaylist(pl.id);
                        onClose();
                      }
                    }}
                  >
                    <span className="text-xl flex-shrink-0">{pl.emoji || '🎵'}</span>
                    <div className="truncate">
                      <h4 className="text-sm font-bold text-white group-hover:text-[#ffd86b] transition truncate">
                        {pl.name}
                      </h4>
                      <p className="text-[11px] font-mono text-[#8c7a9e] truncate">
                        <span className="uppercase text-[#ffd86b]">{pl.type}</span> • {describeContent(pl)}
                        {(pl.type === 'album' || pl.type === 'collection') && (pl.date_start || pl.date_end) ? ` • ${formatQuarterRange(pl.date_start, pl.date_end)}` : ''}
                        {pl.description ? ` • ${pl.description}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => loadPlaylistIntoForm(pl)}
                      title="Edit Playlist"
                      className="p-1.5 rounded-lg bg-[#20172e] hover:bg-[#2e2042] text-[#8c7a9e] hover:text-white border border-[#3b2b52] transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(pl.id)}
                      title="Delete Playlist"
                      className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-800/50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );

              return (
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {modalCollections.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#ffd86b] font-bold flex items-center gap-1 px-1">
                        📚 Album Compilations ({modalCollections.length})
                      </span>
                      {modalCollections.map(renderPlaylistItem)}
                    </div>
                  )}

                  {modalAlbums.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#b3a6c7] font-bold flex items-center gap-1 px-1">
                        💿 Albums ({modalAlbums.length})
                      </span>
                      {modalAlbums.map(renderPlaylistItem)}
                    </div>
                  )}

                  {modalGenreCompilations.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#ffd86b] font-bold flex items-center gap-1 px-1">
                        🗂️ Genre Compilations ({modalGenreCompilations.length})
                      </span>
                      {modalGenreCompilations.map(renderPlaylistItem)}
                    </div>
                  )}

                  {modalGenres.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c7a9e] font-bold flex items-center gap-1 px-1">
                        🎸 Genre Playlists ({modalGenres.length})
                      </span>
                      {modalGenres.map(renderPlaylistItem)}
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      ) : (
        /* Edit / Create Form */
        <div className="space-y-4 text-left">
          <button
            type="button"
            onClick={() => setMode('list')}
            className="inline-flex items-center gap-1 text-xs font-mono text-[#8c7a9e] hover:text-[#ffd86b] transition cursor-pointer mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Playlists List</span>
          </button>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-600/70 text-rose-200 text-xs font-mono">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Playlist Type (locked once created) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TYPE_OPTIONS.map((opt) => {
              const isActive = type === opt.id;
              const locked = !!editingPlaylistId && !isActive;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    setType(opt.id);
                    setSelectedParentCompilationIds([]);
                    if (opt.id === 'genre' || opt.id === 'genre_compilation') {
                      setDateStart('');
                      setDateEnd('');
                    }
                    if (opt.id === 'album' || opt.id === 'collection') {
                      setSelectedTimeblocks([]);
                    }
                  }}
                  title={locked ? 'Type cannot be changed after creation' : opt.hint}
                  className={`p-2.5 rounded-xl text-xs flex flex-col items-center gap-0.5 transition border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isActive
                      ? 'bg-[#291e0a] text-[#ffd86b] border-[#d4af37] shadow-gold-sm'
                      : 'bg-[#181224] text-[#8c7a9e] hover:text-white border-[#2b1f3b]'
                  }`}
                >
                  <span className="text-lg">{opt.emoji}</span>
                  <span className="font-bold">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Name & Emoji */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="sm:col-span-3 space-y-1">
              <label className="text-xs font-mono text-[#8c7a9e]">Playlist Title *</label>
              <input
                type="text"
                autoFocus
                placeholder={
                  type === 'genre' ? 'e.g. Rock' : type === 'album' ? 'e.g. Grade 10' : 'e.g. High School'
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#171320] border border-[#3b2b4d] focus:border-[#ffd86b] rounded-xl px-3 py-2 text-sm text-white focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#8c7a9e]">Icon Emoji</label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  maxLength={2}
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-14 text-center bg-[#171320] border border-[#3b2b4d] focus:border-[#ffd86b] rounded-xl py-2 text-lg text-white focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Preset Emojis Row */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-[#8c7a9e] mr-1">Quick Icons:</span>
            {PRESET_EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setEmoji(em)}
                className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition border cursor-pointer ${
                  emoji === em ? 'bg-[#ffd86b] border-[#ffd86b] text-black shadow-gold-sm' : 'bg-[#181224] border-[#312340] hover:bg-[#251b36]'
                }`}
              >
                {em}
              </button>
            ))}
          </div>

          {/* Period covered, in quarters (Album & Album Compilation only; Genre drops date) */}
          {(type === 'album' || type === 'collection') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <QuarterPicker
                label="From"
                value={dateStart}
                onChange={(v) => {
                  setDateStart(v);
                  if (!endTouched) setDateEnd(v);
                }}
              />
              <QuarterPicker
                label="To (inclusive, defaults to From)"
                value={dateEnd}
                onChange={(v) => {
                  setEndTouched(true);
                  setDateEnd(v);
                }}
              />
            </div>
          )}

          {/* Short note */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-[#8c7a9e]">Note / Short Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional short note"
              className="w-full bg-[#171320] border border-[#3b2b4d] focus:border-[#ffd86b] rounded-xl px-3 py-2 text-sm text-white focus:outline-none transition"
            />
          </div>

          {/* GENRE: Channel Multi-Selection */}
          {type === 'genre' && (
            <div className="p-3.5 rounded-xl bg-[#110d1a] border border-[#2b2038] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-cinzel font-bold text-[#ffd86b] flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  <span>Member Channels</span>
                </span>
                <span className="text-[11px] font-mono text-[#8c7a9e]">
                  <strong className="text-white">{selectedChannels.length}</strong> selected •{' '}
                  <strong className="text-[#ffd86b]">{totalTracksInSelection.toLocaleString()}</strong> pooled songs
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8c7a9e] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter channels (e.g. Hoyo, NCS, Remix)..."
                  value={channelSearchQuery}
                  onChange={(e) => setChannelSearchQuery(e.target.value)}
                  className="w-full bg-[#181224] border border-[#362747] focus:border-[#d4af37] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none transition placeholder-[#5e4f73]"
                />
              </div>

              <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                {filteredChannels.length === 0 ? (
                  <p className="text-xs text-[#6e5d85] italic p-2">No matching channels found</p>
                ) : (
                  filteredChannels.map((ch) => {
                    const isChecked = selectedChannels.includes(ch.name);
                    return (
                      <button
                        key={ch.name}
                        type="button"
                        onClick={() => toggleChannel(ch.name)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-mono transition text-left cursor-pointer border ${
                          isChecked
                            ? 'bg-[#291e0a] text-[#ffd86b] border-[#d4af37] shadow-gold-sm'
                            : 'bg-[#181224] text-[#b3a6c7] hover:text-white border-[#2b1f3b] hover:bg-[#201830]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#ffd86b] flex-shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-[#6e5d85] flex-shrink-0" />
                          )}
                          <span className="truncate">{ch.name}</span>
                        </div>
                        <span className="text-[10px] text-[#8c7a9e] flex-shrink-0 ml-2">
                          {ch.count.toLocaleString()} songs
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* GENRE (extra songs) & ALBUM (songs): handpicked songs */}
          {(type === 'genre' || type === 'album') && (
            <div className="p-3.5 rounded-xl bg-[#110d1a] border border-[#2b2038] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-cinzel font-bold text-[#ffd86b] flex items-center gap-1.5">
                  <Disc3 className="w-3.5 h-3.5" />
                  <span>{type === 'album' ? 'Handpicked Songs' : 'Extra Songs (diverse channels)'}</span>
                </span>
                <span className="text-[11px] font-mono text-[#8c7a9e]">
                  <strong className="text-white">{selectedSongIds.length}</strong> picked
                </span>
              </div>

              {selectedSongIds.length > 0 && (
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {selectedSongIds.map((id) => {
                    const meta = songMeta[id];
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-[#291e0a] border border-[#d4af37]/50 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[#ffd86b] font-semibold">{meta?.title || id}</p>
                          {meta && <p className="truncate text-[10px] text-[#8c7a9e] font-mono">{meta.channel}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSong(id)}
                          title="Remove song"
                          className="p-1 text-[#8c7a9e] hover:text-rose-300 transition cursor-pointer flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8c7a9e] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search the catalog by title, channel or ID (min 2 chars)..."
                  value={songSearchQuery}
                  onChange={(e) => handleSongSearchChange(e.target.value)}
                  className="w-full bg-[#181224] border border-[#362747] focus:border-[#d4af37] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none transition placeholder-[#5e4f73]"
                />
              </div>

              {songSearchQuery.trim().length >= 2 && (
                <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                  {isSongSearching ? (
                    <p className="text-xs text-[#6e5d85] italic p-2">Searching...</p>
                  ) : songResults.length === 0 ? (
                    <p className="text-xs text-[#6e5d85] italic p-2">No songs found</p>
                  ) : (
                    songResults.map((r) => {
                      const picked = selectedSongIds.includes(r.id);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => toggleSong(r.id)}
                          className={`w-full flex items-center justify-between gap-2 p-2 rounded-lg text-xs transition text-left cursor-pointer border ${
                            picked
                              ? 'bg-[#291e0a] text-[#ffd86b] border-[#d4af37]'
                              : 'bg-[#181224] text-[#b3a6c7] hover:text-white border-[#2b1f3b] hover:bg-[#201830]'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{r.title}</p>
                            <p className="truncate text-[10px] text-[#8c7a9e] font-mono">{r.channel}</p>
                          </div>
                          {picked ? (
                            <Check className="w-4 h-4 text-[#ffd86b] flex-shrink-0" />
                          ) : (
                            <Plus className="w-4 h-4 text-[#8c7a9e] flex-shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* COLLECTION: select Albums */}
          {type === 'collection' && (
            <div className="p-3.5 rounded-xl bg-[#110d1a] border border-[#2b2038] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-cinzel font-bold text-[#ffd86b] flex items-center gap-1.5">
                  <ListMusic className="w-3.5 h-3.5" />
                  <span>Member Albums</span>
                </span>
                <span className="text-[11px] font-mono text-[#8c7a9e]">
                  <strong className="text-white">{selectedAlbumIds.length}</strong> selected
                </span>
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                {albums.length === 0 ? (
                  <p className="text-xs text-[#6e5d85] italic p-2">
                    No Albums yet. Create Albums first, then merge them here.
                  </p>
                ) : (
                  albums.map((al) => {
                    const isChecked = selectedAlbumIds.includes(al.id);
                    return (
                      <button
                        key={al.id}
                        type="button"
                        onClick={() => toggleAlbum(al.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-mono transition text-left cursor-pointer border ${
                          isChecked
                            ? 'bg-[#291e0a] text-[#ffd86b] border-[#d4af37] shadow-gold-sm'
                            : 'bg-[#181224] text-[#b3a6c7] hover:text-white border-[#2b1f3b] hover:bg-[#201830]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#ffd86b] flex-shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-[#6e5d85] flex-shrink-0" />
                          )}
                          <span className="truncate">
                            {al.emoji || '💿'} {al.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#8c7a9e] flex-shrink-0 ml-2">
                          {al.include_songs.length} songs
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* GENRE COMPILATION: select Genres */}
          {type === 'genre_compilation' && (
            <div className="p-3.5 rounded-xl bg-[#110d1a] border border-[#2b2038] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-cinzel font-bold text-[#ffd86b] flex items-center gap-1.5">
                  <ListMusic className="w-3.5 h-3.5" />
                  <span>Member Genres</span>
                </span>
                <span className="text-[11px] font-mono text-[#8c7a9e]">
                  <strong className="text-white">{selectedAlbumIds.length}</strong> selected
                </span>
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                {genres.length === 0 ? (
                  <p className="text-xs text-[#6e5d85] italic p-2">
                    No Genre playlists yet. Create Genre playlists first, then merge them here.
                  </p>
                ) : (
                  genres.map((g) => {
                    const isChecked = selectedAlbumIds.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleAlbum(g.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-mono transition text-left cursor-pointer border ${
                          isChecked
                            ? 'bg-[#291e0a] text-[#ffd86b] border-[#d4af37] shadow-gold-sm'
                            : 'bg-[#181224] text-[#b3a6c7] hover:text-white border-[#2b1f3b] hover:bg-[#201830]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#ffd86b] flex-shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-[#6e5d85] flex-shrink-0" />
                          )}
                          <span className="truncate">
                            {g.emoji || '🎸'} {g.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#8c7a9e] flex-shrink-0 ml-2">
                          {g.include_channels.length} ch, {g.include_songs.length} songs
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* PARENT COMPILATION (Optional for Album or Genre) */}
          {(type === 'album' || type === 'genre') && (
            <div className="p-3.5 rounded-xl bg-[#110d1a] border border-[#2b2038] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-cinzel font-bold text-[#ffd86b] flex items-center gap-1.5">
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>
                    Add to {type === 'album' ? 'Album Compilation' : 'Genre Compilation'} (Optional)
                  </span>
                </span>
                <span className="text-[11px] font-mono text-[#8c7a9e]">
                  {selectedParentCompilationIds.length > 0 ? (
                    <span className="text-[#ffd86b]">{selectedParentCompilationIds.length} selected</span>
                  ) : (
                    'Standalone (None)'
                  )}
                </span>
              </div>

              {availableParentCompilations.length === 0 ? (
                <p className="text-xs text-[#6e5d85] italic p-1">
                  No {type === 'album' ? 'Album Compilations' : 'Genre Compilations'} created yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {availableParentCompilations.map((col) => {
                    const isSelected = selectedParentCompilationIds.includes(col.id);
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => toggleParentCompilation(col.id)}
                        className={`p-2 rounded-lg text-xs font-mono flex items-center justify-between gap-2 transition border cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[#291e0a] text-[#ffd86b] border-[#d4af37] shadow-gold-sm'
                            : 'bg-[#181224] text-[#8c7a9e] hover:text-white border-[#2b1f3b]'
                        }`}
                      >
                        <span className="truncate">
                          {col.emoji || (type === 'album' ? '📚' : '🗂️')} {col.name}
                        </span>
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-[#ffd86b] flex-shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-[#6e5d85] flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Compatible Timeblock Arcs (Genre & Genre Compilation only; Album drops timeblock) */}
          {type !== 'album' && type !== 'collection' && (
            <div className="p-3.5 rounded-xl bg-[#110d1a] border border-[#2b2038] space-y-2">
              <span className="text-xs font-cinzel font-bold text-[#ffd86b] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Compatible Timeblock Arcs (Optional)</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {TIMEBLOCK_OPTIONS.map((tb) => {
                  const isActive = selectedTimeblocks.includes(tb.id);
                  return (
                    <button
                      key={tb.id}
                      type="button"
                      onClick={() => toggleTimeblock(tb.id)}
                      className={`p-2 rounded-lg text-xs font-sans flex items-center gap-2 transition border cursor-pointer ${
                        isActive
                          ? 'bg-[#291e0a] text-[#ffd86b] border-[#d4af37] shadow-gold-sm'
                          : 'bg-[#181224] text-[#8c7a9e] hover:text-white border-[#2b1f3b]'
                      }`}
                    >
                      <span>{tb.emoji}</span>
                      <span className="truncate text-[11px]">{tb.label}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-[#ffd86b] ml-auto flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#261c33]">
            <SharedButton variant="secondary" size="md" onClick={() => setMode('list')} disabled={isSaving}>
              Cancel
            </SharedButton>
            <SharedButton variant="primary" size="md" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : editingPlaylistId ? 'Update Playlist' : 'Create Playlist'}
            </SharedButton>
          </div>
        </div>
      )}
    </ModalContainer>
  );
};
