// path: src/apps/vinyl-angel/components/PlaylistManagerModal.tsx

import React, { useState, useMemo } from 'react';
import { ModalContainer } from '../../../components/shared/ModalContainer';
import { SharedButton } from '../../../components/shared/SharedButton';
import { saveCustomPlaylist, deleteCustomPlaylist, purgeChannelSongs } from '../services/engine';
import { useVinylStore } from '../store/useVinylStore';
import type { CustomPlaylist, ChannelOriginItem } from '../types';
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
} from 'lucide-react';

interface PlaylistManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  channelList: ChannelOriginItem[];
  onSelectPlaylist?: (playlistId: string) => void;
  initialEditPlaylistId?: string | null;
}

const PRESET_EMOJIS = ['🎵', '🎧', '⚔️', '🌙', '⚡', '🚀', '🌊', '🪶', '☕', '🔥', '💎', '🌸', '🌌', '👑'];

const TIMEBLOCK_OPTIONS = [
  { id: 'Arc Zero ~ Kick Starter', label: 'Arc Zero ~ Kick Starter', emoji: '🌊' },
  { id: 'Arc 01 ~ Morning Star - Raye', label: 'Arc 01 ~ Morning Star - Raye', emoji: '🚀' },
  { id: 'Arc 02 ~ Battle Phase - Racheal', label: 'Arc 02 ~ Battle Phase - Racheal', emoji: '⚔️' },
  { id: 'Arc 03 ~ Night Hours Melody', label: 'Arc 03 ~ Night Hours Melody', emoji: '🌙' },
  { id: 'Arc 04 ~ Sacred Pragma', label: 'Arc 04 ~ Sacred Pragma', emoji: '🪶' },
];

export const PlaylistManagerModal: React.FC<PlaylistManagerModalProps> = ({
  isOpen,
  onClose,
  projectId,
  channelList,
  onSelectPlaylist,
  initialEditPlaylistId = null,
}) => {
  const { customPlaylists, addCustomPlaylist, updateCustomPlaylist, removeCustomPlaylist } =
    useVinylStore();

  const [mode, setMode] = useState<'list' | 'edit'>(initialEditPlaylistId ? 'edit' : 'list');
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(initialEditPlaylistId);

  // Form fields
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎵');
  const [description, setDescription] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedTimeblocks, setSelectedTimeblocks] = useState<string[]>([]);
  const [channelSearchQuery, setChannelSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startCreating = () => {
    setEditingPlaylistId(null);
    setName('');
    setEmoji('🎵');
    setDescription('');
    setSelectedChannels([]);
    setSelectedTimeblocks([]);
    setChannelSearchQuery('');
    setErrorMessage(null);
    setMode('edit');
  };

  const startEditing = (pl: CustomPlaylist) => {
    setEditingPlaylistId(pl.id);
    setName(pl.name);
    setEmoji(pl.emoji || '🎵');
    setDescription(pl.description || '');
    setSelectedChannels([...pl.channels]);
    setSelectedTimeblocks([...(pl.compatible_timeblocks || [])]);
    setChannelSearchQuery('');
    setErrorMessage(null);
    setMode('edit');
  };

  const toggleChannel = (chName: string) => {
    setSelectedChannels((prev) =>
      prev.includes(chName) ? prev.filter((c) => c !== chName) : [...prev, chName]
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
    if (selectedChannels.length === 0) {
      setErrorMessage('Please select at least one channel for this playlist');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const saved = await saveCustomPlaylist(projectId, {
        id: editingPlaylistId || undefined,
        name: name.trim(),
        emoji,
        description: description.trim(),
        channels: selectedChannels,
        compatible_timeblocks: selectedTimeblocks,
      });

      if (editingPlaylistId) {
        updateCustomPlaylist(saved);
      } else {
        addCustomPlaylist(saved);
      }

      setMode('list');
      if (onSelectPlaylist) {
        onSelectPlaylist(saved.id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save playlist');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (plId: string) => {
    const playlist = customPlaylists.find((p) => p.id === plId);
    if (!playlist) return;

    // Calculate total songs across all member channels
    const totalSongs = playlist.channels.reduce((sum, chName) => {
      const ch = channelList.find((c) => c.name === chName);
      return sum + (ch?.count || 0);
    }, 0);

    // Confirmation dialog with purge details
    const confirmed = confirm(
      `⚠️ PLAYLIST DELETION WITH CHANNEL PURGE\n\n` +
      `Delete playlist "${playlist.name}"?\n\n` +
      `This will:\n` +
      `• Delete the playlist federation\n` +
      `• PURGE all ${totalSongs.toLocaleString()} songs from ${playlist.channels.length} channel(s):\n` +
      `  ${playlist.channels.join(', ')}\n\n` +
      `This is a soft-reboot: you can re-curl these channels with refined filters.\n\n` +
      `Proceed?`
    );

    if (!confirmed) return;

    try {
      // Step 1: Purge all songs from member channels
      const purgePromises = playlist.channels.map(async (chName) => {
        const ch = channelList.find((c) => c.name === chName);
        if (ch) {
          try {
            await purgeChannelSongs(projectId, ch.name, ch.channel_id);
          } catch (err) {
            console.warn(`[PlaylistDelete] Failed to purge channel ${chName}:`, err);
          }
        }
      });

      await Promise.all(purgePromises);

      // Step 2: Delete the playlist itself
      await deleteCustomPlaylist(projectId, plId);
      removeCustomPlaylist(plId);

      if (mode === 'edit' && editingPlaylistId === plId) {
        setMode('list');
      }
    } catch (err) {
      console.error('[PlaylistDelete] Failed to delete playlist and purge channels:', err);
    }
  };

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'list' ? 'Custom Playlists' : editingPlaylistId ? 'Edit Playlist' : 'New Playlist'}
      subtitle={
        mode === 'list'
          ? 'Federate multiple channels into thematic listening streams'
          : 'Combine channels under a shared musical style and timeblock'
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
                Group your favorite channels together (e.g., HOYO-MiX + NCS) to create themed listening streams.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {customPlaylists.map((pl) => {
                const pooledTracks = channelList
                  .filter((ch) => pl.channels.includes(ch.name))
                  .reduce((sum, ch) => sum + ch.count, 0);

                return (
                  <div
                    key={pl.id}
                    className="p-3.5 rounded-xl bg-[#15101f] hover:bg-[#1c152a] border border-[#2e243d] hover:border-[#d4af37]/60 transition flex items-center justify-between gap-3 group"
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
                      <span className="text-2xl flex-shrink-0">{pl.emoji || '🎵'}</span>
                      <div className="truncate">
                        <h4 className="text-sm font-bold text-white group-hover:text-[#ffd86b] transition truncate">
                          {pl.name}
                        </h4>
                        <p className="text-[11px] font-mono text-[#8c7a9e] truncate">
                          {pl.channels.length} channel{pl.channels.length > 1 ? 's' : ''} •{' '}
                          <span className="text-[#ffd86b] font-bold">{pooledTracks.toLocaleString()}</span> songs
                          {pl.description ? ` • ${pl.description}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditing(pl)}
                        title="Edit Playlist Channels"
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
              })}
            </div>
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

          {/* Name & Emoji */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="sm:col-span-3 space-y-1">
              <label className="text-xs font-mono text-[#8c7a9e]">Playlist Title *</label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Epic Battle Orchestral"
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

          {/* Channel Multi-Selection Section */}
          <div className="p-3.5 rounded-xl bg-[#110d1a] border border-[#2b2038] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cinzel font-bold text-[#ffd86b] flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                <span>Select Member Channels *</span>
              </span>
              <span className="text-[11px] font-mono text-[#8c7a9e]">
                <strong className="text-white">{selectedChannels.length}</strong> selected •{' '}
                <strong className="text-[#ffd86b]">{totalTracksInSelection.toLocaleString()}</strong> pooled songs
              </span>
            </div>

            {/* Channel Searcher */}
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

            {/* Channels Checklist */}
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

          {/* Compatible Timeblock Arcs */}
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
