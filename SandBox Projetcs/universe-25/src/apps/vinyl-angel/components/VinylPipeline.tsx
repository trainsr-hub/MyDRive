// =============================================================================
// [VINYL ANGEL ETL PIPELINE COMPONENT]
// =============================================================================
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { executeOrder } from '../../../services/api';
import {
  syncTier2ToTier3,
  syncTier3ToTier4,
  fetchTier3State,
  syncRawinfoMinusBlacklistToTier1
} from '../services/engine';
import type { Tier2EventEntry, Tier3StateRecord } from '../types';
import { Flame, Zap, Gauge, Sparkles, CheckCircle2, ShieldBan, RefreshCw } from 'lucide-react';

export const VinylPipeline: FC<{ projectId?: string }> = ({ projectId = 'music_app' }) => {
  const targetProjectId = !projectId || projectId === 'vinyl_angel' ? 'music_app' : projectId;

  const [tier2Buffer, setTier2Buffer] = useState<Tier2EventEntry[]>([]);
  const [tier3StateList, setTier3StateList] = useState<Tier3StateRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const resT2 = await executeOrder<Tier2EventEntry[]>({
        project_id: targetProjectId,
        tier: '2',
        order: { action: 'read_all' },
      });
      setTier2Buffer(Array.isArray(resT2.data) ? resT2.data : []);
      const t3 = await fetchTier3State(targetProjectId);
      setTier3StateList(t3);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetProjectId]);

  const handleT2ToT3 = async () => {
    setIsProcessing(true);
    const startTime = performance.now();
    try {
      const res = await syncTier2ToTier3(targetProjectId);
      const durationMs = Math.round(performance.now() - startTime);
      let msg = `⚡ Ingested ${res.eventsProcessed} events into Tier 3 (${res.updatedTracksCount} tracks updated in ${durationMs}ms)!`;
      if (res.blockedCount > 0) {
        msg += ` | 🚫 Blocked ${res.blockedCount} tracks & excluded from _1_static.db`;
      }
      setToast(msg);
      await loadData();
    } catch (e) {
      setToast(`❌ Error: ${e}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleT3ToT4 = async () => {
    setIsProcessing(true);
    const startTime = performance.now();
    try {
      const res = await syncTier3ToTier4(targetProjectId);
      const durationMs = Math.round(performance.now() - startTime);
      let msg = `👑 Projected Hazard for ${res.syncedCount} tracks into Tier 4 in ${durationMs}ms!`;
      if (res.purgedCount > 0) {
        msg += ` | ☣️ Purged ${res.purgedCount} bad KPI tracks (< 2.0) into bad_kpi_list.db & excluded from _1_static.db`;
      }
      setToast(msg);
      await loadData();
    } catch (e) {
      setToast(`❌ Error: ${e}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFull = async () => {
    setIsProcessing(true);
    const startTime = performance.now();
    try {
      const t2Res = await syncTier2ToTier3(targetProjectId);
      const t3Res = await syncTier3ToTier4(targetProjectId);
      const durationMs = Math.round(performance.now() - startTime);
      let msg = `✨ Full Pipeline complete in ${durationMs}ms: ${t2Res.eventsProcessed} events ingested, ${t3Res.syncedCount} T4 views projected!`;
      if (t2Res.blockedCount > 0) {
        msg += ` (🚫 ${t2Res.blockedCount} blacklisted)`;
      }
      if (t3Res.purgedCount > 0) {
        msg += ` (☣️ ${t3Res.purgedCount} bad KPI purged)`;
      }
      setToast(msg);
      await loadData();
    } catch (e) {
      setToast(`❌ Error: ${e}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualStaticPrune = async () => {
    setIsProcessing(true);
    try {
      const res = await syncRawinfoMinusBlacklistToTier1(targetProjectId);
      setToast(`🛡️ Excluded ${res.excludedCount} Blacklisted & Bad KPI tracks from _1_static.db.`);
    } catch (e) {
      setToast(`❌ Error pruning _1_static.db: ${e}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#120f18] border border-[#2b2238] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-[#b82333]" />
            <h2 className="font-cinzel text-base font-bold text-[#ffd86b]">
              Vinyl Angel Ultra-Fast Data Pipeline
            </h2>
          </div>
          <p className="text-xs text-[#8c7a9e]">
            Batched Ingestion ➔ Memory-Speed State Aggregation ➔ Single-Transaction T4 Projection
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleManualStaticPrune}
            disabled={isProcessing}
            title="Lọc thủ công: Loại trừ danh sách Blacklist & Bad KPI khỏi _1_static.db"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#171320] hover:bg-[#20192e] border border-[#3d304f] text-[#a78bfa] text-xs font-semibold font-cinzel transition disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Exclude Violations
          </button>
          <button
            onClick={handleT2ToT3}
            disabled={isProcessing || tier2Buffer.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1a1424] border border-[#841822] text-[#ff6b7b] text-xs font-semibold font-cinzel transition disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" /> Step 1: T2 ➔ T3 ({tier2Buffer.length})
          </button>
          <button
            onClick={handleT3ToT4}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1a1424] border border-[#524124] text-[#ffd86b] text-xs font-semibold font-cinzel transition disabled:opacity-50"
          >
            <Gauge className="w-3.5 h-3.5" /> Step 2: T3 ➔ T4 Hazard
          </button>
          <button
            onClick={handleFull}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black font-cinzel font-bold text-xs shadow-gold-md hover:brightness-110 transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" /> Full Pipeline
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-4 rounded-xl bg-[#1c1824] border border-[#d4af37] text-xs text-[#ffd86b] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-[#100d16] border border-[#261d33] space-y-3">
          <h3 className="font-cinzel text-xs font-bold text-[#ff6b7b]">Tier 2 Events Buffer ({tier2Buffer.length})</h3>
          <div className="h-96 overflow-y-auto space-y-2 text-xs font-mono">
            {tier2Buffer.length === 0 ? (
              <div className="p-8 text-center text-[#685c78]">Buffer is empty.</div>
            ) : (
              tier2Buffer.map((evt, i) => {
                const isBlock = (evt.action || '').toLowerCase() === 'block';
                return (
                  <div key={i} className={`p-2.5 rounded border space-y-1 ${isBlock ? 'bg-[#2b0c10] border-[#841822]' : 'bg-[#171320] border-[#2b2238]'}`}>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[#ffd86b] font-bold">{evt.id}</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold flex items-center gap-1 ${isBlock ? 'bg-[#4d0d16] text-[#ff6b7b]' : 'bg-[#201a2b] text-emerald-400'}`}>
                        {isBlock && <ShieldBan className="w-2.5 h-2.5" />}
                        {evt.action}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#8c7a9e]">Epoch: {evt.timestamp}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2 p-5 rounded-xl bg-[#100d16] border border-[#261d33] space-y-3">
          <h3 className="font-cinzel text-xs font-bold text-[#ffd86b]">Tier 3 State Matrices ({tier3StateList.length})</h3>
          <div className="h-96 overflow-y-auto space-y-2 text-xs font-mono">
            {tier3StateList.map((st) => (
              <div key={st.id} className="p-3 rounded-lg bg-[#171320] border border-[#2b2238] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-[#ffd86b]">{st.id}</span>
                  <div className="flex gap-1.5 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-[#2b1016] text-[#ff6b7b]">3+: {st.score_3_count.length}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#1e1b29] text-[#a49bad]">4+: {st.score_4_count.length}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#13261a] text-emerald-400">5+: {st.score_5_count.length}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#1a2030] text-sky-400">6+: {st.score_6_count.length}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#2d2210] text-amber-400">7+: {st.score_7_count.length}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VinylPipeline;
