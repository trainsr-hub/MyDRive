// path: src/apps/vinyl-angel/components/VinylPlayer.tsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { executeOrder } from '../../../services/api';
import { checkBackendHealth } from '../../../core/api';
import {
  fetchSampledTracks,
  fetchMoreSampledTracks,
  fetchChannelOrigins,
  getFilterConfig,
  saveFilterConfig,
  rateChannelDirect,
  flushOfflineEvents,
  syncTier2ToTier3,
  syncTier3ToTier4,
  fetchCustomPlaylists,
  resolvePlaylistSources,
  fetchChannelMeta,
  deleteTrackImmediately,
  fetchBlockedTrackIds,
  bufferUnavailableVideo,
  getUnavailableReason,
  saveCustomPlaylist,
  formatQuarterRange,
  deleteCustomPlaylist,
  purgeChannelSongs,
  updateChannelStatus,
  fetchAllTracksForChannel,
} from '../services/engine';
import { LoadingDiagnostics } from './LoadingDiagnostics';
import { PlaylistManagerModal } from './PlaylistManagerModal';
import { useVinylStore } from '../store/useVinylStore';
import type { PlaylistItem, ScoreTier, ChannelOriginItem, TrackDisplayMeta, Tier2EventEntry, CustomPlaylist, ChannelStatus } from '../types';
import { SharedButton } from '../../../components/shared';
import { HazardBadge } from '../../../components/HazardBadge';
import {
  Disc3,
  Disc,
  Music,
  RotateCcw,
  Sparkles,
  Check,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FastForward,
  RefreshCw,
  WifiOff,
  Database,
  Radio,
  DownloadCloud,
  Clock,
  Ban,
  ListMusic,
  Shield,
  FilterX,
  Gauge,
  Repeat,
  Search,
  X,
  ChevronDown,
  CheckSquare,
  Square,
  Crown,
  Zap,
  Pin,
  Plus,
  Settings,
} from 'lucide-react';

interface VinylPlayerProps {
  projectId: string;
  onNavigateToIngestion?: () => void;
  navigateTo?: (tab: string) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

// Option at the bottom of the Include selector list (used as default fallback when a channel is approved/hidden/deleted)
export function computeBottomPlaylistOption(
  channelList: ChannelOriginItem[],
  customPlaylists: CustomPlaylist[],
  channelMetaMap: Record<string, { status: string }>,
  excludeChannel?: string | string[]
): string {
  const excludedList: string[] = Array.isArray(excludeChannel)
    ? excludeChannel
    : excludeChannel
    ? [excludeChannel]
    : [];
  // Sort deterministically: count descending, then name ascending for 100% stable ordering
  const sorted = [...channelList].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );

  const getStatus = (c: ChannelOriginItem) => {
    return (
      channelMetaMap[c.channel_id || '']?.status ||
      channelMetaMap[c.name]?.status ||
      'raw'
    );
  };

  // 1. Bottom-most group: Raw Playlists that actually have matching songs (> 0)
  const raw = sorted.filter(
    (c) =>
      !excludedList.includes(c.name) &&
      (c.channel_id ? !excludedList.includes(c.channel_id) : true) &&
      c.count > 0 &&
      getStatus(c) === 'raw'
  );
  if (raw.length > 0) {
    return raw[raw.length - 1].name;
  }

  // 2. Cleaning Playlists that actually have matching songs (> 0)
  const cleaning = sorted.filter(
    (c) =>
      !excludedList.includes(c.name) &&
      (c.channel_id ? !excludedList.includes(c.channel_id) : true) &&
      c.count > 0 &&
      getStatus(c) === 'cleaning'
  );
  if (cleaning.length > 0) {
    return cleaning[cleaning.length - 1].name;
  }

  // 3. Custom Playlists that actually have songs
  const eligibleCustom = customPlaylists.filter(
    (p) =>
      !excludedList.includes(p.id) &&
      !excludedList.includes(`CUSTOM:${p.id}`) &&
      ((p.include_songs && p.include_songs.length > 0) || (p.include_channels && p.include_channels.length > 0))
  );
  if (eligibleCustom.length > 0) {
    return `CUSTOM:${eligibleCustom[eligibleCustom.length - 1].id}`;
  }

  return 'ALL';
}

export const VinylPlayer: React.FC<VinylPlayerProps> = ({
  projectId,
  onNavigateToIngestion,
  navigateTo,
}) => {
  const targetProjectId = !projectId || projectId === 'vinyl_angel' ? 'music_app' : projectId;

  const {
    settings,
    updateSettings,
    discs,
    earnDiscs,
    incrementRatingStats,
    equippedStylus,
    stats,
    queuedTrackForGameplay,
    setQueuedTrackForGameplay,
    queuedPlaylistForGameplay,
    setQueuedPlaylistForGameplay,
    offlineOutbox = [],
    enqueueOfflineEvent,
    clearOfflineOutbox,
    customPlaylists,
    setCustomPlaylists,
    addCustomPlaylist,
    updateCustomPlaylist,
    removeCustomPlaylist,
    channelList,
    setChannelList,
    channelMetaMap,
    setChannelMetaMap,
    addBlockedSong,
  } = useVinylStore();

  // Sorting & Filtering parameters: channel_name, excluded_channels, hazard_cap, and discovery_mode (from File 1, 4 & 5)
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [excludedChannels, setExcludedChannels] = useState<string[]>([]);
  const [hazardCap, setHazardCap] = useState<string>('3.2');
  const [isDiscoveryMode, setIsDiscoveryMode] = useState<boolean>(() => Boolean(useVinylStore.getState().discoveryMode));
  const [isExcludeDropdownOpen, setIsExcludeDropdownOpen] = useState<boolean>(false);
  const [excludeSearchQuery, setExcludeSearchQuery] = useState<string>('');
  const [isIncludeDropdownOpen, setIsIncludeDropdownOpen] = useState<boolean>(false);
  const [includeSearchQuery, setIncludeSearchQuery] = useState<string>('');
  const [foldedSections, setFoldedSections] = useState<{ custom?: boolean; approved?: boolean; cleaning?: boolean; raw?: boolean }>({});
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState<boolean>(false);
  const [excludeTab, setExcludeTab] = useState<'playlists' | 'channels'>('playlists');

  // Add to Custom Playlist State (Separate Album & Genre Selectors)
  const [activePicker, setActivePicker] = useState<'album_song' | 'genre_song' | 'genre_channel' | null>(null);
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState<string>('');
  const [savingPlaylistId, setSavingPlaylistId] = useState<string | null>(null);
  const [quickPlaylistName, setQuickPlaylistName] = useState<string>('');
  const [isQuickCreating, setIsQuickCreating] = useState<boolean>(false);
  const [preselectedChannelForModal, setPreselectedChannelForModal] = useState<string | null>(null);
  const [preselectedSongForModal, setPreselectedSongForModal] = useState<string | null>(null);

  const excludeDropdownRef = useRef<HTMLDivElement>(null);
  const includeDropdownRef = useRef<HTMLDivElement>(null);
  const foldedSectionsRef = useRef<{ custom?: boolean; approved?: boolean; cleaning?: boolean; raw?: boolean }>({});
  const playlistControlsRef = useRef<HTMLDivElement>(null);

  // Categorize channels by their curation status (Approved, Cleaning, Raw)
  // Stably sorted by count DESC, then name ASC so dropdown ordering is deterministic
  const { approvedChannels, cleaningChannels, rawChannels } = useMemo(() => {
    const sorted = [...channelList].sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name)
    );
    const app: ChannelOriginItem[] = [];
    const cln: ChannelOriginItem[] = [];
    const raw: ChannelOriginItem[] = [];

    sorted.forEach((ch) => {
      // Hide channels that have 0 songs satisfying the active filter
      if (!ch.count || ch.count <= 0) return;

      const st =
        channelMetaMap[ch.channel_id || '']?.status ||
        channelMetaMap[ch.name]?.status ||
        'raw';
      // In Discovery Mode, Approved channels by definition have 0 unassigned songs (100% in albums)
      if (st === 'approved') {
        if (!isDiscoveryMode) app.push(ch);
      } else if (st === 'cleaning') {
        cln.push(ch);
      } else {
        raw.push(ch);
      }
    });

    return { approvedChannels: app, cleaningChannels: cln, rawChannels: raw };
  }, [channelList, channelMetaMap, isDiscoveryMode]);



  // Track pool & Catalog state
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [totalCatalogCount, setTotalCatalogCount] = useState<number>(0);
  const [sessionRatedCount, setSessionRatedCount] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [displayStats, setDisplayStats] = useState<Record<string, TrackDisplayMeta>>({});
  const [currentProbability, setCurrentProbability] = useState<number | null>(null);

  // Connection, Watchdog & Outbox Lifecycle state
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadPhase, setLoadPhase] = useState<string>('');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isLoudFailure, setIsLoudFailure] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [isFlushingOutbox, setIsFlushingOutbox] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExhausted, setIsExhausted] = useState<boolean>(false);

  const consecutiveFailuresRef = useRef<number>(0);

  // Rating controls state
  const [ratingTarget, setRatingTarget] = useState<'track' | 'channel'>(
    settings.applyAlbumToEntireChannel ? 'channel' : 'track'
  );
  const [selectedScore, setSelectedScore] = useState<ScoreTier | ''>('');
  const [selectedArcs, setSelectedArcs] = useState<string[]>([]);
  const [isLogging, setIsLogging] = useState<boolean>(false);
  const [stagedHazardRank, setStagedHazardRank] = useState<number | null>(5);
  const [isRatingPinned, setIsRatingPinned] = useState<boolean>(false);
  const [pendingLogsCount, setPendingLogsCount] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; type?: 'info' | 'success' | 'warn' | 'error' } | null>(null);

  useEffect(() => {
    if (settings.applyAlbumToEntireChannel) {
      setRatingTarget('channel');
    }
  }, [settings.applyAlbumToEntireChannel]);

  // References to eliminate circular effects, stale closures, and player race conditions
  const playerRef = useRef<any>(null);
  const isPlayerReadyRef = useRef<boolean>(false);
  const isAutoSyncingRef = useRef<boolean>(false);
  const isRatingPinnedRef = useRef<boolean>(false);
  const currentlyLoadedVideoIdRef = useRef<string | null>(null);
  const pendingVideoIdRef = useRef<string | null>(null);
  const lastLoggedTrackIdRef = useRef<string | null>(null);
  const playlistRef = useRef<PlaylistItem[]>([]);
  const displayStatsRef = useRef<Record<string, TrackDisplayMeta>>({});
  const currentIndexRef = useRef<number>(-1);
  const currentTrackRef = useRef<PlaylistItem | null>(null);
  const selectedArcsRef = useRef<string[]>([]);
  const selectedScoreRef = useRef<ScoreTier | ''>('');
  const stagedHazardRankRef = useRef<number | null>(5);
  const selectedChannelRef = useRef<string>('ALL');
  const excludedChannelsRef = useRef<string[]>([]);
  const hazardCapRef = useRef<string>('3.2');
  const isDiscoveryModeRef = useRef<boolean>(Boolean(useVinylStore.getState().discoveryMode));
  const settingsRef = useRef(settings);
  const consecutiveErrorsRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const isFetchingMoreRef = useRef<boolean>(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const bufferedUnavailableIdsRef = useRef<Set<string>>(new Set());
  const handleNextSongRef = useRef<(action: string | null) => Promise<void>>(async () => {});
  const logActionToTier2Ref = useRef<any>(null);
  const showToastRef = useRef<any>(null);
  const getBottomPlaylistOptionRef = useRef<
    (
      overrideChannels?: ChannelOriginItem[],
      overrideCustomPls?: CustomPlaylist[],
      overrideMeta?: Record<string, { status: string }>,
      excludeChannel?: string
    ) => string
  >(() => 'ALL');
  const mountPlayerRef = useRef<(() => void) | null>(null);

  // Derived current active track
  const currentTrack =
    currentIndex >= 0 && currentIndex < playlist.length ? playlist[currentIndex] : null;

  const loadDataRef = useRef<(channel?: string, cap?: string, exclude?: string[], discoveryMode?: boolean, triedChannels?: string[]) => Promise<void>>(async () => {});

  const getBottomPlaylistOption = useCallback(
    (
      overrideChannels?: ChannelOriginItem[],
      overrideCustomPls?: CustomPlaylist[],
      overrideMeta?: Record<string, { status: string }>,
      excludeChannel?: string
    ): string => {
      return computeBottomPlaylistOption(
        overrideChannels ?? channelList,
        overrideCustomPls ?? customPlaylists,
        overrideMeta ?? channelMetaMap,
        excludeChannel
      );
    },
    [channelList, customPlaylists, channelMetaMap]
  );
  getBottomPlaylistOptionRef.current = getBottomPlaylistOption;

  // Synchronize ref mirrors
  playlistRef.current = playlist;
  displayStatsRef.current = displayStats;
  currentIndexRef.current = currentIndex;
  currentTrackRef.current = currentTrack;
  selectedArcsRef.current = selectedArcs;
  selectedScoreRef.current = selectedScore;
  stagedHazardRankRef.current = stagedHazardRank;
  isRatingPinnedRef.current = isRatingPinned;
  selectedChannelRef.current = selectedChannel;
  isDiscoveryModeRef.current = isDiscoveryMode;
  excludedChannelsRef.current = excludedChannels;
  hazardCapRef.current = hazardCap;
  settingsRef.current = settings;
  foldedSectionsRef.current = foldedSections;

  // Close exclude popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        excludeDropdownRef.current &&
        !excludeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsExcludeDropdownOpen(false);
      }
    };
    if (isExcludeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExcludeDropdownOpen]);

  // Close include popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        includeDropdownRef.current &&
        !includeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsIncludeDropdownOpen(false);
      }
    };
    if (isIncludeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isIncludeDropdownOpen]);

  // Close add-to-playlist popover on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        playlistControlsRef.current &&
        !playlistControlsRef.current.contains(event.target as Node)
      ) {
        setActivePicker(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActivePicker(null);
      }
    };
    if (activePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePicker]);

  // Filter channels inside dropdown search
  const filteredExcludeChannels = useMemo(() => {
    if (!excludeSearchQuery.trim()) return channelList;
    const q = excludeSearchQuery.toLowerCase().trim();
    return channelList.filter((ch) => ch.name.toLowerCase().includes(q));
  }, [channelList, excludeSearchQuery]);

  // Currently assigned Album for the playing song (Single-choice selector: exactly 1 album)
  const currentAlbum = useMemo(() => {
    if (!currentTrack) return null;
    return customPlaylists.find((p) => p.type === 'album' && p.include_songs.includes(currentTrack.id)) || null;
  }, [customPlaylists, currentTrack?.id]);

  // Set of all song IDs that belong to any Album (used for strict Discovery Mode enforcement)
  const allAlbumSongIdSet = useMemo(() => {
    const set = new Set<string>();
    customPlaylists.forEach((p) => {
      if (p.type === 'album' && Array.isArray(p.include_songs)) {
        p.include_songs.forEach((id) => {
          if (id) set.add(String(id).trim());
        });
      }
    });
    return set;
  }, [customPlaylists]);
  const allAlbumSongIdSetRef = useRef<Set<string>>(allAlbumSongIdSet);
  allAlbumSongIdSetRef.current = allAlbumSongIdSet;

  // Currently assigned Genre for the playing song (Single-choice selector: exactly 1 genre)
  const currentSongGenre = useMemo(() => {
    if (!currentTrack) return null;
    return customPlaylists.find((p) => p.type === 'genre' && p.include_songs.includes(currentTrack.id)) || null;
  }, [customPlaylists, currentTrack?.id]);

  // Currently assigned Genre for the playing channel (Single-choice selector: exactly 1 genre)
  const currentChannelGenre = useMemo(() => {
    if (!currentTrack || !currentTrack.channel) return null;
    const ch = currentTrack.channel.trim();
    return customPlaylists.find((p) => p.type === 'genre' && p.include_channels.includes(ch)) || null;
  }, [customPlaylists, currentTrack?.channel]);

  // Grouped options for active selector dropdown (grouped by corresponding compilations, sorted by name)
  const groupedPlaylistsForActivePicker = useMemo(() => {
    if (!activePicker) return [];
    const isAlbum = activePicker === 'album_song';
    const targetType = isAlbum ? 'album' : 'genre';
    const compilationType = isAlbum ? 'collection' : 'genre_compilation';
    const q = playlistSearchQuery.toLowerCase().trim();

    // 1. All candidates of target type (album or genre), sorted by name
    const allCandidates = customPlaylists
      .filter((p) => p.type === targetType)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    // 2. All compilations of corresponding compilation type, sorted by name
    const compilations = customPlaylists
      .filter((p) => p.type === compilationType)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    const assignedItemIds = new Set<string>();
    const groups: Array<{
      id: string;
      title: string;
      emoji: string;
      isStandalone?: boolean;
      items: CustomPlaylist[];
    }> = [];

    // 3. Collect member items for each compilation
    for (const comp of compilations) {
      const compMatches = q && (comp.name.toLowerCase().includes(q) || comp.description?.toLowerCase().includes(q));

      const memberItems = comp.include_playlists
        .map((memberId) => allCandidates.find((c) => c.id === memberId))
        .filter((c): c is CustomPlaylist => {
          if (!c) return false;
          assignedItemIds.add(c.id);
          if (!q) return true;
          if (compMatches) return true;
          return c.name.toLowerCase().includes(q) || (c.description?.toLowerCase().includes(q) ?? false);
        })
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

      if (memberItems.length > 0) {
        groups.push({
          id: comp.id,
          title: comp.name,
          emoji: comp.emoji || (isAlbum ? '📚' : '🗂️'),
          items: memberItems,
        });
      }
    }

    // 4. Standalone items = candidates not belonging to any compilation
    const standaloneItems = allCandidates
      .filter((item) => {
        if (assignedItemIds.has(item.id)) return false;
        if (!q) return true;
        return item.name.toLowerCase().includes(q) || (item.description?.toLowerCase().includes(q) ?? false);
      })
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    if (standaloneItems.length > 0) {
      groups.push({
        id: '__standalone__',
        title: compilations.length > 0 ? (isAlbum ? 'Standalone Albums' : 'Standalone Genres') : (isAlbum ? 'All Albums' : 'All Genres'),
        emoji: isAlbum ? '💿' : '🎸',
        isStandalone: true,
        items: standaloneItems,
      });
    }

    return groups;
  }, [activePicker, customPlaylists, playlistSearchQuery]);

  const totalAvailableForActivePicker = useMemo(() => {
    return groupedPlaylistsForActivePicker.reduce((sum, g) => sum + g.items.length, 0);
  }, [groupedPlaylistsForActivePicker]);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      if (isMountedRef.current) setToast(null);
    }, 3000);
  }, []);
  showToastRef.current = showToast;

  // Evicts songs from the active buffer while keeping the currently playing track and re-syncing its index.
  // (Filtering playlistRef without fixing currentIndexRef desynchronises the player.)
  const evictFromBuffer = useCallback((ids: Set<string>) => {
    const curId = playlistRef.current[currentIndexRef.current]?.id;
    const next = playlistRef.current.filter(
      (t) => t.id === curId || !ids.has(String(t.id).trim())
    );
    playlistRef.current = next;
    setPlaylist(next);
    const idx = curId ? next.findIndex((t) => t.id === curId) : -1;
    currentIndexRef.current = idx;
    setCurrentIndex(idx);
  }, []);

  // Single-choice: Select/assign an Album for the current song
  const handleSelectAlbumForSong = useCallback(
    async (targetAlbum: CustomPlaylist | null) => {
      if (!currentTrack) return;
      const songId = currentTrack.id;

      if (targetAlbum && currentAlbum?.id === targetAlbum.id) {
        setActivePicker(null);
        return;
      }

      setSavingPlaylistId(targetAlbum ? targetAlbum.id : 'unassign_album');
      try {
        // 1. Remove song from previous album if changing or unassigning
        if (currentAlbum) {
          const updatedPrev: CustomPlaylist = {
            ...currentAlbum,
            include_songs: currentAlbum.include_songs.filter((id) => id !== songId),
            updated_at: new Date().toISOString(),
          };
          await saveCustomPlaylist(targetProjectId, updatedPrev);
          updateCustomPlaylist(updatedPrev);
        }

        // 2. Add song to target album if selected
        if (targetAlbum) {
          const isChannelBatch = settingsRef.current.applyAlbumToEntireChannel && Boolean(currentTrack.channel);
          const chName = (currentTrack.channel || '').trim();
          const chId = currentTrack.channel_id || chName;

          if (isChannelBatch) {
            // Whole Channel Mode: Fetch all tracks in channel (backend + active buffer)
            const backendIds = chName ? await fetchAllTracksForChannel(targetProjectId, chName, chId) : [];
            const bufferIds = playlistRef.current
              .filter((t) => (chName && t.channel === chName) || (chId && t.channel_id === chId))
              .map((t) => String(t.id).trim());
            const allChannelSongIds = Array.from(new Set([...backendIds, ...bufferIds, songId]));

            // Remove all channel songs from any previous custom albums
            for (const pl of customPlaylists) {
              if (pl.id !== targetAlbum.id && pl.type === 'album') {
                const rem = pl.include_songs.filter((id) => !allChannelSongIds.includes(id));
                if (rem.length !== pl.include_songs.length) {
                  const updatedPrev: CustomPlaylist = {
                    ...pl,
                    include_songs: rem,
                    updated_at: new Date().toISOString(),
                  };
                  try {
                    await saveCustomPlaylist(targetProjectId, updatedPrev);
                    updateCustomPlaylist(updatedPrev);
                  } catch (_) {}
                }
              }
            }

            // Assign all channel songs to target album
            const mergedSongs = Array.from(new Set([...targetAlbum.include_songs, ...allChannelSongIds]));
            const updatedTarget: CustomPlaylist = {
              ...targetAlbum,
              include_songs: mergedSongs,
              updated_at: new Date().toISOString(),
            };
            const saved = await saveCustomPlaylist(targetProjectId, updatedTarget);
            updateCustomPlaylist(saved);

            // Determine Rank & Score to log
            const defaultScoreMap: Record<number, ScoreTier> = {
              7: '7+',
              6: '6+',
              5: '5+',
              4: '4+',
              3: '3+',
            };
            const rankToLog = stagedHazardRankRef.current ?? 5;
            const scoreToLog =
              selectedScoreRef.current ||
              defaultScoreMap[rankToLog] ||
              settingsRef.current.defaultPassScore ||
              '5+';

            // Rate channel in _3_state.db and Tier 2
            try {
              await rateChannelDirect(
                targetProjectId,
                chId,
                chName,
                scoreToLog,
                selectedArcsRef.current
              );
            } catch (e) {
              console.warn('[handleSelectAlbumForSong] Channel direct rating warning:', e);
            }

            earnDiscs(15);
            incrementRatingStats(15);

            // Optimistically update local displayStats
            setDisplayStats((prev) => {
              const updated = { ...prev };
              allChannelSongIds.forEach((id) => {
                const curr = updated[id] || { played: 0, hazard_level: 3.0, timeblock: null, unlock_date: null };
                updated[id] = {
                  ...curr,
                  played: (curr.played || 0) + 1,
                  hazard_rank: rankToLog,
                };
              });
              return updated;
            });

            // Channel is now 100% in albums -> mark approved
            try {
              await updateChannelStatus(targetProjectId, chId, chName, 'approved', 'audited');
              const freshMeta = await fetchChannelMeta(targetProjectId);
              setChannelMetaMap(freshMeta);
            } catch (e) {}

            // If in Discovery Mode, purge all newly assigned channel songs from active playback buffer immediately
            if (isDiscoveryModeRef.current) {
              evictFromBuffer(new Set(allChannelSongIds.map((s) => String(s).trim())));
            }

            showToast(
              `👑 Channel Batch: Assigned ${allChannelSongIds.length} tracks in "${chName}" to Album "${saved.name}", Ranked ${rankToLog} (${scoreToLog}) & Approved! (+15 💿)`,
              'success'
            );

            // Auto-advance if enabled
            if (settingsRef.current.autoAdvanceOnAlbumAdd) {
              if (selectedChannelRef.current === chName || selectedChannelRef.current === chId) {
                const nextBottom = computeBottomPlaylistOption(
                  channelList,
                  customPlaylists,
                  { ...channelMetaMap, [chName]: { status: 'approved' }, [chId]: { status: 'approved' } },
                  chName
                );
                setSelectedChannel(nextBottom);
                selectedChannelRef.current = nextBottom;
                saveFilterConfig(targetProjectId, {
                  selectedChannel: nextBottom,
                  excludedChannels: excludedChannelsRef.current,
                  hazardCap: hazardCapRef.current,
                  discoveryMode: isDiscoveryModeRef.current,
                });
                seenIdsRef.current.clear();
                showToast(`▶ Advancing to next channel: "${nextBottom === 'ALL' ? 'All Catalog' : nextBottom}"`, 'info');
                await loadDataRef.current(nextBottom, hazardCapRef.current, excludedChannelsRef.current);
              } else {
                await handleNextSongRef.current(scoreToLog);
              }
            }
          } else {
            // Normal Single Track Assignment
            const updatedTarget: CustomPlaylist = {
              ...targetAlbum,
              include_songs: targetAlbum.include_songs.includes(songId)
                ? targetAlbum.include_songs
                : [...targetAlbum.include_songs, songId],
              updated_at: new Date().toISOString(),
            };
            const saved = await saveCustomPlaylist(targetProjectId, updatedTarget);
            updateCustomPlaylist(saved);

            showToast(`Assigned track to Album "${saved.name}"`, 'success');

            // Check if current channel just reached 100% album coverage and was auto-approved
            try {
              const freshMeta = await fetchChannelMeta(targetProjectId);
              setChannelMetaMap(freshMeta);
              const wasApproved = channelMetaMap[chName]?.status === 'approved';
              const isNowApproved = freshMeta[chName]?.status === 'approved';
              if (!wasApproved && isNowApproved) {
                const bottomOpt = getBottomPlaylistOption();
                showToast(
                  `🎉 Channel "${chName}" is 100% curated into Albums and is now APPROVED! Auto-switched to "${bottomOpt === 'ALL' ? 'All Catalog' : bottomOpt}"`,
                  'success'
                );
              }
            } catch (e) {
              console.warn('[VinylPlayer] Auto-approval check failed:', e);
            }

            // Auto-Advance on Album Add Mode: Log Track & Move to Next Song
            if (settingsRef.current.autoAdvanceOnAlbumAdd) {
              const defaultScoreMap: Record<number, ScoreTier> = {
                7: '7+',
                6: '6+',
                5: '5+',
                4: '4+',
                3: '3+',
              };
              let scoreToLog =
                selectedScoreRef.current ||
                (stagedHazardRankRef.current ? defaultScoreMap[stagedHazardRankRef.current] : null) ||
                settingsRef.current.defaultPassScore ||
                '5+';

              const activeTrackRank =
                displayStatsRef.current[String(currentTrack.id)]?.hazard_rank ??
                currentTrack.hazard_rank ??
                null;
              if (scoreToLog === 'block' && activeTrackRank !== null) {
                scoreToLog = settingsRef.current.defaultPassScore || '5+';
              }

              await handleNextSongRef.current(scoreToLog);
            }
          }
        } else if (currentAlbum) {
          showToast(`Removed track from Album "${currentAlbum.name}"`, 'info');
          // Channel might no longer be fully approved
          try {
            const freshMeta = await fetchChannelMeta(targetProjectId);
            setChannelMetaMap(freshMeta);
          } catch (e) {}
        }
      } catch (err: any) {
        console.error('[VinylPlayer] Failed to update album for song:', err);
        showToast(err.message || 'Failed to update Album', 'error');
      } finally {
        setSavingPlaylistId(null);
        setActivePicker(null);
      }
    },
    [currentTrack, currentAlbum, targetProjectId, updateCustomPlaylist, showToast]
  );

  // Single-choice: Select/assign a Genre for the current song
  const handleSelectGenreForSong = useCallback(
    async (targetGenre: CustomPlaylist | null) => {
      if (!currentTrack) return;
      const songId = currentTrack.id;

      if (targetGenre && currentSongGenre?.id === targetGenre.id) {
        setActivePicker(null);
        return;
      }

      setSavingPlaylistId(targetGenre ? targetGenre.id : 'unassign_genre_song');
      try {
        if (currentSongGenre) {
          const updatedPrev: CustomPlaylist = {
            ...currentSongGenre,
            include_songs: currentSongGenre.include_songs.filter((id) => id !== songId),
            updated_at: new Date().toISOString(),
          };
          await saveCustomPlaylist(targetProjectId, updatedPrev);
          updateCustomPlaylist(updatedPrev);
        }

        if (targetGenre) {
          const updatedTarget: CustomPlaylist = {
            ...targetGenre,
            include_songs: targetGenre.include_songs.includes(songId)
              ? targetGenre.include_songs
              : [...targetGenre.include_songs, songId],
            updated_at: new Date().toISOString(),
          };
          const saved = await saveCustomPlaylist(targetProjectId, updatedTarget);
          updateCustomPlaylist(saved);
          showToast(`Assigned track to Genre "${saved.name}"`, 'success');
        } else if (currentSongGenre) {
          showToast(`Removed track from Genre "${currentSongGenre.name}"`, 'info');
        }
      } catch (err: any) {
        console.error('[VinylPlayer] Failed to update genre for song:', err);
        showToast(err.message || 'Failed to update Genre for track', 'error');
      } finally {
        setSavingPlaylistId(null);
        setActivePicker(null);
      }
    },
    [currentTrack, currentSongGenre, targetProjectId, updateCustomPlaylist, showToast]
  );

  // Single-choice: Select/assign a Genre for the current channel
  const handleSelectGenreForChannel = useCallback(
    async (targetGenre: CustomPlaylist | null) => {
      if (!currentTrack || !currentTrack.channel) return;
      const channelName = currentTrack.channel.trim();

      if (targetGenre && currentChannelGenre?.id === targetGenre.id) {
        setActivePicker(null);
        return;
      }

      setSavingPlaylistId(targetGenre ? targetGenre.id : 'unassign_genre_channel');
      try {
        if (currentChannelGenre) {
          const updatedPrev: CustomPlaylist = {
            ...currentChannelGenre,
            include_channels: currentChannelGenre.include_channels.filter((ch) => ch !== channelName),
            updated_at: new Date().toISOString(),
          };
          await saveCustomPlaylist(targetProjectId, updatedPrev);
          updateCustomPlaylist(updatedPrev);
        }

        if (targetGenre) {
          const updatedTarget: CustomPlaylist = {
            ...targetGenre,
            include_channels: targetGenre.include_channels.includes(channelName)
              ? targetGenre.include_channels
              : [...targetGenre.include_channels, channelName],
            updated_at: new Date().toISOString(),
          };
          const saved = await saveCustomPlaylist(targetProjectId, updatedTarget);
          updateCustomPlaylist(saved);
          showToast(`Assigned channel "${channelName}" to Genre "${saved.name}"`, 'success');
        } else if (currentChannelGenre) {
          showToast(`Removed channel "${channelName}" from Genre "${currentChannelGenre.name}"`, 'info');
        }
      } catch (err: any) {
        console.error('[VinylPlayer] Failed to update genre for channel:', err);
        showToast(err.message || 'Failed to update Genre for channel', 'error');
      } finally {
        setSavingPlaylistId(null);
        setActivePicker(null);
      }
    },
    [currentTrack, currentChannelGenre, targetProjectId, updateCustomPlaylist, showToast]
  );

  // Quick-create a new playlist seeded with the current song or channel
  const handleQuickCreatePlaylist = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentTrack || !activePicker) return;
      const plName = quickPlaylistName.trim();
      if (!plName) {
        showToast('Please enter a playlist name', 'warn');
        return;
      }

      setIsQuickCreating(true);
      try {
        const isAlbum = activePicker === 'album_song';
        const isChannel = activePicker === 'genre_channel';
        const channelName = (currentTrack.channel || '').trim();
        const chId = currentTrack.channel_id || channelName;
        const isChannelBatch = isAlbum && settingsRef.current.applyAlbumToEntireChannel && Boolean(channelName);

        let songList = [currentTrack.id];
        if (isChannelBatch) {
          const backendIds = await fetchAllTracksForChannel(targetProjectId, channelName, chId);
          const bufferIds = playlistRef.current
            .filter((t) => t.channel === channelName || (t.channel_id && t.channel_id === chId))
            .map((t) => String(t.id).trim());
          songList = Array.from(new Set([...backendIds, ...bufferIds, String(currentTrack.id).trim()]));
        }

        const newPlData = {
          name: plName,
          emoji: isAlbum ? '💿' : '🎸',
          description: '',
          type: (isAlbum ? 'album' : 'genre') as 'album' | 'genre',
          include_channels: isChannel ? [channelName] : [],
          include_songs: isChannel ? [] : songList,
          include_playlists: [],
          compatible_timeblocks: [],
        };

        const saved = await saveCustomPlaylist(targetProjectId, newPlData);
        addCustomPlaylist(saved);
        setQuickPlaylistName('');

        // Single-choice maintenance: remove from previous
        if (isChannelBatch) {
          customPlaylists.forEach(async (pl) => {
            if (pl.type === 'album') {
              const rem = pl.include_songs.filter((id) => !songList.includes(id));
              if (rem.length !== pl.include_songs.length) {
                const updatedPrev = {
                  ...pl,
                  include_songs: rem,
                  updated_at: new Date().toISOString(),
                };
                try {
                  await saveCustomPlaylist(targetProjectId, updatedPrev);
                  updateCustomPlaylist(updatedPrev);
                } catch (_) {}
              }
            }
          });
        } else if (isAlbum && currentAlbum) {
          const updatedPrev = {
            ...currentAlbum,
            include_songs: currentAlbum.include_songs.filter((id) => id !== currentTrack.id),
          };
          await saveCustomPlaylist(targetProjectId, updatedPrev);
          updateCustomPlaylist(updatedPrev);
        } else if (!isAlbum && isChannel && currentChannelGenre) {
          const updatedPrev = {
            ...currentChannelGenre,
            include_channels: currentChannelGenre.include_channels.filter((c) => c !== channelName),
          };
          await saveCustomPlaylist(targetProjectId, updatedPrev);
          updateCustomPlaylist(updatedPrev);
        } else if (!isAlbum && !isChannel && currentSongGenre) {
          const updatedPrev = {
            ...currentSongGenre,
            include_songs: currentSongGenre.include_songs.filter((id) => id !== currentTrack.id),
          };
          await saveCustomPlaylist(targetProjectId, updatedPrev);
          updateCustomPlaylist(updatedPrev);
        }

        showToast(`Created "${saved.name}" and assigned successfully!`, 'success');
        setActivePicker(null);

        if (isAlbum) {
          const defaultScoreMap: Record<number, ScoreTier> = {
            7: '7+',
            6: '6+',
            5: '5+',
            4: '4+',
            3: '3+',
          };
          const rankToLog = stagedHazardRankRef.current ?? 5;
          const scoreToLog =
            selectedScoreRef.current ||
            defaultScoreMap[rankToLog] ||
            settingsRef.current.defaultPassScore ||
            '5+';

          if (isChannelBatch) {
            try {
              await rateChannelDirect(
                targetProjectId,
                chId,
                channelName,
                scoreToLog,
                selectedArcsRef.current
              );
            } catch (e) {}

            earnDiscs(15);
            incrementRatingStats(15);

            setDisplayStats((prev) => {
              const updated = { ...prev };
              songList.forEach((id) => {
                const curr = updated[id] || { played: 0, hazard_level: 3.0, timeblock: null, unlock_date: null };
                updated[id] = { ...curr, played: (curr.played || 0) + 1, hazard_rank: rankToLog };
              });
              return updated;
            });

            try {
              await updateChannelStatus(targetProjectId, chId, channelName, 'approved', 'audited');
              const freshMeta = await fetchChannelMeta(targetProjectId);
              setChannelMetaMap(freshMeta);
            } catch (e) {}

            showToast(
              `👑 Whole Channel "${channelName}" (${songList.length} tracks) created & assigned to Album "${saved.name}", Ranked ${rankToLog} & Approved! (+15 💿)`,
              'success'
            );

            if (settingsRef.current.autoAdvanceOnAlbumAdd) {
              if (selectedChannelRef.current === channelName || selectedChannelRef.current === chId) {
                const nextBottom = computeBottomPlaylistOption(
                  channelList,
                  customPlaylists,
                  { ...channelMetaMap, [channelName]: { status: 'approved' }, [chId]: { status: 'approved' } },
                  channelName
                );
                setSelectedChannel(nextBottom);
                selectedChannelRef.current = nextBottom;
                saveFilterConfig(targetProjectId, {
                  selectedChannel: nextBottom,
                  excludedChannels: excludedChannelsRef.current,
                  hazardCap: hazardCapRef.current,
                  discoveryMode: isDiscoveryModeRef.current,
                });
                seenIdsRef.current.clear();
                showToast(`▶ Advancing to next channel: "${nextBottom === 'ALL' ? 'All Catalog' : nextBottom}"`, 'info');
                await loadDataRef.current(nextBottom, hazardCapRef.current, excludedChannelsRef.current);
              } else {
                await handleNextSongRef.current(scoreToLog);
              }
            }
          } else {
            try {
              const freshMeta = await fetchChannelMeta(targetProjectId);
              setChannelMetaMap(freshMeta);
              const chName = currentTrack.channel;
              if (freshMeta[chName]?.status === 'approved') {
                showToast(`🎉 Channel "${chName}" completed into Albums and is now APPROVED!`, 'success');
              }
            } catch (e) {}

            // Auto-Advance on Album Add Mode: Log Track & Move to Next Song
            if (settingsRef.current.autoAdvanceOnAlbumAdd) {
              const activeTrackRank =
                displayStatsRef.current[String(currentTrack.id)]?.hazard_rank ??
                currentTrack.hazard_rank ??
                null;
              let finalScore = scoreToLog;
              if (finalScore === 'block' && activeTrackRank !== null) {
                finalScore = settingsRef.current.defaultPassScore || '5+';
              }

              await handleNextSongRef.current(finalScore);
            }
          }
        }
      } catch (err: any) {
        console.error('[VinylPlayer] Failed to quick-create playlist:', err);
        showToast(err.message || 'Failed to create playlist', 'error');
      } finally {
        setIsQuickCreating(false);
      }
    },
    [
      currentTrack,
      activePicker,
      quickPlaylistName,
      targetProjectId,
      currentAlbum,
      currentSongGenre,
      currentChannelGenre,
      addCustomPlaylist,
      updateCustomPlaylist,
      showToast,
    ]
  );

  const getPlayedCount = useCallback((trackId: string): number => {
    const val = displayStatsRef.current[String(trackId)];
    return val && Number.isInteger(val.played) && val.played >= 0 ? val.played : 0;
  }, []);

  const getHazardLevel = useCallback((trackId: string): number => {
    const val = displayStatsRef.current[String(trackId)];
    return val && !isNaN(val.hazard_level) ? val.hazard_level : 3.0;
  }, []);

  // Authoritative YouTube video synchronization function
  const syncVideoToPlayer = useCallback((targetVideoId: string | null) => {
    if (!targetVideoId || !targetVideoId.trim()) return;
    const cleanId = String(targetVideoId).trim();

    if (!isPlayerReadyRef.current || !playerRef.current) {
      pendingVideoIdRef.current = cleanId;
      if (!playerRef.current && mountPlayerRef.current) {
        mountPlayerRef.current();
      }
      return;
    }

    if (currentlyLoadedVideoIdRef.current === cleanId) {
      return;
    }

    try {
      currentlyLoadedVideoIdRef.current = cleanId;
      pendingVideoIdRef.current = null;
      if (typeof playerRef.current.loadVideoById === 'function') {
        playerRef.current.loadVideoById({
          videoId: cleanId,
          startSeconds: 0,
        });
        playerRef.current.playVideo?.();
      }
    } catch (err) {
      console.warn('[YouTube Player] loadVideoById error:', err);
    }
  }, []);

  // Synchronize YouTube player whenever currentTrack changes
  useEffect(() => {
    if (currentTrack && currentTrack.id) {
      syncVideoToPlayer(currentTrack.id);
    }
  }, [currentTrack?.id, syncVideoToPlayer]);

  // Zero-allocation O(N) roulette selection
  const selectWeightedTrack = useCallback((list: PlaylistItem[], excludeIdx: number = -1) => {
    if (!list || list.length === 0) {
      return { index: -1, probability: 0 };
    }

    const n = list.length;
    if (n === 1) {
      return { index: 0, probability: 100 };
    }

    let totalWeight = 0;
    for (let i = 0; i < n; i++) {
      if (i === excludeIdx) continue;
      const count = displayStatsRef.current[list[i].id]?.played ?? 0;
      totalWeight += 1 / (count + 1);
    }

    if (totalWeight <= 0) return { index: 0, probability: 100 };

    let randomVal = Math.random() * totalWeight;
    let selectedIndex = 0;
    let selectedWeight = 1;

    for (let i = 0; i < n; i++) {
      if (i === excludeIdx) continue;
      const count = displayStatsRef.current[list[i].id]?.played ?? 0;
      const w = 1 / (count + 1);
      randomVal -= w;
      if (randomVal <= 0) {
        selectedIndex = i;
        selectedWeight = w;
        break;
      }
    }

    const probability = (selectedWeight / totalWeight) * 100;
    return { index: selectedIndex, probability };
  }, []);

  // Play track by index and trigger state synchronization
  const playTrackByIndex = useCallback((idx: number, currentList: PlaylistItem[], prob: number | null = null) => {
    if (idx < 0 || idx >= currentList.length) return;

    setCurrentIndex(idx);
    currentIndexRef.current = idx;
    setCurrentProbability(prob);
    setSelectedArcs([]);
    if (!isRatingPinnedRef.current) {
      setSelectedScore('');
      selectedScoreRef.current = '';
    }
  }, []);

  // Replenish playlist buffer from backend in background respecting channel_name, excluded_channels, and hazard_cap
  const replenishBufferIfNeeded = useCallback(async () => {
    if (isFetchingMoreRef.current || playlistRef.current.length >= 15) return;

    isFetchingMoreRef.current = true;
    try {
      let customChannels: string[] | undefined = undefined;
      let includeSongIds: string[] | undefined = undefined;
      let singleChannel: string | undefined = selectedChannelRef.current;

      if (singleChannel && singleChannel.startsWith('CUSTOM:')) {
        const plId = singleChannel.replace('CUSTOM:', '');
        const src = resolvePlaylistSources(useVinylStore.getState().customPlaylists, plId);
        if (src.channels.length > 0 || src.songIds.length > 0) {
          customChannels = src.channels.length > 0 ? src.channels : undefined;
          includeSongIds = src.songIds.length > 0 ? src.songIds : undefined;
          singleChannel = undefined;
        }
      } else if (singleChannel === 'STATUS:approved') {
        customChannels = approvedChannels.map((c) => c.name);
        singleChannel = undefined;
      } else if (singleChannel === 'STATUS:cleaning') {
        customChannels = cleaningChannels.map((c) => c.name);
        singleChannel = undefined;
      } else if (singleChannel === 'STATUS:raw') {
        customChannels = rawChannels.map((c) => c.name);
        singleChannel = undefined;
      }

      const blockedRaw = useVinylStore.getState().blockedSongIds;
      const blocked = Array.isArray(blockedRaw) ? blockedRaw : [];
      const isDisc = isDiscoveryModeRef.current || selectedChannelRef.current === 'DISCOVERY:unassigned';
      let moreTracks = await fetchMoreSampledTracks(
        targetProjectId,
        50,
        singleChannel,
        hazardCapRef.current,
        excludedChannelsRef.current,
        customChannels,
        blocked.length > 0 ? blocked : undefined,
        includeSongIds,
        isDisc
      );
      if (moreTracks.length === 0 && singleChannel && singleChannel !== 'ALL' && singleChannel !== 'DISCOVERY:unassigned' && !singleChannel.startsWith('CUSTOM:')) {
        moreTracks = await fetchMoreSampledTracks(
          targetProjectId,
          50,
          singleChannel,
          'ALL',
          undefined,
          undefined,
          blocked.length > 0 ? blocked : undefined,
          undefined,
          isDisc
        );
      }
      if (!isMountedRef.current) return;

      let filteredMore = moreTracks;
      if (isDisc) {
        filteredMore = filteredMore.filter((t) => !allAlbumSongIdSetRef.current.has(String(t.id).trim()));
      }

      const newUniqueTracks = filteredMore.filter((t) => !seenIdsRef.current.has(t.id));
      if (newUniqueTracks.length > 0) {
        newUniqueTracks.forEach((t) => seenIdsRef.current.add(t.id));
        const merged = [...playlistRef.current, ...newUniqueTracks];
        playlistRef.current = merged;
        setPlaylist(merged);
      }
    } catch (e) {
      console.warn('[VinylPlayer] Background buffer replenishment notice:', e);
    } finally {
      isFetchingMoreRef.current = false;
    }
  }, [targetProjectId]);

  // Automated Outbox Flush Helper
  const flushQueuedEvents = useCallback(async () => {
    const currentOutbox = useVinylStore.getState().offlineOutbox || [];
    if (currentOutbox.length === 0 || isFlushingOutbox) return;

    setIsFlushingOutbox(true);
    try {
      const res = await flushOfflineEvents(targetProjectId, currentOutbox);
      if (res.success) {
        clearOfflineOutbox();
        const flushed = res.flushedCount || 0;
        showToast(`⚡ Flushed ${flushed} offline rating log(s) directly to _2_events.jsonl!`, 'success');
        setPendingLogsCount((prev) => {
          const next = prev + flushed;
          if (next >= 15) {
            triggerAutoSyncIfNeeded(next);
          }
          return next;
        });
      }
    } catch (err: any) {
      console.warn('[VinylPlayer] Outbox flush deferred until backend connection is stable:', err);
    } finally {
      if (isMountedRef.current) setIsFlushingOutbox(false);
    }
  }, [targetProjectId, isFlushingOutbox, clearOfflineOutbox, showToast]);

  // Automated Batch Sync every 15 logs (Tier 2 -> Tier 3 -> Tier 4)
  const triggerAutoSyncIfNeeded = useCallback(
    async (currentCount: number) => {
      if (isAutoSyncingRef.current || currentCount < 15) return;

      isAutoSyncingRef.current = true;
      try {
        const t2Res = await syncTier2ToTier3(targetProjectId);
        const t3Res = await syncTier3ToTier4(targetProjectId);
        setPendingLogsCount(0);
        showToast(
          `⚡ Auto-Sync (15 Logs): ${t2Res.eventsProcessed} logs ingested ➔ ${t3Res.syncedCount} tracks projected to Tier 4!`,
          'success'
        );
      } catch (err: any) {
        console.warn('[Auto-Sync] Error during automated 15-log sync:', err);
      } finally {
        if (isMountedRef.current) isAutoSyncingRef.current = false;
      }
    },
    [targetProjectId, showToast]
  );

  // Log action to Tier 2 with Offline Outbox Fallback
  // source 'end' = auto-logged when the song ends; 'active' = user clicked a log/block button.
  // Disc rewards: end score=3, active score=7, end block=8, active block=5.
  const logActionToTier2 = async (
    track: PlaylistItem,
    action: string,
    source: 'end' | 'active' = 'active'
  ) => {
    const isBlockAction = action === 'block';
    const discReward = isBlockAction
      ? source === 'end' ? 8 : 5
      : source === 'end' ? 3 : 7;
    const trackId = String(track.id).trim();

    if (lastLoggedTrackIdRef.current === trackId) {
      showToast(`⏭️ Already logged this track`, 'warn');
      return true;
    }

    const timestampHex = Date.now().toString(16).toUpperCase();
    const activeArcs = selectedArcsRef.current;
    const rankToLog = stagedHazardRankRef.current;

    const payloadData: Tier2EventEntry = {
      id: trackId,
      action: action,
      timestamp: timestampHex,
      target_type: 'track',
      channel_id: track.channel_id,
      channel_name: track.channel,
    };

    if (rankToLog !== null && rankToLog !== undefined) {
      payloadData.hazard_rank = rankToLog;
    }

    if (activeArcs.length === 1) {
      payloadData.timeblock = activeArcs[0];
    } else if (activeArcs.length > 1) {
      payloadData.timeblock = [...activeArcs];
    }

    // 1. Optimistic reward and local played count
    lastLoggedTrackIdRef.current = trackId;
    earnDiscs(discReward);
    incrementRatingStats(discReward);
    setSessionRatedCount((prev) => prev + 1);

    setDisplayStats((prev) => {
      const current = prev[trackId] || { played: 0, hazard_level: 3.0, timeblock: null, unlock_date: null };
      const assignedRank = rankToLog ?? current.hazard_rank ?? null;
      let optimHazard = current.hazard_level;
      if (assignedRank && assignedRank >= 3 && assignedRank <= 7) {
        const base = assignedRank - 0.5;
        const k = (8.5 - assignedRank) / 100.0;
        const addS = action === '7+' ? 4 : action === '6+' ? 2 : action === '5+' ? 1 : 0;
        optimHazard = Math.round(Math.min(8.5, Math.max(1.0, base + k * addS)) * 100) / 100;
      }
      return {
        ...prev,
        [trackId]: {
          ...current,
          played: (current.played || 0) + 1,
          hazard_rank: assignedRank,
          hazard_level: optimHazard,
        },
      };
    });

    const arcSuffix = activeArcs.length > 0 ? ` [${activeArcs.length} Arcs]` : '';
    const rankSuffix = rankToLog ? ` [Rank ${rankToLog}]` : '';

    // If action is 'block', immediately eradicate song from pool and store
    if (action === 'block') {
      addBlockedSong(trackId);
      seenIdsRef.current.add(trackId);
      setTotalCatalogCount((prev) => Math.max(0, prev - 1));
      deleteTrackImmediately(targetProjectId, trackId).catch((err) => {
        console.warn('[VinylPlayer] Error executing immediate track deletion:', err);
      });
    }

    // 2. Attempt immediate append to backend Tier 2 (_2_events.jsonl)
    try {
      setIsLogging(true);
      await executeOrder({
        project_id: targetProjectId,
        tier: '2',
        order: {
          action: 'append',
          data: payloadData,
        },
      });

      if (action === 'block') {
        showToast(`🚫 Blocked & Eradicated from Pool${arcSuffix}${rankSuffix} (+${discReward} Discs)`, 'warn');
      } else {
        showToast(`✨ Logged ${action.toUpperCase()}${arcSuffix}${rankSuffix} (+${discReward} Discs)`, 'success');
      }

      setPendingLogsCount((prev) => {
        const next = prev + 1;
        if (next >= 15) {
          triggerAutoSyncIfNeeded(next);
        }
        return next;
      });

      // Check if earlier outbox items need flushing
      const pendingOutbox = useVinylStore.getState().offlineOutbox || [];
      if (pendingOutbox.length > 0) {
        flushQueuedEvents();
      }
    } catch (err: any) {
      // 3. Fallback: Save to Offline Outbox safely
      enqueueOfflineEvent(payloadData);
      showToast(
        `📦 Offline Outbox: Queued ${action.toUpperCase()}${arcSuffix}${rankSuffix} (auto-flushes to _2_events.jsonl on reconnect) (+${discReward} 💿)`,
        'warn'
      );
    } finally {
      setSelectedArcs([]);
      if (!isRatingPinnedRef.current) {
        setSelectedScore('');
        selectedScoreRef.current = '';
        setStagedHazardRank(5);
        stagedHazardRankRef.current = 5;
      }
      if (isMountedRef.current) setIsLogging(false);
    }
    return true;
  };
  logActionToTier2Ref.current = logActionToTier2;

  // Rate Entire Channel at once (Channel Mastery) with Offline Outbox Fallback
  const handleLogChannel = async (scoreToLog: string) => {
    const activeTrack = currentTrackRef.current;
    if (!activeTrack || !activeTrack.channel) {
      showToast('No active channel to rate', 'warn');
      return;
    }

    const channelId = activeTrack.channel_id || activeTrack.channel;
    const channelName = activeTrack.channel;
    const activeArcs = selectedArcsRef.current;
    const timestampHex = Date.now().toString(16).toUpperCase();

    const channelEvent: Tier2EventEntry = {
      id: channelId,
      target_type: 'channel',
      channel_id: channelId,
      channel_name: channelName,
      action: scoreToLog,
      timestamp: timestampHex,
      timeblock: activeArcs.length === 1 ? activeArcs[0] : activeArcs.length > 1 ? activeArcs : undefined,
    };

    // 1. Optimistic reward and stats
    earnDiscs(5);
    incrementRatingStats(5);
    setSessionRatedCount((prev) => prev + 1);

    const arcSuffix = activeArcs.length > 0 ? ` [${activeArcs.length} Arcs]` : '';

    // 2. Attempt direct backend rating
    try {
      setIsLogging(true);
      const res = await rateChannelDirect(
        targetProjectId,
        channelId,
        channelName,
        scoreToLog,
        activeArcs
      );

      if (res.success) {
        const newHazard = res.hazard;
        const newPlayed = res.played;
        const newTimeblock = activeArcs.length > 0 ? activeArcs[0] : null;

        // Optimistically update all tracks in local buffer belonging to this channel
        setDisplayStats((prev) => {
          const updated = { ...prev };
          playlistRef.current.forEach((t) => {
            if (t.channel === channelName || (t.channel_id && t.channel_id === channelId)) {
              updated[t.id] = {
                hazard_level: newHazard,
                played: newPlayed,
                timeblock: newTimeblock,
                unlock_date: null,
              };
            }
          });
          return updated;
        });

        // Also update playlist items in state
        setPlaylist((prevList) =>
          prevList.map((t) =>
            t.channel === channelName || (t.channel_id && t.channel_id === channelId)
              ? { ...t, hazard_level: newHazard, played: newPlayed, timeblock: newTimeblock }
              : t
          )
        );

        showToast(
          `👑 Channel Mastery: Applied ${scoreToLog.toUpperCase()}${arcSuffix} to all songs in "${channelName}" (+5 💿)`,
          'success'
        );

        setPendingLogsCount((prev) => {
          const next = prev + 1;
          if (next >= 15) {
            triggerAutoSyncIfNeeded(next);
          }
          return next;
        });

        const pendingOutbox = useVinylStore.getState().offlineOutbox || [];
        if (pendingOutbox.length > 0) {
          flushQueuedEvents();
        }
      }
    } catch (err: any) {
      // 3. Fallback: Save to Offline Outbox safely
      enqueueOfflineEvent(channelEvent);
      showToast(
        `📦 Offline Outbox: Queued Channel ${scoreToLog.toUpperCase()} for "${channelName}" (auto-flushes on reconnect) (+5 💿)`,
        'warn'
      );
    } finally {
      setSelectedArcs([]);
      if (!isRatingPinnedRef.current) {
        setSelectedScore('');
        selectedScoreRef.current = '';
      }
      if (isMountedRef.current) setIsLogging(false);
    }
  };

  // Mode 1: Log Rating ONLY (Keep track playing)
  const handleLogCurrentTrack = async (scoreToLog: string) => {
    if (ratingTarget === 'channel') {
      await handleLogChannel(scoreToLog);
      return;
    }

    const activeTrack = currentTrackRef.current;
    if (!activeTrack || !activeTrack.id) return;
    const trackId = String(activeTrack.id).trim();

    if (lastLoggedTrackIdRef.current === trackId) {
      showToast(`Track "${activeTrack.title}" is already logged! Advance to next song.`, 'warn');
      return;
    }

    await logActionToTier2(activeTrack, scoreToLog);
  };

  // Sovereign Pinned Rating Latch (Locks Hazard Rank and Rating/Block across all tracks this session)
  const handleTogglePinRating = () => {
    setIsRatingPinned((prev) => {
      const next = !prev;
      if (next) {
        const rankStr = stagedHazardRank ? `Rank ${stagedHazardRank}` : 'Current Rank';
        const scoreStr = selectedScore ? selectedScore.toUpperCase() : 'Current Score';
        showToast(`📌 Pinned Rating Locked: [${rankStr} | ${scoreStr}] active across all songs`, 'success');
      } else {
        showToast('🔓 Pinned Rating Unlocked: selections will reset after each track', 'info');
      }
      return next;
    });
  };

  // Sovereign Hazard Rank Staging (Toggles in memory & seeds default score)
  const handleToggleHazardRank = (rank: number) => {
    const defaultScoreMap: Record<number, ScoreTier> = {
      7: '7+',
      6: '6+',
      5: '5+',
      4: '4+',
      3: '3+',
    };

    setStagedHazardRank((prev) => {
      if (prev === rank) {
        // Toggling off: if selectedScore matches the default for this rank, unselect it too
        if (selectedScore === defaultScoreMap[rank]) {
          setSelectedScore('');
        }
        return null;
      }

      // First pick / selecting rank: automatically seed the matching default score
      setSelectedScore(defaultScoreMap[rank]);
      return rank;
    });
  };

  // Automatically synchronize hazard_rank from _3_state.db if not yet in displayStats
  useEffect(() => {
    const activeTrack = currentTrack;
    if (!activeTrack || !activeTrack.id) {
      if (!isRatingPinnedRef.current) {
        setStagedHazardRank(5);
      }
      return;
    }
    const trackId = String(activeTrack.id).trim();

    if (!isRatingPinnedRef.current) {
      const existingRank = displayStats[trackId]?.hazard_rank ?? activeTrack.hazard_rank ?? 5;
      setStagedHazardRank(existingRank);
    }

    if (displayStats[trackId]?.hazard_rank === undefined && activeTrack.hazard_rank === undefined) {
      executeOrder<Record<string, unknown>>({
        project_id: targetProjectId,
        tier: '3',
        order: { action: 'read_key', key: trackId },
      })
        .then((res) => {
          if (res.data && res.data.hazard_rank !== undefined && res.data.hazard_rank !== null) {
            const rank = Number(res.data.hazard_rank);
            setDisplayStats((prev) => ({
              ...prev,
              [trackId]: {
                ...(prev[trackId] || { played: 0, hazard_level: 3.0, timeblock: null, unlock_date: null }),
                hazard_rank: rank,
              },
            }));
            setPlaylist((prev) =>
              prev.map((t) => (t.id === trackId ? { ...t, hazard_rank: rank } : t))
            );
            if (!isRatingPinnedRef.current) {
              setStagedHazardRank((prev) => prev ?? rank);
            }
          }
        })
        .catch(() => {});
    }
  }, [currentTrack?.id, targetProjectId]);

  // Mode 2: Advance to Next Song
  const handleNextSong = useCallback(
    async (action: string | null) => {
      const currentList = playlistRef.current;
      const currIdx = currentIndexRef.current;

      if (currIdx < 0 || currIdx >= currentList.length) {
        // Out-of-sync index: recover by playing a track from the buffer instead of silently doing nothing
        if (currentList.length > 0) {
          const recoverPick = selectWeightedTrack(currentList, -1);
          playTrackByIndex(recoverPick.index, currentList, recoverPick.probability);
        }
        return;
      }

      const activeTrack = currentList[currIdx];
      const trackId = String(activeTrack.id).trim();

      // If action is explicitly provided (e.g. immediate 'block' or '3+')
      if (action && action !== 'skip') {
        if (lastLoggedTrackIdRef.current !== trackId) {
          await logActionToTier2(activeTrack, action);
        }
      } else {
        showToast(`💿 Skipped to next track`, 'info');
      }

      // Reset selection states (respects Pinned Rating Latch)
      setSelectedArcs([]);
      if (!isRatingPinnedRef.current) {
        setSelectedScore('');
        selectedScoreRef.current = '';
        setStagedHazardRank(5);
        stagedHazardRankRef.current = 5;
      }

      // Remove current track from session playlist
      const updatedList = [...currentList];
      updatedList.splice(currIdx, 1);
      playlistRef.current = updatedList;
      setPlaylist(updatedList);

      // When a single song is blocked, remove it from any custom playlist definitions
      // while keeping all other songs in the playlist/channel completely protected and intact!
      if (action === 'block') {
        customPlaylists.forEach(async (pl) => {
          if (pl.include_songs.includes(trackId)) {
            const updatedPl: CustomPlaylist = {
              ...pl,
              include_songs: pl.include_songs.filter((id) => id !== trackId),
              updated_at: new Date().toISOString(),
            };
            try {
              await saveCustomPlaylist(targetProjectId, updatedPl);
              updateCustomPlaylist(updatedPl);
            } catch (e) {
              console.warn('[handleNextSong] Failed to remove blocked song from custom playlist:', pl.name, e);
            }
          }
        });
      }

      if (updatedList.length === 0) {
        setIsExhausted(true);
        setCurrentIndex(-1);
        currentIndexRef.current = -1;
        if (playerRef.current?.stopVideo) {
          try {
            playerRef.current.stopVideo();
          } catch (_) {}
        }
        currentlyLoadedVideoIdRef.current = null;
        pendingVideoIdRef.current = null;

        const curSelected = selectedChannelRef.current;

        // When a specific channel or playlist reaches the end of its buffer,
        // it means the final song has finished playing.
        // SYNC BUFFER IMMEDIATELY & PROCESS CHANNEL BEFORE ADVANCING!
        if (curSelected !== 'ALL' && curSelected !== 'DISCOVERY:unassigned' && !isDiscoveryModeRef.current) {
          showToast('⚡ Final song completed! Synchronizing buffer & processing channel...', 'info');

          // 1. Flush offline outbox immediately
          try {
            const currentOutbox = useVinylStore.getState().offlineOutbox || [];
            if (currentOutbox.length > 0) {
              const res = await flushOfflineEvents(targetProjectId, currentOutbox);
              if (res.success) {
                clearOfflineOutbox();
              }
            }
          } catch (e) {
            console.warn('[handleNextSong] Outbox flush on buffer completion warning:', e);
          }

          // 2. Immediate Tier 2 -> Tier 3 -> Tier 4 Sync
          let t2Processed = 0;
          try {
            const t2Res = await syncTier2ToTier3(targetProjectId, true);
            await syncTier3ToTier4(targetProjectId);
            t2Processed = t2Res.eventsProcessed;
            setPendingLogsCount(0);
          } catch (e) {
            console.error('[handleNextSong] Sync Tier 2 -> 3 -> 4 failed:', e);
          }

          // 3. Process the channel & re-fetch fresh metadata / origins
          let freshMeta: Record<string, { status: ChannelStatus; notes?: string }> = {};
          let freshOrigins: ChannelOriginItem[] = [];
          let freshPlaylists: CustomPlaylist[] = customPlaylists;

          try {
            // fetchChannelMeta triggers backend sync_channel_approval_status
            const [meta, origins, pls] = await Promise.all([
              fetchChannelMeta(targetProjectId),
              fetchChannelOrigins(targetProjectId),
              fetchCustomPlaylists(targetProjectId),
            ]);
            freshMeta = meta;
            freshOrigins = origins;
            freshPlaylists = pls;

            const isCustom = curSelected.startsWith('CUSTOM:');
            const isStatusGroup = curSelected.startsWith('STATUS:');

            if (!isCustom && !isStatusGroup) {
              const chName = curSelected;
              const chItem = freshOrigins.find((c) => c.name === chName);
              const chId = chItem?.channel_id || chName;
              const currentSt = freshMeta[chName]?.status || 'raw';

              // If channel has 0 songs remaining in catalog, purge it
              if (!chItem || chItem.count === 0) {
                try {
                  await purgeChannelSongs(targetProjectId, chName, chId);
                  freshOrigins = freshOrigins.filter((c) => c.name !== chName);
                  delete freshMeta[chName];
                  if (chId) delete freshMeta[chId];
                  showToast(`🗑️ Channel "${chName}" has 0 songs left & was purged`, 'warn');
                } catch (e) {
                  console.warn('[handleNextSong] Channel purge warning:', e);
                }
              } else if (currentSt === 'approved') {
                showToast(`🎉 Channel "${chName}" is 100% curated into Albums and is now APPROVED!`, 'success');
              } else if (currentSt === 'raw') {
                // Channel finished all songs in raw -> promote to cleaning
                try {
                  await updateChannelStatus(targetProjectId, chId, chName, 'cleaning', 'audited');
                  freshMeta[chName] = { status: 'cleaning', notes: 'audited' };
                  if (chId) freshMeta[chId] = { status: 'cleaning', notes: 'audited' };
                  showToast(`🧹 Channel "${chName}" fully screened ➔ Promoted to Cleaning`, 'info');
                } catch (e) {
                  console.warn('[handleNextSong] Failed to promote raw channel to cleaning:', e);
                }
              }
            } else if (isCustom) {
              const plId = curSelected.replace('CUSTOM:', '');
              const plObj = freshPlaylists.find((p) => p.id === plId);
              if (plObj && plObj.include_songs.length === 0 && plObj.include_channels.length === 0) {
                try {
                  await deleteCustomPlaylist(targetProjectId, plId);
                  removeCustomPlaylist(plId);
                  freshPlaylists = freshPlaylists.filter((p) => p.id !== plId);
                  showToast(`🗑️ Empty Playlist "${plObj.name}" deleted`, 'warn');
                } catch (e) {}
              }
            } else if (isStatusGroup) {
              const statusTarget = curSelected.replace('STATUS:', '');
              const remainingInGroup = freshOrigins.filter((c) => {
                const st = freshMeta[c.name]?.status || 'raw';
                return st === statusTarget && st !== 'approved';
              });
              if (remainingInGroup.length > 0) {
                setChannelList(freshOrigins);
                setChannelMetaMap(freshMeta);
                setCustomPlaylists(freshPlaylists);
                seenIdsRef.current.clear();
                showToast(`🎉 Status batch completed (${t2Processed} events synced). Loading next ${statusTarget} batch...`, 'info');
                await loadDataRef.current(curSelected, hazardCapRef.current, excludedChannelsRef.current);
                return;
              }
            }

            // Update Zustand store
            setChannelList(freshOrigins);
            setChannelMetaMap(freshMeta);
            setCustomPlaylists(freshPlaylists);
          } catch (e) {
            console.error('[handleNextSong] Failed to refresh metadata after buffer completion:', e);
          }

          // 4. Compute next bottom playlist, explicitly excluding curSelected
          const nextBottom = computeBottomPlaylistOption(
            freshOrigins.length > 0 ? freshOrigins : channelList,
            freshPlaylists.length > 0 ? freshPlaylists : customPlaylists,
            Object.keys(freshMeta).length > 0 ? freshMeta : channelMetaMap,
            curSelected
          );

          setSelectedChannel(nextBottom);
          selectedChannelRef.current = nextBottom;
          saveFilterConfig(targetProjectId, {
            selectedChannel: nextBottom,
            excludedChannels: excludedChannelsRef.current,
            hazardCap: hazardCapRef.current,
            discoveryMode: isDiscoveryModeRef.current,
          });

          seenIdsRef.current.clear();

          showToast(
            `▶ Channel stream completed (${t2Processed} events synced). Playing next: "${nextBottom === 'ALL' ? 'All Catalog' : nextBottom}"`,
            'info'
          );

          await loadDataRef.current(nextBottom, hazardCapRef.current, excludedChannelsRef.current);
          return;
        }

        // Discovery Mode on a specific playlist: its unassigned pool is spent.
        // Compute the next playable candidate directly to avoid reloading an empty channel.
        if (isDiscoveryModeRef.current && curSelected !== 'ALL') {
          setIsLoading(true);
          setLoadPhase('Channel stream completed. Advancing to next playable playlist...');
          try {
            const outbox = useVinylStore.getState().offlineOutbox || [];
            if (outbox.length > 0) {
              const flushed = await flushOfflineEvents(targetProjectId, outbox);
              if (flushed.success) clearOfflineOutbox();
            }
          } catch (_) {}
          let freshOrigins: ChannelOriginItem[] = [];
          try {
            const activeBlocked = useVinylStore.getState().blockedSongIds || [];
            const fresh = await fetchChannelOrigins(targetProjectId, {
              hazardCap: hazardCapRef.current,
              onlyUnassigned: true,
              excludeChannels: excludedChannelsRef.current,
              blockedIds: activeBlocked.length > 0 ? activeBlocked : undefined,
              hideEmpty: true,
            });
            if (Array.isArray(fresh)) {
              freshOrigins = fresh;
              setChannelList([...fresh].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)));
            }
          } catch (_) {
            freshOrigins = useVinylStore.getState().channelList;
          }

          const eligiblePlaylists = useVinylStore.getState().customPlaylists.filter((p) => p.type !== 'album');
          const nextCandidate = computeBottomPlaylistOption(
            freshOrigins.filter((c) => c.count > 0 && c.name !== curSelected),
            eligiblePlaylists,
            channelMetaMap,
            [curSelected]
          );

          seenIdsRef.current.clear();
          const targetNext = nextCandidate && nextCandidate !== 'ALL' && nextCandidate !== curSelected
            ? nextCandidate
            : 'ALL';

          const label = targetNext.startsWith('CUSTOM:')
            ? useVinylStore.getState().customPlaylists.find((p) => p.id === targetNext.replace('CUSTOM:', ''))?.name || 'Custom Playlist'
            : targetNext === 'ALL'
            ? 'All Unassigned Catalog'
            : targetNext;

          setSelectedChannel(targetNext);
          selectedChannelRef.current = targetNext;
          saveFilterConfig(targetProjectId, {
            selectedChannel: targetNext,
            excludedChannels: excludedChannelsRef.current,
            hazardCap: hazardCapRef.current,
            discoveryMode: true,
          });
          showToast(`⏭ Stream completed. Auto-switching to: "${label}"`, 'info');
          await loadDataRef.current(targetNext, hazardCapRef.current, excludedChannelsRef.current, true, [curSelected]);
          return;
        }

        // For 'ALL' catalog mode: flush outbox and sync buffer immediately, then replenish
        try {
          const currentOutbox = useVinylStore.getState().offlineOutbox || [];
          if (currentOutbox.length > 0) {
            await flushOfflineEvents(targetProjectId, currentOutbox);
            clearOfflineOutbox();
          }
          await syncTier2ToTier3(targetProjectId, true);
          await syncTier3ToTier4(targetProjectId);
          setPendingLogsCount(0);
        } catch (_) {}

        showToast('🎉 Buffer completed! Synchronized & fetching more tracks...', 'info');
        replenishBufferIfNeeded();
        return;
      }

      consecutiveErrorsRef.current = 0;
      const nextPick = selectWeightedTrack(updatedList, -1);
      playTrackByIndex(nextPick.index, updatedList, nextPick.probability);

      // Trigger background replenishment if buffer is running low
      if (updatedList.length < 15) {
        replenishBufferIfNeeded();
      }
    },
    [
      selectWeightedTrack,
      playTrackByIndex,
      showToast,
      replenishBufferIfNeeded,
      channelList,
      setChannelList,
      customPlaylists,
      setCustomPlaylists,
      channelMetaMap,
      setChannelMetaMap,
      targetProjectId,
      getBottomPlaylistOption,
      removeCustomPlaylist,
      clearOfflineOutbox,
      totalCatalogCount,
    ]
  );
  handleNextSongRef.current = handleNextSong;

  // Stuck-state watchdog: idle overlay with no track, no pending load and not exhausted/offline.
  // Self-heal by reloading the pool (capped so a genuinely broken state cannot loop forever).
  const stuckRecoveriesRef = useRef<number>(0);
  useEffect(() => {
    const stuck = !isInitializing && !isLoading && !currentTrack && !isExhausted && !isOffline;
    if (!stuck) {
      if (currentTrack) stuckRecoveriesRef.current = 0;
      return;
    }
    if (stuckRecoveriesRef.current >= 3) return;
    const timer = setTimeout(() => {
      stuckRecoveriesRef.current += 1;
      console.warn('[VinylPlayer] Idle with no active track - reloading the pool (self-heal)');
      showToastRef.current?.('♻ Player was idle with no track - reloading the pool...', 'info');
      loadDataRef.current();
    }, 2500);
    return () => clearTimeout(timer);
  }, [isInitializing, isLoading, currentTrack?.id, isExhausted, isOffline, playlist.length]);

  // Load sampled tracks filtered by channel_name, hazard_cap, excluded_channels, and discovery_mode from Backend File 1, 4 & 5
  const loadData = useCallback(
    async (
      channelToFilter: string = selectedChannelRef.current,
      capToFilter: string = hazardCapRef.current,
      excludeToFilter: string[] = excludedChannelsRef.current,
      discoveryModeToFilter: boolean = isDiscoveryModeRef.current || channelToFilter === 'DISCOVERY:unassigned',
      triedChannels: string[] = []
    ) => {
      setIsLoading(true);
      setLoadPhase(
        `Sampling ${discoveryModeToFilter ? 'unassigned songs' : 'songs'} from ${
          channelToFilter === 'ALL'
            ? 'all playlists'
            : channelToFilter.startsWith('CUSTOM:')
            ? 'a custom playlist'
            : `"${channelToFilter}"`
        }${triedChannels.length > 0 ? ` (auto-switch hop ${triedChannels.length})` : ''}`
      );
      setIsOffline(false);
      setErrorMessage(null);
      setIsExhausted(false);

      try {
        let customChannels: string[] | undefined = undefined;
        let includeSongIds: string[] | undefined = undefined;
        let singleChannel: string | undefined = channelToFilter;

        if (channelToFilter === 'DISCOVERY:unassigned') {
          singleChannel = undefined;
        } else if (channelToFilter && channelToFilter.startsWith('CUSTOM:')) {
          const plId = channelToFilter.replace('CUSTOM:', '');
          const src = resolvePlaylistSources(useVinylStore.getState().customPlaylists, plId);
          if (src.channels.length > 0 || src.songIds.length > 0) {
            customChannels = src.channels.length > 0 ? src.channels : undefined;
            includeSongIds = src.songIds.length > 0 ? src.songIds : undefined;
            singleChannel = undefined;
          }
        } else if (channelToFilter === 'STATUS:approved') {
          customChannels = approvedChannels.map((c) => c.name);
          singleChannel = undefined;
        } else if (channelToFilter === 'STATUS:cleaning') {
          customChannels = cleaningChannels.map((c) => c.name);
          singleChannel = undefined;
        } else if (channelToFilter === 'STATUS:raw') {
          customChannels = rawChannels.map((c) => c.name);
          singleChannel = undefined;
        }

        const blockedRaw = useVinylStore.getState().blockedSongIds;
        const blocked = Array.isArray(blockedRaw) ? blockedRaw : [];

        const storeChannels = useVinylStore.getState().channelList;
        const needMeta = !storeChannels || storeChannels.length === 0;

        let sampledData: Awaited<ReturnType<typeof fetchSampledTracks>>;
        if (needMeta) {
          const [sData, channels, pls, meta, dbBlocked] = await Promise.all([
            fetchSampledTracks(
              targetProjectId,
              50,
              singleChannel,
              capToFilter,
              excludeToFilter,
              customChannels,
              blocked.length > 0 ? blocked : undefined,
              includeSongIds,
              discoveryModeToFilter
            ),
            fetchChannelOrigins(targetProjectId, {
              hazardCap: capToFilter,
              onlyUnassigned: discoveryModeToFilter,
              excludeChannels: excludeToFilter,
              blockedIds: blocked.length > 0 ? blocked : undefined,
              hideEmpty: true,
            }).catch(() => []),
            fetchCustomPlaylists(targetProjectId).catch(() => []),
            fetchChannelMeta(targetProjectId).catch(() => ({})),
            fetchBlockedTrackIds(targetProjectId).catch(() => []),
          ]);
          sampledData = sData;

          if (Array.isArray(dbBlocked) && dbBlocked.length > 0) {
            useVinylStore.setState((s) => ({
              blockedSongIds: Array.from(new Set([...(s.blockedSongIds || []), ...dbBlocked])),
            }));
          }

          if (pls && pls.length >= 0) {
            setCustomPlaylists(pls);
          }
          if (meta) {
            setChannelMetaMap(meta);
          }

          if (channels && channels.length >= 0) {
            const sorted = [...channels].sort(
              (a, b) => b.count - a.count || a.name.localeCompare(b.name)
            );
            setChannelList(sorted);
          }
        } else {
          sampledData = await fetchSampledTracks(
            targetProjectId,
            50,
            singleChannel,
            capToFilter,
            excludeToFilter,
            customChannels,
            blocked.length > 0 ? blocked : undefined,
            includeSongIds,
            discoveryModeToFilter
          );
        }

        let { tracks, totalCatalogCount: count, statsMap } = sampledData;

        // If a specific channel was selected and returned 0 tracks under current filters
        // (e.g. hazard cap constraint), gracefully relax hazard cap to stream the channel directly
        // BUT strictly maintain discoveryMode constraint (only songs not in any album)!
        // Skip relaxing in Discovery Mode if channel has 0 unassigned songs (it would be completely futile).
        if (
          tracks.length === 0 &&
          !discoveryModeToFilter &&
          singleChannel &&
          singleChannel !== 'ALL' &&
          singleChannel !== 'DISCOVERY:unassigned' &&
          !singleChannel.startsWith('CUSTOM:')
        ) {
          try {
            const relaxed = await fetchSampledTracks(
              targetProjectId,
              50,
              singleChannel,
              'ALL',
              undefined,
              undefined,
              blocked.length > 0 ? blocked : undefined,
              undefined,
              false
            );
            if (relaxed.tracks.length > 0) {
              sampledData = relaxed;
              tracks = relaxed.tracks;
              count = relaxed.totalCatalogCount;
              statsMap = relaxed.statsMap;
              showToast(`▶ Streaming "${singleChannel}" (${relaxed.tracks.length} songs)`, 'info');
            }
          } catch (_) {}
        }

        if (discoveryModeToFilter) {
          tracks = tracks.filter((t) => !allAlbumSongIdSetRef.current.has(String(t.id).trim()));
        }

        setTotalCatalogCount(count);

        if (tracks.length === 0) {
          // Auto-Switch: nothing matches the active filters -> fast-probe candidates to find the next playable option
          const canAutoSwitch =
            settingsRef.current.autoSwitchOnEmpty !== false &&
            Boolean(channelToFilter) &&
            channelToFilter !== 'ALL' &&
            channelToFilter !== 'DISCOVERY:unassigned';

          if (canAutoSwitch) {
            const tried = [...triedChannels, channelToFilter];
            const labelOf = (v: string) =>
              v.startsWith('CUSTOM:')
                ? useVinylStore.getState().customPlaylists.find((p) => p.id === v.replace('CUSTOM:', ''))?.name || 'Custom Playlist'
                : v;
            console.warn(`[VinylPlayer] "${channelToFilter}" has no matching songs. Fast-probing candidate playlists...`);

            setLoadPhase(`"${labelOf(channelToFilter)}" has no matching songs - probing next playlist...`);

            // Fetch fresh channel origins ONCE with active constraints
            let freshOrigins: ChannelOriginItem[] = [];
            try {
              freshOrigins = await fetchChannelOrigins(targetProjectId, {
                hazardCap: capToFilter,
                onlyUnassigned: discoveryModeToFilter,
                excludeChannels: excludeToFilter,
                blockedIds: blocked.length > 0 ? blocked : undefined,
                hideEmpty: true,
              });
            } catch (_) {
              freshOrigins = useVinylStore.getState().channelList;
            }

            const eligiblePlaylists = discoveryModeToFilter
              ? useVinylStore.getState().customPlaylists.filter((p) => p.type !== 'album')
              : useVinylStore.getState().customPlaylists;

            // Fast Pre-Flight Probe: check candidates with limit=15 to avoid recursive multi-roundtrip storms
            let foundCandidate: string | null = null;
            let candidateSample: Awaited<ReturnType<typeof fetchSampledTracks>> | null = null;
            const probeTried = [...tried];

            for (let probeStep = 0; probeStep < 4; probeStep++) {
              const candidate = computeBottomPlaylistOption(
                freshOrigins.filter((c) => c.count > 0 && !probeTried.includes(c.name)),
                eligiblePlaylists,
                channelMetaMap,
                probeTried
              );

              if (!candidate || candidate === 'ALL' || probeTried.includes(candidate)) {
                break;
              }
              probeTried.push(candidate);

              try {
                let candSingle: string | undefined = candidate;
                let candCustom: string[] | undefined = undefined;
                let candIncludeIds: string[] | undefined = undefined;

                if (candidate.startsWith('CUSTOM:')) {
                  const plId = candidate.replace('CUSTOM:', '');
                  const src = resolvePlaylistSources(useVinylStore.getState().customPlaylists, plId);
                  candCustom = src.channels.length > 0 ? src.channels : undefined;
                  candIncludeIds = src.songIds.length > 0 ? src.songIds : undefined;
                  candSingle = undefined;
                }

                const probeRes = await fetchSampledTracks(
                  targetProjectId,
                  15,
                  candSingle,
                  capToFilter,
                  excludeToFilter,
                  candCustom,
                  blocked.length > 0 ? blocked : undefined,
                  candIncludeIds,
                  discoveryModeToFilter
                );

                let candTracks = probeRes.tracks;
                if (discoveryModeToFilter) {
                  candTracks = candTracks.filter((t) => !allAlbumSongIdSetRef.current.has(String(t.id).trim()));
                }

                if (candTracks.length > 0) {
                  foundCandidate = candidate;
                  candidateSample = {
                    ...probeRes,
                    tracks: candTracks,
                  };
                  break;
                }
              } catch (_) {}
            }

            if (foundCandidate && candidateSample && candidateSample.tracks.length > 0) {
              showToast(
                `⏭ No songs match in "${labelOf(channelToFilter)}". Auto-switched to: "${labelOf(foundCandidate)}"`,
                'info'
              );
              setSelectedChannel(foundCandidate);
              selectedChannelRef.current = foundCandidate;
              saveFilterConfig(targetProjectId, {
                selectedChannel: foundCandidate,
                excludedChannels: excludedChannelsRef.current,
                hazardCap: hazardCapRef.current,
                discoveryMode: discoveryModeToFilter,
              });

              // Adopt candidate tracks directly without an extra network call!
              tracks = candidateSample.tracks;
              count = candidateSample.totalCatalogCount;
              statsMap = candidateSample.statsMap;
              setTotalCatalogCount(count);
              // Fall through to play candidate track!
            } else {
              showToast('No other playlist has songs matching current filters.', 'warn');
              if (playerRef.current?.stopVideo) {
                try {
                  playerRef.current.stopVideo();
                } catch (_) {}
              }
              currentlyLoadedVideoIdRef.current = null;
              pendingVideoIdRef.current = null;
              setIsExhausted(true);
              setPlaylist([]);
              playlistRef.current = [];
              setCurrentIndex(-1);
              currentIndexRef.current = -1;
              setIsLoading(false);
              return;
            }
          } else {
            if (playerRef.current?.stopVideo) {
              try {
                playerRef.current.stopVideo();
              } catch (_) {}
            }
            currentlyLoadedVideoIdRef.current = null;
            pendingVideoIdRef.current = null;
            setIsExhausted(true);
            setPlaylist([]);
            playlistRef.current = [];
            setCurrentIndex(-1);
            currentIndexRef.current = -1;
            setIsLoading(false);
            return;
          }
        }

        const queued = useVinylStore.getState().queuedTrackForGameplay;
        let finalTracks = tracks;
        let initialIndex = 0;
        let initialProb: number | null = null;

        if (queued && queued.id) {
          const queuedHazard = queued.hazard_level ?? 3.0;
          const queuedPlayed = queued.played ?? 0;
          statsMap[queued.id] = {
            played: queuedPlayed,
            hazard_level: queuedHazard,
            timeblock: queued.timeblock ?? null,
            unlock_date: null,
          };

          const existIdx = tracks.findIndex((t) => t.id === queued.id);
          if (existIdx >= 0) {
            initialIndex = existIdx;
          } else {
            finalTracks = [queued, ...tracks];
            initialIndex = 0;
          }
          initialProb = 100;
          useVinylStore.getState().setQueuedTrackForGameplay(null);
        } else {
          const pick = selectWeightedTrack(tracks, -1);
          initialIndex = pick.index;
          initialProb = pick.probability;
        }

        // Track seen IDs
        seenIdsRef.current = new Set(finalTracks.map((t) => t.id));

        displayStatsRef.current = statsMap;
        setDisplayStats(statsMap);

        playlistRef.current = finalTracks;
        setPlaylist(finalTracks);

        setCurrentIndex(initialIndex);
        setCurrentProbability(initialProb);
        currentIndexRef.current = initialIndex;
      } catch (err: any) {
        console.error('[VinylPlayer] Failed to connect to Backend Storage Engine:', err);
        setIsOffline(true);
        setErrorMessage(
          err.message || 'Unable to connect to Blue Rose Storage Engine on http://localhost:8080'
        );
        setPlaylist([]);
        playlistRef.current = [];
        setCurrentIndex(-1);
        currentIndexRef.current = -1;
      } finally {
        setIsLoading(false);
      }
    },
    [targetProjectId, selectWeightedTrack]
  );

  loadDataRef.current = loadData;

  // Dynamic listener for queued tracks arriving from Gallery & Sync tab
  useEffect(() => {
    if (!queuedTrackForGameplay || isLoading) return;

    const track = queuedTrackForGameplay;
    const currentList = playlistRef.current;
    const existingIndex = currentList.findIndex((t) => t.id === track.id);

    const trackHazard = track.hazard_level ?? 3.0;
    const trackPlayed = track.played ?? 0;
    const updatedMeta: TrackDisplayMeta = {
      played: trackPlayed,
      hazard_level: trackHazard,
      timeblock: track.timeblock ?? null,
      unlock_date: null,
    };

    displayStatsRef.current[track.id] = updatedMeta;
    setDisplayStats((prev) => ({
      ...prev,
      [track.id]: updatedMeta,
    }));

    if (existingIndex >= 0) {
      setCurrentIndex(existingIndex);
      currentIndexRef.current = existingIndex;
      setCurrentProbability(100);
    } else {
      const updated = [track, ...currentList];
      playlistRef.current = updated;
      setPlaylist(updated);
      seenIdsRef.current.add(track.id);
      setCurrentIndex(0);
      currentIndexRef.current = 0;
      setCurrentProbability(100);
    }

    setIsExhausted(false);
    lastLoggedTrackIdRef.current = null;
    setSelectedScore('');
    selectedScoreRef.current = '';
    setSelectedArcs([]);
    showToast(`🎵 Loaded from Gallery: "${track.title}"`, 'success');
    setQueuedTrackForGameplay(null);
  }, [queuedTrackForGameplay, isLoading, showToast, setQueuedTrackForGameplay]);

  // Dynamic listener for queued playlist arriving from Playlists tab
  useEffect(() => {
    if (!queuedPlaylistForGameplay) return;
    const source = queuedPlaylistForGameplay;
    setQueuedPlaylistForGameplay(null);

    setSelectedChannel(source);
    selectedChannelRef.current = source;
    setExcludedChannels([]);
    excludedChannelsRef.current = [];

    let playlistLabel = source;
    if (source.startsWith('CUSTOM:')) {
      const plId = source.replace('CUSTOM:', '');
      const pl = useVinylStore.getState().customPlaylists.find((p) => p.id === plId);
      playlistLabel = pl ? `${pl.emoji || '🎵'} ${pl.name}` : 'Custom Playlist';
    }

    showToast(`▶ Streaming: ${playlistLabel}`, 'info');
    loadData(source, hazardCapRef.current, []);
  }, [queuedPlaylistForGameplay, loadData, setQueuedPlaylistForGameplay, showToast]);

  // Dedicated effect to track component mount status safely across React 18 StrictMode lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initial load on mount: restore persistent filter configuration from Tier 5 (_5_config.db)
  const isInitializedRef = useRef<string | null>(null);
  useEffect(() => {
    if (isInitializedRef.current === targetProjectId) return;
    isInitializedRef.current = targetProjectId;

    const initFromPersistentConfig = async () => {
      try {
        const saved = await getFilterConfig(targetProjectId).catch(() => null);
        const isDisc = saved
          ? Boolean(
              saved.discoveryMode ??
              saved.onlyUnassignedAlbums ??
              saved.selectedChannel === 'DISCOVERY:unassigned'
            )
          : Boolean(useVinylStore.getState().discoveryMode);

        const [dbBlocked, pls, meta] = await Promise.all([
          fetchBlockedTrackIds(targetProjectId).catch(() => []),
          fetchCustomPlaylists(targetProjectId).catch(() => []),
          fetchChannelMeta(targetProjectId).catch(() => ({})),
        ]);

        const blockedList = Array.from(new Set([
          ...(useVinylStore.getState().blockedSongIds || []),
          ...(Array.isArray(dbBlocked) ? dbBlocked : []),
        ]));

        const origins = await fetchChannelOrigins(targetProjectId, {
          onlyUnassigned: isDisc,
          blockedIds: blockedList.length > 0 ? blockedList : undefined,
          hideEmpty: true,
        }).catch(() => []);

        if (Array.isArray(dbBlocked) && dbBlocked.length > 0) {
          useVinylStore.setState((s) => ({
            blockedSongIds: Array.from(new Set([...(s.blockedSongIds || []), ...dbBlocked])),
          }));
        }

        const sortedOrigins = Array.isArray(origins)
          ? [...origins].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
          : [];

        if (sortedOrigins.length > 0) {
          setChannelList(sortedOrigins);
        }
        if (pls && pls.length > 0) {
          setCustomPlaylists(pls);
        }
        if (meta) {
          setChannelMetaMap(meta);
        }

        const exList = saved?.excludedChannels || [];
        const hCap = saved?.hazardCap || '3.2';
        let ch = saved?.selectedChannel;
        useVinylStore.getState().setDiscoveryMode?.(isDisc);
        const fSections = saved?.foldedSections || {};
        setFoldedSections(fSections);
        foldedSectionsRef.current = fSections;

        // Default option of include is ALWAYS the bottom-most playlist
        if (!ch || ch === 'ALL') {
          ch = computeBottomPlaylistOption(sortedOrigins, pls || [], meta || {});
          saveFilterConfig(targetProjectId, {
            selectedChannel: ch,
            hazardCap: hCap,
            excludedChannels: exList,
            discoveryMode: isDisc,
            foldedSections: fSections,
          });
        }

        setExcludedChannels(exList);
        excludedChannelsRef.current = exList;
        setHazardCap(hCap);
        hazardCapRef.current = hCap;
        setSelectedChannel(ch);
        selectedChannelRef.current = ch;
        setIsDiscoveryMode(isDisc);
        isDiscoveryModeRef.current = isDisc;
        setIsInitializing(false);

        await loadData(ch, hCap, exList, isDisc);
      } catch (e: any) {
        console.warn('[VinylPlayer] Error reading persistent filter config from Tier 5:', e);
        setIsInitializing(false);
        setIsOffline(true);
        setErrorMessage(
          e?.message || 'Unable to connect to Storage Engine on http://localhost:8080'
        );
      }
    };

    initFromPersistentConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetProjectId, loadData]);

  // Check pending Tier 2 events on mount and trigger auto-sync if threshold is already met
  useEffect(() => {
    executeOrder<Tier2EventEntry[]>({
      project_id: targetProjectId,
      tier: '2',
      order: { action: 'read_all' },
    })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setPendingLogsCount(list.length);
        if (list.length >= 15) {
          triggerAutoSyncIfNeeded(list.length);
        }
      })
      .catch(() => {});
  }, [targetProjectId, triggerAutoSyncIfNeeded]);

  // Handle Multi-Select Toggle for an Excluded Playlist & Persist to Tier 5
  const handleToggleExcludeChannel = (channelName: string) => {
    let next: string[];
    if (excludedChannels.includes(channelName)) {
      next = excludedChannels.filter((c) => c !== channelName);
      showToast(`Removed exclusion for "${channelName}"`, 'info');
    } else {
      next = [...excludedChannels, channelName];
      showToast(`Excluded playlist "${channelName}"`, 'warn');
    }

    setExcludedChannels(next);
    excludedChannelsRef.current = next;

    // Persist to Tier 5 Backend File (_5_config.db)
    saveFilterConfig(targetProjectId, {
      excludedChannels: next,
      hazardCap: hazardCapRef.current,
      selectedChannel: selectedChannelRef.current,
      discoveryMode: isDiscoveryModeRef.current,
    });

    loadData(selectedChannel, hazardCap, next);
  };

  // Handle Multi-Select Toggle for an entire Custom Playlist's channels
  const handleToggleExcludePlaylist = (pl: CustomPlaylist) => {
    const memberChannels = resolvePlaylistSources(customPlaylists, pl.id).channels;
    if (memberChannels.length === 0) {
      showToast(`"${pl.name}" has no channels to exclude`, 'info');
      return;
    }
    const allExcluded = memberChannels.every((c: string) => excludedChannels.includes(c));
    let next: string[];

    if (allExcluded) {
      next = excludedChannels.filter((c) => !memberChannels.includes(c));
      showToast(`Removed exclusion for "${pl.name}"`, 'info');
    } else {
      next = Array.from(new Set([...excludedChannels, ...memberChannels]));
      showToast(`Excluded all channels in "${pl.name}"`, 'warn');
    }

    setExcludedChannels(next);
    excludedChannelsRef.current = next;

    saveFilterConfig(targetProjectId, {
      excludedChannels: next,
      hazardCap: hazardCapRef.current,
      selectedChannel: selectedChannelRef.current,
      discoveryMode: isDiscoveryModeRef.current,
    });

    loadData(selectedChannel, hazardCap, next);
  };

  // Handle Clear All Exclusions & Persist to Tier 5
  const handleClearAllExclusions = () => {
    setExcludedChannels([]);
    excludedChannelsRef.current = [];
    showToast('Cleared all playlist exclusions', 'info');

    // Persist to Tier 5 Backend File (_5_config.db)
    saveFilterConfig(targetProjectId, {
      excludedChannels: [],
      hazardCap: hazardCapRef.current,
      selectedChannel: selectedChannelRef.current,
      discoveryMode: isDiscoveryModeRef.current,
    });

    loadData(selectedChannel, hazardCap, []);
  };

  // Handle Include Playlist / Channel Selector change & Persist to Tier 5
  const handleSelectChannel = (channelName: string) => {
    const prevChannel = selectedChannelRef.current;
    setSelectedChannel(channelName);
    selectedChannelRef.current = channelName;

    let isDisc = isDiscoveryModeRef.current;
    if (channelName === 'DISCOVERY:unassigned') {
      isDisc = true;
      setIsDiscoveryMode(true);
      isDiscoveryModeRef.current = true;
      useVinylStore.getState().setDiscoveryMode?.(true);
      showToast('✨ Discovery: Streaming uncurated songs (not in any Album)', 'success');
    } else if (prevChannel === 'DISCOVERY:unassigned') {
      // Switching away from Discovery:unassigned option to a regular channel or catalog
      if (!isDiscoveryModeRef.current) {
        isDisc = false;
        useVinylStore.getState().setDiscoveryMode?.(false);
      }
      if (channelName === 'ALL') {
        showToast('🎵 Playlist: All Playlists', 'info');
      } else {
        showToast(`🎵 Playlist: ${channelName}`, 'info');
      }
    } else if (channelName === 'ALL') {
      showToast('🎵 Playlist: All Playlists', 'info');
    } else {
      showToast(`🎵 Playlist: ${channelName}`, 'info');
    }
    // Persist to Tier 5 Backend File (_5_config.db)
    saveFilterConfig(targetProjectId, {
      excludedChannels: excludedChannelsRef.current,
      hazardCap: hazardCapRef.current,
      selectedChannel: channelName,
      discoveryMode: isDisc,
      foldedSections: foldedSectionsRef.current,
    });

    loadData(channelName, hazardCap, excludedChannels, isDisc);
  };

  // Toggle fold/expand state for playlist sections in Include dropdown and persist to Tier 5
  const handleToggleFoldSection = (section: 'custom' | 'approved' | 'cleaning' | 'raw') => {
    setFoldedSections((prev) => {
      const next = { ...prev, [section]: !prev[section] };
      foldedSectionsRef.current = next;
      saveFilterConfig(targetProjectId, {
        selectedChannel: selectedChannelRef.current,
        excludedChannels: excludedChannelsRef.current,
        hazardCap: hazardCapRef.current,
        discoveryMode: isDiscoveryModeRef.current,
        foldedSections: next,
      });
      return next;
    });
  };

  // Get user-friendly label for current Include selection
  const getSelectedIncludeLabel = useCallback(() => {
    if (selectedChannel === 'ALL') {
      return 'All Playlists';
    }
    if (selectedChannel === 'DISCOVERY:unassigned' || isDiscoveryMode) {
      return '✨ Discovery: Unassigned';
    }
    if (selectedChannel.startsWith('CUSTOM:')) {
      const plId = selectedChannel.replace('CUSTOM:', '');
      const pl = customPlaylists.find((p) => p.id === plId);
      return pl ? `${pl.emoji || '🎵'} ${pl.name}` : 'Custom Playlist';
    }
    if (selectedChannel === 'STATUS:approved') {
      return '▶ All Approved';
    }
    if (selectedChannel === 'STATUS:cleaning') {
      return '▶ All Cleaning';
    }
    if (selectedChannel === 'STATUS:raw') {
      return '▶ All Raw';
    }
    return selectedChannel;
  }, [selectedChannel, isDiscoveryMode, customPlaylists]);

  // Filter Include items via search input
  const filteredIncludeCustomPlaylists = useMemo(() => {
    let list = customPlaylists;
    // In Discovery Mode, hide Album playlists (since Albums by definition only contain assigned songs)
    if (isDiscoveryMode) {
      list = list.filter((pl) => pl.type !== 'album');
    }
    if (!includeSearchQuery.trim()) return list;
    const q = includeSearchQuery.toLowerCase().trim();
    return list.filter((pl) => pl.name.toLowerCase().includes(q));
  }, [customPlaylists, includeSearchQuery, isDiscoveryMode]);

  const filteredIncludeApprovedChannels = useMemo(() => {
    if (!includeSearchQuery.trim()) return approvedChannels;
    const q = includeSearchQuery.toLowerCase().trim();
    return approvedChannels.filter((ch) => ch.name.toLowerCase().includes(q));
  }, [approvedChannels, includeSearchQuery]);

  const filteredIncludeCleaningChannels = useMemo(() => {
    if (!includeSearchQuery.trim()) return cleaningChannels;
    const q = includeSearchQuery.toLowerCase().trim();
    return cleaningChannels.filter((ch) => ch.name.toLowerCase().includes(q));
  }, [cleaningChannels, includeSearchQuery]);

  const filteredIncludeRawChannels = useMemo(() => {
    if (!includeSearchQuery.trim()) return rawChannels;
    const q = includeSearchQuery.toLowerCase().trim();
    return rawChannels.filter((ch) => ch.name.toLowerCase().includes(q));
  }, [rawChannels, includeSearchQuery]);

  const getHazardCapDisplay = (capValue: string) => {
    if (capValue === '7+' || capValue === '7') return 'Hazard: 7+ (Crown)';
    if (capValue === '6+' || capValue === '6') return 'Hazard: 6+ (Awakened)';
    if (capValue === '3.2 to under 6' || capValue === '3.2_to_under_6') return 'Hazard: 3.2 to <6.0';
    if (capValue === 'under 4.0' || capValue === 'under_4.0') return 'Hazard: <4.0 (Calm Zone)';
    if (capValue === 'under 3.2' || capValue === 'under_3.2' || capValue === '3.2') return 'Hazard: <3.2 (Calm/Unrated)';
    if (capValue === 'ALL') return 'All Hazard Levels';
    return `Hazard: ${capValue}`;
  };

  // Returns the minimum number of Hazard-3.0 songs to remove to raise a
  // playlist's weighted-average score by exactly +0.01.
  // Formula: k = ceil(0.01 * N / (H0 - 2.99))  (derived from solving the
  // weighted-average equation; only meaningful when H0 > 3.0).
  const calcHazardDrag = (count: number, avgHazard: number): string => {
    if (!count || count <= 0 || avgHazard <= 3.0) return '';
    const k = Math.ceil((0.01 * count) / (avgHazard - 2.99));
    if (k <= 0 || k >= count) return '';
    return ` • -${k} for +0.01`;
  };

  // Compute aggregate stats (totalSongs, avgHazard) for a custom playlist
  // using the channelList that is already loaded in component state.
  const getCustomPlaylistAgg = (pl: CustomPlaylist): { totalSongs: number; avgHazard: number } => {
    const src = resolvePlaylistSources(customPlaylists, pl.id);
    let totalSongs = 0;
    let weightedSum = 0;
    src.channels.forEach((chName) => {
      const ch = channelList.find((c) => c.name === chName);
      if (ch) {
        totalSongs += ch.count;
        weightedSum += (ch.avg_hazard ?? 3.0) * ch.count;
      }
    });
    // Handpicked songs: use known hazard from displayStats, otherwise default 3.0
    src.songIds.forEach((id) => {
      totalSongs += 1;
      weightedSum += displayStats[id]?.hazard_level ?? 3.0;
    });
    const avgHazard = totalSongs > 0 ? weightedSum / totalSongs : 3.0;
    return { totalSongs, avgHazard: Math.round(avgHazard * 100) / 100 };
  };

  // Compute average hazard of the currently loaded (filtered) pool from displayStats.
  // This is the correct N and H₀ to use for calcHazardDrag — matching what the
  // player actually sees, which agrees with totalCatalogCount.
  const poolAvgHazard = useMemo(() => {
    const ids = Object.keys(displayStats);
    if (ids.length === 0) return 3.0;
    let sum = 0;
    let n = 0;
    ids.forEach((id) => {
      const h = displayStats[id]?.hazard_level;
      if (h !== undefined && !isNaN(h)) { sum += h; n++; }
    });
    return n > 0 ? sum / n : 3.0;
  }, [displayStats]);

  // Handle Hazard Level Cap change & Persist to Tier 5
  const handleSelectHazardCap = (capValue: string) => {
    setHazardCap(capValue);
    hazardCapRef.current = capValue;

    showToast(`🎯 Hazard Pool: ${getHazardCapDisplay(capValue)}`, 'info');

    // Persist to Tier 5 Backend File (_5_config.db)
    saveFilterConfig(targetProjectId, {
      excludedChannels: excludedChannelsRef.current,
      hazardCap: capValue,
      selectedChannel: selectedChannelRef.current,
      discoveryMode: isDiscoveryModeRef.current,
    });

    loadData(selectedChannel, capValue, excludedChannels);
  };

  // Toggle Unassigned Album Discovery Mode
  const handleToggleDiscoveryMode = () => {
    setIsDiscoveryMode((prev) => {
      const next = !prev;
      isDiscoveryModeRef.current = next;
      useVinylStore.getState().setDiscoveryMode?.(next);

      let targetChannel = selectedChannelRef.current;
      if (!next && targetChannel === 'DISCOVERY:unassigned') {
        targetChannel = getBottomPlaylistOption();
        setSelectedChannel(targetChannel);
        selectedChannelRef.current = targetChannel;
      }

      saveFilterConfig(targetProjectId, {
        selectedChannel: targetChannel,
        excludedChannels: excludedChannelsRef.current,
        hazardCap: hazardCapRef.current,
        discoveryMode: next,
        foldedSections: foldedSectionsRef.current,
      });

      // Synchronize channel list counts and available channels to active discovery mode
      const activeBlocked = useVinylStore.getState().blockedSongIds;
      fetchChannelOrigins(targetProjectId, {
        onlyUnassigned: next,
        blockedIds: activeBlocked.length > 0 ? activeBlocked : undefined,
        hideEmpty: true,
      }).then((fresh) => {
        if (isMountedRef.current && Array.isArray(fresh)) {
          const sorted = [...fresh].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
          setChannelList(sorted);
        }
      }).catch(() => {});

      if (next) {
        // Immediately purge any album-assigned songs from current active buffer
        evictFromBuffer(allAlbumSongIdSetRef.current);
        showToast('✨ Discovery Mode Activated: Streaming only songs not in any Album', 'success');
      } else {
        showToast('Standard Stream: Restored regular song pool', 'info');
      }

      loadData(targetChannel, hazardCapRef.current, excludedChannelsRef.current, next);
      return next;
    });
  };

  // Reset all filters to default & Persist to Tier 5
  const handleResetFilters = () => {
    const defaultChannel = getBottomPlaylistOption();
    setSelectedChannel(defaultChannel);
    selectedChannelRef.current = defaultChannel;
    setExcludedChannels([]);
    excludedChannelsRef.current = [];
    setHazardCap('ALL');
    hazardCapRef.current = 'ALL';
    setIsDiscoveryMode(false);
    isDiscoveryModeRef.current = false;
    useVinylStore.getState().setDiscoveryMode?.(false);

    // Persist to Tier 5 Backend File (_5_config.db)
    saveFilterConfig(targetProjectId, {
      excludedChannels: [],
      hazardCap: 'ALL',
      selectedChannel: defaultChannel,
      discoveryMode: false,
      foldedSections: foldedSectionsRef.current,
    });

    showToast(`🔄 Filters reset to default (${defaultChannel === 'ALL' ? 'All Playlists' : defaultChannel}, No Exclusions, All Hazards)`, 'info');
    loadData(defaultChannel, 'ALL', [], false);
  };

  // Automated Reconnection Watchdog (fail empty 4 times, fail loudly on 5th)
  useEffect(() => {
    let timerId: any = null;
    let isCancelled = false;

    const probeBackendHealth = async () => {
      try {
        const isHealthy = await checkBackendHealth();
        if (isCancelled) return;

        if (isHealthy) {
          const hadPriorFailures = consecutiveFailuresRef.current > 0 || isOffline;
          consecutiveFailuresRef.current = 0;
          if (isOffline) setIsOffline(false);
          if (isLoudFailure) setIsLoudFailure(false);
          setErrorMessage(null);

          // Flush any pending offline outbox logs immediately upon reconnection
          const currentOutbox = useVinylStore.getState().offlineOutbox || [];
          if (currentOutbox.length > 0) {
            flushQueuedEvents();
          }

          // If buffer was empty due to offline start, reload tracks
          if (hadPriorFailures && playlistRef.current.length === 0 && !isLoading) {
            loadData();
          }
        } else {
          consecutiveFailuresRef.current += 1;
          const fails = consecutiveFailuresRef.current;

          // Fail empty for first 4 attempts, fail loudly on 5th
          if (fails < 5) {
            setIsOffline(true);
            setIsLoudFailure(false);
          } else {
            setIsOffline(true);
            setIsLoudFailure(true);
            setErrorMessage('Backend Storage Engine Unreachable (5 retries failed) — Offline Outbox Active');
          }
        }
      } catch {
        if (isCancelled) return;
        consecutiveFailuresRef.current += 1;
        if (consecutiveFailuresRef.current >= 5) {
          setIsOffline(true);
          setIsLoudFailure(true);
          setErrorMessage('Backend Storage Engine Unreachable (5 retries failed) — Offline Outbox Active');
        }
      }

      // Schedule next probe: 2.5s if offline or outbox queued, 15s if healthy
      const outboxCount = useVinylStore.getState().offlineOutbox?.length || 0;
      const intervalMs = isOffline || outboxCount > 0 ? 2500 : 15000;
      if (!isCancelled) {
        timerId = setTimeout(probeBackendHealth, intervalMs);
      }
    };

    probeBackendHealth();

    return () => {
      isCancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [isOffline, isLoudFailure, flushQueuedEvents, loadData, isLoading]);

  // Handle Manual Retry Connection
  const handleRetryConnection = async () => {
    setIsRetrying(true);
    try {
      const isHealthy = await checkBackendHealth();
      if (isHealthy) {
        consecutiveFailuresRef.current = 0;
        setIsOffline(false);
        setIsLoudFailure(false);
        setErrorMessage(null);
        await flushQueuedEvents();
        await loadData(selectedChannel, hazardCap, excludedChannels);
      } else {
        consecutiveFailuresRef.current = 5;
        setIsOffline(true);
        setIsLoudFailure(true);
        showToast('⚠️ Manual connection retry failed. Backend is offline.', 'error');
      }
    } finally {
      if (isMountedRef.current) setIsRetrying(false);
    }
  };

  // Dedicated YouTube Player mounting & watchdog lifecycle effect (Mounts ONCE on component mount)
  useEffect(() => {
    let isDestroyed = false;
    let pollInterval: any = null;

    const mountPlayer = () => {
      if (isDestroyed) return;

      const container = document.getElementById('vinyl-yt-player');
      if (!container) {
        return;
      }

      // If player already exists
      if (playerRef.current) {
        // If still in constructor/loading phase, allow it to complete
        if (!isPlayerReadyRef.current) {
          return;
        }

        // If marked ready, check if its iframe is still actively attached to DOM
        try {
          const iframe = playerRef.current.getIframe?.();
          if (iframe && document.body.contains(iframe)) {
            return; // Player is healthy and mounted
          }
        } catch (_) {}

        // Stale player or detached iframe: clean up and recreate
        try {
          playerRef.current.destroy?.();
        } catch (_) {}
        playerRef.current = null;
        isPlayerReadyRef.current = false;
      }

      if (!window.YT || !window.YT.Player) {
        return;
      }

      const initialVideoId =
        (pendingVideoIdRef.current && String(pendingVideoIdRef.current).trim()) ||
        (currentTrackRef.current?.id && String(currentTrackRef.current.id).trim()) ||
        (playlistRef.current[currentIndexRef.current]?.id && String(playlistRef.current[currentIndexRef.current].id).trim()) ||
        '';

      try {
        const playerConfig: any = {
          host: 'https://www.youtube-nocookie.com',
          height: '100%',
          width: '100%',
          playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (isDestroyed) return;
              isPlayerReadyRef.current = true;

              // Immediately synchronize to authoritative currentTrack target
              const targetId =
                pendingVideoIdRef.current ||
                currentTrackRef.current?.id ||
                playlistRef.current[currentIndexRef.current]?.id;

              if (targetId && String(targetId).trim().length > 0) {
                const cleanTargetId = String(targetId).trim();
                currentlyLoadedVideoIdRef.current = cleanTargetId;
                pendingVideoIdRef.current = null;
                try {
                  event.target.loadVideoById({
                    videoId: cleanTargetId,
                    startSeconds: 0,
                  });
                  event.target.playVideo();
                } catch (e) {
                  console.warn('[YouTube Player] onReady load error:', e);
                }
              } else if (initialVideoId && initialVideoId.length > 0) {
                currentlyLoadedVideoIdRef.current = initialVideoId;
                try {
                  event.target.playVideo();
                } catch (_) {}
              }
            },
            onStateChange: (event: any) => {
              if (isDestroyed) return;

              // Self-healing watchdog: check playing video ID against currentTrack
              if (event.data === window.YT.PlayerState.PLAYING) {
                const playingId = event.target?.getVideoData?.()?.video_id;
                const expectedTrack = currentTrackRef.current;
                if (
                  playingId &&
                  expectedTrack?.id &&
                  String(playingId).trim() !== String(expectedTrack.id).trim() &&
                  currentlyLoadedVideoIdRef.current !== expectedTrack.id
                ) {
                  console.warn(
                    `[YouTube Watchdog] Desync detected (playing ${playingId} vs expected ${expectedTrack.id}). Resyncing...`
                  );
                  currentlyLoadedVideoIdRef.current = expectedTrack.id;
                  try {
                    event.target.loadVideoById({
                      videoId: String(expectedTrack.id).trim(),
                      startSeconds: 0,
                    });
                    event.target.playVideo();
                  } catch (e) {
                    console.warn('[YouTube Watchdog] Resync failed:', e);
                  }
                  return;
                } else if (playingId) {
                  currentlyLoadedVideoIdRef.current = playingId;
                }
              }

              // Auto-advance when video finishes naturally
              if (event.data === window.YT.PlayerState.ENDED) {
                if (settingsRef.current.autoplay) {
                  const currList = playlistRef.current;
                  const cIdx = currentIndexRef.current;
                  if (cIdx >= 0 && cIdx < currList.length) {
                    const activeTrack = currList[cIdx];
                    if (lastLoggedTrackIdRef.current !== activeTrack.id) {
                      let scoreToLog =
                        selectedScoreRef.current || settingsRef.current.defaultPassScore || '5+';
                      // Ranked tracks are immune to deferred block — only Block & Skip Now is allowed
                      const activeTrackRank =
                        displayStatsRef.current[String(activeTrack.id)]?.hazard_rank ??
                        activeTrack.hazard_rank ??
                        null;
                      if (scoreToLog === 'block' && activeTrackRank !== null) {
                        scoreToLog = settingsRef.current.defaultPassScore || '5+';
                        if (showToastRef.current) {
                          showToastRef.current(
                            `🛡️ Track "${activeTrack.title}" is protected (Ranked) — block prevented, logged as ${scoreToLog}`,
                            'info'
                          );
                        }
                      }
                      if (logActionToTier2Ref.current) {
                        logActionToTier2Ref.current(activeTrack, scoreToLog, 'end');
                      }
                    }
                  }
                  handleNextSongRef.current(null);
                }
              }
            },
            onError: (e: any) => {
              const errorCode = e?.data;
              console.warn('[YouTube Player] Playback error code:', errorCode);
              consecutiveErrorsRef.current += 1;

              // Proactively buffer unavailable track to JSONL tier
              const activeTrack = currentTrackRef.current || playlistRef.current[currentIndexRef.current];
              if (activeTrack && activeTrack.id) {
                const trackId = String(activeTrack.id).trim();
                if (!bufferedUnavailableIdsRef.current.has(trackId)) {
                  bufferedUnavailableIdsRef.current.add(trackId);
                  earnDiscs(2); // Unavailable video reward
                  bufferUnavailableVideo(targetProjectId, activeTrack, errorCode).then((buffered) => {
                    if (buffered && isMountedRef.current) {
                      const reason = getUnavailableReason(errorCode);
                      if (showToastRef.current) {
                        showToastRef.current(`⚠️ Buffered unavailable track: "${activeTrack.title}" (${reason})`, 'warn');
                      }
                    }
                  });
                }
              }

              if (consecutiveErrorsRef.current <= 5) {
                setTimeout(() => {
                  if (isMountedRef.current) {
                    handleNextSongRef.current(null);
                  }
                }, 1200);
              }
            },
          },
        };

        if (initialVideoId && initialVideoId.length > 0) {
          playerConfig.videoId = initialVideoId;
        }

        playerRef.current = new window.YT.Player('vinyl-yt-player', playerConfig);
      } catch (err) {
        console.error('[YouTube Player] Failed to construct YT.Player:', err);
      }
    };

    mountPlayerRef.current = mountPlayer;

    if (!window.YT || !window.YT.Player) {
      if (!document.getElementById('yt-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevReady) prevReady();
        mountPlayer();
      };
    }

    // Keep polling until container exists and player is mounted
    pollInterval = setInterval(() => {
      if (isDestroyed) {
        clearInterval(pollInterval);
        return;
      }
      const container = document.getElementById('vinyl-yt-player');
      if (window.YT && window.YT.Player && container) {
        if (!playerRef.current) {
          mountPlayer();
        } else {
          const iframe = playerRef.current.getIframe?.();
          if (iframe && document.body.contains(iframe)) {
            clearInterval(pollInterval);
            pollInterval = null;
          } else {
            mountPlayer();
          }
        }
      }
    }, 250);

    mountPlayer();

    return () => {
      isDestroyed = true;
      if (pollInterval) clearInterval(pollInterval);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (_) {}
        playerRef.current = null;
        isPlayerReadyRef.current = false;
        currentlyLoadedVideoIdRef.current = null;
      }
    };
  }, []);

  const handleToggleDeferredBlock = () => {
    const currentRank =
      displayStats[currentTrack?.id || '']?.hazard_rank ??
      currentTrack?.hazard_rank ??
      null;
    const isRankedImmune = currentRank !== null;

    if (selectedScore === 'block') {
      setSelectedScore('');
      selectedScoreRef.current = '';
      showToast('Cancelled queued block', 'info');
    } else {
      setSelectedScore('block');
      selectedScoreRef.current = 'block';
      if (isRankedImmune) {
        showToast('⏳ Block on track end queued (Protected ranked track — block will not take effect on end)', 'info');
      } else {
        showToast('⏳ Track marked to Block when finished playing', 'warn');
      }
    }
  };

  // Approved channels are now directly selectable and playable without forced fallback
  const isAnyFilterActive =
    selectedChannel !== 'ALL' || excludedChannels.length > 0 || hazardCap !== 'ALL' || isDiscoveryMode;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Toast Overlay */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-2xl bg-[#171320] border border-[#d4af37] text-xs font-semibold shadow-2xl flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 text-[#ffd86b]">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
          {toast.type === 'warn' && <AlertCircle className="w-4 h-4 text-amber-400" />}
          {toast.type === 'info' && <Sparkles className="w-4 h-4 text-[#ffd86b]" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Symmetrical Session Progress & Telemetry Header with Include, Multi-Select Exclude & Hazard Cap Selectors */}
      <div className="p-5 rounded-2xl bg-[#120f18] border border-[#2b2238] shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#8c7a9e] font-cinzel font-bold">
            <TrendingUp className="w-4 h-4 text-[#ffd86b]" />
            <span>HARMONIC TELEMETRY</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Include Playlist Selector */}
            {/* Include Playlist Selector with Foldable Sections & Backend Persistence */}
            <div className="relative" ref={includeDropdownRef}>
              <button
                type="button"
                onClick={() => setIsIncludeDropdownOpen((prev) => !prev)}
                disabled={isInitializing}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1424] border border-[#3d304f] transition hover:border-[#5a4773] text-xs font-mono font-bold cursor-pointer select-none max-w-[240px] disabled:opacity-50"
                title="Filter to include songs from this playlist, channel, or discovery mode"
              >
                <ListMusic className="w-3.5 h-3.5 text-[#ffd86b] flex-shrink-0" />
                <span className="text-[11px] font-mono text-[#8c7a9e] hidden md:inline">Include:</span>
                <span className="text-[#ffd86b] truncate">
                  {getSelectedIncludeLabel()}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-[#8c7a9e] flex-shrink-0 transition-transform duration-200 ${
                    isIncludeDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Include Popover Dropdown */}
              {isIncludeDropdownOpen && (
                <div className="absolute left-0 mt-2 w-84 max-w-[90vw] bg-[#140f1c] border border-[#d4af37]/70 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
                  {/* Popover Header */}
                  <div className="p-3 border-b border-[#2b2238] bg-[#1a1424] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-cinzel font-bold text-[#ffd86b]">
                      <ListMusic className="w-3.5 h-3.5 text-[#ffd86b]" />
                      <span>Include Stream Source</span>
                    </div>
                    {(isDiscoveryMode || selectedChannel === 'DISCOVERY:unassigned' || hazardCap !== 'ALL' || excludedChannels.length > 0) && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 flex items-center gap-1 shadow-sm" title="Playlists with 0 songs matching your active filters are hidden from this list">
                        <span>⚡</span>
                        <span>Empty Hidden</span>
                      </span>
                    )}
                  </div>

                  {/* Search Bar */}
                  <div className="p-2 border-b border-[#2b2238] bg-[#100b17]">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#1b1526] border border-[#3d304f] text-xs">
                      <Search className="w-3.5 h-3.5 text-[#8c7a9e]" />
                      <input
                        type="text"
                        value={includeSearchQuery}
                        onChange={(e) => setIncludeSearchQuery(e.target.value)}
                        placeholder="Search playlists or channels..."
                        className="w-full bg-transparent text-white placeholder-[#685c78] focus:outline-none font-mono text-xs"
                      />
                      {includeSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setIncludeSearchQuery('')}
                          className="text-[#8c7a9e] hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Select: All Catalog & Discovery Mode */}
                  <div className="p-2 border-b border-[#2b2238] space-y-1 bg-[#120d18]">
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectChannel('ALL');
                        setIsIncludeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-mono font-bold transition cursor-pointer ${
                        selectedChannel === 'ALL'
                          ? 'bg-[#2b203c] border border-[#ffd86b] text-[#ffd86b] shadow-sm'
                          : 'bg-[#171320] hover:bg-[#20192b] border border-transparent text-[#cbd5e1]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>🌐</span>
                        <span>All Playlists (Catalog)</span>
                      </div>
                      {selectedChannel === 'ALL' && <Check className="w-3.5 h-3.5 text-[#ffd86b]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleSelectChannel('DISCOVERY:unassigned');
                        setIsIncludeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-mono font-bold transition cursor-pointer ${
                        selectedChannel === 'DISCOVERY:unassigned'
                          ? 'bg-amber-950/70 border border-amber-400 text-amber-200 shadow-sm'
                          : 'bg-[#1a1420] hover:bg-[#261d30] border border-transparent text-amber-300/90'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>✨</span>
                        <span>Discovery: Unassigned to Album</span>
                      </div>
                      {selectedChannel === 'DISCOVERY:unassigned' && <Check className="w-3.5 h-3.5 text-amber-300" />}
                    </button>
                  </div>

                  {/* Foldable Sections Container */}
                  <div className="max-h-72 overflow-y-auto p-2 space-y-2.5 scrollbar-thin">
                    {/* Section 1: Custom Playlists */}
                    <div className="rounded-xl border border-[#2b2238] bg-[#120e1a] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleToggleFoldSection('custom')}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-[#181322] hover:bg-[#221b30] transition cursor-pointer select-none border-b border-[#2b2238]/60 min-h-[44px]"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold font-cinzel text-[#ffd86b]">
                          <span>⭐ Custom Playlists</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#2b203c] text-[#d6c4eb]">
                            {filteredIncludeCustomPlaylists.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8c7a9e]">
                          <span className="text-[10px]">{foldedSections.custom ? 'Expand' : 'Fold'}</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-[#ffd86b] transition-transform duration-200 ${
                              foldedSections.custom ? '-rotate-90' : 'rotate-0'
                            }`}
                          />
                        </div>
                      </button>

                      {!foldedSections.custom && (
                        <div className="p-1.5 space-y-1 bg-[#100c17]">
                          <button
                            type="button"
                            onClick={() => {
                              setIsPlaylistModalOpen(true);
                              setIsIncludeDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs text-[#ffd86b] hover:bg-[#201830] transition border border-dashed border-[#ffd86b]/40 font-mono"
                          >
                            <Settings className="w-3.5 h-3.5 text-[#ffd86b]" />
                            <span>Manage Custom Playlists...</span>
                          </button>

                          {filteredIncludeCustomPlaylists.length === 0 ? (
                            <div className="py-2 text-center text-[11px] text-[#8c7a9e] font-mono">
                              No custom playlists found
                            </div>
                          ) : (
                            filteredIncludeCustomPlaylists.map((pl) => {
                              const isSelected = selectedChannel === `CUSTOM:${pl.id}`;
                              return (
                                <button
                                  key={pl.id}
                                  type="button"
                                  onClick={() => {
                                    handleSelectChannel(`CUSTOM:${pl.id}`);
                                    setIsIncludeDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs font-mono transition cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#2b203c] border border-[#ffd86b] text-[#ffd86b]'
                                      : 'hover:bg-[#1a1424] text-[#cbd5e1]'
                                  }`}
                                >
                                  <span className="truncate">
                                    {pl.emoji || '🎵'} {pl.name} ({pl.type})
                                  </span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-[#ffd86b] flex-shrink-0" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* Section 1.5: Approved Channels */}
                    {approvedChannels.length > 0 && (
                      <div className="rounded-xl border border-emerald-900/40 bg-[#0d1612] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleToggleFoldSection('approved')}
                          className="w-full flex items-center justify-between px-3 py-2.5 bg-[#14231b] hover:bg-[#1a2e24] transition cursor-pointer select-none border-b border-emerald-900/30 min-h-[44px]"
                        >
                          <div className="flex items-center gap-2 text-xs font-bold font-cinzel text-emerald-400">
                            <span>🟢 Approved Channels</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300">
                              {filteredIncludeApprovedChannels.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8c7a9e]">
                            <span className="text-[10px]">{foldedSections.approved ? 'Expand' : 'Fold'}</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-emerald-400 transition-transform duration-200 ${
                                foldedSections.approved ? '-rotate-90' : 'rotate-0'
                              }`}
                            />
                          </div>
                        </button>

                        {!foldedSections.approved && (
                          <div className="p-1.5 space-y-1 bg-[#0b130f]">
                            {filteredIncludeApprovedChannels.length === 0 ? (
                              <div className="py-2 text-center text-[11px] text-[#8c7a9e] font-mono">
                                No approved channels found
                              </div>
                            ) : (
                              filteredIncludeApprovedChannels.map((ch) => {
                                const isSelected = selectedChannel === ch.name;
                                return (
                                  <button
                                    key={ch.name}
                                    type="button"
                                    onClick={() => {
                                      handleSelectChannel(ch.name);
                                      setIsIncludeDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs font-mono transition cursor-pointer ${
                                      isSelected
                                        ? 'bg-emerald-950/80 border border-emerald-400 text-emerald-200 font-bold'
                                        : 'hover:bg-[#13221a] text-emerald-300'
                                    }`}
                                  >
                                    <span className="truncate">{ch.name}</span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <span className="text-[10px] text-emerald-400/80">
                                        {ch.count} songs
                                      </span>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-300" />}
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Section 2: Cleaning Playlists */}
                    <div className="rounded-xl border border-amber-900/40 bg-[#141018] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleToggleFoldSection('cleaning')}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-[#1c1622] hover:bg-[#251d2e] transition cursor-pointer select-none border-b border-amber-900/30 min-h-[44px]"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold font-cinzel text-amber-400">
                          <span>🟡 Cleaning Playlists</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-950 text-amber-300">
                            {filteredIncludeCleaningChannels.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8c7a9e]">
                          <span className="text-[10px]">{foldedSections.cleaning ? 'Expand' : 'Fold'}</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-amber-400 transition-transform duration-200 ${
                              foldedSections.cleaning ? '-rotate-90' : 'rotate-0'
                            }`}
                          />
                        </div>
                      </button>

                      {!foldedSections.cleaning && (
                        <div className="p-1.5 space-y-1 bg-[#100c14]">
                          {cleaningChannels.length > 1 && !includeSearchQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectChannel('STATUS:cleaning');
                                setIsIncludeDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs font-mono font-bold transition cursor-pointer ${
                                selectedChannel === 'STATUS:cleaning'
                                  ? 'bg-amber-950/80 border border-amber-400 text-amber-200'
                                  : 'bg-[#1e1710] hover:bg-[#281f15] text-amber-300'
                              }`}
                            >
                              <span className="truncate">
                                ▶ Stream All Cleaning ({cleaningChannels.reduce((sum, c) => sum + c.count, 0).toLocaleString()} songs)
                              </span>
                              {selectedChannel === 'STATUS:cleaning' && <Check className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />}
                            </button>
                          )}

                          {filteredIncludeCleaningChannels.length === 0 ? (
                            <div className="py-2 text-center text-[11px] text-[#8c7a9e] font-mono">
                              No cleaning playlists found
                            </div>
                          ) : (
                            filteredIncludeCleaningChannels.map((ch) => {
                              const isSelected = selectedChannel === ch.name;
                              return (
                                <button
                                  key={ch.name}
                                  type="button"
                                  onClick={() => {
                                    handleSelectChannel(ch.name);
                                    setIsIncludeDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs font-mono transition cursor-pointer ${
                                    isSelected
                                      ? 'bg-amber-950/60 border border-amber-400 text-amber-200'
                                      : 'hover:bg-[#1a1420] text-amber-100'
                                  }`}
                                >
                                  <span className="truncate">
                                    {ch.name} ({ch.count.toLocaleString()} songs{ch.avg_hazard ? ` • ${ch.avg_hazard}` : ''})
                                  </span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* Section 3: Raw Playlists */}
                    <div className="rounded-xl border border-rose-900/40 bg-[#161016] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleToggleFoldSection('raw')}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-[#20141a] hover:bg-[#2b1b23] transition cursor-pointer select-none border-b border-rose-900/30 min-h-[44px]"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold font-cinzel text-rose-400">
                          <span>🔴 Raw Playlists</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-rose-950 text-rose-300">
                            {filteredIncludeRawChannels.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8c7a9e]">
                          <span className="text-[10px]">{foldedSections.raw ? 'Expand' : 'Fold'}</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-rose-400 transition-transform duration-200 ${
                              foldedSections.raw ? '-rotate-90' : 'rotate-0'
                            }`}
                          />
                        </div>
                      </button>

                      {!foldedSections.raw && (
                        <div className="p-1.5 space-y-1 bg-[#120b12]">
                          {rawChannels.length > 1 && !includeSearchQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectChannel('STATUS:raw');
                                setIsIncludeDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs font-mono font-bold transition cursor-pointer ${
                                selectedChannel === 'STATUS:raw'
                                  ? 'bg-rose-950/80 border border-rose-400 text-rose-200'
                                  : 'bg-[#221016] hover:bg-[#2e151e] text-rose-300'
                              }`}
                            >
                              <span className="truncate">
                                ▶ Stream All Raw ({rawChannels.reduce((sum, c) => sum + c.count, 0).toLocaleString()} songs)
                              </span>
                              {selectedChannel === 'STATUS:raw' && <Check className="w-3.5 h-3.5 text-rose-300 flex-shrink-0" />}
                            </button>
                          )}

                          {filteredIncludeRawChannels.length === 0 ? (
                            <div className="py-2 text-center text-[11px] text-[#8c7a9e] font-mono">
                              No raw playlists found
                            </div>
                          ) : (
                            filteredIncludeRawChannels.map((ch) => {
                              const isSelected = selectedChannel === ch.name;
                              return (
                                <button
                                  key={ch.name}
                                  type="button"
                                  onClick={() => {
                                    handleSelectChannel(ch.name);
                                    setIsIncludeDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs font-mono transition cursor-pointer ${
                                    isSelected
                                      ? 'bg-rose-950/60 border border-rose-400 text-rose-200'
                                      : 'hover:bg-[#1a0f16] text-rose-100'
                                  }`}
                                >
                                  <span className="truncate">
                                    {ch.name} ({ch.count.toLocaleString()} songs{ch.avg_hazard ? ` • ${ch.avg_hazard}` : ''})
                                  </span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-rose-300 flex-shrink-0" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Hazard Drag Badge — uses the actual filtered pool (totalCatalogCount)
                so the number always matches what the player sees in the pool count. */}
            {(() => {
              const drag = calcHazardDrag(totalCatalogCount, poolAvgHazard);
              if (!drag || isLoading || totalCatalogCount === 0) return null;
              return (
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-950/50 border border-amber-700/50 text-amber-300 text-[10px] font-mono select-none"
                  title={`Remove ${drag.replace(' • ', '').replace(' for +0.01', '')} Hazard-3.0 songs from this pool to gain +0.01 avg score`}
                >
                  <span>{drag.trimStart()}</span>
                </div>
              );
            })()}

            {/* Multi-Select Exclude Popover Trigger & Dropdown */}
            <div className="relative" ref={excludeDropdownRef}>
              <button
                type="button"
                onClick={() => setIsExcludeDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition text-xs font-mono font-bold cursor-pointer select-none ${
                  excludedChannels.length > 0
                    ? 'bg-rose-950/60 border-rose-500/80 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                    : 'bg-[#1a1424] border-[#3d304f] text-[#cbd5e1] hover:border-[#5a4773]'
                }`}
                title="Exclude entire playlists or channels from the active stream"
              >
                <Ban className={`w-3.5 h-3.5 ${excludedChannels.length > 0 ? 'text-rose-400' : 'text-[#8c7a9e]'}`} />
                <span className="text-[11px] font-mono text-[#8c7a9e] hidden md:inline">Exclude:</span>
                <span className={excludedChannels.length > 0 ? 'text-rose-300 font-bold' : 'text-[#a79bb7]'}>
                  {excludedChannels.length === 0
                    ? 'None'
                    : `${excludedChannels.length} Excluded`}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-[#8c7a9e] transition-transform duration-200 ${
                    isExcludeDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Popover */}
              {isExcludeDropdownOpen && (
                <div className="absolute left-0 mt-2 w-80 max-w-[90vw] bg-[#140f1c] border border-[#d4af37]/70 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
                  {/* Header */}
                  <div className="p-3 border-b border-[#2b2238] bg-[#1a1424] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-cinzel font-bold text-[#ffd86b]">
                      <Ban className="w-3.5 h-3.5 text-rose-400" />
                      <span>Exclude Stream Source</span>
                    </div>
                    {excludedChannels.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllExclusions}
                        className="text-[10px] font-mono text-rose-300 hover:text-white bg-rose-950/80 px-2 py-0.5 rounded border border-rose-700/60 transition cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Tabs: Playlists vs Channels */}
                  <div className="flex border-b border-[#2b2238] bg-[#120d18] text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setExcludeTab('playlists')}
                      className={`flex-1 py-1.5 text-center font-bold transition border-b-2 cursor-pointer ${
                        excludeTab === 'playlists'
                          ? 'border-[#ffd86b] text-[#ffd86b] bg-[#1a1324]'
                          : 'border-transparent text-[#8c7a9e] hover:text-white'
                      }`}
                    >
                      ⭐ Playlists ({customPlaylists.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setExcludeTab('channels')}
                      className={`flex-1 py-1.5 text-center font-bold transition border-b-2 cursor-pointer ${
                        excludeTab === 'channels'
                          ? 'border-[#ffd86b] text-[#ffd86b] bg-[#1a1324]'
                          : 'border-transparent text-[#8c7a9e] hover:text-white'
                      }`}
                    >
                      📻 Channels ({channelList.length})
                    </button>
                  </div>

                  {excludeTab === 'playlists' ? (
                    <div className="max-h-60 overflow-y-auto p-1.5 space-y-1 scrollbar-thin">
                      {customPlaylists.length === 0 ? (
                        <div className="py-6 text-center text-xs text-[#8c7a9e] font-mono">
                          No custom playlists created yet
                        </div>
                      ) : (
                        customPlaylists.map((pl) => {
                          const memberChannels = resolvePlaylistSources(customPlaylists, pl.id).channels;
                          const allExcluded =
                            memberChannels.length > 0 &&
                            memberChannels.every((c) => excludedChannels.includes(c));
                          return (
                            <button
                              key={pl.id}
                              type="button"
                              onClick={() => handleToggleExcludePlaylist(pl)}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition cursor-pointer ${
                                allExcluded
                                  ? 'bg-rose-950/70 border border-rose-600/70 text-rose-100 shadow-sm'
                                  : 'bg-[#171320]/60 hover:bg-[#20192b] border border-transparent text-[#cbd5e1]'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                {allExcluded ? (
                                  <CheckSquare className="w-4 h-4 text-rose-400 flex-shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-[#685c78] flex-shrink-0" />
                                )}
                                <span className="truncate font-medium">
                                  {pl.emoji || '🎵'} {pl.name}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-[#8c7a9e] flex-shrink-0 bg-black/40 px-1.5 py-0.5 rounded">
                                {memberChannels.length} ch
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Search inside dropdown */}
                      <div className="p-2 border-b border-[#231b2e] bg-[#100c17]">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8c7a9e]" />
                          <input
                            type="text"
                            placeholder="Search channels to exclude..."
                            value={excludeSearchQuery}
                            onChange={(e) => setExcludeSearchQuery(e.target.value)}
                            className="w-full bg-[#171320] border border-[#2b2238] focus:border-[#d4af37] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#685c78] focus:outline-none"
                          />
                          {excludeSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setExcludeSearchQuery('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8c7a9e] hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Scrollable list of channels with checkboxes */}
                      <div className="max-h-60 overflow-y-auto p-1.5 space-y-1 scrollbar-thin">
                        {filteredExcludeChannels.length === 0 ? (
                          <div className="py-6 text-center text-xs text-[#8c7a9e] font-mono">
                            No matching channels found
                          </div>
                        ) : (
                          filteredExcludeChannels.map((ch) => {
                            const isExcluded = excludedChannels.includes(ch.name);
                            return (
                              <button
                                key={ch.name}
                                type="button"
                                onClick={() => handleToggleExcludeChannel(ch.name)}
                                className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition cursor-pointer ${
                                  isExcluded
                                    ? 'bg-rose-950/70 border border-rose-600/70 text-rose-100 shadow-sm'
                                    : 'bg-[#171320]/60 hover:bg-[#20192b] border border-transparent text-[#cbd5e1]'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  {isExcluded ? (
                                    <CheckSquare className="w-4 h-4 text-rose-400 flex-shrink-0" />
                                  ) : (
                                    <Square className="w-4 h-4 text-[#685c78] flex-shrink-0" />
                                  )}
                                  <span className="truncate font-medium">{ch.name}</span>
                                </div>
                                <span className="text-[10px] font-mono text-[#8c7a9e] flex-shrink-0 bg-black/40 px-1.5 py-0.5 rounded">
                                  {ch.count.toLocaleString()}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}

                  {/* Footer */}
                  <div className="p-2 border-t border-[#2b2238] bg-[#1a1424] flex items-center justify-between text-[11px] font-mono text-[#8c7a9e]">
                    <span>{excludedChannels.length} excluded</span>
                    <button
                      type="button"
                      onClick={() => setIsExcludeDropdownOpen(false)}
                      className="px-3 py-1 rounded-lg bg-[#d4af37] text-black font-bold text-xs hover:brightness-110 transition cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hazard Cap Selector (File 4 metadata) */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1424] border border-[#3d304f] transition hover:border-[#5a4773]">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-mono text-[#8c7a9e] hidden md:inline">Hazard Cap:</span>
              <select
                value={hazardCap === '3.2' ? 'under 3.2' : hazardCap}
                onChange={(e) => handleSelectHazardCap(e.target.value)}
                className="bg-transparent text-amber-300 text-xs font-mono font-bold focus:outline-none cursor-pointer"
                title="Filter tracks by hazard range"
              >
                <option value="ALL" className="bg-[#120f18] text-white">
                  All (No Cap)
                </option>
                <option value="7+" className="bg-[#120f18] text-purple-300">
                  7+ (Crown / Transcendent)
                </option>
                <option value="6+" className="bg-[#120f18] text-amber-300">
                  6+ (Awakened &amp; Above)
                </option>
                <option value="3.2 to under 6" className="bg-[#120f18] text-blue-300">
                  3.2 to under 6 (Cultivated)
                </option>
                <option value="under 4.0" className="bg-[#120f18] text-teal-300">
                  Under 4.0 (Calm Zone)
                </option>
                <option value="under 3.2" className="bg-[#120f18] text-emerald-300">
                  Under 3.2 (Calm / Unrated)
                </option>
              </select>
            </div>

            {/* Discovery Mode (Unassigned to Any Album) Toggle Button */}
            <button
              type="button"
              onClick={handleToggleDiscoveryMode}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition text-xs font-mono font-bold cursor-pointer select-none ${
                isDiscoveryMode || selectedChannel === 'DISCOVERY:unassigned'
                  ? 'bg-amber-950/70 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-[#1a1424] border-[#3d304f] text-[#cbd5e1] hover:border-[#ffd86b]/60'
              }`}
              title="Discovery Mode: Stream only songs that do NOT yet belong to any Album"
            >
              <Sparkles
                className={`w-3.5 h-3.5 ${
                  isDiscoveryMode || selectedChannel === 'DISCOVERY:unassigned' ? 'text-amber-400' : 'text-[#8c7a9e]'
                }`}
              />
              <span className="text-[11px] font-mono text-[#8c7a9e] hidden md:inline">Mode:</span>
              <span>Discovery</span>
              {(isDiscoveryMode || selectedChannel === 'DISCOVERY:unassigned') && (
                <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] border border-amber-500/40 font-bold">
                  ON
                </span>
              )}
            </button>

            {/* Auto-Switch When Empty Quick Toggle */}
            <button
              type="button"
              onClick={() => updateSettings({ autoSwitchOnEmpty: !settings.autoSwitchOnEmpty })}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition text-xs font-mono font-bold cursor-pointer select-none ${
                settings.autoSwitchOnEmpty
                  ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                  : 'bg-[#1a1424] border-[#3d304f] text-[#cbd5e1] hover:border-[#ffd86b]/60'
              }`}
              title="Auto-Switch: when no song matches the active filters, jump to the bottom-most playable playlist in the Include dropdown"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${settings.autoSwitchOnEmpty ? 'text-emerald-400' : 'text-[#8c7a9e]'}`} />
              <span>Auto-Next</span>
              {settings.autoSwitchOnEmpty && (
                <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] border border-emerald-500/40 font-bold">
                  ON
                </span>
              )}
            </button>

            {/* Reset Filters Quick Button (visible when filters are active) */}
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-lg bg-[#201729] hover:bg-[#2e203c] border border-[#4d3a63] text-[#c4b5d4] hover:text-white transition cursor-pointer"
                title="Reset all filters to default"
              >
                <RotateCcw className="w-3 h-3 text-[#ffd86b]" /> Reset
              </button>
            )}

            {/* Primary Filtered Pool Badge */}
            <span
              className="flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#1a1424] border border-[#d4af37]/60 text-[#ffd86b] shadow-gold-sm"
              title="Total songs remaining in pool matching all active filters"
            >
              <Database className="w-3.5 h-3.5 text-[#ffd86b]" />{' '}
              {totalCatalogCount > 0 ? `${totalCatalogCount.toLocaleString()} in Pool` : (isLoading ? 'Calculating...' : '0 in Pool')}
            </span>

            <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#1a1424] border border-[#3d304f] text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> {sessionRatedCount} Rated
            </span>

            <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#1a1424] border border-[#3d304f] text-[#ffd86b]">
              <Disc3 className="w-3.5 h-3.5 text-[#ffd86b]" /> {discs} Discs
            </span>

            {/* Offline Outbox Queue Counter */}
            {(offlineOutbox?.length || 0) > 0 && (
              <button
                type="button"
                onClick={flushQueuedEvents}
                disabled={isFlushingOutbox || isOffline}
                className="flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900/90 border border-amber-500/80 text-amber-300 transition cursor-pointer shadow-md active:scale-95"
                title="Offline Outbox has pending rating events. Click to force flush to backend _2_events.jsonl"
              >
                <Clock className={`w-3.5 h-3.5 text-amber-400 ${isFlushingOutbox ? 'animate-spin' : ''}`} />
                <span>{offlineOutbox.length} in Outbox</span>
                {!isOffline && <span className="text-[10px] text-emerald-400 font-semibold underline ml-0.5">(Flush)</span>}
              </button>
            )}

            {(onNavigateToIngestion || navigateTo) && (
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToIngestion) onNavigateToIngestion();
                  else if (navigateTo) navigateTo('ingestion');
                }}
                className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#291e07] to-[#1a1424] hover:brightness-125 border border-[#524124] text-[#ffd86b] transition cursor-pointer"
              >
                <DownloadCloud className="w-3 h-3" /> Ingest More
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Telemetry Breakdown & Multi-Select Removable Tags */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#8c7a9e]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>Active Pool:</span>
            <span className="text-white font-bold bg-[#1c1626] px-2 py-0.5 rounded border border-[#342745]">
              {(() => {
                if (selectedChannel === 'ALL') return 'All Playlists (Catalog)';
                if (selectedChannel === 'STATUS:approved') return `🟢 All Approved Playlists (${approvedChannels.length} channels)`;
                if (selectedChannel === 'STATUS:cleaning') return `🟡 All Cleaning Playlists (${cleaningChannels.length} channels)`;
                if (selectedChannel === 'STATUS:raw') return `🔴 All Raw Playlists (${rawChannels.length} channels)`;
                if (selectedChannel.startsWith('CUSTOM:')) {
                  const plId = selectedChannel.replace('CUSTOM:', '');
                  const pl = customPlaylists.find((p) => p.id === plId);
                  return pl ? `${pl.emoji || '🎵'} ${pl.name} (${pl.type})` : 'Custom Playlist';
                }
                return selectedChannel;
              })()}
            </span>

            {hazardCap !== 'ALL' && (
              <span className="text-amber-300 font-semibold bg-amber-950/50 px-2 py-0.5 rounded border border-amber-700/50">
                {getHazardCapDisplay(hazardCap)}
              </span>
            )}

            {excludedChannels.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-rose-400 font-semibold text-[10px]">Excluded ({excludedChannels.length}):</span>
                {excludedChannels.map((ex) => (
                  <span
                    key={`badge-${ex}`}
                    className="inline-flex items-center gap-1 bg-rose-950/70 text-rose-200 border border-rose-700/60 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold"
                  >
                    <span className="max-w-[130px] truncate">{ex}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleExcludeChannel(ex)}
                      title={`Remove exclusion for ${ex}`}
                      className="hover:text-white p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <span className="text-[#8c7a9e]">•</span>
            <span className="text-[#ffd86b] font-bold">
              {totalCatalogCount.toLocaleString()} songs remaining in pool
            </span>
            <span className="text-[#6d5e80]">
              ({playlist.length} in active buffer)
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span
              className="flex items-center gap-1 bg-[#191322] px-2 py-0.5 rounded-md border border-[#3b2b4d]"
              title={`${pendingLogsCount % 15}/15 logs until next automatic Tier 2 ➔ Tier 3 ➔ Tier 4 sync`}
            >
              <Zap className="w-3 h-3 text-[#ffd86b]" />
              <span>Auto-Sync:</span>
              <strong className="text-[#ffd86b] font-mono ml-0.5">
                {pendingLogsCount % 15}/15
              </strong>
            </span>
            <span className="text-[#4f4261]">•</span>
            <div>
              Session Ratings: <strong className="text-[#ffd86b]">{stats.sessionRatingsCount}</strong>
            </div>
          </div>
        </div>

        {/* Dynamic Visual Buffer Gauge */}
        <div className="w-full h-2 bg-[#1a1424] rounded-full overflow-hidden border border-[#2b2238]">
          <div
            className="h-full bg-gradient-to-r from-[#d4af37] via-[#ffd86b] to-[#f59e0b] rounded-full transition-all duration-500 shadow-gold-sm"
            style={{ width: `${Math.min(100, Math.max(5, (playlist.length / 50) * 100))}%` }}
          />
        </div>
      </div>

      {/* Backend Disconnected / Loud Offline Banner */}
      {isLoudFailure && (
        <div className="p-6 md:p-8 rounded-2xl bg-[#1c1218] border border-rose-800/60 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in duration-300">
          <div className="flex items-start gap-4 text-left">
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-700/50 text-rose-400 flex-shrink-0">
              <WifiOff className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-cinzel text-lg font-bold text-rose-200">
                  Backend Storage Engine Unreachable (5 Retries Failed)
                </h3>
                {(offlineOutbox?.length || 0) > 0 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-600/70">
                    Offline Outbox Active ({offlineOutbox.length} queued)
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-300/80 font-sans leading-relaxed max-w-xl">
                The backend server at <code className="font-mono bg-rose-950 px-1.5 py-0.5 rounded text-rose-200">http://localhost:8080</code> is offline. You can continue listening and rating; all events are safely preserved locally in the Outbox and will automatically flush to <code className="font-mono bg-rose-950 px-1.5 py-0.5 rounded text-rose-200">_2_events.jsonl</code> upon reconnection.
              </p>
              <p className="text-[11px] text-rose-400/70 font-mono">
                Launch command: <code className="bg-black/40 px-2 py-0.5 rounded text-amber-300">python backend/server.py</code>
              </p>
            </div>
          </div>
          <SharedButton
            variant="primary"
            size="md"
            disabled={isRetrying}
            onClick={handleRetryConnection}
            className="flex items-center gap-2 min-w-[170px] justify-center flex-shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Connecting...' : 'Retry Connection Now'}</span>
          </SharedButton>
        </div>
      )}

      {/* Empty Pool / Exhausted Feedback */}
      {isExhausted && !isInitializing && !isLoading && !isOffline && (
        <div className="p-8 md:p-12 rounded-2xl bg-[#120f18] border border-[#3d2b4f] shadow-2xl text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#1c1426] border border-[#ffd86b]/40 flex items-center justify-center text-3xl">
            {totalCatalogCount === 0 ? <FilterX className="w-8 h-8 text-amber-400" /> : <Sparkles className="w-8 h-8 text-[#ffd86b]" />}
          </div>
          <div className="space-y-2">
            <h3 className="font-cinzel text-lg font-bold text-[#ffd86b]">
              {totalCatalogCount === 0 ? 'No Songs Match Selected Filters' : 'Current Buffer Completed!'}
            </h3>
            <p className="text-xs text-[#a394b5] font-sans max-w-md mx-auto leading-relaxed">
              {totalCatalogCount === 0 ? (
                <>
                  0 songs remain in the pool under the current filter combination:
                  <br />
                  <span className="text-white font-mono font-semibold">
                    Include: {selectedChannel} • Excluded ({excludedChannels.length}): {excludedChannels.length > 0 ? excludedChannels.join(', ') : 'None'} • {getHazardCapDisplay(hazardCap)}
                  </span>
                  <br />
                  Adjust or reset your filters to expand the available song pool.
                </>
              ) : (
                `Buffer completed. Replenishing next batch from ${totalCatalogCount.toLocaleString()} songs remaining in pool...`
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {selectedChannel !== 'ALL' && (
              <SharedButton
                variant="primary"
                size="md"
                onClick={() => handleSelectChannel('ALL')}
                className="flex items-center gap-2"
              >
                <span>🌐 Stream All Playlists</span>
              </SharedButton>
            )}
            <SharedButton variant={selectedChannel !== 'ALL' ? 'secondary' : 'primary'} size="md" onClick={handleResetFilters} className="flex items-center gap-2">
              <RotateCcw className={`w-4 h-4 ${selectedChannel !== 'ALL' ? 'text-[#ffd86b]' : 'text-black'}`} />
              <span>Reset All Filters</span>
            </SharedButton>
            {(onNavigateToIngestion || navigateTo) && (
              <SharedButton
                variant="secondary"
                size="md"
                onClick={() => {
                  if (onNavigateToIngestion) onNavigateToIngestion();
                  else if (navigateTo) navigateTo('ingestion');
                }}
                className="flex items-center gap-2"
              >
                <DownloadCloud className="w-4 h-4 text-[#ffd86b]" />
                <span>Ingest More Songs</span>
              </SharedButton>
            )}
          </div>
        </div>
      )}

      {/* Main Workstation Grid */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        style={isExhausted && !isInitializing && !isLoading && !isOffline ? { display: 'none' } : undefined}
      >
        {/* Left Column: YouTube Video & Track Metadata */}
        <div
          className={`lg:col-span-7 xl:col-span-7 p-6 md:p-7 rounded-2xl bg-[#120f18] border shadow-2xl backdrop-blur-md space-y-5 transition-all duration-300 ${
            equippedStylus === 'golden-stylus'
              ? 'border-[#d4af37] shadow-[0_0_24px_rgba(212,175,55,0.2)]'
              : 'border-[#2b2238]'
          }`}
        >
          {/* Track Title & Header */}
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-[#1c1626] border border-[#3d304f] text-[#ffd86b] shadow-inner flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#ffd86b]" />
                {(isDiscoveryMode || selectedChannel === 'DISCOVERY:unassigned') && (
                  <span className="text-amber-400 font-bold">DISCOVERY • </span>
                )}
                TRACK {currentIndex + 1} / {playlist.length} (Buffer) • {totalCatalogCount.toLocaleString()} in Pool
              </span>
            </div>

            <h2 className="text-lg md:text-2xl font-bold text-[#f5f0e8] leading-tight flex items-center justify-center gap-2.5 max-w-2xl mx-auto">
              <Disc3 className="w-6 h-6 text-[#ffd86b] flex-shrink-0" />
              <span className="truncate">
                {isInitializing
                  ? 'Connecting to Storage Engine...'
                  : isLoading
                  ? 'Sampling Harmonic Stream...'
                  : currentTrack?.title || 'No Track Selected'}
              </span>
            </h2>

            {currentTrack && (
              <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs text-[#8c7a9e] pt-1">
                {/* Origin Channel */}
                <span className="text-[#ffd86b] font-semibold">{currentTrack.channel}</span>
                <span>•</span>
                <span>ID: {currentTrack.id}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-[#e2e8f0] font-semibold bg-[#1a1424] px-2 py-0.5 rounded border border-[#3d304f]">
                  <Repeat className="w-3 h-3 text-[#ffd86b]" />
                  Played: <strong className="text-[#ffd86b]">{getPlayedCount(currentTrack.id)}</strong>
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1.5 bg-[#1a1424] px-2 py-0.5 rounded border border-[#3d304f]">
                  <Gauge className="w-3 h-3 text-amber-400" />
                  <HazardBadge score={getHazardLevel(currentTrack.id)} size="sm" showDetails={false} />
                </span>
                {currentProbability !== null && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">
                      Pick Chance: {currentProbability.toFixed(3)}%
                    </span>
                  </>
                )}
                {!currentAlbum && (
                  <>
                    <span>•</span>
                    <span
                      className="inline-flex items-center gap-1 bg-amber-950/70 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-xs"
                      title="This track does not yet belong to any Album"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>DISCOVERY (NO ALBUM)</span>
                    </span>
                  </>
                )}
              </div>
            )}

            {selectedScore === 'block' && (
              <div className="px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/70 text-rose-300 text-xs font-mono font-bold animate-pulse flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                <span>Marked to Blacklist on Track End</span>
              </div>
            )}

            {errorMessage && <p className="text-xs text-rose-400 font-mono">⚠️ {errorMessage}</p>}
          </div>

          {/* YouTube Video Viewport 16:9 */}
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-[#2b2238] shadow-2xl">
            <div id="vinyl-yt-player" className="w-full h-full" />
            {(isInitializing || isLoading || !currentTrack) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-[#0a080f]/90 text-[#8c7a9e] z-10 pointer-events-none backdrop-blur-xs px-4 text-center">
                <Disc3 className="w-12 h-12 text-[#ffd86b] animate-spin" style={{ animationDuration: '3s' }} />
                <p className="text-xs font-mono text-[#ffd86b] font-bold">
                  {isInitializing
                    ? 'Connecting to Storage Engine...'
                    : isLoading
                    ? `Sampling Stream: ${
                        isDiscoveryMode || selectedChannel === 'DISCOVERY:unassigned'
                          ? `Discovery Mode (Unassigned to Albums${selectedChannel !== 'ALL' && selectedChannel !== 'DISCOVERY:unassigned' ? ` • ${selectedChannel}` : ''})`
                          : selectedChannel === 'ALL'
                          ? 'All Playlists'
                          : selectedChannel
                      }...`
                    : isExhausted
                    ? 'No songs match the current filters'
                    : isOffline
                    ? 'Storage Engine unreachable'
                    : 'Awaiting active track...'}
                </p>
                <LoadingDiagnostics
                  active={isInitializing || isLoading || (!currentTrack && !isExhausted && !isOffline)}
                  phase={
                    isInitializing
                      ? 'Restoring saved filters, playlists and blocked list...'
                      : isLoading
                      ? loadPhase
                      : isExhausted
                      ? 'Try another playlist, relax the hazard cap, or enable Auto-Next.'
                      : isOffline
                      ? 'Use the retry controls to reconnect.'
                      : 'Waiting for the next track to be selected...'
                  }
                />
              </div>
            )}
          </div>
        </div>

          {/* Right Column: Interactive Rating & Control Deck */}
          <div className="lg:col-span-5 xl:col-span-5 p-6 md:p-7 rounded-2xl bg-[#120f18] border border-[#2b2238] shadow-2xl backdrop-blur-md space-y-5">
            <div className="flex items-center justify-between border-b border-[#261d33] pb-3">
              <span className="font-cinzel text-sm font-bold text-[#ffd86b] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ffd86b]" /> Harmonic Rating Deck
              </span>
              <div className="flex items-center gap-2.5">
                {/* Pinned Rating Latch Button */}
                <button
                  type="button"
                  onClick={handleTogglePinRating}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
                    isRatingPinned
                      ? 'bg-amber-950/90 text-[#ffd86b] border-[#ffd86b] shadow-gold-sm'
                      : 'bg-[#171320] text-[#8c7a9e] hover:text-white border-[#2b2238] hover:border-[#3d2b4f]'
                  }`}
                  title={
                    isRatingPinned
                      ? 'Pinned: Rating and Hazard Rank remain locked across songs (Click to unlock)'
                      : 'Pin: Lock current Rating and Hazard Rank across all songs this session'
                  }
                >
                  <Pin className={`w-3.5 h-3.5 ${isRatingPinned ? 'text-[#ffd86b] fill-[#ffd86b]' : 'text-[#8c7a9e]'}`} />
                  <span>{isRatingPinned ? 'Pinned' : 'Pin'}</span>
                </button>

                <span className="text-[11px] font-mono text-[#8c7a9e]">
                  Selected:{' '}
                  <strong className={selectedScore === 'block' ? 'text-rose-400 font-bold' : 'text-white'}>
                    {selectedScore ? selectedScore.toUpperCase() : 'None'}
                  </strong>
                  {isRatingPinned && <span className="ml-1 text-[9px] text-[#ffd86b] font-bold">[LOCKED]</span>}
                </span>
              </div>
            </div>

            {/* Rating Target Scope Selector: Single Track vs Entire Channel */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 rounded-xl bg-[#0e0c14] border border-[#2b2238] gap-2">
              <span className="text-[11px] font-mono text-[#8c7a9e] flex items-center gap-1">
                <span>Rating Target:</span>
              </span>
              <div className="flex items-center gap-1 bg-[#171320] p-0.5 rounded-lg border border-[#261d33] w-full sm:w-auto justify-between sm:justify-start">
                <button
                  type="button"
                  onClick={() => {
                    setRatingTarget('track');
                    updateSettings({ applyAlbumToEntireChannel: false });
                  }}
                  className={`flex-1 sm:flex-initial px-3 py-1 rounded-md font-mono text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    ratingTarget === 'track' && !settings.applyAlbumToEntireChannel
                      ? 'bg-[#d4af37] text-black shadow-gold-sm'
                      : 'text-[#8c7a9e] hover:text-white'
                  }`}
                >
                  <Disc3 className="w-3.5 h-3.5" />
                  <span>Single Song</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRatingTarget('channel');
                    updateSettings({ applyAlbumToEntireChannel: true });
                  }}
                  className={`flex-1 sm:flex-initial px-3 py-1 rounded-md font-mono text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    ratingTarget === 'channel' || settings.applyAlbumToEntireChannel
                      ? 'bg-gradient-to-r from-[#d4af37] via-[#ffd86b] to-[#f59e0b] text-black shadow-gold-sm font-black'
                      : 'text-[#8c7a9e] hover:text-[#ffd86b]'
                  }`}
                  title={currentTrack ? `Rate & Album curate all songs from "${currentTrack.channel}" at once` : 'Rate channel'}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span className="max-w-[130px] truncate">All in Channel</span>
                </button>
              </div>
            </div>

            {/* Channel Rating Mode Notice */}
            {ratingTarget === 'channel' && currentTrack && (
              <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-950/60 to-purple-950/40 border border-[#d4af37]/60 text-xs font-mono text-[#ffd86b] flex items-center gap-2 animate-in fade-in duration-200">
                <Crown className="w-4 h-4 text-[#ffd86b] flex-shrink-0" />
                <span className="truncate">
                  Channel Mode: Scoring will apply to <strong>ALL</strong> songs in &ldquo;{currentTrack.channel}&rdquo;
                </span>
              </div>
            )}

            {/* Top Quick Action Row (Cancel, Spin, Pass) */}
            <div className="grid grid-cols-3 gap-2.5 md:gap-3">
              {/* Cancel Button */}
              <SharedButton
                variant="danger"
                size="md"
                disabled={isLogging || isExhausted || !currentTrack}
                onClick={() => handleNextSong('3+')}
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2"
              >
                <span className="text-base">🥀</span>
                <span className="text-center">Cancel (3+)</span>
              </SharedButton>

              {/* Spin / Skip Button */}
              <SharedButton
                variant="secondary"
                size="md"
                disabled={isLogging || isExhausted || !currentTrack}
                onClick={() => handleNextSong(null)}
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2"
              >
                <RotateCcw className="w-4 h-4 text-[#ffd86b]" />
                <span className="text-center">Spin (Skip)</span>
              </SharedButton>

              {/* 2-Mode Pass / Log Button: Commit Rating & Staged Rank if selected, Skip to Next if none */}
              {selectedScore || (stagedHazardRank !== null && stagedHazardRank !== (displayStats[currentTrack?.id || '']?.hazard_rank ?? currentTrack?.hazard_rank ?? null)) ? (
                <SharedButton
                  variant={selectedScore === 'block' ? 'danger' : 'primary'}
                  size="md"
                  disabled={isLogging || isExhausted || !currentTrack}
                  onClick={() => handleLogCurrentTrack(selectedScore || 'rank')}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2"
                >
                  <Check className="w-4 h-4 text-black" />
                  <span className="text-center">
                    {ratingTarget === 'channel'
                      ? `Rate Channel ${selectedScore ? selectedScore.toUpperCase() : `Rank ${stagedHazardRank}`} (+5 💿)`
                      : `Log ${selectedScore ? selectedScore.toUpperCase() : `Rank ${stagedHazardRank}`} (+3 💿)`}
                  </span>
                </SharedButton>
              ) : (
                <SharedButton
                  variant="secondary"
                  size="md"
                  disabled={isLogging || isExhausted || !currentTrack}
                  onClick={() => handleNextSong(null)}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2"
                >
                  <FastForward className="w-4 h-4 text-[#ffd86b]" />
                  <span className="text-center">Pass (Next)</span>
                </SharedButton>
              )}
            </div>

            {/* Sovereign Hazard Rank Designation Module (3 to 7) */}
            {(() => {
              const activeSavedRank = displayStats[currentTrack?.id || '']?.hazard_rank ?? currentTrack?.hazard_rank ?? null;
              const currentActiveRank = stagedHazardRank !== null ? stagedHazardRank : activeSavedRank;
              const isStaged = stagedHazardRank !== null && stagedHazardRank !== activeSavedRank;

              const rankMeta: Record<number, { title: string; badge: string; color: string }> = {
                3: { title: 'Base', badge: 'Rank 3 (C)', color: 'text-stone-300' },
                4: { title: 'Solid', badge: 'Rank 4 (B)', color: 'text-blue-300' },
                5: { title: 'Prime', badge: 'Rank 5 (A)', color: 'text-emerald-300' },
                6: { title: 'Awaken', badge: 'Rank 6 (S₁)', color: 'text-amber-300' },
                7: { title: 'Crown', badge: 'Rank 7 (Ψ)', color: 'text-purple-300' },
              };

              return (
                <div className="p-3.5 rounded-2xl bg-[#0e0c14] border border-[#3b2b4d] space-y-2.5 text-left shadow-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#e2d4f0] font-cinzel font-bold flex items-center gap-2">
                      <Crown className="w-4 h-4 text-[#ffd86b]" />
                      <span>HAZARD RANK</span>
                      <span className="text-[10px] font-sans font-normal text-[#8c7a9e]">
                        {isRatingPinned ? '(PINNED LOCK)' : '(STAGING)'}
                      </span>
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-lg border transition-all ${
                        currentActiveRank !== null && currentActiveRank !== undefined
                          ? isRatingPinned
                            ? 'bg-amber-950 text-[#ffd86b] border-[#ffd86b] shadow-gold-sm font-black'
                            : isStaged
                            ? 'bg-amber-950/90 text-[#ffd86b] border-[#ffd86b] shadow-gold-sm animate-pulse'
                            : 'bg-amber-950/60 text-[#ffd86b] border-[#d4af37]'
                          : 'bg-[#171320] text-[#7d708f] border-[#2b2238]'
                      }`}
                    >
                      {currentActiveRank !== null && currentActiveRank !== undefined
                        ? `${rankMeta[currentActiveRank]?.badge || `Rank ${currentActiveRank}`}${isRatingPinned ? ' (Pinned)' : isStaged ? ' (Staged)' : ''}`
                        : 'Unassigned'}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {[3, 4, 5, 6, 7].map((rankNum) => {
                      const isCurrent = currentActiveRank === rankNum;
                      return (
                        <button
                          key={rankNum}
                          type="button"
                          disabled={isLogging || isExhausted || !currentTrack}
                          onClick={() => handleToggleHazardRank(rankNum)}
                          title={`Stage Hazard Rank ${rankNum} (${rankMeta[rankNum]?.title})`}
                          className={`py-2 px-1 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center gap-0.5 transition-all border cursor-pointer ${
                            isCurrent
                              ? 'bg-gradient-to-b from-[#ffd86b] to-[#d4af37] text-black border-[#ffd86b] shadow-gold-sm scale-105'
                              : 'bg-[#161220] hover:bg-[#251e36] text-[#b3a6c7] hover:text-white border-[#332742] hover:border-[#523e6b]'
                          }`}
                        >
                          <span className="text-sm font-black">{rankNum}</span>
                          <span className="text-[9px] uppercase tracking-tighter opacity-80">
                            {rankMeta[rankNum]?.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Rating Scores (3+ to 7+) */}
            <div className="grid grid-cols-5 gap-2">
              {(['3+', '4+', '5+', '6+', '7+'] as ScoreTier[]).map((score) => {
                const isSelected = selectedScore === score;
                const labels: Record<string, { label: string; icon: string }> = {
                  '3+': { label: 'Seedling', icon: '🌱' },
                  '4+': { label: 'Melody', icon: '🎵' },
                  '5+': { label: 'Sparkle', icon: '✨' },
                  '6+': { label: 'Blaze', icon: '🔥' },
                  '7+': { label: 'Crown', icon: '👑' },
                };
                return (
                  <SharedButton
                    variant={isSelected ? 'primary' : 'secondary'}
                    size="md"
                    key={score}
                    disabled={isLogging || isExhausted || !currentTrack}
                    onClick={() => setSelectedScore(selectedScore === score ? '' : score)}
                    className="flex flex-col items-center justify-center gap-1"
                  >
                    <span className="text-base md:text-lg">{labels[score]?.icon}</span>
                    <span className="font-bold">{score}</span>
                  </SharedButton>
                );
              })}
            </div>

            {/* 2 Separate Inputs: ALBUM (1 button for track) & GENRE (2 buttons for track & channel) */}
            <div ref={playlistControlsRef} className="space-y-3 text-left">
              {/* INPUT 1: ADD TO ALBUM (Single-choice selector, track only) */}
              <div className="p-3.5 rounded-2xl bg-[#0f0d14] border border-[#2b2238] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#ffd86b] font-cinzel font-bold flex items-center gap-1.5">
                    <Disc className="w-4 h-4 text-[#d4af37]" /> ADD TO ALBUM
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const next = !settings.applyAlbumToEntireChannel;
                        updateSettings({ applyAlbumToEntireChannel: next });
                        setRatingTarget(next ? 'channel' : 'track');
                        showToast(
                          next
                            ? `👑 Channel Batch Mode ON: Assigning an album will apply to ALL songs in "${currentTrack?.channel || 'Channel'}" and mark it Approved`
                            : 'Single Song Mode: Assigning an album applies only to the current song',
                          next ? 'success' : 'info'
                        );
                      }}
                      title="Apply album and staged hazard rank to all songs in the current channel/playlist at once"
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition border cursor-pointer ${
                        settings.applyAlbumToEntireChannel
                          ? 'bg-gradient-to-r from-amber-950 via-purple-950 to-amber-950 border-[#ffd86b] text-[#ffd86b] shadow-gold-sm font-black'
                          : 'bg-[#171320] border-[#382b4a] text-[#8c7a9e] hover:text-[#cbd5e1]'
                      }`}
                    >
                      <Crown className={`w-3 h-3 ${settings.applyAlbumToEntireChannel ? 'text-[#ffd86b]' : 'text-[#8c7a9e]'}`} />
                      <span>Batch Channel: {settings.applyAlbumToEntireChannel ? 'ON' : 'OFF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const next = !settings.autoAdvanceOnAlbumAdd;
                        updateSettings({ autoAdvanceOnAlbumAdd: next });
                        showToast(
                          next
                            ? '⚡ Auto-Advance Mode ON: Adding an album will log track & jump to next song'
                            : 'Auto-Advance Mode OFF: Adding an album will keep current song playing',
                          next ? 'success' : 'info'
                        );
                      }}
                      title="Upon adding/assigning this track to an album: automatically log track and advance to next song"
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition border cursor-pointer ${
                        settings.autoAdvanceOnAlbumAdd
                          ? 'bg-amber-950/80 border-[#ffd86b] text-[#ffd86b] shadow-gold-sm'
                          : 'bg-[#171320] border-[#382b4a] text-[#8c7a9e] hover:text-[#cbd5e1]'
                      }`}
                    >
                      <Zap className={`w-3 h-3 ${settings.autoAdvanceOnAlbumAdd ? 'text-[#ffd86b]' : 'text-[#8c7a9e]'}`} />
                      <span>Auto-Log & Next: {settings.autoAdvanceOnAlbumAdd ? 'ON' : 'OFF'}</span>
                    </button>
                    <span className="text-[10px] text-[#8c7a9e] hidden sm:inline">
                      {settings.applyAlbumToEntireChannel ? 'Entire channel' : 'Handpicked tracks only'}
                    </span>
                  </div>
                </div>

                {/* 1 button to select Album for track */}
                {currentAlbum ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={!currentTrack}
                      onClick={() => {
                        setPlaylistSearchQuery('');
                        setActivePicker(activePicker === 'album_song' ? null : 'album_song');
                      }}
                      className="flex-1 py-2 px-3 min-h-[42px] rounded-xl flex items-center justify-between gap-2 border bg-gradient-to-r from-[#2a1e0b] to-[#1c1426] border-[#d4af37] text-white shadow-gold-sm transition hover:brightness-110 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg flex-shrink-0">{currentAlbum.emoji || '💿'}</span>
                        <div className="text-left min-w-0">
                          <div className="text-xs font-bold text-[#ffd86b] truncate">
                            {currentAlbum.name}
                          </div>
                          <div className="text-[10px] font-mono text-[#a896be] flex items-center gap-1.5">
                            {formatQuarterRange(currentAlbum.date_start, currentAlbum.date_end) && (
                              <span>{formatQuarterRange(currentAlbum.date_start, currentAlbum.date_end)} • </span>
                            )}
                            <span>{currentAlbum.include_songs.length} tracks picked</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#3d2b09] text-[#ffd86b] border border-[#d4af37]/60 font-bold">
                          ASSIGNED
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-[#ffd86b] transition-transform ${activePicker === 'album_song' ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    <button
                      type="button"
                      title="Remove from Album"
                      onClick={() => handleSelectAlbumForSong(null)}
                      className="p-2.5 min-h-[42px] rounded-xl bg-[#1c121e] hover:bg-rose-950/50 border border-[#382645] hover:border-rose-500/50 text-[#8c7a9e] hover:rose-300 transition cursor-pointer flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-[#8c7a9e] hover:text-rose-300" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!currentTrack}
                    onClick={() => {
                      setPlaylistSearchQuery('');
                      setActivePicker(activePicker === 'album_song' ? null : 'album_song');
                    }}
                    className={`w-full py-2 px-3 min-h-[42px] rounded-xl flex items-center justify-between gap-2 border transition cursor-pointer disabled:opacity-50 ${
                      activePicker === 'album_song'
                        ? 'bg-[#241a2e] border-[#d4af37] text-white shadow-gold-sm'
                        : 'bg-[#171320] hover:bg-[#20192b] border-[#2e2638] hover:border-[#3f324f] text-[#cbd5e1] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Disc className="w-4 h-4 text-[#ffd86b] flex-shrink-0" />
                      <div className="text-left min-w-0">
                        <span className="text-xs font-semibold text-[#f5f0e8]">Select Album for Track</span>
                        <p className="text-[10px] font-mono text-[#8c7a9e]">Not assigned to any album</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 text-xs text-[#8c7a9e]">
                      <Plus className="w-3.5 h-3.5 text-[#ffd86b]" />
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activePicker === 'album_song' ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                )}

                {/* Album Popover (when activePicker === 'album_song') */}
                {activePicker === 'album_song' && currentTrack && (
                  <div className="mt-2 bg-[#140f1c] border border-[#d4af37]/60 rounded-2xl overflow-hidden flex flex-col font-sans shadow-2xl">
                    <div className="px-3.5 py-2.5 bg-[#1a1424] border-b border-[#2b2238] flex items-center justify-between text-xs">
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="text-[#8c7a9e] font-mono text-[10px] block uppercase tracking-wider">
                          Select Album for Track:
                        </span>
                        <span className="font-semibold text-[#ffd86b] truncate block text-xs" title={currentTrack.title}>
                          {currentTrack.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActivePicker(null)}
                        className="p-1 rounded-md text-[#8c7a9e] hover:text-white hover:bg-[#251c33] transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {settings.applyAlbumToEntireChannel ? (
                      <div className="px-3.5 py-2 bg-gradient-to-r from-amber-950 via-purple-950 to-amber-950 border-b border-[#ffd86b]/40 flex items-center justify-between text-xs text-[#ffd86b] font-mono">
                        <span className="flex items-center gap-1.5">
                          <Crown className="w-4 h-4 text-[#ffd86b] animate-pulse" />
                          <span>BATCH CHANNEL: Picking an album applies to <strong>ALL tracks</strong> in &ldquo;{currentTrack.channel}&rdquo;</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-black/40 text-[10px] text-amber-300 font-bold border border-amber-500/40">
                          Rank {stagedHazardRank ?? 5} • {selectedScore || '5+'}
                        </span>
                      </div>
                    ) : settings.autoAdvanceOnAlbumAdd ? (
                      <div className="px-3 py-1.5 bg-[#251b0a] border-b border-[#ffd86b]/30 flex items-center justify-between text-[11px] text-[#ffd86b] font-mono">
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-[#ffd86b] animate-pulse" />
                          <span>Auto-Advance active: picking an album logs & jumps to next</span>
                        </span>
                        <span className="text-[10px] text-[#e5c158] opacity-80 font-sans">
                          Score: {selectedScore || (stagedHazardRank ? `${stagedHazardRank}+` : settings.defaultPassScore || '5+')}
                        </span>
                      </div>
                    ) : null}

                    {totalAvailableForActivePicker > 3 && (
                      <div className="p-2 border-b border-[#231b2e] bg-[#120d1a]">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c7a9e]" />
                          <input
                            type="text"
                            value={playlistSearchQuery}
                            onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                            placeholder="Search Albums..."
                            className="w-full pl-8 pr-2 py-1 text-xs bg-[#1a1424] border border-[#2b2238] rounded-lg text-white placeholder-[#8c7a9e] focus:outline-none focus:border-[#ffd86b]"
                          />
                        </div>
                      </div>
                    )}

                    <div className="max-h-64 overflow-y-auto p-1.5 space-y-2">
                      {currentAlbum && (
                        <div
                          onClick={() => handleSelectAlbumForSong(null)}
                          className="p-2 flex items-center gap-2 hover:bg-rose-950/30 rounded-lg transition text-rose-400 hover:text-rose-300 cursor-pointer text-xs font-mono"
                        >
                          <X className="w-3.5 h-3.5 text-rose-400" />
                          <span>-- Remove from this Album --</span>
                        </div>
                      )}

                      {totalAvailableForActivePicker === 0 ? (
                        <div className="p-4 text-center text-xs text-[#8c7a9e] space-y-1 font-mono">
                          <p className="font-medium text-[#cbd5e1]">No Albums available yet</p>
                          <p className="text-[11px]">Type below to create and assign immediately!</p>
                        </div>
                      ) : (
                        groupedPlaylistsForActivePicker.map((group) => (
                          <div key={group.id} className="space-y-1 pt-1 first:pt-0">
                            {/* Compilation Group Header */}
                            {(groupedPlaylistsForActivePicker.length > 1 || !group.isStandalone) && (
                              <div className="px-2.5 py-1 text-[11px] font-mono font-bold tracking-wider flex items-center justify-between text-[#8c7a9e] bg-[#1a1426]/80 rounded-md border border-[#2b2238]">
                                <span className="flex items-center gap-1.5 truncate">
                                  <span>{group.emoji}</span>
                                  <span className={group.isStandalone ? 'text-[#b3a6c7]' : 'text-[#ffd86b]'}>
                                    {group.title}
                                  </span>
                                </span>
                                <span className="text-[10px] text-[#8c7a9e] flex-shrink-0">
                                  {group.items.length} albums
                                </span>
                              </div>
                            )}

                            {/* Member Albums */}
                            <div className="space-y-1">
                              {group.items.map((pl) => {
                                const isSelected = currentAlbum?.id === pl.id;
                                const isSaving = savingPlaylistId === pl.id;

                                return (
                                  <div
                                    key={pl.id}
                                    onClick={() => {
                                      if (!isSaving) handleSelectAlbumForSong(pl);
                                    }}
                                    className={`p-2 flex items-center justify-between gap-2 rounded-lg transition cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#291e0a] border border-[#d4af37]/60 text-white'
                                        : 'hover:bg-[#1a1424] text-[#cbd5e1]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <span className="text-sm font-mono flex-shrink-0">
                                        {isSelected ? '●' : '○'}
                                      </span>
                                      <span className="text-base flex-shrink-0">{pl.emoji || '💿'}</span>
                                      <div className="min-w-0 flex-1">
                                        <p className={`text-xs font-semibold truncate ${isSelected ? 'text-[#ffd86b]' : 'text-white'}`}>
                                          {pl.name}
                                        </p>
                                        <p className="text-[10px] text-[#8c7a9e] font-mono">
                                          {formatQuarterRange(pl.date_start, pl.date_end) && (
                                            <span>{formatQuarterRange(pl.date_start, pl.date_end)} • </span>
                                          )}
                                          <span>{pl.include_songs.length} tracks</span>
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      {isSaving ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#ffd86b]" />
                                      ) : isSelected ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/70 border border-emerald-500/50 text-emerald-400">
                                          <Check className="w-3 h-3" />
                                          <span>SELECTED</span>
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-mono text-[#8c7a9e]">Select</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <form
                      onSubmit={handleQuickCreatePlaylist}
                      className="p-2.5 border-t border-[#231b2e] bg-[#120d1a] flex items-center gap-1.5"
                    >
                      <input
                        type="text"
                        value={quickPlaylistName}
                        onChange={(e) => setQuickPlaylistName(e.target.value)}
                        placeholder="New Album name..."
                        className="flex-1 min-w-0 px-2.5 py-1 text-xs bg-[#1a1424] border border-[#2b2238] rounded-lg text-white placeholder-[#8c7a9e] focus:outline-none focus:border-[#ffd86b]"
                      />
                      <button
                        type="submit"
                        disabled={isQuickCreating || !quickPlaylistName.trim()}
                        className="px-2.5 py-1 bg-[#ffd86b] hover:bg-[#ffe394] text-black font-semibold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isQuickCreating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        <span>Create & Assign</span>
                      </button>
                    </form>

                    <div className="p-2 border-t border-[#231b2e] bg-[#0d0914] text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setActivePicker(null);
                          setPreselectedSongForModal(currentTrack.id);
                          setPreselectedChannelForModal(null);
                          setIsPlaylistModalOpen(true);
                        }}
                        className="text-[11px] font-mono text-[#ffd86b] hover:underline flex items-center justify-center gap-1 w-full py-0.5 cursor-pointer"
                      >
                        <span>Open Full Playlist Manager...</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* INPUT 2: ADD TO GENRE (2 options: track & channel) */}
              <div className="p-3.5 rounded-2xl bg-[#0f0d14] border border-[#2b2238] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-purple-300 font-cinzel font-bold flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-[#a855f7]" /> ADD TO GENRE PLAYLIST
                  </span>
                  <span className="text-[10px] text-[#8c7a9e]">2 options: Track & Channel</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Button 1: For Track */}
                  {currentSongGenre ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={!currentTrack}
                        onClick={() => {
                          setPlaylistSearchQuery('');
                          setActivePicker(activePicker === 'genre_song' ? null : 'genre_song');
                        }}
                        className="flex-1 py-2 px-2.5 min-h-[42px] rounded-xl flex items-center justify-between gap-1.5 border bg-gradient-to-r from-[#201033] to-[#171026] border-purple-500/70 text-white shadow-purple-sm transition hover:brightness-110 cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-base flex-shrink-0">{currentSongGenre.emoji || '🎵'}</span>
                          <div className="text-left min-w-0">
                            <div className="text-xs font-bold text-purple-200 truncate">{currentSongGenre.name}</div>
                            <div className="text-[10px] font-mono text-purple-400">Song Genre</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-purple-400" />
                          <ChevronDown className={`w-3.5 h-3.5 text-purple-400 transition-transform ${activePicker === 'genre_song' ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      <button
                        type="button"
                        title="Remove Track from Genre"
                        onClick={() => handleSelectGenreForSong(null)}
                        className="p-2 min-h-[42px] rounded-xl bg-[#1c121e] hover:bg-rose-950/50 border border-[#382645] hover:border-rose-500/50 text-[#8c7a9e] hover:text-rose-300 transition cursor-pointer flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!currentTrack}
                      onClick={() => {
                        setPlaylistSearchQuery('');
                        setActivePicker(activePicker === 'genre_song' ? null : 'genre_song');
                      }}
                      className={`py-2 px-2.5 min-h-[42px] rounded-xl flex items-center justify-between gap-1.5 border transition cursor-pointer disabled:opacity-50 ${
                        activePicker === 'genre_song'
                          ? 'bg-[#241a2e] border-purple-500 text-white shadow-purple-sm'
                          : 'bg-[#171320] hover:bg-[#20192b] border-[#2e2638] hover:border-[#3f324f] text-[#cbd5e1] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Music className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <div className="text-left min-w-0">
                          <span className="text-xs font-semibold text-[#f5f0e8] truncate block">Add Track to Genre</span>
                          <p className="text-[10px] font-mono text-[#8c7a9e]">Unassigned</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#8c7a9e] flex-shrink-0">
                        <Plus className="w-3.5 h-3.5 text-purple-400" />
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activePicker === 'genre_song' ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                  )}

                  {/* Button 2: For Channel */}
                  {currentChannelGenre ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={!currentTrack}
                        onClick={() => {
                          setPlaylistSearchQuery('');
                          setActivePicker(activePicker === 'genre_channel' ? null : 'genre_channel');
                        }}
                        className="flex-1 py-2 px-2.5 min-h-[42px] rounded-xl flex items-center justify-between gap-1.5 border bg-gradient-to-r from-[#141b33] to-[#101526] border-cyan-500/70 text-white shadow-cyan-sm transition hover:brightness-110 cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-base flex-shrink-0">{currentChannelGenre.emoji || '📻'}</span>
                          <div className="text-left min-w-0">
                            <div className="text-xs font-bold text-cyan-200 truncate">{currentChannelGenre.name}</div>
                            <div className="text-[10px] font-mono text-cyan-400">Channel Genre</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-cyan-400" />
                          <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 transition-transform ${activePicker === 'genre_channel' ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      <button
                        type="button"
                        title="Remove Channel from Genre"
                        onClick={() => handleSelectGenreForChannel(null)}
                        className="p-2 min-h-[42px] rounded-xl bg-[#1c121e] hover:bg-rose-950/50 border border-[#382645] hover:border-rose-500/50 text-[#8c7a9e] hover:text-rose-300 transition cursor-pointer flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!currentTrack}
                      onClick={() => {
                        setPlaylistSearchQuery('');
                        setActivePicker(activePicker === 'genre_channel' ? null : 'genre_channel');
                      }}
                      className={`py-2 px-2.5 min-h-[42px] rounded-xl flex items-center justify-between gap-1.5 border transition cursor-pointer disabled:opacity-50 ${
                        activePicker === 'genre_channel'
                          ? 'bg-[#241a2e] border-cyan-500 text-white shadow-cyan-sm'
                          : 'bg-[#171320] hover:bg-[#20192b] border-[#2e2638] hover:border-[#3f324f] text-[#cbd5e1] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Radio className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <div className="text-left min-w-0">
                          <span className="text-xs font-semibold text-[#f5f0e8] truncate block">Add Channel to Genre</span>
                          <p className="text-[10px] font-mono text-[#8c7a9e]">Unassigned</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#8c7a9e] flex-shrink-0">
                        <Plus className="w-3.5 h-3.5 text-cyan-400" />
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activePicker === 'genre_channel' ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                  )}
                </div>

                {/* Genre Popover (when activePicker === 'genre_song' or 'genre_channel') */}
                {(activePicker === 'genre_song' || activePicker === 'genre_channel') && currentTrack && (
                  <div className="mt-2 bg-[#140f1c] border border-purple-500/60 rounded-2xl overflow-hidden flex flex-col font-sans shadow-2xl">
                    <div className="px-3.5 py-2.5 bg-[#1a1424] border-b border-[#2b2238] flex items-center justify-between text-xs">
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="text-[#8c7a9e] font-mono text-[10px] block uppercase tracking-wider">
                          {activePicker === 'genre_channel'
                            ? `Select Genre for Channel "${currentTrack.channel}":`
                            : `Select Genre for Track:`}
                        </span>
                        <span className="font-semibold text-purple-200 truncate block text-xs" title={activePicker === 'genre_channel' ? currentTrack.channel : currentTrack.title}>
                          {activePicker === 'genre_channel' ? currentTrack.channel : currentTrack.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActivePicker(null)}
                        className="p-1 rounded-md text-[#8c7a9e] hover:text-white hover:bg-[#251c33] transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {totalAvailableForActivePicker > 3 && (
                      <div className="p-2 border-b border-[#231b2e] bg-[#120d1a]">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c7a9e]" />
                          <input
                            type="text"
                            value={playlistSearchQuery}
                            onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                            placeholder="Search Genre playlists..."
                            className="w-full pl-8 pr-2 py-1 text-xs bg-[#1a1424] border border-[#2b2238] rounded-lg text-white placeholder-[#8c7a9e] focus:outline-none focus:border-purple-400"
                          />
                        </div>
                      </div>
                    )}

                    <div className="max-h-64 overflow-y-auto p-1.5 space-y-2">
                      {(activePicker === 'genre_channel' ? currentChannelGenre : currentSongGenre) && (
                        <div
                          onClick={() => {
                            if (activePicker === 'genre_channel') handleSelectGenreForChannel(null);
                            else handleSelectGenreForSong(null);
                          }}
                          className="p-2 flex items-center gap-2 hover:bg-rose-950/30 rounded-lg transition text-rose-400 hover:text-rose-300 cursor-pointer text-xs font-mono"
                        >
                          <X className="w-3.5 h-3.5 text-rose-400" />
                          <span>-- Remove from this Genre --</span>
                        </div>
                      )}

                      {totalAvailableForActivePicker === 0 ? (
                        <div className="p-4 text-center text-xs text-[#8c7a9e] space-y-1 font-mono">
                          <p className="font-medium text-[#cbd5e1]">No Genre playlists available yet</p>
                          <p className="text-[11px]">Type below to create and assign immediately!</p>
                        </div>
                      ) : (
                        groupedPlaylistsForActivePicker.map((group) => (
                          <div key={group.id} className="space-y-1 pt-1 first:pt-0">
                            {/* Compilation Group Header */}
                            {(groupedPlaylistsForActivePicker.length > 1 || !group.isStandalone) && (
                              <div className="px-2.5 py-1 text-[11px] font-mono font-bold tracking-wider flex items-center justify-between text-[#8c7a9e] bg-[#1a1426]/80 rounded-md border border-[#2b2238]">
                                <span className="flex items-center gap-1.5 truncate">
                                  <span>{group.emoji}</span>
                                  <span className={group.isStandalone ? 'text-[#b3a6c7]' : 'text-purple-300'}>
                                    {group.title}
                                  </span>
                                </span>
                                <span className="text-[10px] text-[#8c7a9e] flex-shrink-0">
                                  {group.items.length} genres
                                </span>
                              </div>
                            )}

                            {/* Member Genres */}
                            <div className="space-y-1">
                              {group.items.map((pl) => {
                                const isChannelTarget = activePicker === 'genre_channel';
                                const isSelected = isChannelTarget
                                  ? currentChannelGenre?.id === pl.id
                                  : currentSongGenre?.id === pl.id;
                                const isSaving = savingPlaylistId === pl.id;

                                return (
                                  <div
                                    key={pl.id}
                                    onClick={() => {
                                      if (isSaving) return;
                                      if (isChannelTarget) handleSelectGenreForChannel(pl);
                                      else handleSelectGenreForSong(pl);
                                    }}
                                    className={`p-2 flex items-center justify-between gap-2 rounded-lg transition cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#29173b] border border-purple-500/60 text-white'
                                        : 'hover:bg-[#1a1424] text-[#cbd5e1]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <span className="text-sm font-mono flex-shrink-0">
                                        {isSelected ? '●' : '○'}
                                      </span>
                                      <span className="text-base flex-shrink-0">{pl.emoji || '🎸'}</span>
                                      <div className="min-w-0 flex-1">
                                        <p className={`text-xs font-semibold truncate ${isSelected ? 'text-purple-200' : 'text-white'}`}>
                                          {pl.name}
                                        </p>
                                        <p className="text-[10px] text-[#8c7a9e] font-mono">
                                          <span>{pl.include_channels.length} ch</span> •{' '}
                                          <span>{getCustomPlaylistAgg(pl).totalSongs} tracks</span>
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      {isSaving ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                                      ) : isSelected ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/70 border border-emerald-500/50 text-emerald-400">
                                          <Check className="w-3 h-3" />
                                          <span>SELECTED</span>
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-mono text-[#8c7a9e]">Select</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <form
                      onSubmit={handleQuickCreatePlaylist}
                      className="p-2.5 border-t border-[#231b2e] bg-[#120d1a] flex items-center gap-1.5"
                    >
                      <input
                        type="text"
                        value={quickPlaylistName}
                        onChange={(e) => setQuickPlaylistName(e.target.value)}
                        placeholder="New Genre name..."
                        className="flex-1 min-w-0 px-2.5 py-1 text-xs bg-[#1a1424] border border-[#2b2238] rounded-lg text-white placeholder-[#8c7a9e] focus:outline-none focus:border-purple-400"
                      />
                      <button
                        type="submit"
                        disabled={isQuickCreating || !quickPlaylistName.trim()}
                        className="px-2.5 py-1 bg-purple-500 hover:bg-purple-400 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isQuickCreating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        <span>Create & Assign</span>
                      </button>
                    </form>

                    <div className="p-2 border-t border-[#231b2e] bg-[#0d0914] text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setActivePicker(null);
                          if (activePicker === 'genre_channel') {
                            setPreselectedChannelForModal(currentTrack.channel);
                            setPreselectedSongForModal(null);
                          } else {
                            setPreselectedSongForModal(currentTrack.id);
                            setPreselectedChannelForModal(null);
                          }
                          setIsPlaylistModalOpen(true);
                        }}
                        className="text-[11px] font-mono text-purple-300 hover:underline flex items-center justify-center gap-1 w-full py-0.5 cursor-pointer"
                      >
                        <span>Open Full Playlist Manager...</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dual Block Buttons Deck */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Block Button 1: Immediate Block & Skip */}
              <SharedButton
                variant="danger"
                size="md"
                disabled={isLogging || isExhausted || !currentTrack}
                onClick={() => handleNextSong('block')}
                className="w-full flex items-center justify-center gap-1.5"
              >
                <Ban className="w-4 h-4" />
                <span>Block & Skip Now</span>
              </SharedButton>

              {/* Block Button 2: Deferred Block on Track End (Rating Mode) */}
              {(() => {
                const currentRank =
                  displayStats[currentTrack?.id || '']?.hazard_rank ??
                  currentTrack?.hazard_rank ??
                  null;
                const isRankedImmune = currentRank !== null;
                return (
                  <button
                    type="button"
                    disabled={isLogging || isExhausted || !currentTrack}
                    onClick={handleToggleDeferredBlock}
                    title={
                      isRankedImmune
                        ? '🛡️ Track is protected (Ranked) — you can queue Block on End, but it will not take effect on track end'
                        : undefined
                    }
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-cinzel font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedScore === 'block'
                        ? isRankedImmune
                          ? 'bg-gradient-to-r from-amber-950 to-amber-900 border-amber-500/80 text-amber-200 shadow-md shadow-amber-950/50'
                          : 'bg-gradient-to-r from-rose-950 to-rose-900 border-rose-500 text-rose-200 shadow-md shadow-rose-950/50'
                        : isRankedImmune
                        ? 'bg-[#1a1424] hover:bg-[#231932] border-[#524124] text-amber-300/80 hover:text-amber-200'
                        : 'bg-[#1a1424] hover:bg-[#231932] border-[#3d304f] text-[#cbd5e1] hover:text-rose-300'
                    }`}
                  >
                    <Clock className={`w-3.5 h-3.5 ${isRankedImmune ? 'text-amber-400' : 'text-rose-400'}`} />
                    <span>
                      {selectedScore === 'block'
                        ? isRankedImmune
                          ? '🛡️ Queued (Protected • Won\'t Block)'
                          : '✓ Queued to Block on End'
                        : isRankedImmune
                        ? '🛡️ Block on Track End (Protected)'
                        : 'Block on Track End'}
                    </span>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>

      {/* Playlist Management Modal */}
      <PlaylistManagerModal
        isOpen={isPlaylistModalOpen}
        onClose={() => {
          setIsPlaylistModalOpen(false);
          setPreselectedChannelForModal(null);
          setPreselectedSongForModal(null);
        }}
        projectId={targetProjectId}
        channelList={channelList}
        initialSelectedChannels={preselectedChannelForModal ? [preselectedChannelForModal] : []}
        initialSelectedSongIds={preselectedSongForModal ? [preselectedSongForModal] : []}
        onSelectPlaylist={(plId) => {
          handleSelectChannel(`CUSTOM:${plId}`);
        }}
      />
    </div>
  );
};

export default VinylPlayer;
