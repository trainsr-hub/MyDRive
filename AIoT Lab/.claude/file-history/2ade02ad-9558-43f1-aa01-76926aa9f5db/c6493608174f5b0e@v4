export interface CharacterEntity {
  id: string;
  char_code: string;
  canonical_name: string;
  short_names: string[];
  series_ids: string[];
  taxonomy_ids?: string[];
  stand_ids?: string[];
  dna_ids?: string[];
  hazard_rank: number;
  base_prompt?: string;
  outfit?: string;
  avatar_url?: string;
  variant_count?: number;
  created_at: string;
}

export interface VariantEntity {
  id: string;
  character_id: string;
  variant_names: string[];
  short_names: string[];
  series_ids?: string[];
  taxonomy_ids?: string[];
  stand_ids?: string[];
  dna_ids?: string[];
  hazard_rank: number;
  base_prompt?: string;
  prompt?: string;
  outfit?: string;
  avatar_url?: string;
  char_code?: string;
  canonical_name?: string;
  char_avatar_url?: string;
  created_at: string;
}

export interface WorldEntity {
  id: string;
  name: string;
  child_of?: string | null;
  parent_name?: string;
  description?: string;
  rules: string[];
  character_count?: number;
  created_at: string;
}

export interface AlbumEntity {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface CharacterImageEntry {
  image_id: string;
  image_url: string;
  album_id: string;
  album_name?: string;
}
