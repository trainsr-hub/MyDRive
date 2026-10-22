"""
Rebased Tournament Engine: Deterministic Bracket Topology & Auto-Progression.
Implements the exact dual-wing tree structure from 'Tournament 02 ~ Duality.md'
and 'bracket.css'.
"""

import time
from typing import Dict, Any, List, Optional
import tournament_db as tdb

DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%231a1f3a'/%3E%3Ctext x='50' y='55' font-size='32' text-anchor='middle' fill='%23d4af37' font-family='monospace'%3E%3F%3C/text%3E%3C/svg%3E"


def build_dual_wing_bracket(
    tournament_id: str,
    participants: List[Dict[str, Any]],
    db_path: str = tdb.DEFAULT_DB_PATH
) -> None:
    """
    Builds the complete 16-competitor dual-wing elimination bracket.
    Generates participants and match slots wired with next_match_id links.
    """
    conn = tdb.get_connection(db_path)

    # 1. Pad or truncate participants to 16
    padded_participants: List[Dict[str, Any]] = []
    slot_names = [f"l{i}" for i in range(1, 9)] + [f"r{i}" for i in range(1, 9)]

    for i in range(16):
        initial_slot = slot_names[i]
        if i < len(participants):
            p = participants[i]
            padded_participants.append({
                "character_id": p.get("character_id", f"CHAR_{i+1:02d}"),
                "display_name": p.get("display_name", f"Competitor {i+1}"),
                "avatar_url": p.get("avatar_url") or DEFAULT_AVATAR,
                "seed_index": i + 1,
                "initial_slot": initial_slot
            })
        else:
            padded_participants.append({
                "character_id": f"BYE_{i+1:02d}",
                "display_name": f"Seed {i+1}",
                "avatar_url": DEFAULT_AVATAR,
                "seed_index": i + 1,
                "initial_slot": initial_slot
            })

    with conn:
        conn.execute("BEGIN IMMEDIATE;")

        # Save participants
        for p in padded_participants:
            pid = tdb.generate_tournament_hex_id(tdb.PREFIX_PARTICIPANT)
            conn.execute("""
                INSERT INTO tournament_participants (
                    id, tournament_id, character_id, seed_index, initial_slot, display_name, avatar_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?);
            """, (
                pid,
                tournament_id,
                p["character_id"],
                p["seed_index"],
                p["initial_slot"],
                p["display_name"],
                p["avatar_url"]
            ))

        # 2. Pre-generate Match IDs so we can cleanly wire parent pointers
        # Final Match (l15 vs r15)
        match_final_id = tdb.generate_tournament_hex_id(tdb.PREFIX_MATCH)

        # Semifinals (Round 4F: l13 vs l14 -> l15, r13 vs r14 -> r15)
        match_l15_id = tdb.generate_tournament_hex_id(tdb.PREFIX_MATCH)
        match_r15_id = tdb.generate_tournament_hex_id(tdb.PREFIX_MATCH)

        # Quarterfinals (Round 8F: l9 vs l10 -> l13, l11 vs l12 -> l14, etc.)
        match_l13_id = tdb.generate_tournament_hex_id(tdb.PREFIX_MATCH)
        match_l14_id = tdb.generate_tournament_hex_id(tdb.PREFIX_MATCH)
        match_r13_id = tdb.generate_tournament_hex_id(tdb.PREFIX_MATCH)
        match_r14_id = tdb.generate_tournament_hex_id(tdb.PREFIX_MATCH)

        # Round of 16 (Base Matches: l1 vs l2 -> l9, l3 vs l4 -> l10, etc.)
        match_l9_id = tdb.generate_tournament_hex_id(tdb.PREFIX_MATCH)
        match_l10_id = tdb.generate_tournament_hex_id(tdb.PREFIX_MATCH)
        match_l11_id = tdb.generate_tournament_hex_id(tdb.PREFIX_MATCH)
        match_l12_id = tdb.generate_tournament_hex_id(tdb.PREFIX_MATCH)

        match_r9_id = tdb.generate_tournament_hex_id(tdb.PREFIX_MATCH)
        match_r10_id = tdb.generate_tournament_hex_id(tdb.PREFIX_MATCH)
        match_r11_id = tdb.generate_tournament_hex_id(tdb.PREFIX_MATCH)
        match_r12_id = tdb.generate_tournament_hex_id(tdb.PREFIX_MATCH)

        # 3. Create Grand Final Match (order 15)
        conn.execute("""
            INSERT INTO tournament_matches (
                id, tournament_id, round_name, match_order, position_code,
                slot_a_char_id, slot_b_char_id, next_match_id, next_slot_target
            ) VALUES (?, ?, 'FINAL', 15, 'champion', NULL, NULL, NULL, NULL);
        """, (match_final_id, tournament_id))

        # 4. Create Round 4F Matches (Semis -> Winner advances to Grand Final)
        conn.execute("""
            INSERT INTO tournament_matches (
                id, tournament_id, round_name, match_order, position_code,
                slot_a_char_id, slot_b_char_id, next_match_id, next_slot_target
            ) VALUES (?, ?, '4F', 13, 'l15', NULL, NULL, ?, 'slot_a');
        """, (match_l15_id, tournament_id, match_final_id))

        conn.execute("""
            INSERT INTO tournament_matches (
                id, tournament_id, round_name, match_order, position_code,
                slot_a_char_id, slot_b_char_id, next_match_id, next_slot_target
            ) VALUES (?, ?, '4F', 14, 'r15', NULL, NULL, ?, 'slot_b');
        """, (match_r15_id, tournament_id, match_final_id))

        # 5. Create Round 8F Matches (Quarters -> Advance to l15 / r15)
        conn.execute("""
            INSERT INTO tournament_matches (
                id, tournament_id, round_name, match_order, position_code,
                slot_a_char_id, slot_b_char_id, next_match_id, next_slot_target
            ) VALUES (?, ?, '8F', 9, 'l13', NULL, NULL, ?, 'slot_a');
        """, (match_l13_id, tournament_id, match_l15_id))

        conn.execute("""
            INSERT INTO tournament_matches (
                id, tournament_id, round_name, match_order, position_code,
                slot_a_char_id, slot_b_char_id, next_match_id, next_slot_target
            ) VALUES (?, ?, '8F', 10, 'l14', NULL, NULL, ?, 'slot_b');
        """, (match_l14_id, tournament_id, match_l15_id))

        conn.execute("""
            INSERT INTO tournament_matches (
                id, tournament_id, round_name, match_order, position_code,
                slot_a_char_id, slot_b_char_id, next_match_id, next_slot_target
            ) VALUES (?, ?, '8F', 11, 'r13', NULL, NULL, ?, 'slot_a');
        """, (match_r13_id, tournament_id, match_r15_id))

        conn.execute("""
            INSERT INTO tournament_matches (
                id, tournament_id, round_name, match_order, position_code,
                slot_a_char_id, slot_b_char_id, next_match_id, next_slot_target
            ) VALUES (?, ?, '8F', 12, 'r14', NULL, NULL, ?, 'slot_b');
        """, (match_r14_id, tournament_id, match_r15_id))

        # 6. Create Round 16F Base Matches (R16 -> Advance to l13, l14, r13, r14)
        # Seed initial competitors into slots
        p = padded_participants

        # Left Wing Base Matches
        base_match_configs = [
            (match_l9_id, '16F', 1, 'l9', p[0], p[1], match_l13_id, 'slot_a'),
            (match_l10_id, '16F', 2, 'l10', p[2], p[3], match_l13_id, 'slot_b'),
            (match_l11_id, '16F', 3, 'l11', p[4], p[5], match_l14_id, 'slot_a'),
            (match_l12_id, '16F', 4, 'l12', p[6], p[7], match_l14_id, 'slot_b'),

            # Right Wing Base Matches
            (match_r9_id, '16F', 5, 'r9', p[8], p[9], match_r13_id, 'slot_a'),
            (match_r10_id, '16F', 6, 'r10', p[10], p[11], match_r13_id, 'slot_b'),
            (match_r11_id, '16F', 7, 'r11', p[12], p[13], match_r14_id, 'slot_a'),
            (match_r12_id, '16F', 8, 'r12', p[14], p[15], match_r14_id, 'slot_b'),
        ]

        for (mid, rnd, ord_num, pos, sa, sb, parent_mid, pslot) in base_match_configs:
            conn.execute("""
                INSERT INTO tournament_matches (
                    id, tournament_id, round_name, match_order, position_code,
                    slot_a_char_id, slot_a_name, slot_a_avatar,
                    slot_b_char_id, slot_b_name, slot_b_avatar,
                    next_match_id, next_slot_target
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                mid, tournament_id, rnd, ord_num, pos,
                sa["character_id"], sa["display_name"], sa["avatar_url"],
                sb["character_id"], sb["display_name"], sb["avatar_url"],
                parent_mid, pslot
            ))

    conn.execute("PRAGMA wal_checkpoint(PASSIVE);")
    conn.close()


def record_match_winner(
    tournament_id: str,
    match_id: str,
    winner_char_id: str,
    db_path: str = tdb.DEFAULT_DB_PATH
) -> Dict[str, Any]:
    """
    Records the winner of a match and automatically advances the winner
    into the designated slot of the parent match in the bracket tree.
    If the match was the Grand Final, completes the tournament.
    """
    conn = tdb.get_connection(db_path)
    now_str = time.strftime("%Y-%m-%d %H:%M:%S")

    with conn:
        conn.execute("BEGIN IMMEDIATE;")

        # Fetch current match
        cur = conn.execute("""
            SELECT * FROM tournament_matches
            WHERE id = ? AND tournament_id = ?;
        """, (match_id, tournament_id))
        match = cur.fetchone()
        if not match:
            raise ValueError(f"Match {match_id} not found in tournament {tournament_id}")

        # Resolve winner details
        if match["slot_a_char_id"] == winner_char_id:
            winner_name = match["slot_a_name"]
            winner_avatar = match["slot_a_avatar"]
        elif match["slot_b_char_id"] == winner_char_id:
            winner_name = match["slot_b_name"]
            winner_avatar = match["slot_b_avatar"]
        else:
            # Fallback to participant lookup
            p_cur = conn.execute("""
                SELECT display_name, avatar_url FROM tournament_participants
                WHERE tournament_id = ? AND character_id = ?;
            """, (tournament_id, winner_char_id))
            p_row = p_cur.fetchone()
            winner_name = p_row["display_name"] if p_row else winner_char_id
            winner_avatar = p_row["avatar_url"] if p_row else DEFAULT_AVATAR

        # Update current match
        conn.execute("""
            UPDATE tournament_matches
            SET winner_char_id = ?, winner_name = ?, winner_avatar = ?, completed_at = ?
            WHERE id = ?;
        """, (winner_char_id, winner_name, winner_avatar, now_str, match_id))

        # Propagate into next match if exists
        next_match_id = match["next_match_id"]
        next_slot_target = match["next_slot_target"]

        if next_match_id and next_slot_target:
            if next_slot_target == "slot_a":
                conn.execute("""
                    UPDATE tournament_matches
                    SET slot_a_char_id = ?, slot_a_name = ?, slot_a_avatar = ?
                    WHERE id = ?;
                """, (winner_char_id, winner_name, winner_avatar, next_match_id))
            elif next_slot_target == "slot_b":
                conn.execute("""
                    UPDATE tournament_matches
                    SET slot_b_char_id = ?, slot_b_name = ?, slot_b_avatar = ?
                    WHERE id = ?;
                """, (winner_char_id, winner_name, winner_avatar, next_match_id))

        # If Grand Final, mark tournament completed
        if match["round_name"] == "FINAL":
            conn.execute("""
                UPDATE tournaments
                SET status = 'completed', winner_id = ?, winner_name = ?, updated_at = ?
                WHERE id = ?;
            """, (winner_char_id, winner_name, now_str, tournament_id))

        conn.execute("""
            UPDATE tournaments SET updated_at = ? WHERE id = ?;
        """, (now_str, tournament_id))

    conn.execute("PRAGMA wal_checkpoint(PASSIVE);")
    conn.close()

    return get_tournament_projection(tournament_id, db_path)


def get_tournament_projection(
    tournament_id: str,
    db_path: str = tdb.DEFAULT_DB_PATH
) -> Dict[str, Any]:
    """
    Returns the complete bracket tree projection, denormalized and ready
    for instant rendering by the frontend bracket component.
    """
    conn = tdb.get_connection(db_path)

    # 1. Fetch tournament
    t_cur = conn.execute("SELECT * FROM tournaments WHERE id = ?;", (tournament_id,))
    t_row = t_cur.fetchone()
    if not t_row:
        conn.close()
        raise ValueError(f"Tournament {tournament_id} not found")
    tournament_data = dict(t_row)

    # 2. Fetch participants
    p_cur = conn.execute("""
        SELECT * FROM tournament_participants
        WHERE tournament_id = ?
        ORDER BY seed_index ASC;
    """, (tournament_id,))
    participants = [dict(r) for r in p_cur.fetchall()]

    # 3. Fetch matches
    m_cur = conn.execute("""
        SELECT * FROM tournament_matches
        WHERE tournament_id = ?
        ORDER BY match_order ASC;
    """, (tournament_id,))
    matches = [dict(r) for r in m_cur.fetchall()]

    conn.close()

    # 4. Build coordinate-mapped slot index for bracket.css
    # .l1 .. .l8: Base seeds Left
    # .r1 .. .r8: Base seeds Right
    # .l9 .. .l12: Round of 16 winners Left
    # .r9 .. .r12: Round of 16 winners Right
    # .l13 .. .l14: Round of 8 winners Left
    # .r13 .. .r14: Round of 8 winners Right
    # .l15: Left Champion / Finalist
    # .r15: Right Champion / Finalist
    # champion: Grand Champion

    slots_map: Dict[str, Dict[str, Any]] = {}

    # Seed participants into base slots
    for p in participants:
        slot_code = p["initial_slot"]
        slots_map[slot_code] = {
            "character_id": p["character_id"],
            "display_name": p["display_name"],
            "avatar_url": p["avatar_url"],
            "seed_index": p["seed_index"],
            "is_winner": False
        }

    # Populate intermediate and final slots from matches
    for m in matches:
        pos = m["position_code"]
        if m["winner_char_id"]:
            slots_map[pos] = {
                "character_id": m["winner_char_id"],
                "display_name": m["winner_name"],
                "avatar_url": m["winner_avatar"],
                "match_id": m["id"],
                "is_winner": True
            }

    return {
        "tournament": tournament_data,
        "participants": participants,
        "matches": matches,
        "slots_map": slots_map
    }


def update_slot_participant(
    tournament_id: str,
    slot_code: str,
    display_name: str,
    avatar_url: Optional[str] = None,
    character_id: Optional[str] = None,
    db_path: str = tdb.DEFAULT_DB_PATH
) -> Dict[str, Any]:
    """
    Updates the character name or avatar assigned to a base seed slot (l1..l8, r1..r8)
    and synchronizes the initial Round 16 match.
    """
    conn = tdb.get_connection(db_path)
    clean_name = display_name.strip()
    clean_avatar = avatar_url or DEFAULT_AVATAR
    cid = character_id.strip() if character_id else clean_name

    with conn:
        conn.execute("BEGIN IMMEDIATE;")

        # Update participant record
        conn.execute("""
            UPDATE tournament_participants
            SET display_name = ?, avatar_url = ?, character_id = ?
            WHERE tournament_id = ? AND initial_slot = ?;
        """, (clean_name, clean_avatar, cid, tournament_id, slot_code))

        # Update initial round 16 match
        slot_map = {
            "l1": ("l9", "slot_a"), "l2": ("l9", "slot_b"),
            "l3": ("l10", "slot_a"), "l4": ("l10", "slot_b"),
            "l5": ("l11", "slot_a"), "l6": ("l11", "slot_b"),
            "l7": ("l12", "slot_a"), "l8": ("l12", "slot_b"),
            "r1": ("r9", "slot_a"), "r2": ("r9", "slot_b"),
            "r3": ("r10", "slot_a"), "r4": ("r10", "slot_b"),
            "r5": ("r11", "slot_a"), "r6": ("r11", "slot_b"),
            "r7": ("r12", "slot_a"), "r8": ("r12", "slot_b"),
        }

        if slot_code in slot_map:
            pos_code, target = slot_map[slot_code]
            if target == "slot_a":
                conn.execute("""
                    UPDATE tournament_matches
                    SET slot_a_name = ?, slot_a_avatar = ?, slot_a_char_id = ?
                    WHERE tournament_id = ? AND position_code = ? AND winner_char_id IS NULL;
                """, (clean_name, clean_avatar, cid, tournament_id, pos_code))
            else:
                conn.execute("""
                    UPDATE tournament_matches
                    SET slot_b_name = ?, slot_b_avatar = ?, slot_b_char_id = ?
                    WHERE tournament_id = ? AND position_code = ? AND winner_char_id IS NULL;
                """, (clean_name, clean_avatar, cid, tournament_id, pos_code))

    conn.execute("PRAGMA wal_checkpoint(PASSIVE);")
    conn.close()
    return get_tournament_projection(tournament_id, db_path)
