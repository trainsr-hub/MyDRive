/**
 * Tournament Bracket Types & Topology
 */

export interface TournamentRecord {
  id: string;
  name: string;
  format: string;
  status: 'draft' | 'in_progress' | 'completed';
  winner_id?: string | null;
  winner_name?: string | null;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  character_id: string;
  seed_index: number;
  initial_slot: string;
  display_name: string;
  avatar_url?: string;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round_name: string;
  match_order: number;
  position_code: string;
  slot_a_char_id?: string | null;
  slot_a_name?: string | null;
  slot_a_avatar?: string | null;
  slot_b_char_id?: string | null;
  slot_b_name?: string | null;
  slot_b_avatar?: string | null;
  winner_char_id?: string | null;
  winner_name?: string | null;
  winner_avatar?: string | null;
  next_match_id?: string | null;
  next_slot_target?: string | null;
  completed_at?: string | null;
}

export interface SlotInfo {
  character_id: string;
  display_name: string;
  avatar_url?: string;
  seed_index?: number;
  match_id?: string;
  is_winner?: boolean;
}

export interface TournamentProjection {
  tournament: TournamentRecord;
  participants: TournamentParticipant[];
  matches: TournamentMatch[];
  slots_map: Record<string, SlotInfo>;
}
