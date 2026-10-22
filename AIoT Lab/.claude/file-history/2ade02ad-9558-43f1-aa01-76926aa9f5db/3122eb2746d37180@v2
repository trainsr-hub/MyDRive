"""
Unit verification for Album Database and character_images.json registry.
Validates Manager's Vision:
  - albums (SQLite): Holds album containers with 1007... hex IDs
  - character_images.json: Keyed by exact character_id, maps image_url to album_id
"""

import os
import shutil
import json
import album_db as adb

TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "data", "test_album.db")
TEST_IMAGES_DIR = os.path.join(os.path.dirname(__file__), "data", "test_images_dir")


def run_tests():
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    if os.path.exists(TEST_IMAGES_DIR):
        shutil.rmtree(TEST_IMAGES_DIR)

    print("--- 1. Testing Albums Table Initialization & Seeding ---")
    album_ids = adb.seed_default_albums(TEST_DB_PATH)
    assert "Tournament Avatars" in album_ids, "Tournament Avatars album must exist"
    assert album_ids["Tournament Avatars"].startswith("1007"), "Album ID must use 1007 prefix"

    albums = adb.get_all_albums(TEST_DB_PATH)
    assert len(albums) == 3, f"Expected 3 default albums, got {len(albums)}"
    print(f"Albums initialized: {[a['name'] for a in albums]}")

    print("\n--- 2. Testing O(1) Individual Image JSON File: 'A01.json' ---")
    mock_char_code = "A01"
    mock_char_id = "100401A10785B7B9"
    mock_url_1 = "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100"
    mock_url_2 = "https://images.unsplash.com/photo-casual-ame.png"

    # Add 1st image to Tournament Avatars
    img1 = adb.add_character_image(
        char_code=mock_char_code,
        image_url=mock_url_1,
        album_id=album_ids["Tournament Avatars"],
        character_id=mock_char_id,
        images_dir=TEST_IMAGES_DIR
    )
    assert img1["image_id"].startswith("1008"), "Image ID must use 1008 prefix"
    assert img1["album_id"] == album_ids["Tournament Avatars"]

    # Verify A01.json was created directly
    expected_file = os.path.join(TEST_IMAGES_DIR, "A01.json")
    assert os.path.exists(expected_file), f"Direct file '{expected_file}' must exist on disk for O(1) access!"
    print(f"File verified: {expected_file} created directly on disk!")

    # Add 2nd image to Costumes & Egos
    img2 = adb.add_character_image(
        char_code=mock_char_code,
        image_url=mock_url_2,
        album_id=album_ids["Costumes & Egos"],
        character_id=mock_char_id,
        images_dir=TEST_IMAGES_DIR
    )

    # Verify O(1) retrieval
    char_images = adb.get_images_for_character(mock_char_code, TEST_IMAGES_DIR, TEST_DB_PATH)
    assert len(char_images) == 2, f"Expected 2 images for character, got {len(char_images)}"
    assert char_images[0]["album_name"] == "Tournament Avatars"
    assert char_images[1]["album_name"] == "Costumes & Egos"
    print(f"Character {mock_char_code} has {len(char_images)} images in {mock_char_code}.json:")
    for ci in char_images:
        print(f"  - [{ci['image_id']}] {ci['album_name']} -> {ci['image_url'][:50]}...")

    print("\n--- 3. Testing Primary Avatar Lookup from A01.json ---")
    primary = adb.get_primary_avatar(mock_char_code, TEST_IMAGES_DIR, TEST_DB_PATH)
    assert primary == mock_url_1, f"Primary avatar should be {mock_url_1}, got {primary}"
    print(f"Primary avatar resolved cleanly from A01.json: {primary[:40]}...")

    print("\n--- 4. Testing Image Removal from A01.json ---")
    removed = adb.remove_character_image(mock_char_code, img2["image_id"], TEST_IMAGES_DIR)
    assert removed is True
    char_images_after = adb.get_images_for_character(mock_char_code, TEST_IMAGES_DIR, TEST_DB_PATH)
    assert len(char_images_after) == 1, f"Expected 1 image after removal, got {len(char_images_after)}"
    print(f"Image removed from {mock_char_code}.json successfully.")

    # Cleanup
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    if os.path.exists(TEST_IMAGES_DIR):
        shutil.rmtree(TEST_IMAGES_DIR)

    print("\n[OK] All O(1) Individual Image JSON & Album tests passed cleanly!")


if __name__ == "__main__":
    run_tests()
