// path: src/apps/vinyl-angel/components/VinylPlaylists.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useVinylStore } from '../store/useVinylStore';
import {
  fetchCustomPlaylists,
  resolvePlaylistSources,
  formatQuarterRange,
  fetchChannelOrigins,
  deleteCustomPlaylist,
  saveFilterConfig,
  fetchChannelMeta,
  updateChannelStatus,
  purgeChannelSongs,
} from '../services/engine';
import { getRankFromScore } from '../../../utils/rank';
import { HazardBadge } from '../../../components/HazardBadge';
import { SharedButton } from '../../../components/shared/SharedButton';
import { PlaylistManagerModal } from './PlaylistManagerModal';
import type { CustomPlaylist, ChannelOriginItem, ChannelStatus } from '../types';
import {
  ListMusic,
  Plus,
  Search,
  Play,
  Edit3,
  Trash2,
  Radio,
  Sparkles,
  ArrowUpDown,
  Crown,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';

interface VinylPlaylistsProps {
  projectId?: string;
  onNavigateToGameplay?: (channelOrCustomId?: string) => void;
}

export const VinylPlaylists: React.FC<VinylPlaylistsProps> = ({
  projectId = 'music_app',
  onNavigateToGameplay,
}) => {
  const targetProjectId = !projectId || projectId === 'vinyl_angel' ? 'music_app' : projectId;
  const {
    customPlaylists,
    setCustomPlaylists,
    removeCustomPlaylist,
    channelList,
    setChannelList,
    channelMetaMap,
    setChannelMetaMap,
    updateChannelStatus: updateChannelStatusInStore,
  } = useVinylStore();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'custom' | 'origins'>('custom');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'hazard' | 'count' | 'name'>('name');
  const [isGenreExpanded, setIsGenreExpanded] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'cleaning' | 'raw'>('all');
  const [purgingChannelName, setPurgingChannelName] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: 'info' | 'success' | 'warn' | 'error' } | null>(null);

  const showToast = (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPlaylistId, setEditPlaylistId] = useState<string | null>(null);

  // Load playlists, channel origins, and curation metadata on mount
  useEffect(() => {
    let isCancelled = false;
    const loadData = async () => {
      setLoading(true);
      try {
        const [pls, chs, meta] = await Promise.all([
          fetchCustomPlaylists(targetProjectId),
          fetchChannelOrigins(targetProjectId),
          fetchChannelMeta(targetProjectId),
        ]);
        if (!isCancelled) {
          setCustomPlaylists(pls);
          setChannelList(chs);
          setChannelMetaMap(meta);
        }
      } catch (err) {
        console.error('[VinylPlaylists] Error loading data:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [targetProjectId, setCustomPlaylists]);

  // Channel lookup dictionary for quick O(1) stats computation
  const channelLookup = useMemo(() => {
    const map = new Map<string, ChannelOriginItem>();
    channelList.forEach((ch) => map.set(ch.name, ch));
    return map;
  }, [channelList]);

  // Compute aggregate stats for a custom playlist
  const getPlaylistStats = (pl: CustomPlaylist) => {
    let totalSongs = 0;
    let weightedHazardSum = 0;

    const src = resolvePlaylistSources(customPlaylists, pl.id);
    src.channels.forEach((chName) => {
      const ch = channelLookup.get(chName);
      if (ch) {
        totalSongs += ch.count;
        weightedHazardSum += (ch.avg_hazard ?? 3.0) * ch.count;
      }
    });
    // Handpicked songs: per-song hazard is not loaded here, so they count at the neutral 3.0 baseline
    totalSongs += src.songIds.length;
    weightedHazardSum += 3.0 * src.songIds.length;

    const avgHazard = totalSongs > 0 ? weightedHazardSum / totalSongs : 3.0;
    const roundedHazard = Math.round(avgHazard * 100) / 100;
    const rankCategory = getRankFromScore(roundedHazard);

    return {
      totalSongs,
      avgHazard: roundedHazard,
      rankCategory,
    };
  };

  // Filter and sort Custom Playlists
  const filteredCustomPlaylists = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let res = customPlaylists.filter((pl) => {
      if (!q) return true;
      const matchName = pl.name.toLowerCase().includes(q);
      const matchDesc = pl.description?.toLowerCase().includes(q);
      const matchChannel = pl.include_channels.some((c) => c.toLowerCase().includes(q));
      const matchType = pl.type.includes(q);
      const matchArc = pl.compatible_timeblocks?.some((t) => t.toLowerCase().includes(q));
      const matchMemberAlbum =
        pl.type === 'collection' &&
        pl.include_playlists.some((albumId) => {
          const alb = customPlaylists.find((a) => a.id === albumId);
          return alb && alb.name.toLowerCase().includes(q);
        });
      const matchMemberGenre =
        pl.type === 'genre_compilation' &&
        pl.include_playlists.some((genreId) => {
          const gen = customPlaylists.find((g) => g.id === genreId);
          return gen && gen.name.toLowerCase().includes(q);
        });
      return (
        matchName ||
        matchDesc ||
        matchChannel ||
        matchArc ||
        matchType ||
        matchMemberAlbum ||
        matchMemberGenre
      );
    });

    if (sortBy === 'hazard') {
      res = [...res].sort((a, b) => getPlaylistStats(b).avgHazard - getPlaylistStats(a).avgHazard);
    } else if (sortBy === 'count') {
      res = [...res].sort((a, b) => getPlaylistStats(b).totalSongs - getPlaylistStats(a).totalSongs);
    } else if (sortBy === 'name') {
      res = [...res].sort((a, b) => a.name.localeCompare(b.name));
    }

    return res;
  }, [customPlaylists, searchQuery, sortBy, channelLookup]);

  const collections = useMemo(
    () => filteredCustomPlaylists.filter((p) => p.type === 'collection'),
    [filteredCustomPlaylists]
  );

  const allAlbums = useMemo(
    () => filteredCustomPlaylists.filter((p) => p.type === 'album'),
    [filteredCustomPlaylists]
  );

  const genreCompilations = useMemo(
    () => filteredCustomPlaylists.filter((p) => p.type === 'genre_compilation'),
    [filteredCustomPlaylists]
  );

  const allGenres = useMemo(
    () => filteredCustomPlaylists.filter((p) => p.type === 'genre'),
    [filteredCustomPlaylists]
  );

  // Set of album IDs that belong to at least one collection
  const albumIdsInCollections = useMemo(() => {
    const set = new Set<string>();
    customPlaylists
      .filter((p) => p.type === 'collection')
      .forEach((col) => {
        col.include_playlists.forEach((id) => set.add(id));
      });
    return set;
  }, [customPlaylists]);

  // Standalone albums = albums not assigned to any collection
  const standaloneAlbums = useMemo(
    () => allAlbums.filter((a) => !albumIdsInCollections.has(a.id)),
    [allAlbums, albumIdsInCollections]
  );

  // Set of genre IDs that belong to at least one genre compilation
  const genreIdsInCompilations = useMemo(() => {
    const set = new Set<string>();
    customPlaylists
      .filter((p) => p.type === 'genre_compilation')
      .forEach((gc) => {
        gc.include_playlists.forEach((id) => set.add(id));
      });
    return set;
  }, [customPlaylists]);

  // Standalone genres = genres not assigned to any genre compilation
  const standaloneGenres = useMemo(
    () => allGenres.filter((g) => !genreIdsInCompilations.has(g.id)),
    [allGenres, genreIdsInCompilations]
  );

  // Enhanced channels with curation metadata
  const channelsWithMeta = useMemo(() => {
    return channelList.map((ch) => {
      const meta =
        channelMetaMap[ch.channel_id || ''] ||
        channelMetaMap[ch.name] ||
        { status: 'raw' as ChannelStatus };
      return {
        ...ch,
        status: meta.status,
      };
    });
  }, [channelList, channelMetaMap]);

  // Filter and sort Raw Channel Origins with Manager's Triple-Priority Order:
  // 1. Status: Approved -> Cleaning -> Raw
  // 2. Hazard Level: High to Low
  // 3. Number of songs: High to Low
  const filteredOriginChannels = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let res = channelsWithMeta.filter((ch) => {
      const matchSearch =
        !q ||
        ch.name.toLowerCase().includes(q) ||
        (ch.best_title && ch.best_title.toLowerCase().includes(q));
      const matchStatus = statusFilter === 'all' || ch.status === statusFilter;
      return matchSearch && matchStatus;
    });

    const statusWeight = (s?: ChannelStatus) => {
      if (s === 'approved') return 1;
      if (s === 'cleaning') return 2;
      return 3; // 'raw'
    };

    res.sort((a, b) => {
      // 1. Status Priority: Approved (1) -> Cleaning (2) -> Raw (3)
      const sA = statusWeight(a.status);
      const sB = statusWeight(b.status);
      if (sA !== sB) return sA - sB;

      // 2. Hazard Level: High to Low
      const hA = a.avg_hazard ?? 3.0;
      const hB = b.avg_hazard ?? 3.0;
      if (Math.abs(hA - hB) > 0.001) return hB - hA;

      // 3. Number of songs: High to Low
      return b.count - a.count;
    });

    return res;
  }, [channelsWithMeta, searchQuery, statusFilter]);

  const handleCycleStatus = async (ch: ChannelOriginItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = ch.status || 'raw';
    const next: ChannelStatus =
      current === 'raw' ? 'cleaning' : current === 'cleaning' ? 'approved' : 'raw';

    // Optimistic update in shared store (propagates to all tabs immediately)
    updateChannelStatusInStore(ch.channel_id || ch.name, ch.name, next);

    try {
      await updateChannelStatus(targetProjectId, ch.channel_id || '', ch.name, next);
      showToast(`Set "${ch.name}" status to ${next.toUpperCase()}`, 'success');
    } catch (err) {
      showToast(`Failed to update status for ${ch.name}`, 'error');
    }
  };

  const handlePurgeChannel = async (ch: ChannelOriginItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `⚠️ PERMANENT PURGE WARNING\n\nDelete all ${ch.count.toLocaleString()} songs of "${ch.name}"?\n\nThis completely removes all tracks of this channel from Tier 1, 3, and 4 so you can re-ingest clean curated playlists.\n\nProceed?`
    );
    if (!confirmed) return;

    setPurgingChannelName(ch.name);
    try {
      const res = await purgeChannelSongs(targetProjectId, ch.name, ch.channel_id);
      if (res.success) {
        showToast(
          `🗑️ Purged ${res.purged_count.toLocaleString()} songs from "${ch.name}". Channel cleared!`,
          'success'
        );
        // Derived existence: remove channel from local state immediately
        setChannelList(channelList.filter((c) => c.name !== ch.name));
      } else {
        showToast(`Purge skipped: no tracks found for "${ch.name}"`, 'warn');
      }
    } catch (err: any) {
      showToast(`Failed to purge "${ch.name}": ${err.message}`, 'error');
    } finally {
      setPurgingChannelName(null);
    }
  };

  // Direct play handler: sets selected channel in config and navigates to gameplay
  const handlePlaySource = async (sourceValue: string) => {
    useVinylStore.getState().setQueuedPlaylistForGameplay(sourceValue);
    await saveFilterConfig(targetProjectId, {
      excludedChannels: [],
      selectedChannel: sourceValue,
      discoveryMode: useVinylStore.getState().discoveryMode,
    });
    if (onNavigateToGameplay) {
      onNavigateToGameplay(sourceValue);
    }
  };

  const handleOpenCreateModal = () => {
    setEditPlaylistId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plId: string) => {
    setEditPlaylistId(plId);
    setIsModalOpen(true);
  };

  const handleDeletePlaylist = async (plId: string) => {
    if (!confirm('Are you sure you want to delete this custom playlist?')) return;
    try {
      await deleteCustomPlaylist(targetProjectId, plId);
      removeCustomPlaylist(plId);
    } catch (err) {
      console.error('Failed to delete playlist:', err);
    }
  };

  const renderPlaylistCard = (pl: CustomPlaylist) => {
    const stats = getPlaylistStats(pl);

    return (
      <div
        key={pl.id}
        className="p-5 rounded-2xl bg-[#120f18] hover:bg-[#161220] border border-[#2b2238] hover:border-[#d4af37]/60 shadow-lg hover:shadow-gold-sm transition-all duration-300 flex flex-col justify-between space-y-4 group"
      >
        {/* Top Bar: Icon, Title & Average Hazard */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl flex-shrink-0 p-2 rounded-xl bg-[#1a1424] border border-[#3b2b4d]">
                {pl.emoji || '🎵'}
              </span>
              <div className="min-w-0">
                <h3 className="font-cinzel text-base font-bold text-white group-hover:text-[#ffd86b] transition truncate">
                  {pl.name}
                </h3>
                <span className="text-[11px] font-mono text-[#8c7a9e] flex items-center gap-1">
                  <span className="uppercase text-[#ffd86b]">{pl.type}</span>
                  <span>•</span>
                  <span>
                    {pl.type === 'genre'
                      ? `${pl.include_channels.length} ch + ${pl.include_songs.length} picked`
                      : pl.type === 'album'
                      ? `${pl.include_songs.length} picked`
                      : pl.type === 'genre_compilation'
                      ? `${pl.include_playlists.length} genre${pl.include_playlists.length === 1 ? '' : 's'}`
                      : `${pl.include_playlists.length} album${pl.include_playlists.length === 1 ? '' : 's'}`}
                  </span>
                  <span>•</span>
                  <span className="text-white font-bold">{stats.totalSongs.toLocaleString()} songs</span>
                </span>
              </div>
            </div>

            {/* Average Hazard Level Badge */}
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="text-[9px] font-mono text-[#8c7a9e] uppercase tracking-wider mb-0.5">
                Avg Hazard
              </span>
              <HazardBadge score={stats.avgHazard} rank={stats.rankCategory} />
            </div>
          </div>

          {(pl.type === 'album' || pl.type === 'collection') && (pl.date_start || pl.date_end) && (
            <span className="text-[11px] font-mono text-[#ffd86b]">
              📅 {formatQuarterRange(pl.date_start, pl.date_end)}
            </span>
          )}

          {pl.description && (
            <p className="text-xs text-[#a394b5] font-sans line-clamp-2 leading-relaxed">
              {pl.description}
            </p>
          )}

          {/* Member Chips: channels (genre) / album names (collection) / genre names (genre_compilation) / song count (album) */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#6e5d85] uppercase tracking-wider flex items-center gap-1">
              <Radio className="w-3 h-3 text-[#d4af37]" />{' '}
              {pl.type === 'genre'
                ? 'Member Channels'
                : pl.type === 'album'
                ? 'Handpicked Songs'
                : pl.type === 'genre_compilation'
                ? 'Member Genres'
                : 'Member Albums'}
            </span>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
              {pl.type === 'genre' &&
                pl.include_channels.map((chName) => {
                  const ch = channelLookup.get(chName);
                  return (
                    <span
                      key={chName}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#181224] border border-[#2e233d] text-[10px] font-mono text-[#c4b5d4]"
                      title={`${chName} • ${ch ? ch.count.toLocaleString() : 0} songs • Avg Hazard: ${ch?.avg_hazard ?? 3.0}`}
                    >
                      <span className="max-w-[120px] truncate">{chName}</span>
                      <span className="text-[9px] text-[#ffd86b]">
                        {ch ? `(${ch.count.toLocaleString()})` : ''}
                      </span>
                    </span>
                  );
                })}
              {pl.type === 'collection' &&
                pl.include_playlists.map((albumId) => {
                  const album = customPlaylists.find((p) => p.id === albumId);
                  return (
                    <span
                      key={albumId}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#181224] border border-[#2e233d] text-[10px] font-mono text-[#c4b5d4]"
                      title={album ? album.name : `Missing album ${albumId}`}
                    >
                      <span className="max-w-[140px] truncate">
                        {album ? `${album.emoji || '💿'} ${album.name}` : `⚠ ${albumId}`}
                      </span>
                    </span>
                  );
                })}
              {pl.type === 'genre_compilation' &&
                pl.include_playlists.map((genreId) => {
                  const genre = customPlaylists.find((p) => p.id === genreId);
                  return (
                    <span
                      key={genreId}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#181224] border border-[#2e233d] text-[10px] font-mono text-[#c4b5d4]"
                      title={genre ? genre.name : `Missing genre ${genreId}`}
                    >
                      <span className="max-w-[140px] truncate">
                        {genre ? `${genre.emoji || '🎸'} ${genre.name}` : `⚠ ${genreId}`}
                      </span>
                    </span>
                  );
                })}
              {pl.type !== 'collection' && pl.type !== 'genre_compilation' && pl.include_songs.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#181224] border border-[#2e233d] text-[10px] font-mono text-[#ffd86b]">
                  {pl.include_songs.length} song{pl.include_songs.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>

          {/* Compatible Timeblocks (Genres only) */}
          {pl.type !== 'album' && pl.type !== 'collection' && pl.compatible_timeblocks && pl.compatible_timeblocks.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {pl.compatible_timeblocks.map((tb) => (
                <span
                  key={tb}
                  className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-[#241908] border border-[#d4af37]/40 text-[#ffd86b]"
                >
                  {tb}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#231b2e]">
          <SharedButton
            variant="primary"
            size="sm"
            onClick={() => handlePlaySource(`CUSTOM:${pl.id}`)}
            className="flex-1 flex items-center justify-center gap-1.5 font-bold"
          >
            <Play className="w-3.5 h-3.5 fill-black text-black" />
            <span>Stream Playlist</span>
          </SharedButton>

          <button
            type="button"
            onClick={() => handleOpenEditModal(pl.id)}
            title="Edit Playlist"
            className="p-2 rounded-lg bg-[#1a1424] hover:bg-[#251d33] border border-[#3b2b4d] hover:border-[#d4af37] text-[#8c7a9e] hover:text-white transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleDeletePlaylist(pl.id)}
            title="Delete Playlist"
            className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 hover:text-rose-100 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-left">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-[#171320] border border-[#d4af37] text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 text-[#ffd86b] max-w-lg">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
          {toast.type === 'warn' && <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
          {toast.type === 'info' && <Sparkles className="w-4 h-4 text-[#ffd86b] flex-shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner & Action */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#120f18] border border-[#2b2238] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 z-10 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-950/60 border border-amber-600/50 text-[#ffd86b]">
              <ListMusic className="w-5 h-5" />
            </span>
            <span className="font-cinzel text-xs font-bold text-[#ffd86b] tracking-wider uppercase">
              Harmonic Playlists &amp; Federations
            </span>
          </div>
          <h2 className="font-cinzel text-xl md:text-2xl font-bold text-white tracking-wide">
            Curation &amp; Playlists Matrix
          </h2>
          <p className="text-xs text-[#a394b5] font-sans leading-relaxed">
            Federate music channels into thematic playlists. Every collection computes its live average hazard
            level across all member songs, syncing seamlessly with your Gameplay Include and Exclude filters.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 w-full md:w-auto">
          <SharedButton
            variant="primary"
            size="md"
            onClick={handleOpenCreateModal}
            className="w-full md:w-auto flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>New Custom Playlist</span>
          </SharedButton>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#100d16] border border-[#261d33] shadow-md">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-[#171320] p-1 rounded-lg border border-[#261d33]">
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-[#d4af37] text-black shadow-gold-sm'
                : 'text-[#8c7a9e] hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Custom Playlists ({customPlaylists.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('origins')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'origins'
                ? 'bg-[#d4af37] text-black shadow-gold-sm'
                : 'text-[#8c7a9e] hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Origin Channels ({channelList.length})</span>
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2 flex-1 md:max-w-md justify-end">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8c7a9e]" />
            <input
              type="text"
              placeholder={activeTab === 'custom' ? 'Search playlists or channels...' : 'Search origin channels...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#171320] border border-[#332842] focus:border-[#d4af37] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none transition placeholder-[#685c78]"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#171320] px-2 py-1.5 rounded-lg border border-[#332842] text-xs font-mono text-[#8c7a9e] flex-shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#ffd86b]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-white text-xs font-mono font-bold focus:outline-none cursor-pointer"
            >
              <option value="hazard" className="bg-[#120f18]">Avg Hazard</option>
              <option value="count" className="bg-[#120f18]">Track Count</option>
              <option value="name" className="bg-[#120f18]">Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="p-16 rounded-2xl bg-[#100d16] border border-[#2b2238] text-center space-y-3">
          <Sparkles className="w-8 h-8 text-[#ffd86b] animate-spin mx-auto" />
          <p className="text-xs font-mono text-[#8c7a9e]">Loading playlists and calculating harmonic telemetry...</p>
        </div>
      ) : activeTab === 'custom' ? (
        /* Custom Playlists Tab */
        filteredCustomPlaylists.length === 0 ? (
          <div className="p-16 rounded-2xl bg-[#100d16] border border-[#2b2238] text-center space-y-4 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-full bg-[#1c1426] border border-[#d4af37]/40 flex items-center justify-center text-2xl mx-auto">
              🎵
            </div>
            <div className="space-y-1">
              <h3 className="font-cinzel text-base font-bold text-white">No Custom Playlists Found</h3>
              <p className="text-xs text-[#8c7a9e] font-sans">
                {searchQuery
                  ? 'No playlists match your search query. Try clearing the filter.'
                  : 'You have not created any custom playlists yet. Combine multiple channels under a shared musical style to start streaming!'}
              </p>
            </div>
            <SharedButton variant="primary" size="md" onClick={handleOpenCreateModal} className="mx-auto flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-black" />
              <span>Create Your First Playlist</span>
            </SharedButton>
          </div>
        ) : (
          <div className="space-y-8">
            {/* SECTION 1: ALBUM COMPILATIONS & MEMBER ALBUMS */}
            {collections.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-[#2b2038]">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📚</span>
                    <h3 className="font-cinzel text-base md:text-lg font-bold text-white tracking-wide">
                      Album Compilations & Member Albums
                    </h3>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#291e0a] text-[#ffd86b] border border-[#d4af37]/40 font-semibold">
                      {collections.length} Compilations
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  {collections.map((col) => {
                    const colStats = getPlaylistStats(col);
                    const memberAlbums = col.include_playlists
                      .map((albumId) => customPlaylists.find((p) => p.id === albumId))
                      .filter((p): p is CustomPlaylist => !!p && (
                        !searchQuery.trim() ||
                        filteredCustomPlaylists.some((f) => f.id === p.id) ||
                        col.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
                      ))
                      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

                    return (
                      <div
                        key={col.id}
                        className="p-5 md:p-6 rounded-2xl bg-[#130d1e]/90 border border-[#3e2e54] shadow-2xl space-y-5 transition-all duration-300"
                      >
                        {/* Compilation Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2d213f]">
                          <div className="flex items-start md:items-center gap-3.5 min-w-0">
                            <span className="text-3xl p-2.5 rounded-2xl bg-[#1d142b] border border-[#d4af37]/40 shadow-inner flex-shrink-0">
                              {col.emoji || '📚'}
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-cinzel text-lg font-bold text-white tracking-wide truncate">
                                  {col.name}
                                </h4>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2e200c] text-[#ffd86b] border border-[#d4af37]/60 uppercase tracking-wider">
                                  Album Compilation
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#8c7a9e] mt-1">
                                {formatQuarterRange(col.date_start, col.date_end) && (
                                  <>
                                    <span className="text-[#ffd86b] font-semibold">
                                      📅 {formatQuarterRange(col.date_start, col.date_end)}
                                    </span>
                                    <span>•</span>
                                  </>
                                )}
                                <span>
                                  <strong className="text-white">{col.include_playlists.length}</strong> Albums
                                </span>
                                <span>•</span>
                                <span>
                                  <strong className="text-[#ffd86b]">{colStats.totalSongs.toLocaleString()}</strong> tracks
                                </span>
                                {col.description && (
                                  <>
                                    <span>•</span>
                                    <span className="text-[#b3a6c7] truncate max-w-sm">{col.description}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Compilation Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <SharedButton
                              variant="primary"
                              size="sm"
                              onClick={() => handlePlaySource(`CUSTOM:${col.id}`)}
                              className="flex items-center gap-1.5 font-bold shadow-gold-sm"
                            >
                              <Play className="w-3.5 h-3.5 fill-black text-black" />
                              <span>Stream Compilation</span>
                            </SharedButton>

                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(col.id)}
                              title="Edit Compilation"
                              className="p-2 rounded-lg bg-[#1c1429] hover:bg-[#281c3b] border border-[#3d2c52] hover:border-[#d4af37] text-[#8c7a9e] hover:text-white transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePlaylist(col.id)}
                              title="Delete Compilation"
                              className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 hover:text-rose-100 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Sub-grid of Member Albums */}
                        {memberAlbums.length === 0 ? (
                          <div className="p-6 text-center rounded-xl bg-[#0c0814] border border-[#241a33] text-xs text-[#8c7a9e] font-mono">
                            No Albums added to this Compilation yet. Click edit to assign member Albums.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {memberAlbums.map((album) => renderPlaylistCard(album))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 2: STANDALONE ALBUMS (UNASSIGNED) */}
            {standaloneAlbums.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#2b2038]">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💿</span>
                    <h3 className="font-cinzel text-base md:text-lg font-bold text-white tracking-wide">
                      Standalone Albums
                    </h3>
                    <span className="text-xs font-mono text-[#8c7a9e]">
                      ({standaloneAlbums.length} {collections.length > 0 ? 'unassigned albums' : 'albums'})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {standaloneAlbums.map((album) => renderPlaylistCard(album))}
                </div>
              </div>
            )}

            {/* SECTION 3: GENRE PLAYLISTS & COMPILATIONS EXPANDER SECTION */}
            <div className="rounded-2xl bg-[#100d16] border border-[#2b2238] overflow-hidden transition-all duration-300">
              <button
                type="button"
                onClick={() => setIsGenreExpanded((prev) => !prev)}
                className="w-full p-4 flex items-center justify-between bg-[#15101f] hover:bg-[#1a1426] transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🎸</span>
                  <h3 className="font-cinzel text-base font-bold text-white flex items-center gap-2">
                    Genre Playlists & Compilations
                    <span className="text-xs font-mono font-normal text-[#8c7a9e]">
                      ({genreCompilations.length > 0 ? `${genreCompilations.length} Compilations, ` : ''}
                      {allGenres.length} Genres)
                    </span>
                  </h3>
                  <span className="text-[11px] font-mono text-[#ffd86b] bg-[#291e0a] px-2.5 py-0.5 rounded-full border border-[#d4af37]/40 hidden sm:inline">
                    Channels & Handpicked Tracks
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono text-[#8c7a9e]">
                    {allGenres.reduce((acc, g) => acc + getPlaylistStats(g).totalSongs, 0).toLocaleString()} songs
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#ffd86b] transition-transform duration-200 ${
                      isGenreExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {isGenreExpanded && (
                <div className="p-4 md:p-5 border-t border-[#231b2e] space-y-6">
                  {/* Genre Compilations */}
                  {genreCompilations.length > 0 && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🗂️</span>
                        <h4 className="font-cinzel text-sm md:text-base font-bold text-white tracking-wide">
                          Genre Compilations
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2e200c] text-[#ffd86b] border border-[#d4af37]/60 font-semibold">
                          {genreCompilations.length} Compilations
                        </span>
                      </div>

                      <div className="space-y-5">
                        {genreCompilations.map((gc) => {
                          const gcStats = getPlaylistStats(gc);
                          const memberGenres = gc.include_playlists
                            .map((genreId) => customPlaylists.find((p) => p.id === genreId))
                            .filter((p): p is CustomPlaylist => !!p && (
                              !searchQuery.trim() ||
                              filteredCustomPlaylists.some((f) => f.id === p.id) ||
                              gc.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
                            ))
                            .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

                          return (
                            <div
                              key={gc.id}
                              className="p-5 md:p-6 rounded-2xl bg-[#130d1e]/90 border border-[#3e2e54] shadow-2xl space-y-5 transition-all duration-300"
                            >
                              {/* Compilation Header */}
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2d213f]">
                                <div className="flex items-start md:items-center gap-3.5 min-w-0">
                                  <span className="text-3xl p-2.5 rounded-2xl bg-[#1d142b] border border-[#d4af37]/40 shadow-inner flex-shrink-0">
                                    {gc.emoji || '🗂️'}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h4 className="font-cinzel text-lg font-bold text-white tracking-wide truncate">
                                        {gc.name}
                                      </h4>
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2e200c] text-[#ffd86b] border border-[#d4af37]/60 uppercase tracking-wider">
                                        Genre Compilation
                                      </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#8c7a9e] mt-1">
                                      <span>
                                        <strong className="text-white">{gc.include_playlists.length}</strong> Genres
                                      </span>
                                      <span>•</span>
                                      <span>
                                        <strong className="text-[#ffd86b]">{gcStats.totalSongs.toLocaleString()}</strong> tracks
                                      </span>
                                      {gc.description && (
                                        <>
                                          <span>•</span>
                                          <span className="text-[#b3a6c7] truncate max-w-sm">{gc.description}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Compilation Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <SharedButton
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handlePlaySource(`CUSTOM:${gc.id}`)}
                                    className="flex items-center gap-1.5 font-bold shadow-gold-sm"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-black text-black" />
                                    <span>Stream Compilation</span>
                                  </SharedButton>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(gc.id)}
                                    title="Edit Compilation"
                                    className="p-2 rounded-lg bg-[#1c1429] hover:bg-[#281c3b] border border-[#3d2c52] hover:border-[#d4af37] text-[#8c7a9e] hover:text-white transition cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeletePlaylist(gc.id)}
                                    title="Delete Compilation"
                                    className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 hover:text-rose-100 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Sub-grid of Member Genres */}
                              {memberGenres.length === 0 ? (
                                <div className="p-6 text-center rounded-xl bg-[#0c0814] border border-[#241a33] text-xs text-[#8c7a9e] font-mono">
                                  No Genres added to this Compilation yet. Click edit to assign member Genres.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {memberGenres.map((genre) => renderPlaylistCard(genre))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Standalone Genres */}
                  {standaloneGenres.length > 0 && (
                    <div className="space-y-3">
                      {genreCompilations.length > 0 && (
                        <div className="flex items-center justify-between pb-1 border-b border-[#231b2e]">
                          <h4 className="font-cinzel text-xs md:text-sm font-bold text-white tracking-wide">
                            Standalone Genres ({standaloneGenres.length})
                          </h4>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {standaloneGenres.map((g) => renderPlaylistCard(g))}
                      </div>
                    </div>
                  )}

                  {genreCompilations.length === 0 && standaloneGenres.length === 0 && (
                    <div className="p-8 text-center text-xs text-[#8c7a9e] font-mono">
                      No Genre playlists created yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        /* Origin Channels Tab */
        <div className="space-y-3.5">
          {/* Status Filter Chips Bar */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-[#100d16] border border-[#261d33]">
            <span className="text-[10px] font-mono text-[#8c7a9e] px-2 uppercase tracking-wider">
              Filter Status:
            </span>
            {(['all', 'approved', 'cleaning', 'raw'] as const).map((st) => {
              const isSel = statusFilter === st;
              const count =
                st === 'all'
                  ? channelsWithMeta.length
                  : channelsWithMeta.filter((c) => c.status === st).length;
              const labels = {
                all: 'All Channels',
                approved: '🟢 Approved',
                cleaning: '🟡 Cleaning',
                raw: '🔴 Raw',
              };
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition border cursor-pointer ${
                    isSel
                      ? 'bg-[#ffd86b] text-black border-[#ffd86b] shadow-gold-sm'
                      : 'bg-[#171320] text-[#8c7a9e] hover:text-white border-[#2b2238] hover:border-[#3b2b4d]'
                  }`}
                >
                  <span>{labels[st]}</span>
                  <span className="ml-1.5 text-[10px] font-normal opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          {filteredOriginChannels.length === 0 ? (
            <div className="p-16 rounded-2xl bg-[#100d16] border border-[#2b2238] text-center space-y-2 max-w-sm mx-auto">
              <Radio className="w-8 h-8 text-[#8c7a9e] mx-auto opacity-50" />
              <p className="text-xs font-mono text-[#8c7a9e]">No channels match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredOriginChannels.map((ch) => {
                const avgH = ch.avg_hazard ?? 3.0;
                const rank = getRankFromScore(avgH);
                const thumbSrc =
                  ch.best_thumbnail ||
                  (ch.best_id ? `https://i.ytimg.com/vi/${ch.best_id}/mqdefault.jpg` : null);

                return (
                  <div
                    key={ch.name}
                    className="p-4 rounded-2xl bg-[#120f18] hover:bg-[#161220] border border-[#2b2238] hover:border-[#ffd86b]/40 shadow-md hover:shadow-gold-sm transition-all duration-300 flex flex-col justify-between space-y-3 group"
                  >
                    {/* Top Row: Best Song Avatar Thumbnail + Title + Status */}
                    <div className="flex items-start gap-3">
                      {/* Avatar Thumbnail */}
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#1c1426] border border-[#3b2b4d] flex-shrink-0 shadow-sm">
                        {thumbSrc ? (
                          <img
                            src={thumbSrc}
                            alt={ch.best_title || ch.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              if (ch.best_id) {
                                (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${ch.best_id}/hqdefault.jpg`;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">
                            📻
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 px-1 py-0.2 bg-black/80 rounded-tl text-[8px] font-mono text-[#ffd86b] font-bold">
                          BEST
                        </span>
                      </div>

                      {/* Info & Status */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <h4
                            className="text-sm font-bold text-white group-hover:text-[#ffd86b] transition truncate"
                            title={ch.name}
                          >
                            {ch.name}
                          </h4>

                          {/* Status Pill Button */}
                          <button
                            type="button"
                            onClick={(e) => handleCycleStatus(ch, e)}
                            title="Click to cycle status: Raw ➔ Cleaning ➔ Approved"
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1 flex-shrink-0 ${
                              ch.status === 'approved'
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                                : ch.status === 'cleaning'
                                ? 'bg-amber-950/80 text-amber-300 border-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                                : 'bg-rose-950/80 text-rose-300 border-rose-500/80'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                ch.status === 'approved'
                                  ? 'bg-emerald-400'
                                  : ch.status === 'cleaning'
                                  ? 'bg-amber-400'
                                  : 'bg-rose-400'
                              }`}
                            />
                            <span>{ch.status || 'raw'}</span>
                          </button>
                        </div>

                        {ch.best_title && (
                          <p
                            className="text-[11px] text-[#a394b5] font-sans truncate"
                            title={`Highest Rated: ${ch.best_title}`}
                          >
                            ⭐ {ch.best_title}
                          </p>
                        )}

                        <div className="text-[10px] font-mono text-[#8c7a9e]">
                          <strong className="text-white">{ch.count.toLocaleString()}</strong> catalog songs
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Hazard Badge + Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#231b2e]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-[#8c7a9e] uppercase">Avg</span>
                        <HazardBadge score={avgH} rank={rank} />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <SharedButton
                          variant="secondary"
                          size="sm"
                          onClick={() => handlePlaySource(ch.name)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs"
                        >
                          <Play className="w-3 h-3 fill-[#ffd86b] text-[#ffd86b]" />
                          <span>Stream</span>
                        </SharedButton>

                        <button
                          type="button"
                          disabled={purgingChannelName === ch.name}
                          onClick={(e) => handlePurgeChannel(ch, e)}
                          title={`Purge all ${ch.count} songs of "${ch.name}" to re-curl clean`}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 hover:text-rose-100 transition cursor-pointer disabled:opacity-50"
                        >
                          <Trash2
                            className={`w-3.5 h-3.5 ${
                              purgingChannelName === ch.name ? 'animate-spin' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Playlist Manager Modal */}
      <PlaylistManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={targetProjectId}
        channelList={channelList}
        initialEditPlaylistId={editPlaylistId}
        onSelectPlaylist={(plId) => {
          setIsModalOpen(false);
          handlePlaySource(`CUSTOM:${plId}`);
        }}
      />
    </div>
  );
};
