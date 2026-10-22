// =============================================================================
// [VINYL ANGEL MATHEMATICAL & ULTRA HIGH-PERFORMANCE ETL ENGINE]
// =============================================================================
import { executeOrder, API_BASE } from '../../../services/api';
import { getRankFromScore } from '../../../utils/rank';
import type {
  Tier3StateRecord,
  ChannelStateRecord,
  Tier2EventEntry,
  VinylDisplayCard,
  PlaylistItem,
  ChannelOriginItem,
  CurlerResult,
  CurlerStreamEvent,
  CustomPlaylist,
  PlaylistType,
  ChannelStatus,
  UnavailableVideoEntry,
} from '../types';

export const ARC_METADATA: Record<string, { title: string; emoji: string }> = {
  timeblock_arc0: { title: 'Arc Zero ~ Kick Starter', emoji: '🌊' },
  timeblock_arc1: { title: 'Arc 01 ~ Morning Star - Raye', emoji: '🚀' },
  timeblock_arc2: { title: 'Arc 02 ~ Battle Phase - Racheal', emoji: '⚔️' },
  timeblock_arc3: { title: 'Arc 03 ~ Night Hours Melody', emoji: '🌙' },
  timeblock_arc4: { title: 'Arc 04 ~ Sacred Pragma', emoji: '🪶' },
};

interface Tier1StaticItem {
  title?: string;
  channel_name?: string;
  channel?: string;
  artist?: string;
  duration?: number | string;
}

const tier1MemoryCache: Record<string, Tier1StaticItem> = {};
let cachedEligibleTier4List: VinylDisplayCard[] | null = null;

export function invalidateVinylCache(projectId?: string) {
  cachedEligibleTier4List = null;
  if (!projectId) {
    for (const k in tier1MemoryCache) delete tier1MemoryCache[k];
  }
}

export function calculateHazardLevel(record: Tier3StateRecord | ChannelStateRecord): number {
  const rank = record.hazard_rank;
  if (!rank || rank < 3 || rank > 7) {
    return 3.0;
  }

  const s5 = record.score_5_count?.length || 0;
  const s6 = record.score_6_count?.length || 0;
  const s7 = record.score_7_count?.length || 0;

  // Sovereign calibration: 25 of 7+ (4pts), 50 of 6+ (2pts), or 100 of 5+ (1pt) to reach 8.0
  const S = 4 * s7 + 2 * s6 + 1 * s5;

  const base = rank - 0.5;
  const k = (8.5 - rank) / 100.0;

  const score = base + k * S;
  return Math.round(Math.min(8.5, Math.max(1.0, score)) * 100) / 100;
}

export function calculateTotalPlayed(record: Tier3StateRecord | ChannelStateRecord): number {
  return (
    record.score_3_count.length +
    record.score_4_count.length +
    record.score_5_count.length +
    record.score_6_count.length +
    record.score_7_count.length
  );
}

export function getDominantTimeblock(record: Tier3StateRecord | ChannelStateRecord): string | null {
  const arcCounts = [
    { key: 'timeblock_arc0', count: record.timeblock_arc0 },
    { key: 'timeblock_arc1', count: record.timeblock_arc1 },
    { key: 'timeblock_arc2', count: record.timeblock_arc2 },
    { key: 'timeblock_arc3', count: record.timeblock_arc3 },
    { key: 'timeblock_arc4', count: record.timeblock_arc4 },
  ];
  arcCounts.sort((a, b) => b.count - a.count);
  const highest = arcCounts[0];
  return highest && highest.count > 0 ? ARC_METADATA[highest.key]?.title || null : null;
}

function parseJsonArray(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function fetchChannelState(
  projectId: string
): Promise<Record<string, ChannelStateRecord>> {
  try {
    const res = await executeOrder<Record<string, Record<string, unknown>>>({
      project_id: projectId,
      tier: 'channel_state',
      order: { action: 'read_all' },
    });
    const rawData = res.data || {};
    const result: Record<string, ChannelStateRecord> = {};

    for (const [chId, row] of Object.entries(rawData)) {
      result[chId] = {
        channel_id: chId,
        channel_name: (row.channel_name as string) || '',
        score_3_count: parseJsonArray(row.score_3_count),
        score_4_count: parseJsonArray(row.score_4_count),
        score_5_count: parseJsonArray(row.score_5_count),
        score_6_count: parseJsonArray(row.score_6_count),
        score_7_count: parseJsonArray(row.score_7_count),
        timeblock_arc0: Number(row.timeblock_arc0) || 0,
        timeblock_arc1: Number(row.timeblock_arc1) || 0,
        timeblock_arc2: Number(row.timeblock_arc2) || 0,
        timeblock_arc3: Number(row.timeblock_arc3) || 0,
        timeblock_arc4: Number(row.timeblock_arc4) || 0,
        unlock_date: (row.unlock_date as string) || null,
        updated_at: (row.updated_at as string) || undefined,
      };
    }
    return result;
  } catch (e) {
    console.warn('[Engine] Failed to fetch channel_state table:', e);
    return {};
  }
}

export async function rateChannelDirect(
  projectId: string,
  channelId: string,
  channelName: string,
  action: string,
  timeblocks: string[] = []
): Promise<{ success: boolean; hazard: number; played: number; record: ChannelStateRecord }> {
  const currentChannels = await fetchChannelState(projectId);
  const chRecord: ChannelStateRecord = currentChannels[channelId] || {
    channel_id: channelId,
    channel_name: channelName,
    score_3_count: [],
    score_4_count: [],
    score_5_count: [],
    score_6_count: [],
    score_7_count: [],
    timeblock_arc0: 0,
    timeblock_arc1: 0,
    timeblock_arc2: 0,
    timeblock_arc3: 0,
    timeblock_arc4: 0,
    unlock_date: null,
  };

  const timestampHex = Date.now().toString(16).toUpperCase();
  const act = action.toLowerCase().trim();

  if (act === '3+' || act === 'cancel' || act === 'downvote') {
    chRecord.score_3_count.push(timestampHex);
  } else if (act === '4+') {
    chRecord.score_4_count.push(timestampHex);
  } else if (act === '5+' || act === 'continue') {
    chRecord.score_5_count.push(timestampHex);
  } else if (act === '6+' || act === 'upvote') {
    chRecord.score_6_count.push(timestampHex);
  } else if (act === '7+' || act === 'overflow') {
    chRecord.score_7_count.push(timestampHex);
  }

  if (timeblocks && timeblocks.length > 0) {
    timeblocks.forEach((b) => {
      if (/arc\s*zero|kick/i.test(b)) chRecord.timeblock_arc0++;
      else if (/arc\s*0?1|morning/i.test(b)) chRecord.timeblock_arc1++;
      else if (/arc\s*0?2|battle/i.test(b)) chRecord.timeblock_arc2++;
      else if (/arc\s*0?3|night/i.test(b)) chRecord.timeblock_arc3++;
      else if (/arc\s*0?4|sacred/i.test(b)) chRecord.timeblock_arc4++;
    });
  }

  chRecord.updated_at = new Date().toISOString();

  // 1. Upsert into channel_state table in _3_state.db
  await executeOrder({
    project_id: projectId,
    tier: 'channel_state',
    order: {
      action: 'upsert',
      key: channelId,
      data: {
        channel_name: channelName,
        score_3_count: JSON.stringify(chRecord.score_3_count),
        score_4_count: JSON.stringify(chRecord.score_4_count),
        score_5_count: JSON.stringify(chRecord.score_5_count),
        score_6_count: JSON.stringify(chRecord.score_6_count),
        score_7_count: JSON.stringify(chRecord.score_7_count),
        timeblock_arc0: chRecord.timeblock_arc0,
        timeblock_arc1: chRecord.timeblock_arc1,
        timeblock_arc2: chRecord.timeblock_arc2,
        timeblock_arc3: chRecord.timeblock_arc3,
        timeblock_arc4: chRecord.timeblock_arc4,
        unlock_date: chRecord.unlock_date,
        updated_at: chRecord.updated_at,
      },
    },
  });

  // 2. Also record to Tier 2 JSONL event buffer
  await executeOrder({
    project_id: projectId,
    tier: '2',
    order: {
      action: 'append',
      data: {
        id: channelId,
        target_type: 'channel',
        channel_id: channelId,
        channel_name: channelName,
        action: action,
        timestamp: timestampHex,
        timeblock: timeblocks.length === 1 ? timeblocks[0] : timeblocks.length > 1 ? timeblocks : undefined,
      },
    },
  });

  const hazard = calculateHazardLevel(chRecord);
  const played = calculateTotalPlayed(chRecord);

  return { success: true, hazard, played, record: chRecord };
}

export async function fetchEligibleTier4List(
  projectId: string,
  forceRefresh = false
): Promise<VinylDisplayCard[]> {
  if (!forceRefresh && cachedEligibleTier4List) {
    return cachedEligibleTier4List;
  }

  const t4Res = await executeOrder<Record<string, Record<string, unknown>>>({
    project_id: projectId,
    tier: '4',
    order: { action: 'read_all' },
  });
  const t4Data = t4Res.data || {};

  const list: VinylDisplayCard[] = [];
  let indexCounter = 1;

  for (const [id, rawT4] of Object.entries(t4Data)) {
    const t4Item = (rawT4 as Record<string, unknown>) || {};
    const rawHazard = t4Item.hazard_level;
    const hazard =
      rawHazard !== undefined && rawHazard !== null && !isNaN(Number(rawHazard))
        ? Number(rawHazard)
        : 3.0;

    if (hazard <= 3.0) continue;

    const rawPlayed = t4Item.played;
    const played =
      rawPlayed !== undefined && rawPlayed !== null && !isNaN(Number(rawPlayed))
        ? Number(rawPlayed)
        : 0;

    list.push({
      id,
      dbIndex: indexCounter++,
      title: `Track ${id}`,
      channel: '',
      duration: null,
      hazard_level: hazard,
      played,
      timeblock: (t4Item.timeblock as string) || null,
      unlock_date: (t4Item.unlock_date as string) || null,
      rankCategory: getRankFromScore(hazard),
    });
  }

  cachedEligibleTier4List = list;
  return list;
}

// =============================================================================
// [FULL CATALOG SEARCH (ALL 173K+ TRACKS FROM _1_STATIC.DB)]
// Searches by title, channel, or ID across the entire static catalog
// =============================================================================
export async function searchFullCatalog(
  projectId: string,
  query: string,
  limit = 30
): Promise<VinylDisplayCard[]> {
  if (!query || query.trim().length < 2) return [];

  const [searchRes, t4Res] = await Promise.all([
    executeOrder<Record<string, Record<string, unknown>>>({
      project_id: projectId,
      tier: '1',
      order: { action: 'sample', data: { search: query.trim(), limit } },
    }),
    executeOrder<Record<string, Record<string, unknown>>>({
      project_id: projectId,
      tier: '4',
      order: { action: 'read_all' },
    }),
  ]);

  const rawData = searchRes.data || {};
  const t4Data = t4Res.data || {};
  const list: VinylDisplayCard[] = [];
  let indexCounter = 1;

  for (const [id, row] of Object.entries(rawData)) {
    const v = (row as Record<string, unknown>) || {};
    const t4Item = t4Data[id] as Record<string, unknown> | undefined;
    const hazard = t4Item?.hazard_level !== undefined && t4Item?.hazard_level !== null
      ? Number(t4Item.hazard_level)
      : 3.0;
    const played = t4Item?.played !== undefined && t4Item?.played !== null
      ? Number(t4Item.played)
      : 0;

    list.push({
      id,
      dbIndex: indexCounter++,
      title: (v.title as string) || `Track ${id}`,
      channel:
        (v.channel_name as string) ||
        (v.channel as string) ||
        (v.artist as string) ||
        'Unknown Origin',
      duration: (v.duration as number) ?? null,
      hazard_level: Math.round(hazard * 100) / 100,
      played,
      timeblock: (t4Item?.timeblock as string) || null,
      unlock_date: (t4Item?.unlock_date as string) || null,
      rankCategory: getRankFromScore(hazard),
    });
  }

  return list;
}

// =============================================================================
// [SINGLE-REQUEST BATCH READ FOR 16 PAGE ITEMS]
// =============================================================================
export async function resolvePageMetadataOnDemand(
  projectId: string,
  pageTracks: VinylDisplayCard[]
): Promise<VinylDisplayCard[]> {
  if (pageTracks.length === 0) return [];

  const missingIds = pageTracks
    .map((t) => t.id)
    .filter((id) => !tier1MemoryCache[id]);

  if (missingIds.length > 0) {
    try {
      const res = await executeOrder<Record<string, Tier1StaticItem>>({
        project_id: projectId,
        tier: '1',
        order: { action: 'batch_read', data: missingIds },
      });
      const dataMap = res.data || {};
      for (const [id, staticInfo] of Object.entries(dataMap)) {
        tier1MemoryCache[id] = staticInfo;
      }
    } catch (e) {
      console.warn(`[LazyTier1 Batch] Failed to load batch of ${missingIds.length} items:`, e);
    }
  }

  return pageTracks.map((item) => {
    const staticInfo = tier1MemoryCache[item.id];
    return {
      ...item,
      title: staticInfo?.title || item.title,
      channel:
        staticInfo?.channel_name ||
        staticInfo?.channel ||
        staticInfo?.artist ||
        'Unknown Origin',
      duration: staticInfo?.duration ?? null,
    };
  });
}

export async function fetchTier3State(projectId: string): Promise<Tier3StateRecord[]> {
  const result = await executeOrder<Record<string, Record<string, unknown>>>({
    project_id: projectId,
    tier: '3',
    order: { action: 'read_all' },
  });

  const rawData = result.data || {};
  return Object.entries(rawData).map(([id, row]) => ({
    id,
    score_3_count: parseJsonArray(row.score_3_count),
    score_4_count: parseJsonArray(row.score_4_count),
    score_5_count: parseJsonArray(row.score_5_count),
    score_6_count: parseJsonArray(row.score_6_count),
    score_7_count: parseJsonArray(row.score_7_count),
    timeblock_arc0: Number(row.timeblock_arc0) || 0,
    timeblock_arc1: Number(row.timeblock_arc1) || 0,
    timeblock_arc2: Number(row.timeblock_arc2) || 0,
    timeblock_arc3: Number(row.timeblock_arc3) || 0,
    timeblock_arc4: Number(row.timeblock_arc4) || 0,
    unlock_date: (row.unlock_date as string) || null,
    hazard_rank:
      row.hazard_rank !== undefined && row.hazard_rank !== null
        ? Number(row.hazard_rank)
        : null,
  }));
}

export async function syncRawinfoMinusBlacklistToTier1(projectId: string): Promise<{
  totalActive: number;
  excludedCount: number;
}> {
  invalidateVinylCache(projectId);
  return {
    totalActive: 0,
    excludedCount: 0,
  };
}

export async function syncTier2ToTier3(projectId: string, forceClear = true) {
  const tier2Res = await executeOrder<Tier2EventEntry[]>({
    project_id: projectId,
    tier: '2',
    order: { action: 'read_all' },
  });
  const rawEvents = Array.isArray(tier2Res.data) ? tier2Res.data : [];

  // 1. Gather all block events from rawEvents
  const blockedIds: string[] = [];
  for (const evt of rawEvents) {
    if (!evt || !evt.id) continue;
    const act = (evt.action || '').toLowerCase().trim();
    if (act === 'block') {
      blockedIds.push(evt.id);
    }
  }

  // 2. Directly purge any block events from Tier 1 (cascades to Tier 3, Tier 4, and system dbs)
  if (blockedIds.length > 0) {
    await executeOrder({
      project_id: projectId,
      tier: '1',
      order: {
        action: 'batch_delete',
        data: blockedIds,
      },
    });
    blockedIds.forEach((id) => delete tier1MemoryCache[id]);
    invalidateVinylCache(projectId);
  }

  // 3. Process non-blocked rating events for Tier 3 tracks and channels
  const excludedSet = new Set(blockedIds);
  const [currentT3, currentChannels] = await Promise.all([
    fetchTier3State(projectId),
    fetchChannelState(projectId),
  ]);

  const stateMap: Record<string, Tier3StateRecord> = {};
  currentT3.forEach((r) => {
    if (!excludedSet.has(r.id)) {
      stateMap[r.id] = r;
    }
  });

  const channelMap: Record<string, ChannelStateRecord> = { ...currentChannels };
  const modifiedTrackIds = new Set<string>();
  const modifiedChannelIds = new Set<string>();

  for (const evt of rawEvents) {
    if (!evt || !evt.id || excludedSet.has(evt.id)) continue;
    const act = (evt.action || '').toLowerCase().trim();
    if (act === 'block') continue;

    // Check if event is targeted to an entire channel
    if (evt.target_type === 'channel' || (evt.channel_id && evt.channel_id === evt.id)) {
      const chId = evt.channel_id || evt.id;
      if (!channelMap[chId]) {
        channelMap[chId] = {
          channel_id: chId,
          channel_name: evt.channel_name || '',
          score_3_count: [],
          score_4_count: [],
          score_5_count: [],
          score_6_count: [],
          score_7_count: [],
          timeblock_arc0: 0,
          timeblock_arc1: 0,
          timeblock_arc2: 0,
          timeblock_arc3: 0,
          timeblock_arc4: 0,
          unlock_date: null,
        };
      }
      const ch = channelMap[chId];
      if (evt.hazard_rank !== undefined && evt.hazard_rank !== null) {
        (ch as any).hazard_rank = Number(evt.hazard_rank);
      }

      if (act === '3+' || act === 'cancel' || act === 'downvote') {
        ch.score_3_count.push(evt.timestamp);
      } else if (act === '4+') {
        ch.score_4_count.push(evt.timestamp);
      } else if (act === '5+' || act === 'continue') {
        ch.score_5_count.push(evt.timestamp);
      } else if (act === '6+' || act === 'upvote') {
        ch.score_6_count.push(evt.timestamp);
      } else if (act === '7+' || act === 'overflow') {
        ch.score_7_count.push(evt.timestamp);
      }

      if (evt.timeblock) {
        const blocks = Array.isArray(evt.timeblock) ? evt.timeblock : [evt.timeblock];
        blocks.forEach((b) => {
          if (/arc\s*zero|kick/i.test(b)) ch.timeblock_arc0++;
          else if (/arc\s*0?1|morning/i.test(b)) ch.timeblock_arc1++;
          else if (/arc\s*0?2|battle/i.test(b)) ch.timeblock_arc2++;
          else if (/arc\s*0?3|night/i.test(b)) ch.timeblock_arc3++;
          else if (/arc\s*0?4|sacred/i.test(b)) ch.timeblock_arc4++;
        });
      }
      modifiedChannelIds.add(chId);
      continue;
    }

    // Otherwise it's a track-level event
    if (!stateMap[evt.id]) {
      stateMap[evt.id] = {
        id: evt.id,
        score_3_count: [],
        score_4_count: [],
        score_5_count: [],
        score_6_count: [],
        score_7_count: [],
        timeblock_arc0: 0,
        timeblock_arc1: 0,
        timeblock_arc2: 0,
        timeblock_arc3: 0,
        timeblock_arc4: 0,
        unlock_date: null,
        hazard_rank: null,
      };
    }
    const r = stateMap[evt.id];
    if (evt.hazard_rank !== undefined && evt.hazard_rank !== null) {
      r.hazard_rank = Number(evt.hazard_rank);
    }

    if (act === '3+' || act === 'cancel' || act === 'downvote') {
      r.score_3_count.push(evt.timestamp);
    } else if (act === '4+') {
      r.score_4_count.push(evt.timestamp);
    } else if (act === '5+' || act === 'continue') {
      r.score_5_count.push(evt.timestamp);
    } else if (act === '6+' || act === 'upvote') {
      r.score_6_count.push(evt.timestamp);
    } else if (act === '7+' || act === 'overflow') {
      r.score_7_count.push(evt.timestamp);
    }

    if (evt.timeblock) {
      const blocks = Array.isArray(evt.timeblock) ? evt.timeblock : [evt.timeblock];
      blocks.forEach((b) => {
        if (/arc\s*zero|kick/i.test(b)) r.timeblock_arc0++;
        else if (/arc\s*0?1|morning/i.test(b)) r.timeblock_arc1++;
        else if (/arc\s*0?2|battle/i.test(b)) r.timeblock_arc2++;
        else if (/arc\s*0?3|night/i.test(b)) r.timeblock_arc3++;
        else if (/arc\s*0?4|sacred/i.test(b)) r.timeblock_arc4++;
      });
    }
    modifiedTrackIds.add(evt.id);
  }

  // 7. Upsert modified track states into tier_3_data
  if (modifiedTrackIds.size > 0) {
    const t3BatchData: Record<string, Record<string, unknown>> = {};
    for (const id of modifiedTrackIds) {
      if (excludedSet.has(id)) continue;
      const r = stateMap[id];
      t3BatchData[id] = {
        score_3_count: JSON.stringify(r.score_3_count),
        score_4_count: JSON.stringify(r.score_4_count),
        score_5_count: JSON.stringify(r.score_5_count),
        score_6_count: JSON.stringify(r.score_6_count),
        score_7_count: JSON.stringify(r.score_7_count),
        timeblock_arc0: r.timeblock_arc0,
        timeblock_arc1: r.timeblock_arc1,
        timeblock_arc2: r.timeblock_arc2,
        timeblock_arc3: r.timeblock_arc3,
        timeblock_arc4: r.timeblock_arc4,
        unlock_date: r.unlock_date,
        hazard_rank: r.hazard_rank ?? null,
      };
    }

    await executeOrder({
      project_id: projectId,
      tier: '3',
      order: {
        action: 'batch_upsert',
        data: t3BatchData,
      },
    });
  }

  // 8. Upsert modified channel states into channel_state table
  if (modifiedChannelIds.size > 0) {
    const chBatchData: Record<string, Record<string, unknown>> = {};
    for (const chId of modifiedChannelIds) {
      const ch = channelMap[chId];
      chBatchData[chId] = {
        channel_id: ch.channel_id,
        channel_name: ch.channel_name,
        score_3_count: JSON.stringify(ch.score_3_count),
        score_4_count: JSON.stringify(ch.score_4_count),
        score_5_count: JSON.stringify(ch.score_5_count),
        score_6_count: JSON.stringify(ch.score_6_count),
        score_7_count: JSON.stringify(ch.score_7_count),
        timeblock_arc0: ch.timeblock_arc0,
        timeblock_arc1: ch.timeblock_arc1,
        timeblock_arc2: ch.timeblock_arc2,
        timeblock_arc3: ch.timeblock_arc3,
        timeblock_arc4: ch.timeblock_arc4,
        unlock_date: ch.unlock_date,
        updated_at: new Date().toISOString(),
      };
    }

    await executeOrder({
      project_id: projectId,
      tier: 'channel_state',
      order: {
        action: 'batch_upsert',
        data: chBatchData,
      },
    });
  }

  // Clear _2_events.jsonl whenever events have been processed into Tier 3
  if (rawEvents.length > 0 && (forceClear || rawEvents.length >= 15)) {
    await executeOrder({ project_id: projectId, tier: '2', order: { action: 'clear' } });
  }

  return {
    eventsProcessed: rawEvents.length,
    updatedTracksCount: modifiedTrackIds.size,
    updatedChannelsCount: modifiedChannelIds.size,
    blockedCount: blockedIds.length,
    staticSynced: true,
  };
}

export async function syncTier3ToTier4(projectId: string) {
  const [t3Records, channelRecords] = await Promise.all([
    fetchTier3State(projectId),
    fetchChannelState(projectId),
  ]);

  const t4ValidBatchMap: Record<string, Record<string, unknown>> = {};

  // Index individual track ratings
  const trackMap: Record<string, Tier3StateRecord> = {};
  for (const t3 of t3Records) {
    trackMap[t3.id] = t3;
  }

  // Fetch track lists for rated channels to apply channel-wide metadata
  const activeChannelIds = Object.keys(channelRecords);
  const channelTracksMap: Record<string, string[]> = {};

  if (activeChannelIds.length > 0) {
    try {
      const chTracksRes = await executeOrder<Record<string, string[]>>({
        project_id: projectId,
        tier: '1',
        order: {
          action: 'get_channel_tracks',
          data: { channel_ids: activeChannelIds },
        },
      });
      if (chTracksRes.data) {
        Object.assign(channelTracksMap, chTracksRes.data);
      }
    } catch (e) {
      console.warn('[syncTier3ToTier4] Error fetching channel tracks:', e);
    }
  }

  const processedSongIds = new Set<string>();

  // Process all songs belonging to rated channels (channel metadata applies to every song of that channel)
  for (const chId of activeChannelIds) {
    const ch = channelRecords[chId];
    const songsInChannel = channelTracksMap[chId] || [];

    for (const songId of songsInChannel) {
      processedSongIds.add(songId);

      const individualT3 = trackMap[songId];
      let compositeRecord: Tier3StateRecord;

      if (individualT3) {
        compositeRecord = {
          id: songId,
          score_3_count: [...ch.score_3_count, ...individualT3.score_3_count],
          score_4_count: [...ch.score_4_count, ...individualT3.score_4_count],
          score_5_count: [...ch.score_5_count, ...individualT3.score_5_count],
          score_6_count: [...ch.score_6_count, ...individualT3.score_6_count],
          score_7_count: [...ch.score_7_count, ...individualT3.score_7_count],
          timeblock_arc0: ch.timeblock_arc0 + individualT3.timeblock_arc0,
          timeblock_arc1: ch.timeblock_arc1 + individualT3.timeblock_arc1,
          timeblock_arc2: ch.timeblock_arc2 + individualT3.timeblock_arc2,
          timeblock_arc3: ch.timeblock_arc3 + individualT3.timeblock_arc3,
          timeblock_arc4: ch.timeblock_arc4 + individualT3.timeblock_arc4,
          unlock_date: individualT3.unlock_date || ch.unlock_date,
          hazard_rank: individualT3.hazard_rank ?? null,
        };
      } else {
        compositeRecord = {
          id: songId,
          score_3_count: [...ch.score_3_count],
          score_4_count: [...ch.score_4_count],
          score_5_count: [...ch.score_5_count],
          score_6_count: [...ch.score_6_count],
          score_7_count: [...ch.score_7_count],
          timeblock_arc0: ch.timeblock_arc0,
          timeblock_arc1: ch.timeblock_arc1,
          timeblock_arc2: ch.timeblock_arc2,
          timeblock_arc3: ch.timeblock_arc3,
          timeblock_arc4: ch.timeblock_arc4,
          unlock_date: ch.unlock_date,
          hazard_rank: null,
        };
      }

      if (compositeRecord.hazard_rank) {
        const hazard = calculateHazardLevel(compositeRecord);
        t4ValidBatchMap[songId] = {
          id: songId,
          hazard_level: hazard,
          played: calculateTotalPlayed(compositeRecord),
          timeblock: getDominantTimeblock(compositeRecord),
          unlock_date: compositeRecord.unlock_date,
        };
      }
    }
  }

  // Process remaining individual track ratings whose channels weren't batch rated
  for (const t3 of t3Records) {
    if (processedSongIds.has(t3.id)) continue;

    if (t3.hazard_rank) {
      const hazard = calculateHazardLevel(t3);
      t4ValidBatchMap[t3.id] = {
        id: t3.id,
        hazard_level: hazard,
        played: calculateTotalPlayed(t3),
        timeblock: getDominantTimeblock(t3),
        unlock_date: t3.unlock_date,
      };
    }
  }

  if (Object.keys(t4ValidBatchMap).length > 0) {
    await executeOrder({
      project_id: projectId,
      tier: '4',
      order: {
        action: 'batch_upsert',
        data: t4ValidBatchMap,
      },
    });
  }

  invalidateVinylCache(projectId);
  return {
    syncedCount: Object.keys(t4ValidBatchMap).length,
    purgedCount: 0,
    badKpiIds: [],
  };
}

// =============================================================================
// [IMMEDIATE TRACK DELETION FROM POOL]
// Directly removes a blocked track from Tier 1 (_1_static.db) with automatic cascade
// =============================================================================
export async function deleteTrackImmediately(
  projectId: string,
  trackId: string
): Promise<boolean> {
  try {
    const cleanId = String(trackId).trim();
    if (!cleanId) return false;

    // 1. Delete directly from Tier 1 (_1_static.db), which cascades to Tier 3, 4, and system dbs
    await executeOrder({
      project_id: projectId,
      tier: '1',
      order: {
        action: 'delete',
        key: cleanId,
      },
    });

    // 2. Also ensure Tier 3 and 4 explicit delete just in case
    await Promise.all([
      executeOrder({
        project_id: projectId,
        tier: '3',
        order: { action: 'delete', key: cleanId },
      }).catch(() => {}),
      executeOrder({
        project_id: projectId,
        tier: '4',
        order: { action: 'delete', key: cleanId },
      }).catch(() => {}),
    ]);

    // 3. Invalidate local memory cache
    delete tier1MemoryCache[cleanId];
    invalidateVinylCache(projectId);

    return true;
  } catch (err) {
    console.error(`[deleteTrackImmediately] Failed to delete ${trackId}:`, err);
    return false;
  }
}

// =============================================================================
// [BLOCKED TRACKS PERSISTENCE & RETRIEVAL]
// Queries or modifies blocked.db to ensure blocked songs never resurface on re-curling
// =============================================================================
export async function fetchBlockedTrackIds(projectId: string): Promise<string[]> {
  try {
    const res = await executeOrder<Record<string, Record<string, unknown>>>({
      project_id: projectId,
      tier: 'blocked',
      order: { action: 'read_all' },
    });
    return Object.keys(res.data || {});
  } catch (err) {
    console.warn('[Engine] Failed to fetch blocked track IDs:', err);
    return [];
  }
}

export async function unblockTrack(projectId: string, trackId: string): Promise<boolean> {
  try {
    await executeOrder({
      project_id: projectId,
      tier: 'blocked',
      order: { action: 'delete', key: trackId },
    });
    return true;
  } catch (err) {
    console.error(`[Engine] Failed to unblock track ${trackId}:`, err);
    return false;
  }
}

// =============================================================================
// [UNAVAILABLE VIDEOS BUFFER & MANAGEMENT]
// Buffers playback failure IDs to unavailable_videos.jsonl, allows viewing,
// clearing the buffer, or batch-deleting unavailable videos from _1_static.db.
// =============================================================================
export function getUnavailableReason(errorCode?: number): string {
  switch (errorCode) {
    case 100:
      return 'Video Not Found (Deleted / Private)';
    case 101:
    case 150:
      return 'Embed Playback Restricted by Owner';
    case 2:
      return 'Invalid Video ID Parameter';
    case 5:
      return 'HTML5 Player Playback Error';
    default:
      return errorCode ? `Playback Error (Code ${errorCode})` : 'Unavailable / Unplayable';
  }
}

export async function fetchUnavailableVideos(
  projectId: string
): Promise<UnavailableVideoEntry[]> {
  try {
    const res = await executeOrder<UnavailableVideoEntry[]>({
      project_id: projectId,
      tier: 'unavailable',
      order: { action: 'read_all' },
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.warn('[Engine] Failed to fetch unavailable videos:', err);
    return [];
  }
}

export async function bufferUnavailableVideo(
  projectId: string,
  track: PlaylistItem,
  errorCode?: number
): Promise<boolean> {
  try {
    const cleanId = String(track.id).trim();
    if (!cleanId) return false;

    const entry: UnavailableVideoEntry = {
      id: cleanId,
      title: track.title || 'Untitled Track',
      channel: track.channel || 'Unknown Channel',
      channel_id: track.channel_id,
      timestamp: new Date().toISOString(),
      error_code: errorCode,
      reason: getUnavailableReason(errorCode),
    };

    await executeOrder({
      project_id: projectId,
      tier: 'unavailable',
      order: {
        action: 'append',
        data: entry,
      },
    });

    return true;
  } catch (err) {
    console.error(`[Engine] Failed to buffer unavailable track ${track.id}:`, err);
    return false;
  }
}

export async function clearUnavailableBuffer(projectId: string): Promise<boolean> {
  try {
    await executeOrder({
      project_id: projectId,
      tier: 'unavailable',
      order: { action: 'clear' },
    });
    return true;
  } catch (err) {
    console.error('[Engine] Failed to clear unavailable buffer:', err);
    return false;
  }
}

export async function removeUnavailableTrackFromBuffer(
  projectId: string,
  trackId: string
): Promise<boolean> {
  try {
    await executeOrder({
      project_id: projectId,
      tier: 'unavailable',
      order: { action: 'delete', key: trackId },
    });
    return true;
  } catch (err) {
    console.error(`[Engine] Failed to remove track ${trackId} from unavailable buffer:`, err);
    return false;
  }
}

export async function deleteUnavailableVideosAndClearBuffer(
  projectId: string,
  trackIds: string[]
): Promise<{ deletedCount: number; success: boolean }> {
  try {
    const uniqueIds = Array.from(new Set(trackIds.map((id) => String(id).trim()))).filter(Boolean);
    if (uniqueIds.length === 0) {
      await clearUnavailableBuffer(projectId);
      return { deletedCount: 0, success: true };
    }

    // 1. Batch delete from Tier 1 (_1_static.db), cascading to Tier 3 & 4 and recording in blocked.db
    const res = await executeOrder<{ deleted_count?: number }>({
      project_id: projectId,
      tier: '1',
      order: {
        action: 'batch_delete',
        data: uniqueIds,
      },
    });

    const deletedCount = res.data?.deleted_count ?? uniqueIds.length;

    // 2. Invalidate caches
    uniqueIds.forEach((id) => {
      delete tier1MemoryCache[id];
    });
    invalidateVinylCache(projectId);

    // 3. Clear the unavailable buffer
    await clearUnavailableBuffer(projectId);

    return { deletedCount, success: true };
  } catch (err) {
    console.error('[Engine] Failed to delete unavailable videos and clear buffer:', err);
    return { deletedCount: 0, success: false };
  }
}

export async function deleteChannelUnavailableVideos(
  projectId: string,
  channelTrackIds: string[]
): Promise<{ deletedCount: number; success: boolean }> {
  try {
    const uniqueIds = Array.from(new Set(channelTrackIds.map((id) => String(id).trim()))).filter(Boolean);
    if (uniqueIds.length === 0) {
      return { deletedCount: 0, success: true };
    }

    // 1. Batch delete from Tier 1
    const res = await executeOrder<{ deleted_count?: number }>({
      project_id: projectId,
      tier: '1',
      order: {
        action: 'batch_delete',
        data: uniqueIds,
      },
    });

    const deletedCount = res.data?.deleted_count ?? uniqueIds.length;

    // 2. Remove those IDs from the unavailable buffer
    await executeOrder({
      project_id: projectId,
      tier: 'unavailable',
      order: {
        action: 'batch_delete',
        data: uniqueIds,
      },
    });

    // 3. Invalidate caches
    uniqueIds.forEach((id) => {
      delete tier1MemoryCache[id];
    });
    invalidateVinylCache(projectId);

    return { deletedCount, success: true };
  } catch (err) {
    console.error('[Engine] Failed to delete channel unavailable videos:', err);
    return { deletedCount: 0, success: false };
  }
}

// =============================================================================
// [ULTRA-FAST STREAMING SAMPLER FOR VINYL GAMEPLAY]
// Samples random tracks from Tier 1 with channel_name and hazard_level cap support
// =============================================================================
export async function fetchSampledTracks(
  projectId: string,
  limit = 50,
  channelName?: string,
  hazardCap?: number | string | null,
  excludeChannel?: string | string[] | null,
  channels?: string[] | null,
  blockedIds?: string[] | null,  // NEW: immediately excluded blocked song IDs
  includeIds?: string[] | null,  // Handpicked song IDs OR'd with channels (playlist sources)
  onlyUnassignedAlbums?: boolean
): Promise<{
  tracks: PlaylistItem[];
  totalCatalogCount: number;
  statsMap: Record<string, import('../types').TrackDisplayMeta>;
}> {
  const samplePayload: any = { limit };
  if (includeIds && includeIds.length > 0) {
    samplePayload.include_ids = includeIds;
  }
  if (channels && channels.length > 0) {
    samplePayload.channels = channels;
  } else if (channelName && channelName !== 'ALL') {
    samplePayload.channel_name = channelName;
  }
  if (excludeChannel && excludeChannel !== 'NONE' && excludeChannel !== 'ALL') {
    samplePayload.exclude_channel = excludeChannel;
  }
  if (hazardCap !== undefined && hazardCap !== null && hazardCap !== 'ALL' && hazardCap !== 'NONE') {
    samplePayload.hazard_cap = hazardCap;
  }
  // NEW: Pass blocked song IDs for immediate exclusion from pool
  if (blockedIds && blockedIds.length > 0) {
    samplePayload.exclude_ids = blockedIds;
  }
  if (onlyUnassignedAlbums) {
    samplePayload.only_unassigned_albums = true;
  }

  const countPayload: any = {};
  if (includeIds && includeIds.length > 0) {
    countPayload.include_ids = includeIds;
  }
  if (channels && channels.length > 0) {
    countPayload.channels = channels;
  } else if (channelName && channelName !== 'ALL') {
    countPayload.channel_name = channelName;
  }
  if (excludeChannel && excludeChannel !== 'NONE' && excludeChannel !== 'ALL') {
    countPayload.exclude_channel = excludeChannel;
  }
  if (hazardCap !== undefined && hazardCap !== null && hazardCap !== 'ALL' && hazardCap !== 'NONE') {
    countPayload.hazard_cap = hazardCap;
  }
  if (blockedIds && blockedIds.length > 0) {
    countPayload.exclude_ids = blockedIds;
  }
  if (onlyUnassignedAlbums) {
    countPayload.only_unassigned_albums = true;
  }

  const [sampleRes, countRes, channelStateMap] = await Promise.all([
    executeOrder<Record<string, Record<string, unknown>>>({
      project_id: projectId,
      tier: '1',
      order: { action: 'sample', data: samplePayload },
    }),
    executeOrder<{ count: number }>({
      project_id: projectId,
      tier: '1',
      order: { action: 'count', data: countPayload },
    }),
    fetchChannelState(projectId),
  ]);

  const rawSample = sampleRes.data || {};
  const sampleTrackIds = Object.keys(rawSample).map(String);
  const statsMap: Record<string, import('../types').TrackDisplayMeta> = {};
  const hazardRankMap: Record<string, number | null> = {};

  if (sampleTrackIds.length > 0) {
    try {
      const [t4Res, t3Res] = await Promise.all([
        executeOrder<Record<string, Record<string, unknown>>>({
          project_id: projectId,
          tier: '4',
          order: { action: 'batch_read', data: sampleTrackIds },
        }),
        executeOrder<Record<string, Record<string, unknown>>>({
          project_id: projectId,
          tier: '3',
          order: { action: 'batch_read', data: sampleTrackIds },
        }),
      ]);

      if (t4Res.data) {
        Object.entries(t4Res.data).forEach(([id, val]) => {
          let played = 0;
          let hazard_level = 3.0;
          let timeblock: string | null = null;
          let unlock_date: string | null = null;

          if (val && typeof val === 'object' && !Array.isArray(val)) {
            const v = val as Record<string, unknown>;
            played = Number.isInteger(v.played)
              ? (v.played as number)
              : parseInt(String(v.played || 0), 10);
            const rawHazard = Number(v.hazard_level);
            hazard_level = !isNaN(rawHazard) ? rawHazard : 3.0;
            timeblock = (v.timeblock as string) || null;
            unlock_date = (v.unlock_date as string) || null;
          } else if (val !== null && val !== undefined) {
            played = parseInt(String(val), 10);
          }

          statsMap[String(id)] = {
            played: Number.isFinite(played) && played >= 0 ? Math.floor(played) : 0,
            hazard_level: Math.round(hazard_level * 100) / 100,
            timeblock,
            unlock_date,
          };
        });
      }

      if (t3Res.data) {
        Object.entries(t3Res.data).forEach(([id, r]) => {
          if (r && r.hazard_rank !== undefined && r.hazard_rank !== null) {
            hazardRankMap[id] = Number(r.hazard_rank);
          }
        });
      }
    } catch (_) {}
  }

  const tracks: PlaylistItem[] = Object.entries(rawSample)
    .map(([id, val]) => {
      const v = (val as Record<string, unknown>) || {};
      const trackId = String(id).trim();
      const t4 = statsMap[trackId];
      const chId = (v.channel_id as string) || (v.channelId as string) || '';
      const chState = chId ? channelStateMap[chId] : undefined;

      const chHazard = chState ? calculateHazardLevel(chState) : 3.0;
      const chPlayed = chState ? calculateTotalPlayed(chState) : 0;
      const chTimeblock = chState ? getDominantTimeblock(chState) : null;

      const effectiveHazard = t4 ? t4.hazard_level : chHazard;
      const effectivePlayed = t4 ? t4.played : chPlayed;
      const effectiveTimeblock = t4?.timeblock ?? chTimeblock;
      const effectiveRank = hazardRankMap[trackId] ?? null;

      // Update statsMap so track stats are populated
      if (!t4 && chState) {
        statsMap[trackId] = {
          hazard_level: effectiveHazard,
          played: effectivePlayed,
          timeblock: effectiveTimeblock,
          unlock_date: chState.unlock_date,
          hazard_rank: effectiveRank,
        };
      } else if (statsMap[trackId]) {
        statsMap[trackId].hazard_rank = effectiveRank;
      }

      return {
        id: trackId,
        title: (v.title as string) || (v.name as string) || `Track ${id}`,
        channel:
          (v.channel_name as string) ||
          (v.channel as string) ||
          (v.artist as string) ||
          'Unknown Origin',
        channel_id: chId,
        duration: (v.duration as number) ?? null,
        hazard_level: effectiveHazard,
        played: effectivePlayed,
        timeblock: effectiveTimeblock,
        hazard_rank: effectiveRank,
      };
    })
    .filter((t) => t.id && t.id.length >= 8);

  const totalCatalogCount = countRes.data?.count !== undefined ? countRes.data.count : tracks.length;

  return { tracks, totalCatalogCount, statsMap };
}

export async function fetchMoreSampledTracks(
  projectId: string,
  limit = 50,
  channelName?: string,
  hazardCap?: number | string | null,
  excludeChannel?: string | string[] | null,
  channels?: string[] | null,
  blockedIds?: string[] | null,  // NEW: immediately excluded blocked song IDs
  includeIds?: string[] | null,  // Handpicked song IDs OR'd with channels (playlist sources)
  onlyUnassignedAlbums?: boolean
): Promise<PlaylistItem[]> {
  const samplePayload: any = { limit };
  if (includeIds && includeIds.length > 0) {
    samplePayload.include_ids = includeIds;
  }
  if (channels && channels.length > 0) {
    samplePayload.channels = channels;
  } else if (channelName && channelName !== 'ALL') {
    samplePayload.channel_name = channelName;
  }
  if (excludeChannel && excludeChannel !== 'NONE' && excludeChannel !== 'ALL') {
    samplePayload.exclude_channel = excludeChannel;
  }
  if (hazardCap !== undefined && hazardCap !== null && hazardCap !== 'ALL' && hazardCap !== 'NONE') {
    samplePayload.hazard_cap = hazardCap;
  }
  // NEW: Pass blocked song IDs for immediate exclusion from pool
  if (blockedIds && blockedIds.length > 0) {
    samplePayload.exclude_ids = blockedIds;
  }
  if (onlyUnassignedAlbums) {
    samplePayload.only_unassigned_albums = true;
  }

  const [sampleRes, channelStateMap] = await Promise.all([
    executeOrder<Record<string, Record<string, unknown>>>({
      project_id: projectId,
      tier: '1',
      order: { action: 'sample', data: samplePayload },
    }),
    fetchChannelState(projectId),
  ]);

  const rawSample = sampleRes.data || {};
  const sampleTrackIds = Object.keys(rawSample).map(String);
  const statsMap: Record<string, import('../types').TrackDisplayMeta> = {};
  const hazardRankMap: Record<string, number | null> = {};

  if (sampleTrackIds.length > 0) {
    try {
      const [t4Res, t3Res] = await Promise.all([
        executeOrder<Record<string, Record<string, unknown>>>({
          project_id: projectId,
          tier: '4',
          order: { action: 'batch_read', data: sampleTrackIds },
        }),
        executeOrder<Record<string, Record<string, unknown>>>({
          project_id: projectId,
          tier: '3',
          order: { action: 'batch_read', data: sampleTrackIds },
        }),
      ]);

      if (t4Res.data) {
        Object.entries(t4Res.data).forEach(([id, val]) => {
          let played = 0;
          let hazard_level = 3.0;
          let timeblock: string | null = null;
          let unlock_date: string | null = null;

          if (val && typeof val === 'object' && !Array.isArray(val)) {
            const v = val as Record<string, unknown>;
            played = Number.isInteger(v.played)
              ? (v.played as number)
              : parseInt(String(v.played || 0), 10);
            const rawHazard = Number(v.hazard_level);
            hazard_level = !isNaN(rawHazard) ? rawHazard : 3.0;
            timeblock = (v.timeblock as string) || null;
            unlock_date = (v.unlock_date as string) || null;
          } else if (val !== null && val !== undefined) {
            played = parseInt(String(val), 10);
          }

          statsMap[String(id)] = {
            played: Number.isFinite(played) && played >= 0 ? Math.floor(played) : 0,
            hazard_level: Math.round(hazard_level * 100) / 100,
            timeblock,
            unlock_date,
          };
        });
      }

      if (t3Res.data) {
        Object.entries(t3Res.data).forEach(([id, r]) => {
          if (r && r.hazard_rank !== undefined && r.hazard_rank !== null) {
            hazardRankMap[id] = Number(r.hazard_rank);
          }
        });
      }
    } catch (_) {}
  }

  return Object.entries(rawSample)
    .map(([id, val]) => {
      const v = (val as Record<string, unknown>) || {};
      const trackId = String(id).trim();
      const t4 = statsMap[trackId];
      const chId = (v.channel_id as string) || (v.channelId as string) || '';
      const chState = chId ? channelStateMap[chId] : undefined;

      const chHazard = chState ? calculateHazardLevel(chState) : 3.0;
      const chPlayed = chState ? calculateTotalPlayed(chState) : 0;
      const chTimeblock = chState ? getDominantTimeblock(chState) : null;
      const effectiveRank = hazardRankMap[trackId] ?? null;

      return {
        id: trackId,
        title: (v.title as string) || (v.name as string) || `Track ${id}`,
        channel:
          (v.channel_name as string) ||
          (v.channel as string) ||
          (v.artist as string) ||
          'Unknown Origin',
        channel_id: chId,
        duration: (v.duration as number) ?? null,
        hazard_level: t4 ? t4.hazard_level : chHazard,
        played: t4 ? t4.played : chPlayed,
        timeblock: t4?.timeblock ?? chTimeblock,
        hazard_rank: effectiveRank,
      };
    })
    .filter((t) => t.id && t.id.length >= 8);
}

export async function fetchTier4DisplayStats(
  projectId: string,
  trackIds: string[]
): Promise<Record<string, import('../types').TrackDisplayMeta>> {
  if (!trackIds || trackIds.length === 0) return {};
  try {
    const res = await executeOrder<Record<string, Record<string, unknown>>>({
      project_id: projectId,
      tier: '4',
      order: { action: 'batch_read', data: trackIds },
    });
    const result: Record<string, import('../types').TrackDisplayMeta> = {};
    if (res.data) {
      Object.entries(res.data).forEach(([id, val]) => {
        if (val && typeof val === 'object') {
          const v = val as Record<string, unknown>;
          const played = Number.isInteger(v.played)
            ? (v.played as number)
            : parseInt(String(v.played || 0), 10);
          const rawHazard = Number(v.hazard_level);
          const hazard_level = !isNaN(rawHazard) ? rawHazard : 3.0;
          result[id] = {
            played: Number.isFinite(played) && played >= 0 ? Math.floor(played) : 0,
            hazard_level: Math.round(hazard_level * 100) / 100,
            timeblock: (v.timeblock as string) || null,
            unlock_date: (v.unlock_date as string) || null,
          };
        }
      });
    }
    return result;
  } catch (e) {
    console.warn('[Engine] Failed to fetch Tier 4 stats:', e);
    return {};
  }
}

export async function fetchChannelOrigins(
  projectId: string,
  filters?: {
    hazardCap?: string | number | null;
    onlyUnassigned?: boolean;
    excludeChannels?: string[] | null;
    blockedIds?: string[] | null;
    hideEmpty?: boolean;
  }
): Promise<ChannelOriginItem[]> {
  try {
    const payload: any = {};
    if (filters?.hazardCap && filters.hazardCap !== 'ALL' && filters.hazardCap !== 'NONE') {
      payload.hazard_cap = filters.hazardCap;
    }
    if (filters?.onlyUnassigned) {
      payload.only_unassigned_albums = true;
    }
    if (filters?.excludeChannels && filters.excludeChannels.length > 0) {
      payload.exclude_channels = filters.excludeChannels;
    }
    if (filters?.blockedIds && filters.blockedIds.length > 0) {
      payload.exclude_ids = filters.blockedIds;
    }
    if (filters?.hideEmpty !== undefined) {
      payload.hide_empty = filters.hideEmpty;
    }
    const res = await executeOrder<{ channels?: ChannelOriginItem[] }>({
      project_id: projectId,
      tier: '1',
      order: {
        action: 'get_channels',
        data: Object.keys(payload).length > 0 ? payload : undefined,
      },
    });
    return Array.isArray(res.data?.channels) ? res.data.channels : [];
  } catch (e) {
    console.warn('[Engine] Failed to fetch channel origins list:', e);
    return [];
  }
}

// =============================================================================
// [YOUTUBE PLAYLIST INGESTION & CURLER PIPELINE]
// Dynamically discovers and curls new songs from playlists into Tier 1 Database
// =============================================================================
export async function getCurlerPlaylists(projectId: string): Promise<string[]> {
  try {
    const res = await executeOrder<{ playlists?: string[] }>({
      project_id: projectId,
      tier: '1',
      order: { action: 'get_playlists' },
    });
    return Array.isArray(res.data?.playlists) ? res.data.playlists : [];
  } catch (e) {
    console.warn('[Curler] Failed to retrieve stored playlists:', e);
    return [];
  }
}

export async function saveCurlerPlaylists(projectId: string, urls: string[]): Promise<boolean> {
  try {
    await executeOrder({
      project_id: projectId,
      tier: '1',
      order: { action: 'save_playlists', data: { urls } },
    });
    return true;
  } catch (e) {
    console.error('[Curler] Failed to save playlists:', e);
    return false;
  }
}

export async function triggerPlaylistCurl(
  projectId: string,
  options?: {
    urls?: string[];
    max_playlists?: number;
    max_per_playlist?: number;
  }
): Promise<CurlerResult> {
  const res = await executeOrder<CurlerResult>({
    project_id: projectId,
    tier: '1',
    order: {
      action: 'curl_playlists',
      data: options || {},
    },
  });

  // Invalidate any local static caches so new songs can appear immediately
  for (const k in tier1MemoryCache) delete tier1MemoryCache[k];
  invalidateVinylCache(projectId);

  return (
    res.data || {
      status: 'success',
      total_playlists: 0,
      total_scanned_videos: 0,
      total_new_added: 0,
      total_catalog_now: 0,
      reports: [],
    }
  );
}

export async function streamPlaylistIngestion(
  options: {
    urls?: string[];
    max_playlists?: number;
    max_per_playlist?: number;
  },
  onEvent: (event: CurlerStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/curler/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
    signal,
  });

  if (!res.ok) {
    throw new Error(`Curler stream request failed with HTTP ${res.status}`);
  }

  if (!res.body) {
    throw new Error('ReadableStream not supported on response body.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      let readResult;
      try {
        readResult = await reader.read();
      } catch (readErr: any) {
        if (signal?.aborted) throw readErr;
        console.warn('[Curler Stream] Stream read terminated unexpectedly:', readErr);
        onEvent({
          type: 'error',
          category: 'red',
          status: 'network_interrupted',
          message: `Stream connection interrupted: ${readErr?.message || 'Network disconnected'}. Processed songs up to this point are preserved in database.`,
        });
        break;
      }

      const { done, value } = readResult;
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() || '';

      for (const chunk of chunks) {
        const trimmed = chunk.trim();
        if (trimmed.startsWith('data:')) {
          try {
            const jsonStr = trimmed.slice(5).trim();
            if (jsonStr) {
              const eventData = JSON.parse(jsonStr) as CurlerStreamEvent;
              onEvent(eventData);
            }
          } catch (err) {
            console.warn('[Curler Stream] Failed to parse SSE chunk:', err);
          }
        }
      }
    }

    if (buffer.trim().startsWith('data:')) {
      try {
        const jsonStr = buffer.trim().slice(5).trim();
        if (jsonStr) {
          const eventData = JSON.parse(jsonStr) as CurlerStreamEvent;
          onEvent(eventData);
        }
      } catch (_) {}
    }
  } finally {
    // Clear static caches after streaming completes
    for (const k in tier1MemoryCache) delete tier1MemoryCache[k];
    invalidateVinylCache();
  }
}

// =============================================================================
// [PERSISTENT FILTER CONFIGURATION IN TIER 5 DATABASE]
// Persists multi-select excluded channels and filter parameters into _5_config.db
// =============================================================================
export interface SavedFilterConfig {
  excludedChannels: string[];
  hazardCap?: string;
  selectedChannel?: string;
  discoveryMode?: boolean;
  onlyUnassignedAlbums?: boolean;
  foldedSections?: {
    custom?: boolean;
    approved?: boolean;
    cleaning?: boolean;
    raw?: boolean;
  };
}

export async function getFilterConfig(projectId: string): Promise<SavedFilterConfig | null> {
  try {
    const res = await executeOrder<{
      excluded_channels?: string | string[];
      hazard_cap?: string;
      selected_channel?: string;
      discovery_mode?: boolean | number | string;
      only_unassigned_albums?: boolean | number | string;
      folded_sections?: string | Record<string, boolean>;
    }>({
      project_id: projectId,
      tier: '5',
      order: { action: 'read_key', key: 'filter_settings' },
    });
    if (!res.data) return null;

    let excludedChannels: string[] = [];
    const rawEx = res.data.excluded_channels;
    if (Array.isArray(rawEx)) {
      excludedChannels = rawEx.map(String).filter((s) => s && s !== 'NONE' && s !== 'ALL');
    } else if (typeof rawEx === 'string' && rawEx.trim()) {
      try {
        const parsed = JSON.parse(rawEx);
        if (Array.isArray(parsed)) {
          excludedChannels = parsed.map(String).filter((s) => s && s !== 'NONE' && s !== 'ALL');
        } else if (parsed && typeof parsed === 'string') {
          excludedChannels = [parsed];
        }
      } catch {
        excludedChannels = rawEx
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s && s !== 'NONE' && s !== 'ALL');
      }
    }

    const rawDisc = res.data.discovery_mode ?? res.data.only_unassigned_albums;
    const isDisc = rawDisc === true || rawDisc === 1 || rawDisc === '1' || rawDisc === 'true';

    let foldedSections: { custom?: boolean; approved?: boolean; cleaning?: boolean; raw?: boolean } = {
      custom: false,
      approved: false,
      cleaning: false,
      raw: false,
    };
    if (res.data.folded_sections) {
      try {
        const parsed =
          typeof res.data.folded_sections === 'string'
            ? JSON.parse(res.data.folded_sections)
            : res.data.folded_sections;
        if (parsed && typeof parsed === 'object') {
          foldedSections = { ...foldedSections, ...parsed };
        }
      } catch {}
    }

    return {
      excludedChannels,
      hazardCap: res.data.hazard_cap || 'ALL',
      selectedChannel: res.data.selected_channel || 'ALL',
      discoveryMode: isDisc,
      onlyUnassignedAlbums: isDisc,
      foldedSections,
    };
  } catch (e) {
    console.warn('[Engine] Failed to read filter settings from Tier 5:', e);
    return null;
  }
}

export async function saveFilterConfig(
  projectId: string,
  config: SavedFilterConfig
): Promise<boolean> {
  try {
    const payloadData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (config.excludedChannels !== undefined) {
      payloadData.excluded_channels = config.excludedChannels;
    }
    if (config.hazardCap !== undefined) {
      payloadData.hazard_cap = config.hazardCap || 'ALL';
    }
    if (config.selectedChannel !== undefined) {
      payloadData.selected_channel = config.selectedChannel || 'ALL';
    }
    if (config.discoveryMode !== undefined) {
      payloadData.discovery_mode = Boolean(config.discoveryMode);
    } else if (config.onlyUnassignedAlbums !== undefined) {
      payloadData.discovery_mode = Boolean(config.onlyUnassignedAlbums);
    }
    if (config.foldedSections !== undefined) {
      payloadData.folded_sections = JSON.stringify(config.foldedSections);
    }

    await executeOrder({
      project_id: projectId,
      tier: '5',
      order: {
        action: 'upsert',
        key: 'filter_settings',
        data: payloadData,
      },
    });
    return true;
  } catch (e) {
    console.error('[Engine] Failed to persist filter settings to Tier 5:', e);
    return false;
  }
}

// =============================================================================
// [RESILIENT OFFLINE-FIRST EVENT OUTBOX FLUSH]
// Immediately drains all locally queued rating events into _2_events.jsonl on backend
// =============================================================================
export async function flushOfflineEvents(
  projectId: string,
  events: Tier2EventEntry[]
): Promise<{ success: boolean; flushedCount: number }> {
  if (!events || events.length === 0) {
    return { success: true, flushedCount: 0 };
  }

  try {
    const res = await executeOrder<{ appended_count?: number }>({
      project_id: projectId,
      tier: '2',
      order: {
        action: 'batch_append',
        data: events,
      },
    });

    // Also directly purge any flushed block events from Tier 1 immediately
    const blockEvents = events.filter((e) => (e.action || '').toLowerCase().trim() === 'block');
    if (blockEvents.length > 0) {
      const blockedIds = blockEvents.map((b) => b.id);
      try {
        await executeOrder({
          project_id: projectId,
          tier: '1',
          order: { action: 'batch_delete', data: blockedIds },
        });
        blockedIds.forEach((id) => delete tier1MemoryCache[id]);
        invalidateVinylCache(projectId);
      } catch (be) {
        console.warn('[Outbox Flush] Failed to delete blocked tracks from Tier 1:', be);
      }
    }

    return {
      success: true,
      flushedCount: res.data?.appended_count || events.length,
    };
  } catch (err) {
    console.error('[Outbox Flush] Error appending events to backend Tier 2:', err);
    throw err;
  }
}

// =============================================================================
// [SOVEREIGN HAZARD RANK ENGINE ASSIGNMENT]
// Sets or retrieves the Manager's personal explicit hazard_rank (3 to 7) in _3_state.db
// =============================================================================
export async function updateTrackHazardRank(
  projectId: string,
  trackId: string,
  hazardRank: number
): Promise<{ success: boolean; newHazard: number }> {
  try {
    // 1. Fetch current Tier 3 counts if any
    let s5 = 0;
    let s6 = 0;
    let s7 = 0;
    try {
      const curT3 = await executeOrder<Record<string, unknown>>({
        project_id: projectId,
        tier: '3',
        order: { action: 'read_key', key: trackId },
      });
      if (curT3.data) {
        const parseCount = (v: unknown) => {
          if (Array.isArray(v)) return v.length;
          if (typeof v === 'string') {
            try {
              const parsed = JSON.parse(v);
              return Array.isArray(parsed) ? parsed.length : 0;
            } catch {
              return 0;
            }
          }
          return 0;
        };
        s5 = parseCount(curT3.data.score_5_count);
        s6 = parseCount(curT3.data.score_6_count);
        s7 = parseCount(curT3.data.score_7_count);
      }
    } catch (_) {}

    // Sovereign formula: Base = rank - 0.5, k = (8.5 - rank) / 100, S = 4*s7 + 2*s6 + 1*s5
    const base = hazardRank - 0.5;
    const k = (8.5 - hazardRank) / 100.0;
    const S = 4 * s7 + 2 * s6 + 1 * s5;
    const newHazard = Math.round(Math.min(8.5, Math.max(1.0, base + k * S)) * 100) / 100;

    // 2. Persist hazard_rank to _3_state.db (Tier 3)
    await executeOrder({
      project_id: projectId,
      tier: '3',
      order: {
        action: 'upsert',
        key: trackId,
        data: {
          hazard_rank: hazardRank,
        },
      },
    });

    // 3. Immediately project new hazard_level to _4_display.db (Tier 4)
    await executeOrder({
      project_id: projectId,
      tier: '4',
      order: {
        action: 'upsert',
        key: trackId,
        data: {
          hazard_level: newHazard,
        },
      },
    });

    return { success: true, newHazard };
  } catch (err) {
    console.error(`[Engine] Failed to update hazard_rank for track ${trackId}:`, err);
    throw err;
  }
}

export async function fetchTrackHazardRanks(
  projectId: string,
  trackIds: string[]
): Promise<Record<string, number | null>> {
  if (!trackIds || trackIds.length === 0) return {};
  try {
    const res = await executeOrder<Record<string, Record<string, unknown>>>({
      project_id: projectId,
      tier: '3',
      order: {
        action: 'batch_read',
        data: trackIds,
      },
    });
    const result: Record<string, number | null> = {};
    if (res.data) {
      Object.entries(res.data).forEach(([id, row]) => {
        result[id] =
          row && row.hazard_rank !== undefined && row.hazard_rank !== null
            ? Number(row.hazard_rank)
            : null;
      });
    }
    return result;
  } catch (err) {
    console.warn('[Engine] Failed to fetch track hazard ranks from Tier 3:', err);
    return {};
  }
}

// =============================================================================
// [CUSTOM PLAYLISTS CRUD ENGINE]
// 3 types: 'genre' (channels + songs), 'album' (handpicked songs), 'collection' (album IDs)
// Persists to playlists.db (tier: 'playlists')
// =============================================================================

// 12-char HexID derived from the current time in ms (padded; unique-guarded by caller)
export function generatePlaylistHexId(existingIds: string[] = []): string {
  let ms = Date.now();
  let id = ms.toString(16).padStart(12, '0');
  const taken = new Set(existingIds);
  while (taken.has(id)) {
    ms += 1;
    id = ms.toString(16).padStart(12, '0');
  }
  return id;
}

const QUARTER_RE = /^(\d{4})-Q([1-4])$/;

// Parses '2024-Q3' -> { year: 2024, quarter: 3 }; null when not a valid quarter string
export function parseQuarter(value?: string | null): { year: number; quarter: number } | null {
  const m = QUARTER_RE.exec(value || '');
  return m ? { year: Number(m[1]), quarter: Number(m[2]) } : null;
}

// Human label for a quarter range: 'Q1 2024', or 'Q1 2024 → Q2 2025'. Empty when neither end is set.
export function formatQuarterRange(start?: string | null, end?: string | null): string {
  const s = parseQuarter(start);
  const e = parseQuarter(end);
  const fmt = (q: { year: number; quarter: number }) => `Q${q.quarter} ${q.year}`;
  if (s && e) return s.year === e.year && s.quarter === e.quarter ? fmt(s) : `${fmt(s)} → ${fmt(e)}`;
  if (s) return `${fmt(s)} → ?`;
  if (e) return `? → ${fmt(e)}`;
  return '';
}

function normalizePlaylistType(raw: unknown): PlaylistType {
  return raw === 'album' || raw === 'collection' || raw === 'genre_compilation' ? raw : 'genre';
}

// Resolves a playlist into the channels + song IDs it streams. Compilations expand recursively into member playlists.
export function resolvePlaylistSources(
  playlists: CustomPlaylist[],
  playlistId: string,
  visited: Set<string> = new Set()
): { channels: string[]; songIds: string[] } {
  const pl = playlists.find((p) => p.id === playlistId);
  if (!pl || visited.has(pl.id)) return { channels: [], songIds: [] };
  visited.add(pl.id);

  if (pl.type === 'collection' || pl.type === 'genre_compilation') {
    const channels = new Set<string>();
    const songIds = new Set<string>();
    pl.include_playlists.forEach((childId) => {
      const child = resolvePlaylistSources(playlists, childId, visited);
      child.channels.forEach((c) => channels.add(c));
      child.songIds.forEach((s) => songIds.add(s));
    });
    return { channels: [...channels], songIds: [...songIds] };
  }
  if (pl.type === 'album') {
    return { channels: [], songIds: [...pl.include_songs] };
  }
  return { channels: [...pl.include_channels], songIds: [...pl.include_songs] };
}

export async function fetchCustomPlaylists(projectId: string): Promise<CustomPlaylist[]> {
  try {
    const res = await executeOrder<Record<string, Record<string, unknown>>>({
      project_id: projectId,
      tier: 'playlists',
      order: { action: 'read_all' },
    });
    const raw = res.data || {};
    return Object.entries(raw)
      .map(([id, row]) => ({
        id,
        emoji: (row.emoji as string) || '🎵',
        name: (row.name as string) || 'Untitled Playlist',
        type: normalizePlaylistType(row.type),
        compatible_timeblocks: parseJsonArray(row.compatible_timeblocks),
        // Legacy day-based values are ignored: only 'YYYY-Qn' is valid
        date_start: parseQuarter(row.date_start as string) ? (row.date_start as string) : '',
        date_end: parseQuarter(row.date_end as string) ? (row.date_end as string) : '',
        // Legacy rows stored `channels`; treated as mock data and read as genre channels until recreated
        include_playlists: parseJsonArray(row.include_playlists),
        include_channels: parseJsonArray(row.include_channels ?? row.channels),
        include_songs: parseJsonArray(row.include_songs),
        created_at: (row.created_at as string) || new Date().toISOString(),
        updated_at: (row.updated_at as string) || new Date().toISOString(),
        description: (row.description as string) || '',
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  } catch (err) {
    console.warn('[Engine] Failed to fetch custom playlists from Tier Playlists:', err);
    return [];
  }
}

export async function saveCustomPlaylist(
  projectId: string,
  playlist: Partial<CustomPlaylist> & { name: string }
): Promise<CustomPlaylist> {
  const type = normalizePlaylistType(playlist.type);
  const pl: CustomPlaylist = {
    id: playlist.id || generatePlaylistHexId(),
    emoji: playlist.emoji || '🎵',
    name: playlist.name.trim(),
    type,
    compatible_timeblocks: playlist.compatible_timeblocks || [],
    date_start: parseQuarter(playlist.date_start) ? playlist.date_start! : '',
    date_end: parseQuarter(playlist.date_end) ? playlist.date_end! : '',
    // Per-type content rules: album = songs only, collection/genre_compilation = member playlist IDs only, genre = channels + songs
    include_playlists:
      type === 'collection' || type === 'genre_compilation' ? playlist.include_playlists || [] : [],
    include_channels: type === 'genre' ? playlist.include_channels || [] : [],
    include_songs:
      type === 'collection' || type === 'genre_compilation' ? [] : playlist.include_songs || [],
    created_at: playlist.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    description: playlist.description || '',
  };

  await executeOrder({
    project_id: projectId,
    tier: 'playlists',
    order: {
      action: 'upsert',
      key: pl.id,
      data: {
        emoji: pl.emoji,
        name: pl.name,
        type: pl.type,
        compatible_timeblocks: JSON.stringify(pl.compatible_timeblocks),
        date_start: pl.date_start,
        date_end: pl.date_end,
        include_playlists: JSON.stringify(pl.include_playlists),
        include_channels: JSON.stringify(pl.include_channels),
        include_songs: JSON.stringify(pl.include_songs),
        created_at: pl.created_at,
        updated_at: pl.updated_at,
        description: pl.description,
      },
    },
  });

  return pl;
}

export async function deleteCustomPlaylist(
  projectId: string,
  playlistId: string
): Promise<boolean> {
  try {
    await executeOrder({
      project_id: projectId,
      tier: 'playlists',
      order: { action: 'delete', key: playlistId },
    });
    return true;
  } catch (err) {
    console.error('[Engine] Failed to delete custom playlist:', err);
    return false;
  }
}

// =============================================================================
// [ORIGIN CHANNEL HYGIENE & METADATA SERVICES]
// Tracks status (raw -> cleaning -> approved) and purges uncurated channels
// =============================================================================
export async function fetchChannelMeta(
  projectId: string
): Promise<Record<string, { status: ChannelStatus; notes?: string }>> {
  try {
    const res = await executeOrder<Record<string, Record<string, unknown>>>({
      project_id: projectId,
      tier: 'channel_meta',
      order: { action: 'read_all' },
    });
    const raw = res.data || {};
    const result: Record<string, { status: ChannelStatus; notes?: string }> = {};
    for (const [id, row] of Object.entries(raw)) {
      const st = (row.status as string) || 'raw';
      result[id] = {
        status: (st === 'approved' || st === 'cleaning' || st === 'raw' ? st : 'raw') as ChannelStatus,
        notes: (row.notes as string) || undefined,
      };
      if (row.channel_name && typeof row.channel_name === 'string') {
        result[row.channel_name] = result[id];
      }
    }
    return result;
  } catch (err) {
    console.warn('[Engine] Failed to fetch channel metadata:', err);
    return {};
  }
}

export async function updateChannelStatus(
  projectId: string,
  channelId: string,
  channelName: string,
  status: ChannelStatus,
  notes?: string
): Promise<boolean> {
  try {
    await executeOrder({
      project_id: projectId,
      tier: 'channel_meta',
      order: {
        action: 'upsert',
        key: channelId || channelName,
        data: {
          channel_name: channelName,
          status,
          notes: notes || '',
          updated_at: new Date().toISOString(),
        },
      },
    });
    return true;
  } catch (err) {
    console.error(`[Engine] Failed to update channel status for ${channelName}:`, err);
    return false;
  }
}

export async function purgeChannelSongs(
  projectId: string,
  channelName: string,
  channelId?: string
): Promise<{ success: boolean; purged_count: number }> {
  try {
    const res = await executeOrder<{ purged_count?: number; status?: string }>({
      project_id: projectId,
      tier: '1',
      order: {
        action: 'purge_channel',
        data: {
          channel_name: channelName,
          channel_id: channelId,
        },
      },
    });
    invalidateVinylCache(projectId);
    return {
      success: res.data?.status === 'success',
      purged_count: res.data?.purged_count || 0,
    };
  } catch (err) {
    console.error(`[Engine] Failed to purge channel ${channelName}:`, err);
    throw err;
  }
}

export async function fetchAllTracksForChannel(
  projectId: string,
  channelName: string,
  channelId?: string
): Promise<string[]> {
  try {
    const res = await executeOrder<Record<string, string[]>>({
      project_id: projectId,
      tier: '1',
      order: {
        action: 'get_channel_tracks',
        data: {
          channel_name: channelName,
          channel_id: channelId,
        },
      },
    });
    const map = res.data || {};
    const trackSet = new Set<string>();
    if (channelName && map[channelName]) {
      map[channelName].forEach((id) => trackSet.add(id));
    }
    if (channelId && map[channelId]) {
      map[channelId].forEach((id) => trackSet.add(id));
    }
    Object.values(map).forEach((ids) => {
      if (Array.isArray(ids)) {
        ids.forEach((id) => trackSet.add(id));
      }
    });
    return Array.from(trackSet);
  } catch (err) {
    console.warn('[fetchAllTracksForChannel] Error fetching tracks:', err);
    return [];
  }
}
