import React, { useState, useEffect, useRef } from 'react';
import {
  TournamentRecord,
  TournamentProjection,
  TournamentMatch,
  SlotInfo,
} from '../../types/tournament';
import '@/styles/bracket.css';
import {
  Trophy,
  Dices,
  RefreshCw,
  Plus,
  Play,
  CheckCircle2,
  Users,
  ChevronDown,
  X,
  Sparkles,
  Zap,
  Edit2,
  Image,
  ClipboardList,
  Sliders,
  Check,
} from 'lucide-react';
import { CharacterIdSelector } from './CharacterIdSelector';

const FALLBACK_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%231a1f3a'/%3E%3Ctext x='50' y='55' font-size='32' text-anchor='middle' fill='%23d4af37' font-family='monospace'%3E%3F%3C/text%3E%3C/svg%3E";

export interface ParticipantDraft {
  character_id: string;
  display_name: string;
  avatar_url?: string;
}

const DUALITY_16_PRESET: ParticipantDraft[] = [
  { character_id: 'B28', display_name: 'Hino Akane', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
  { character_id: 'B53', display_name: 'Alabama', avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop' },
  { character_id: 'B57', display_name: 'Lucia', avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop' },
  { character_id: 'B56', display_name: 'Wang Liu Mei', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
  { character_id: 'HOLO_01', display_name: 'Ouro Kronii', avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop' },
  { character_id: 'B39', display_name: 'Mila', avatar_url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=100&h=100&fit=crop' },
  { character_id: 'C25', display_name: 'Yonah', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
  { character_id: 'HOLO_02', display_name: 'Subaru', avatar_url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop' },
  { character_id: 'IDOL_01', display_name: 'Higuchi Madoka', avatar_url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&fit=crop' },
  { character_id: 'C28', display_name: 'Nelly', avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop' },
  { character_id: 'C29', display_name: 'Izumi Konata', avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop' },
  { character_id: 'C30', display_name: 'Pursena Adoldia', avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop' },
  { character_id: 'B02', display_name: 'Amane Kanata', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
  { character_id: 'C31', display_name: 'Milla Maxwell', avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop' },
  { character_id: 'A01', display_name: 'Amelia Watson', avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop' },
  { character_id: 'EVA_01', display_name: 'Eva Frontier', avatar_url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop' },
];

const SLOT_LABELS = [
  'l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8',
  'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'
];

export const TournamentBracketView: React.FC = () => {
  const [tournaments, setTournaments] = useState<TournamentRecord[]>([]);
  const [activeTourneyId, setActiveTourneyId] = useState<string | null>(null);
  const [projection, setProjection] = useState<TournamentProjection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);
  const [editingSlotKey, setEditingSlotKey] = useState<string | null>(null);
  const [slotEditCharId, setSlotEditCharId] = useState('');
  const [slotEditName, setSlotEditName] = useState('');
  const [slotEditAvatar, setSlotEditAvatar] = useState('');

  // New Tournament Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTourneyName, setNewTourneyName] = useState('');
  const [wizardMode, setWizardMode] = useState<'slots' | 'bulk'>('slots');
  const [bulkText, setBulkText] = useState('');
  const [draftParticipants, setDraftParticipants] = useState<ParticipantDraft[]>(() =>
    Array.from({ length: 16 }, (_, i) => ({
      character_id: `CHAR_${i + 1}`,
      display_name: `Competitor ${i + 1}`,
      avatar_url: '',
    }))
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [svgPaths, setSvgPaths] = useState<Array<{ d: string; isActive: boolean }>>([]);

  // Load tournaments list
  const loadTournaments = async () => {
    try {
      const res = await fetch('/api/tournaments');
      const data: TournamentRecord[] = await res.json();
      setTournaments(data);
      if (data.length > 0 && !activeTourneyId) {
        setActiveTourneyId(data[0].id);
      }
    } catch (e) {
      console.error('[Tournament] Failed to load tournament list:', e);
    }
  };

  // Load specific tournament projection
  const loadProjection = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${id}`);
      if (res.ok) {
        const data: TournamentProjection = await res.json();
        setProjection(data);
      }
    } catch (e) {
      console.error('[Tournament] Failed to load bracket projection:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    if (activeTourneyId) {
      loadProjection(activeTourneyId);
    }
  }, [activeTourneyId]);

  // Recalculate SVG Connector Paths
  const updateConnectors = () => {
    const container = containerRef.current;
    if (!container) return;

    const getNodeCenter = (slotClass: string) => {
      const el = container.querySelector(`.bracket-slot-${slotClass}`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const c = container.getBoundingClientRect();
      return {
        x: r.left - c.left + r.width / 2,
        y: r.top - c.top + r.height / 2,
      };
    };

    const paths: Array<{ d: string; isActive: boolean }> = [];

    const connectNodes = (aClass: string, bClass: string, parentClass: string) => {
      const a = getNodeCenter(aClass);
      const b = getNodeCenter(bClass);
      const p = getNodeCenter(parentClass);
      if (!p) return;

      if (a) {
        const midXA = (a.x + p.x) / 2;
        paths.push({
          d: `M ${a.x} ${a.y} H ${midXA} V ${p.y} H ${p.x}`,
          isActive: Boolean(projection?.slots_map[parentClass]?.character_id),
        });
      }
      if (b) {
        const midXB = (b.x + p.x) / 2;
        paths.push({
          d: `M ${b.x} ${b.y} H ${midXB} V ${p.y} H ${p.x}`,
          isActive: Boolean(projection?.slots_map[parentClass]?.character_id),
        });
      }
    };

    // Left Wing
    connectNodes('l1', 'l2', 'l9');
    connectNodes('l3', 'l4', 'l10');
    connectNodes('l5', 'l6', 'l11');
    connectNodes('l7', 'l8', 'l12');

    connectNodes('l9', 'l10', 'l13');
    connectNodes('l11', 'l12', 'l14');

    connectNodes('l13', 'l14', 'l15');

    // Right Wing
    connectNodes('r1', 'r2', 'r9');
    connectNodes('r3', 'r4', 'r10');
    connectNodes('r5', 'r6', 'r11');
    connectNodes('r7', 'r8', 'r12');

    connectNodes('r9', 'r10', 'r13');
    connectNodes('r11', 'r12', 'r14');

    connectNodes('r13', 'r14', 'r15');

    // Grand Final (l15 & r15 -> champion)
    connectNodes('l15', 'r15', 'champion');

    setSvgPaths(paths);
  };

  useEffect(() => {
    const timer = setTimeout(updateConnectors, 100);
    window.addEventListener('resize', updateConnectors);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateConnectors);
    };
  }, [projection]);

  // Handle Pick Winner in Match
  const handlePickWinner = async (winnerId: string) => {
    if (!activeTourneyId || !selectedMatch) return;
    try {
      const res = await fetch(
        `/api/tournaments/${activeTourneyId}/match/${selectedMatch.id}/winner`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ winner_char_id: winnerId }),
        }
      );
      if (res.ok) {
        const updated = await res.json();
        setProjection(updated);
        setSelectedMatch(null);
      }
    } catch (e) {
      console.error('[Tournament] Failed to record winner:', e);
    }
  };

  // Handle Live Slot Edit via SQLite Character Selection
  const handleSaveSlotEdit = async () => {
    if (!activeTourneyId || !editingSlotKey || !slotEditCharId.trim()) return;
    try {
      const res = await fetch(
        `/api/tournaments/${activeTourneyId}/slot/${editingSlotKey}/select-character`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            char_code: slotEditCharId.trim().toUpperCase(),
          }),
        }
      );
      if (res.ok) {
        const updated = await res.json();
        setProjection(updated);
        setEditingSlotKey(null);
      } else {
        const err = await res.json();
        alert(err.detail || 'Character ID not found in SQLite database');
      }
    } catch (e) {
      console.error('[Tournament] Failed to update slot:', e);
    }
  };

  // Bulk Paste Parsing with Auto-Resolution from SQLite
  const handleBulkTextChange = async (text: string) => {
    setBulkText(text);
    const lines = text
      .split('\n')
      .map((l) => l.trim().replace(/^\[\[/, '').replace(/\]\]$/, '').trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const updated = [...draftParticipants];
    for (let idx = 0; idx < Math.min(lines.length, 16); idx++) {
      const line = lines[idx];
      const match = line.match(/^([A-Za-z0-9_-]+)/);
      const code = match ? match[1].toUpperCase() : line.toUpperCase();
      try {
        const res = await fetch(`/api/characters/${encodeURIComponent(code)}`);
        if (res.ok) {
          const char = await res.json();
          updated[idx] = {
            character_id: char.char_code,
            display_name: char.canonical_name,
            avatar_url: char.avatar_url || '',
          };
          continue;
        }
      } catch {}

      updated[idx] = {
        character_id: code,
        display_name: line,
        avatar_url: updated[idx]?.avatar_url || '',
      };
    }
    setDraftParticipants(updated);
  };

  // Load Preset
  const handleLoadDualityPreset = () => {
    setDraftParticipants(DUALITY_16_PRESET);
    setNewTourneyName('Tournament 03 ~ Duality Singularity');
  };

  // Create Tournament
  const handleCreateTournament = async () => {
    if (!newTourneyName.trim()) return;
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTourneyName.trim(),
          format: 'single_elimination_32',
          participants: draftParticipants,
        }),
      });
      if (res.ok) {
        const data: TournamentProjection = await res.json();
        setNewTourneyName('');
        setIsNewModalOpen(false);
        await loadTournaments();
        setActiveTourneyId(data.tournament.id);
      }
    } catch (e) {
      console.error('[Tournament] Failed to create tournament:', e);
    }
  };

  // Slot Click Router
  const handleSlotClick = (slotKey: string) => {
    if (!projection) return;

    // If it's a base seed slot (l1..l8, r1..r8), offer quick edit or view match
    const isBaseSlot = slotKey.startsWith('l') && parseInt(slotKey.slice(1)) <= 8 ||
                       slotKey.startsWith('r') && parseInt(slotKey.slice(1)) <= 8;

    if (isBaseSlot) {
      const slot = projection.slots_map[slotKey];
      setEditingSlotKey(slotKey);
      setSlotEditCharId(slot?.character_id || '');
      setSlotEditName(slot?.display_name || '');
      setSlotEditAvatar(slot?.avatar_url || '');
      return;
    }

    const match = projection.matches.find((m) => m.position_code === slotKey);
    if (match) {
      setSelectedMatch(match);
      return;
    }
  };

  const renderSlotNode = (slotKey: string) => {
    const slot = projection?.slots_map[slotKey];
    const isWinner = Boolean(slot?.is_winner);
    const hasData = Boolean(slot?.character_id);

    return (
      <div
        key={slotKey}
        onClick={() => handleSlotClick(slotKey)}
        title={slot ? `${slot.display_name} (${slot.character_id})` : slotKey.toUpperCase()}
        className={`bracket-node bracket-slot-${slotKey} ${
          isWinner ? 'node-winner' : hasData ? '' : 'node-empty'
        }`}
      >
        {slot ? (
          <img
            src={slot.avatar_url || FALLBACK_AVATAR}
            alt={slot.display_name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
            }}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-[11px] font-mono text-hazard-textMuted uppercase font-bold">
            {slotKey}
          </div>
        )}
      </div>
    );
  };

  const allSlots = [
    'l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8',
    'l9', 'l10', 'l11', 'l12', 'l13', 'l14', 'l15',
    'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8',
    'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15',
    'champion',
  ];

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn font-sans">
      {/* Top Header & Tournament Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-hazard-card border border-hazard-border shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-hazard-gold to-hazard-amber shadow-hazard-glow text-black font-black">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-black uppercase tracking-wider text-hazard-textBright">
                Hazard Duality Tournaments
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-hazard-gold/15 text-hazard-gold border border-hazard-gold/30 font-bold">
                16-Player Dual-Wing
              </span>
            </div>
            <p className="text-xs text-hazard-textMuted font-mono mt-0.5">
              Deterministic Bracket Topology & Character Hazard Advancement
            </p>
          </div>
        </div>

        {/* Center: Tourney Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={activeTourneyId || ''}
              onChange={(e) => setActiveTourneyId(e.target.value)}
              className="appearance-none bg-hazard-void border border-hazard-border px-4 py-2.5 pr-10 text-xs font-bold text-hazard-textBright rounded-xl outline-none focus:border-hazard-gold cursor-pointer min-w-[240px]"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.status.toUpperCase()})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-hazard-textMuted absolute right-3 top-3 pointer-events-none" />
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-hazard-gold text-black rounded-xl hover:brightness-110 active:scale-95 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Bracket (16 Players)</span>
          </button>

          <button
            onClick={() => activeTourneyId && loadProjection(activeTourneyId)}
            className="p-2.5 text-hazard-textMuted hover:text-hazard-gold bg-hazard-void border border-hazard-border rounded-xl transition"
            title="Refresh Bracket"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-hazard-gold' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grand Champion Winner Banner if Completed */}
      {projection?.tournament.status === 'completed' && projection.tournament.winner_name && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-hazard-gold/20 via-hazard-card to-hazard-gold/20 border-2 border-hazard-gold shadow-hazard-glow">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-hazard-gold animate-bounce" />
            <div>
              <span className="text-[11px] font-mono text-hazard-gold font-bold uppercase tracking-widest">
                GRAND TOURNAMENT CHAMPION
              </span>
              <h3 className="text-lg font-black text-white">
                {projection.tournament.winner_name}
              </h3>
            </div>
          </div>
          <span className="px-4 py-1.5 rounded-full bg-hazard-gold text-black font-black text-xs uppercase tracking-wider">
            VICTORY ACHIEVED
          </span>
        </div>
      )}

      {/* Main Visual Bracket Canvas */}
      <div className="bracket-wrapper" ref={containerRef}>
        <div className="bracket-canvas">
          {/* Dynamic SVG Orthogonal Bracket Connectors */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            style={{ width: '100%', height: '100%' }}
          >
            {svgPaths.map((p, idx) => (
              <path
                key={idx}
                d={p.d}
                fill="none"
                stroke={p.isActive ? '#d4af37' : '#1e2638'}
                strokeWidth={p.isActive ? '2.5' : '1.5'}
                strokeOpacity={p.isActive ? 0.9 : 0.6}
                style={{
                  transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
                  filter: p.isActive ? 'drop-shadow(0 0 4px rgba(212, 175, 55, 0.5))' : 'none',
                }}
              />
            ))}
          </svg>

          {/* Render all 31 dual-wing slot nodes */}
          {allSlots.map(renderSlotNode)}
        </div>
      </div>

      {/* Match Decision Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg p-6 bg-hazard-card border-2 border-hazard-border rounded-3xl shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-hazard-border pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-hazard-gold" />
                <h3 className="text-sm font-black uppercase tracking-wider text-hazard-textBright">
                  Match Order #{selectedMatch.match_order} — {selectedMatch.round_name} ({selectedMatch.position_code})
                </h3>
              </div>
              <button
                onClick={() => setSelectedMatch(null)}
                className="p-1 text-hazard-textMuted hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-hazard-textMuted font-mono">
              Declare the match victor. The chosen competitor will automatically advance up the bracket tree into the next round slot.
            </p>

            {/* Competitor Head-to-Head Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Competitor A */}
              <div
                onClick={() => selectedMatch.slot_a_char_id && handlePickWinner(selectedMatch.slot_a_char_id)}
                className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition cursor-pointer ${
                  selectedMatch.winner_char_id === selectedMatch.slot_a_char_id
                    ? 'border-hazard-gold bg-hazard-gold/10 shadow-hazard-glow'
                    : selectedMatch.slot_a_char_id
                    ? 'border-hazard-border bg-hazard-void hover:border-hazard-gold/60'
                    : 'border-dashed border-hazard-border/40 opacity-40 cursor-not-allowed'
                }`}
              >
                <img
                  src={selectedMatch.slot_a_avatar || FALLBACK_AVATAR}
                  alt={selectedMatch.slot_a_name || 'Slot A'}
                  className="w-16 h-16 rounded-xl object-cover border border-hazard-border"
                />
                <div className="text-center">
                  <h4 className="text-xs font-bold text-hazard-textBright">
                    {selectedMatch.slot_a_name || 'TBD'}
                  </h4>
                  <span className="text-[10px] font-mono text-hazard-textMuted">
                    {selectedMatch.slot_a_char_id || 'Empty'}
                  </span>
                </div>
                {selectedMatch.slot_a_char_id && (
                  <button
                    type="button"
                    className="w-full py-1.5 text-xs font-bold bg-hazard-gold/15 text-hazard-gold border border-hazard-gold/30 rounded-lg hover:bg-hazard-gold hover:text-black transition"
                  >
                    {selectedMatch.winner_char_id === selectedMatch.slot_a_char_id ? 'Current Winner' : 'Declare Winner'}
                  </button>
                )}
              </div>

              {/* Competitor B */}
              <div
                onClick={() => selectedMatch.slot_b_char_id && handlePickWinner(selectedMatch.slot_b_char_id)}
                className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition cursor-pointer ${
                  selectedMatch.winner_char_id === selectedMatch.slot_b_char_id
                    ? 'border-hazard-gold bg-hazard-gold/10 shadow-hazard-glow'
                    : selectedMatch.slot_b_char_id
                    ? 'border-hazard-border bg-hazard-void hover:border-hazard-gold/60'
                    : 'border-dashed border-hazard-border/40 opacity-40 cursor-not-allowed'
                }`}
              >
                <img
                  src={selectedMatch.slot_b_avatar || FALLBACK_AVATAR}
                  alt={selectedMatch.slot_b_name || 'Slot B'}
                  className="w-16 h-16 rounded-xl object-cover border border-hazard-border"
                />
                <div className="text-center">
                  <h4 className="text-xs font-bold text-hazard-textBright">
                    {selectedMatch.slot_b_name || 'TBD'}
                  </h4>
                  <span className="text-[10px] font-mono text-hazard-textMuted">
                    {selectedMatch.slot_b_char_id || 'Empty'}
                  </span>
                </div>
                {selectedMatch.slot_b_char_id && (
                  <button
                    type="button"
                    className="w-full py-1.5 text-xs font-bold bg-hazard-gold/15 text-hazard-gold border border-hazard-gold/30 rounded-lg hover:bg-hazard-gold hover:text-black transition"
                  >
                    {selectedMatch.winner_char_id === selectedMatch.slot_b_char_id ? 'Current Winner' : 'Declare Winner'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-Bracket Slot Quick Edit Modal */}
      {editingSlotKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md p-6 bg-hazard-card border-2 border-hazard-border rounded-3xl shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-hazard-border pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-hazard-gold" />
                <h3 className="text-sm font-black uppercase tracking-wider text-hazard-textBright">
                  Edit Competitor ({editingSlotKey.toUpperCase()})
                </h3>
              </div>
              <button
                onClick={() => setEditingSlotKey(null)}
                className="p-1 text-hazard-textMuted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-mono text-hazard-textMuted uppercase font-bold mb-1.5 block">
                  Select Competitor by Character ID (SQLite Registry)
                </label>
                <CharacterIdSelector
                  value={slotEditCharId}
                  displayName={slotEditName}
                  avatarUrl={slotEditAvatar}
                  onSelect={(char) => {
                    setSlotEditCharId(char.char_code);
                    setSlotEditName(char.canonical_name);
                    setSlotEditAvatar(char.avatar_url || '');
                  }}
                  placeholder="Type Character ID (e.g. A01, B28)..."
                />
              </div>

              {slotEditCharId && (
                <div className="flex items-center gap-3 p-3 bg-hazard-void rounded-xl border border-hazard-border">
                  <img
                    src={slotEditAvatar || FALLBACK_AVATAR}
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover border border-hazard-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-hazard-gold font-mono">
                      ID: {slotEditCharId}
                    </span>
                    <span className="text-xs font-bold text-hazard-textBright">
                      {slotEditName}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-hazard-border">
              <button
                onClick={() => setEditingSlotKey(null)}
                className="px-4 py-2 text-xs font-semibold text-hazard-textMuted hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSlotEdit}
                disabled={!slotEditName.trim()}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-hazard-gold text-black rounded-xl hover:brightness-110 disabled:opacity-50 transition"
              >
                Save Competitor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Tournament Creation Wizard Modal with 16 Player Slots */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[90vh] p-6 bg-hazard-card border-2 border-hazard-border rounded-3xl shadow-2xl flex flex-col gap-5 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-hazard-border pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-hazard-gold" />
                <h3 className="text-sm font-black uppercase tracking-wider text-hazard-textBright">
                  Create Tournament & Configure 16 Competitors
                </h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 text-hazard-textMuted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tournament Name Input & Quick Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
              <input
                type="text"
                placeholder="e.g. Tournament 03 ~ Duality Singularity"
                value={newTourneyName}
                onChange={(e) => setNewTourneyName(e.target.value)}
                className="flex-1 bg-hazard-void border border-hazard-border px-4 py-2 text-xs font-bold text-hazard-textBright rounded-xl outline-none focus:border-hazard-gold min-w-[280px]"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadDualityPreset}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-hazard-cyan/15 text-hazard-cyan border border-hazard-cyan/30 rounded-xl hover:bg-hazard-cyan hover:text-black transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Duality Preset</span>
                </button>

                <div className="flex items-center bg-hazard-void p-1 rounded-xl border border-hazard-border">
                  <button
                    type="button"
                    onClick={() => setWizardMode('slots')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      wizardMode === 'slots' ? 'bg-hazard-gold text-black' : 'text-hazard-textMuted hover:text-white'
                    }`}
                  >
                    16 Slots
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardMode('bulk')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      wizardMode === 'bulk' ? 'bg-hazard-gold text-black' : 'text-hazard-textMuted hover:text-white'
                    }`}
                  >
                    Bulk Paste
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body: Mode 1 (16 Interactive Slots) */}
            {wizardMode === 'slots' && (
              <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Wing Slots (l1..l8) */}
                <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-hazard-void/60 border border-hazard-border">
                  <div className="flex items-center justify-between pb-2 border-b border-hazard-border/50">
                    <span className="text-xs font-bold text-hazard-cyan uppercase tracking-wider font-mono">
                      Left Wing Competitors (Slots l1 - l8)
                    </span>
                    <span className="text-[10px] font-mono text-hazard-textMuted">Rounds 1 - 4</span>
                  </div>

                  <div className="space-y-2">
                    {draftParticipants.slice(0, 8).map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-1.5 rounded-xl bg-hazard-card border border-hazard-border"
                      >
                        <span className="w-6 text-center font-mono font-bold text-xs text-hazard-gold shrink-0">
                          l{idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <CharacterIdSelector
                            value={p.character_id}
                            displayName={p.display_name}
                            avatarUrl={p.avatar_url}
                            onSelect={(char) => {
                              setDraftParticipants((prev) => {
                                const up = [...prev];
                                up[idx] = {
                                  character_id: char.char_code,
                                  display_name: char.canonical_name,
                                  avatar_url: char.avatar_url || '',
                                };
                                return up;
                              });
                            }}
                            placeholder={`Select ID for l${idx + 1} (e.g. A01)...`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Wing Slots (r1..r8) */}
                <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-hazard-void/60 border border-hazard-border">
                  <div className="flex items-center justify-between pb-2 border-b border-hazard-border/50">
                    <span className="text-xs font-bold text-hazard-purple uppercase tracking-wider font-mono">
                      Right Wing Competitors (Slots r1 - r8)
                    </span>
                    <span className="text-[10px] font-mono text-hazard-textMuted">Rounds 5 - 8</span>
                  </div>

                  <div className="space-y-2">
                    {draftParticipants.slice(8, 16).map((p, idx) => {
                      const realIdx = 8 + idx;
                      return (
                        <div
                          key={realIdx}
                          className="flex items-center gap-2 p-1.5 rounded-xl bg-hazard-card border border-hazard-border"
                        >
                          <span className="w-6 text-center font-mono font-bold text-xs text-hazard-gold shrink-0">
                            r{idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <CharacterIdSelector
                              value={p.character_id}
                              displayName={p.display_name}
                              avatarUrl={p.avatar_url}
                              onSelect={(char) => {
                                setDraftParticipants((prev) => {
                                  const up = [...prev];
                                  up[realIdx] = {
                                    character_id: char.char_code,
                                    display_name: char.canonical_name,
                                    avatar_url: char.avatar_url || '',
                                  };
                                  return up;
                                });
                              }}
                              placeholder={`Select ID for r${idx + 1} (e.g. B28)...`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Body: Mode 2 (Bulk Paste) */}
            {wizardMode === 'bulk' && (
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                <p className="text-xs text-hazard-textMuted font-mono">
                  Paste 16 character names (one per line). Wikilinks like <code className="text-hazard-gold">[[B28 - Hino Akane]]</code> will be automatically cleaned.
                </p>
                <textarea
                  value={bulkText}
                  onChange={(e) => handleBulkTextChange(e.target.value)}
                  placeholder={`[[B28 - Hino Akane]]\n[[B53 - Alabama]]\n[[B57 - Lucia]]\n[[B56 - Wang Liu Mei]]\n[[Hololive - Ouro Kronii]]\n[[Miside - B39 - Mila]]\n[[C25 - Yonah]]\n[[Hololive - Subaru]]\n[[idols - Higuchi Madoka]]\n[[C28 ~ Nelly]]\n[[C29 ~ Izumi Konata]]\n[[C30 - Pursena Adoldia]]\n[[Vtuber - B02 - Amane Kanata]]\n[[C31 ~ Milla Maxwell]]\nAmelia Watson\nEva Frontier`}
                  rows={14}
                  className="w-full flex-1 bg-hazard-void border border-hazard-border p-3 text-xs font-mono text-hazard-textBright rounded-xl outline-none focus:border-hazard-gold leading-relaxed resize-none"
                />
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-hazard-border shrink-0">
              <span className="text-xs font-mono text-hazard-textMuted">
                Seeding {draftParticipants.filter((p) => p.display_name.trim()).length} / 16 players
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-hazard-textMuted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateTournament}
                  disabled={!newTourneyName.trim()}
                  className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider bg-hazard-gold text-black rounded-xl hover:brightness-110 disabled:opacity-50 transition shadow-hazard-glow"
                >
                  Generate 16-Player Bracket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
