"""
Unit tests for Tournament Engine & Bracket Auto-Advancement.
"""

import os
import tournament_db as tdb
import tournament_engine as teng

TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "data", "test_tournament.db")


def run_tests():
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)

    print("--- 1. Testing Tournament Creation ---")
    tourney = tdb.create_tournament_record(
        name="Apex Duality Grand Prix",
        format_type="single_elimination_32",
        notes="Automated Bracket Test",
        db_path=TEST_DB_PATH
    )

    assert tourney["id"].startswith("1001"), f"Tournament ID must start with 1001, got {tourney['id']}"
    assert tourney["status"] == "in_progress"
    print(f"Created Tournament: {tourney['id']} - {tourney['name']}")

    print("\n--- 2. Building 16-Player Dual-Wing Bracket ---")
    mock_participants = [
        {"character_id": f"CHAR_{i:02d}", "display_name": f"Fighter {i:02d}", "avatar_url": None}
        for i in range(1, 17)
    ]

    teng.build_dual_wing_bracket(
        tournament_id=tourney["id"],
        participants=mock_participants,
        db_path=TEST_DB_PATH
    )

    proj = teng.get_tournament_projection(tourney["id"], db_path=TEST_DB_PATH)
    assert len(proj["participants"]) == 16, f"Expected 16 participants, got {len(proj['participants'])}"
    assert len(proj["matches"]) == 15, f"Expected 15 matches (8 R1 + 4 R2 + 2 Semis + 1 Final), got {len(proj['matches'])}"

    # Verify participant IDs
    assert proj["participants"][0]["id"].startswith("1003"), "Participant ID must start with 1003"
    # Verify match IDs
    assert proj["matches"][0]["id"].startswith("1002"), "Match ID must start with 1002"

    print(f"Bracket built: {len(proj['participants'])} participants, {len(proj['matches'])} matches.")
    print("Slot map base seeds:", list(proj["slots_map"].keys()))

    print("\n--- 3. Testing Winner Progression (Match 1 -> l9) ---")
    match_1 = next(m for m in proj["matches"] if m["position_code"] == "l9")
    print(f"Match 1 (l9): {match_1['slot_a_name']} vs {match_1['slot_b_name']}")

    # Fighter 1 wins match 1
    winner_id = match_1["slot_a_char_id"]
    proj_updated = teng.record_match_winner(
        tournament_id=tourney["id"],
        match_id=match_1["id"],
        winner_char_id=winner_id,
        db_path=TEST_DB_PATH
    )

    # Verify slot l9 now holds the winner
    assert "l9" in proj_updated["slots_map"], "Slot l9 must be populated with winner"
    assert proj_updated["slots_map"]["l9"]["character_id"] == winner_id
    print(f"Match 1 Winner recorded: {proj_updated['slots_map']['l9']['display_name']} advanced to l9.")

    # Verify parent match l13 received the winner in slot_a
    match_l13 = next(m for m in proj_updated["matches"] if m["position_code"] == "l13")
    assert match_l13["slot_a_char_id"] == winner_id, f"Parent match l13 slot_a should be {winner_id}, got {match_l13['slot_a_char_id']}"
    print(f"Parent match l13 slot_a auto-populated with: {match_l13['slot_a_name']}")

    print("\n--- 4. Simulating Full Bracket Progression to Champion ---")
    # Simulate all matches
    current_proj = proj_updated
    for order in range(1, 16):
        m = next(m for m in current_proj["matches"] if m["match_order"] == order)
        if not m["winner_char_id"]:
            # Pick slot_a as winner
            w_id = m["slot_a_char_id"]
            assert w_id, f"Match {m['position_code']} has no slot_a competitor to pick"
            current_proj = teng.record_match_winner(
                tournament_id=tourney["id"],
                match_id=m["id"],
                winner_char_id=w_id,
                db_path=TEST_DB_PATH
            )
            print(f"  Match {order:02d} ({m['position_code']}): {m['slot_a_name']} won.")

    # Final check
    final_tourney = current_proj["tournament"]
    assert final_tourney["status"] == "completed", f"Tournament status should be completed, got {final_tourney['status']}"
    assert final_tourney["winner_id"] is not None, "Tournament must have winner_id set"
    print(f"\n[OK] Tournament Completed! Grand Champion: {final_tourney['winner_name']} ({final_tourney['winner_id']})")

    # Cleanup
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


if __name__ == "__main__":
    run_tests()
