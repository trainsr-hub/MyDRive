// =============================================================================
// [GLOBAL RANK SCALING & THEMATIC REGISTRY]
// =============================================================================

export const GLOBAL_RANKS = [
  '✦',
  'Ø',
  'Ψ',
  'S₄',
  'S₃',
  'S₂',
  'S₁',
  'A+',
  'A',
  'B+',
  'B',
  'C+',
  'C',
  'D+',
  'D',
] as const;

export type GlobalRankTier = typeof GLOBAL_RANKS[number] | 'F';

export interface RankThematicMeta {
  rank: GlobalRankTier;
  label: string;
  themeTitle: string;
  minScore: number;
  badgeClass: string;
  description: string;
}

export function getRankFromScore(score: number): GlobalRankTier {
  if (score >= 8.0) return '✦';
  if (score >= 7.5) return 'Ø';
  if (score >= 7.0) return 'Ψ';
  if (score >= 6.75) return 'S₄';
  if (score >= 6.5) return 'S₃';
  if (score >= 6.25) return 'S₂';
  if (score >= 6.0) return 'S₁';
  if (score >= 5.5) return 'A+';
  if (score >= 5.0) return 'A';
  if (score >= 4.5) return 'B+';
  if (score >= 4.0) return 'B';
  if (score >= 3.5) return 'C+';
  if (score >= 3.0) return 'C';
  if (score >= 2.5) return 'D+';
  if (score >= 2.0) return 'D';
  return 'F';
}

export function hasTier(scoreOrRank: number | string | null | undefined): boolean {
  if (scoreOrRank === null || scoreOrRank === undefined) return false;
  const rank = typeof scoreOrRank === 'number' ? getRankFromScore(scoreOrRank) : scoreOrRank;
  return rank !== 'F' && (GLOBAL_RANKS as readonly string[]).includes(rank);
}

export const RANK_THEMATIC_REGISTRY: Record<GlobalRankTier, RankThematicMeta> = {
  '✦': {
    rank: '✦',
    label: '✦ Polaris',
    themeTitle: 'Solar Zenith',
    minScore: 8.0,
    badgeClass: 'badge-star',
    description: 'Ngôi sao Tối thượng — Vành nhật hoa xoay và tia lửa hoàng kim trên nền Obsidian.',
  },
  'Ø': {
    rank: 'Ø',
    label: 'Ø Singularity',
    themeTitle: 'Event Horizon',
    minScore: 7.5,
    badgeClass: 'badge-null',
    description: 'Chân trời Sự kiện — Đĩa bồi tụ hố đen xoáy ốc nuốt chửng vật chất vào tâm tuyệt đối.',
  },
  'Ψ': {
    rank: 'Ψ',
    label: 'Ψ Abyss',
    themeTitle: 'Unfrozen Tides',
    minScore: 7.0,
    badgeClass: 'badge-psi',
    description: 'Thủy triều Vô tận — Sóng ngầm đại dương đa tầng cuộn bọt tuyết trắng tuần hoàn.',
  },
  'S₄': {
    rank: 'S₄',
    label: 'S₄ Apex',
    themeTitle: 'Phase IV: Apex Transmutation',
    minScore: 6.75,
    badgeClass: 'badge-s4',
    description: 'Tiến hóa Cực hạn — Thần khí hoàn thiện với nhịp đập siêu năng lượng phát quang.',
  },
  'S₃': {
    rank: 'S₃',
    label: 'S₃ Molten',
    themeTitle: 'Phase III: Molten Flare',
    minScore: 6.5,
    badgeClass: 'badge-s3',
    description: 'Tiến hóa Giai đoạn 3 — Hào quang kép bùng nổ năng lượng viền nguyên chất.',
  },
  'S₂': {
    rank: 'S₂',
    label: 'S₂ Resonant',
    themeTitle: 'Phase II: Energy Sweep',
    minScore: 6.25,
    badgeClass: 'badge-s2',
    description: 'Tiến hóa Giai đoạn 2 — Luồng sáng quét dao động trên nền vàng kim.',
  },
  'S₁': {
    rank: 'S₁',
    label: 'S₁ Awakening',
    themeTitle: 'Phase I: Ember Pulse',
    minScore: 6.0,
    badgeClass: 'badge-s1',
    description: 'Tiến hóa Giai đoạn 1 — Khởi hỏa hoàng kim với nhịp thở ánh kim nhẹ.',
  },
  'A+': {
    rank: 'A+',
    label: 'A+ Master',
    themeTitle: 'Jade Vanguard',
    minScore: 5.5,
    badgeClass: 'bg-[#0b291a] text-[#86efac] border-[#22c55e]/60 shadow-[0_0_8px_rgba(34,197,94,0.25)] font-semibold',
    description: 'Tuyệt tác cao cấp — Lục bảo hộ vệ.',
  },
  'A': {
    rank: 'A',
    label: 'A Prime',
    themeTitle: 'Emerald Standard',
    minScore: 5.0,
    badgeClass: 'bg-[#082015] text-[#4ade80] border-[#16a34a]/40 font-semibold',
    description: 'Kiệt tác xuất sắc — Chuẩn ngọc bích.',
  },
  'B+': {
    rank: 'B+',
    label: 'B+ Choice',
    themeTitle: 'Cobalt Surge',
    minScore: 4.5,
    badgeClass: 'bg-[#0a1e38] text-[#93c5fd] border-[#3b82f6]/50 font-semibold',
    description: 'Rất được ưa chuộng — Xanh coban.',
  },
  'B': {
    rank: 'B',
    label: 'B Solid',
    themeTitle: 'Azure Matrix',
    minScore: 4.0,
    badgeClass: 'bg-[#081526] text-[#60a5fa] border-[#2563eb]/35 font-semibold',
    description: 'Quen thuộc vững chắc — Lam ngọc.',
  },
  'C+': {
    rank: 'C+',
    label: 'C+ Adept',
    themeTitle: 'Iron Slate',
    minScore: 3.5,
    badgeClass: 'bg-[#191522] text-[#cbd5e1] border-[#475569]/50',
    description: 'Bắt đầu tích lũy — Đá phiến xám.',
  },
  'C': {
    rank: 'C',
    label: 'C Base',
    themeTitle: 'Neutral Base',
    minScore: 3.0,
    badgeClass: 'bg-[#14111a] text-[#94a3b8] border-[#334155]/40',
    description: 'Mặc định khởi tạo.',
  },
  'D+': {
    rank: 'D+',
    label: 'D+ Decay',
    themeTitle: 'Warning Sector',
    minScore: 2.5,
    badgeClass: 'bg-[#290d12] text-[#fca5a5] border-[#dc2626]/40',
    description: 'Khu vực cảnh báo suy giảm.',
  },
  'D': {
    rank: 'D',
    label: 'D Abyssal',
    themeTitle: 'Severe Penalty',
    minScore: 2.0,
    badgeClass: 'bg-[#3b080f] text-[#ef4444] border-[#b91c1c]/60 animate-pulse',
    description: 'Bị phạt nghiêm trọng.',
  },
  'F': {
    rank: 'F',
    label: 'F Void',
    themeTitle: 'Nullified',
    minScore: 0.0,
    badgeClass: 'bg-[#121212] text-[#71717a] border-[#27272a]',
    description: 'Vô hiệu hóa.',
  },
};

export function getRankBadgeStyle(rank: string): string {
  const meta = RANK_THEMATIC_REGISTRY[rank as GlobalRankTier];
  return meta ? meta.badgeClass : 'bg-[#141218] text-[#71717a] border-[#27272a]';
}
