# Character Images & Album Vault Architecture Plan

## Context & Vision
The Manager directed that character imagery should **not** be stored inside the `characters` table. Instead, it operates as a decoupled "treasure chest" accessed using the character's exact ID as the key:
1. **`albums` Table (SQLite)**: Holds albums with monotonic hex IDs (`1007...`), storing album name, description, and created timestamp. (Tags deferred to a later phase).
2. **`character_images.json` File**: Stored as a dedicated JSON registry because image assignments change frequently. It is keyed by the **exact character ID (`character_id`)**, with each entry containing image objects that link an `image_url` directly to an `album_id`.

---

## 1. Data Model & Architecture

### Hex ID Prefix Standards (16-character monotonic hex: `<4-prefix><12-hex-ms>`)
- `1004` — Characters (Key to character_images)
- `1005` — Character Variants
- `1006` — Worlds Tree
- **`1007`** — Albums (Treasure Chest collections)
- **`1008`** — Images / Pictures (Individual image entries)

### 1.1. SQLite `albums` Table (`backend/album_db.py`)
```sql
CREATE TABLE IF NOT EXISTS albums (
    id TEXT PRIMARY KEY,                 -- 1007... monotonic hex
    name TEXT NOT NULL UNIQUE,           -- e.g. 'Avatars & Icons', 'Official Artwork', 'Duality Tournament Roster'
    description TEXT DEFAULT '',         -- Album lore / usage purpose
    created_at TEXT NOT NULL             -- YYYY-MM-DD HH:MM:SS
);
CREATE INDEX IF NOT EXISTS idx_albums_name ON albums(name);
```

### 1.2. `character_images.json` File (`backend/data/character_images.json`)
A JSON store keyed by the exact character hex ID (`1004...`), maintaining a list of images linked to specific albums:

```json
{
  "100401A10785B7B9": {
    "character_id": "100401A10785B7B9",
    "char_code": "A01",
    "images": [
      {
        "image_id": "100801A10890A1B2",
        "image_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100",
        "album_id": "100701A10885E123"
      }
    ]
  }
}
```

---

## 2. Ingestion & Default Albums Seed

### Pre-Seeded Default Albums:
1. **`Tournament Avatars`** (`1007...`): Official headshots used in tournament brackets.
2. **`Default Outfits`** (`1007...`): Canonical character appearance portraits.
3. **`Variant & Ego Gallery`** (`1007...`): Special costumes and skins.

### Character Images Migration:
- For each character currently in `characters` table with an existing `avatar_url`, auto-generate an entry in `character_images.json` linked to the `Tournament Avatars` album.
- Remove `avatar_url` reliance in `characters` and `character_variants`: characters now reference images through `character_images[character_id]`.

---

## 3. Backend Implementation (`backend/`)

1. **`album_db.py`**:
   - Schema creation for `albums` table.
   - CRUD operations: `get_all_albums()`, `upsert_album()`, `delete_album()`.
   - `character_images` JSON manager:
     - `load_character_images()`: reads `character_images.json`.
     - `get_images_for_character(char_id)`: returns image list with resolved album names.
     - `add_character_image(char_id, image_url, album_id)`: appends new image and saves.
     - `remove_character_image(char_id, image_id)`: deletes specific image.
     - `get_primary_avatar(char_id)`: helper to retrieve the first or default avatar for tournaments/cards.

2. **`main.py` Endpoints**:
   - `GET /api/albums`: list all albums.
   - `POST /api/albums`: create or update an album.
   - `DELETE /api/albums/{id}`: delete an album.
   - `GET /api/characters/{char_id}/images`: get all images for a character.
   - `POST /api/characters/{char_id}/images`: add an image to a character with `album_id`.
   - `DELETE /api/characters/{char_id}/images/{image_id}`: delete an image.

3. **Tournament Slot Resolution Integration**:
   - `tournament_engine.py` updates to resolve avatars on demand using `album_db.get_primary_avatar(char_id)`.

---

## 4. Frontend Integration (`frontend/src/app/`)

1. **`IdentityStudioApp.tsx`**:
   - Add a 4th tab: 🖼️ **Albums & Chest**.
   - Show album registry and allow managing album containers.

2. **`CharactersTableView.tsx`**:
   - Displays avatar dynamically resolved from `character_images[char_id]`.
   - Clicking on a character's avatar thumbnail opens the **"Image Treasure Chest"** modal showing all images attached to that character, with album tags and the ability to upload/link new image URLs to albums.

3. **`TournamentBracketView.tsx`**:
   - Avatars in tournament brackets fetch from `character_images[character_id]`.

---

## 5. Verification Plan

1. **Backend Unit Verification (`backend/test_album_vault.py`)**:
   - Create album "Avatars".
   - Assign 2 images to character `A01` (`1004...`) under album ID.
   - Assert `character_images.json` holds correct structure with exact `character_id`.
   - Assert `get_primary_avatar("A01")` returns the primary avatar.
2. **API Testing**:
   - `GET /api/albums` returns seeded albums.
   - `GET /api/characters/A01/images` returns list of images with `album_id`.
   - `POST /api/characters/A01/images` adds an image and updates `character_images.json`.
3. **Frontend Testing**:
   - View `http://localhost:5174/identity.html` -> verify album drawer and character image chest.
