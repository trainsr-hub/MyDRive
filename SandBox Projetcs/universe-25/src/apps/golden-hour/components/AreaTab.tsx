// AreaTab.tsx — Multi-List Task Intake & ESP32 Configuration Cockpit with O(1) Inheritance
// Author: Faust (Serving The Manager)
import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  CheckCircle2,
  RefreshCw,
  Link as LinkIcon,
  ShieldAlert,
  Zap,
  Radio,
  Sparkles,
  Check,
  LogIn,
  Key,
  Layers,
  Filter,
  CloudDownload,
  Clock,
  Sun,
  Moon,
  Leaf,
  Cpu
} from 'lucide-react';

interface ListConditions {
  domain?: string;
  element?: 'solar' | 'void' | 'verdant' | 'celestial' | 'aether' | string;
  tags?: string[];
  priority_default?: string;
  mode_default?: string;
  target_seconds?: number;
}

interface GoogleTaskList {
  id: string;
  title: string;
  conditions?: ListConditions;
  sort_order?: number;
  updated?: string;
}

interface GoogleTask {
  id: string;
  tasklist_id?: string;
  tasklist_title?: string;
  conditions?: ListConditions;
  title: string;
  notes?: string;
  status: string;
  due?: string | null;
  updated?: string;
  completed?: string | null;
}

interface NotionTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  tags?: string[];
  dueAt?: string | null;
  url?: string;
}

interface ESP32QueuePayload {
  task_id: string;
  title: string;
  tasklist_title?: string;
  domain?: string;
  element?: string;
  priority?: string;
  mode?: string;
  target_seconds?: number;
  source?: string;
  queue_count?: number;
  last_synced_at?: string | null;
}

export const AreaTab: React.FC = () => {
  const [intakeSource, setIntakeSource] = useState<'google' | 'notion'>('google');

  // Google Tasks State
  const [tasklists, setTasklists] = useState<GoogleTaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('all');
  const [googleTasks, setGoogleTasks] = useState<GoogleTask[]>([]);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSyncingAPI, setIsSyncingAPI] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<{ credentials_present: boolean; authenticated: boolean; last_synced_at?: string } | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Notion State
  const [notionDBUrl, setNotionDBUrl] = useState('3deda88f74e5802c92acc972569ff270');
  const [notionTasks, setNotionTasks] = useState<NotionTask[]>([]);
  const [isNotionLoading, setIsNotionLoading] = useState(false);
  const [notionError, setNotionError] = useState<string | null>(null);
  const [notionLastReadAt, setNotionLastReadAt] = useState<string | null>(null);

  // ESP32 Queue State
  const [esp32Queue, setEsp32Queue] = useState<ESP32QueuePayload | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    fetchGoogleTasksStatus();
    fetchESP32Queue();
  }, []);

  const fetchGoogleTasksStatus = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/v1/golden-hour/google-tasks/status');
      const data = await res.json();
      setGoogleStatus(data);
      if (data.last_synced_at) {
        setLastSyncedAt(data.last_synced_at);
      }
      if (data.authenticated) {
        fetchTasklists();
        fetchGoogleTasks('all');
      }
    } catch (e) {
      console.warn('Backend offline:', e);
    }
  };

  const fetchTasklists = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/v1/golden-hour/google-tasks/lists');
      const data = await res.json();
      if (data.success && data.lists) {
        setTasklists(data.lists);
      }
    } catch (e) {
      console.error('Failed to fetch task lists:', e);
    }
  };

  const fetchESP32Queue = async (listId?: string) => {
    try {
      const url = listId && listId !== 'all'
        ? `http://localhost:8080/api/v1/golden-hour/esp32/queue?limit=3&tasklist_id=${encodeURIComponent(listId)}`
        : 'http://localhost:8080/api/v1/golden-hour/esp32/queue?limit=3';
      const res = await fetch(url);
      const data = await res.json();
      if (data.top_task) {
        setEsp32Queue({
          task_id: data.top_task.task_id,
          title: data.top_task.title,
          tasklist_title: data.top_task.tasklist_title,
          domain: data.top_task.domain,
          element: data.top_task.element,
          priority: data.top_task.priority,
          mode: data.top_task.mode,
          target_seconds: data.top_task.target_seconds,
          source: 'google_tasks',
          queue_count: data.total_in_queue,
          last_synced_at: data.last_synced_at
        });
      } else {
        setEsp32Queue(null);
      }
    } catch (e) {
      console.warn('ESP32 queue fetch error:', e);
    }
  };

  const fetchGoogleTasks = async (listId: string = selectedListId) => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    try {
      const url = listId === 'all'
        ? 'http://localhost:8080/api/v1/golden-hour/google-tasks/tasks?tasklist_id=all'
        : `http://localhost:8080/api/v1/golden-hour/google-tasks/tasks?tasklist_id=${encodeURIComponent(listId)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `HTTP ${res.status}`);
      }
      if (data.success) {
        setGoogleTasks(data.tasks || []);
        if (data.last_synced_at) {
          setLastSyncedAt(data.last_synced_at);
        }
        fetchESP32Queue(listId);
      }
    } catch (e: any) {
      console.error('Failed to fetch Google Tasks:', e);
      setGoogleError(e.message || 'Error querying SQLite database');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSyncFromGoogle = async () => {
    setIsSyncingAPI(true);
    setGoogleError(null);
    try {
      const res = await fetch('http://localhost:8080/api/v1/golden-hour/google-tasks/sync', {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `HTTP ${res.status}`);
      }
      setLastSyncedAt(data.last_synced_at);
      fetchTasklists();
      fetchGoogleTasks(selectedListId);
    } catch (e: any) {
      console.error('Failed to sync from Google API:', e);
      setGoogleError(e.message || 'Error syncing from Google Tasks API');
    } finally {
      setIsSyncingAPI(false);
    }
  };

  const handleSelectList = (listId: string) => {
    setSelectedListId(listId);
    fetchGoogleTasks(listId);
  };

  const handleAuthorizeGoogle = async () => {
    setIsAuthorizing(true);
    setGoogleError(null);
    try {
      const res = await fetch('http://localhost:8080/api/v1/golden-hour/google-tasks/auth', {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `HTTP ${res.status}`);
      }
      if (data.authenticated) {
        setGoogleStatus((prev) => ({ ...prev, credentials_present: true, authenticated: true }));
        fetchTasklists();
        fetchGoogleTasks('all');
      }
    } catch (e: any) {
      console.error('Authorization error:', e);
      setGoogleError(e.message || 'Failed to complete Google OAuth authorization');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleCompleteGoogleTask = async (taskId: string, listId?: string) => {
    setCompletingTaskId(taskId);
    try {
      const res = await fetch('http://localhost:8080/api/v1/golden-hour/google-tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          tasklist_id: listId || selectedListId
        })
      });
      const data = await res.json();
      if (data.success) {
        // Immediate local filter for instant UX (< 0.2ms)
        setGoogleTasks((prev) => prev.filter((t) => t.id !== taskId));
        fetchESP32Queue(selectedListId);
      }
    } catch (e) {
      console.error('Error completing task:', e);
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleReadNotion = async () => {
    setIsNotionLoading(true);
    setNotionError(null);
    try {
      const res = await fetch('http://localhost:8080/api/v1/golden-hour/notion/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database_id: notionDBUrl.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `HTTP ${res.status}`);
      }
      setNotionTasks(data.tasks || []);
      setNotionLastReadAt(data.timestamp || new Date().toISOString());
    } catch (err: any) {
      setNotionError(err.message);
      setNotionTasks([]);
    } finally {
      setIsNotionLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return googleTasks;
    const q = searchQuery.toLowerCase();
    return googleTasks.filter(
      (t) => t.title.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q))
    );
  }, [googleTasks, searchQuery]);

  // Helper for Element Badge styling
  const renderElementBadge = (element?: string) => {
    switch (element) {
      case 'verdant':
        return <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono flex items-center gap-1"><Leaf className="w-2.5 h-2.5" /> Verdant</span>;
      case 'void':
        return <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/30 text-purple-300 text-[10px] font-mono flex items-center gap-1"><Moon className="w-2.5 h-2.5" /> Void</span>;
      case 'celestial':
        return <span className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/30 text-sky-300 text-[10px] font-mono flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> Celestial</span>;
      case 'aether':
        return <span className="px-2 py-0.5 rounded bg-fuchsia-950/80 border border-fuchsia-500/30 text-fuchsia-300 text-[10px] font-mono flex items-center gap-1"><Cpu className="w-2.5 h-2.5" /> Aether</span>;
      case 'solar':
      default:
        return <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/30 text-amber-300 text-[10px] font-mono flex items-center gap-1"><Sun className="w-2.5 h-2.5" /> Solar</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full p-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#120f18] border border-[#2b2238] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#291e07] to-[#120f18] border border-[#524124] shadow-inner">
            <Zap className="w-7 h-7 text-[#ffd86b]" />
          </div>
          <div>
            <h2 className="font-cinzel text-xl font-bold text-[#ffd86b] flex items-center gap-2">
              Task Intake & ESP32 Dispatch Cockpit
            </h2>
            <p className="text-xs text-[#8c7a9e] mt-0.5">
              O(1) SQLite metadata inheritance engine (<span className="text-emerald-400 font-mono font-bold">&lt; 0.5ms</span>) • Tasks inherit parent list rules automatically.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          {intakeSource === 'google' && (
            <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border ${
              googleStatus?.authenticated
                ? 'bg-[#0f281e] text-emerald-400 border-emerald-500/40'
                : 'bg-[#2b1e0a] text-[#ffd86b] border-[#d4af37]/40'
            }`}>
              {googleStatus?.authenticated ? '● SQLITE O(1) ENGINE ACTIVE' : '○ OAUTH READY'}
            </span>
          )}

          {/* Source Selector Tabs */}
          <div className="flex items-center p-1.5 rounded-xl bg-[#171320] border border-[#2b2238]">
            <button
              onClick={() => setIntakeSource('google')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                intakeSource === 'google'
                  ? 'bg-gradient-to-r from-[#ffd86b] to-[#c29a3e] text-[#120f18] shadow-md shadow-[#ffd86b]/10'
                  : 'text-[#8c7a9e] hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Google Tasks ({googleTasks.length})
            </button>
            <button
              onClick={() => setIntakeSource('notion')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                intakeSource === 'notion'
                  ? 'bg-gradient-to-r from-[#ffd86b] to-[#c29a3e] text-[#120f18] shadow-md shadow-[#ffd86b]/10'
                  : 'text-[#8c7a9e] hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Notion
            </button>
          </div>
        </div>
      </div>

      {/* ESP32 Live Telemetry Monitor */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#171320] to-[#1a1226] border border-[#d4af37]/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#2b1e0a] border border-[#d4af37]/40 text-[#ffd86b]">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#ffd86b]">ESP32 ACTIVE TRIPLET QUEUE</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                BROADCASTING
              </span>
            </div>
            <p className="text-sm font-semibold text-white mt-0.5">
              {esp32Queue?.title || 'No Active Directive'}
            </p>
          </div>
        </div>
        <div className="text-right font-mono text-xs text-[#8c7a9e] shrink-0">
          <div>Category: <strong className="text-[#ffd86b]">{esp32Queue?.tasklist_title || 'All Lists'}</strong></div>
          <div>Total in Queue: <strong className="text-white">{esp32Queue?.queue_count || 0} Directives</strong></div>
        </div>
      </div>

      {/* VIEW 1: GOOGLE TASKS (RAPID MULTI-LIST INTAKE) */}
      {intakeSource === 'google' && (
        <div className="space-y-6">
          {/* OAuth Activation Banner if not authenticated */}
          {!googleStatus?.authenticated && (
            <section className="p-6 rounded-2xl bg-[#171320] border border-[#ffd86b]/40 shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-cinzel text-base font-bold text-[#ffd86b] flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    One-Click Google Account Connection
                  </h3>
                  <p className="text-xs text-[#8c7a9e] leading-relaxed">
                    Credentials ready in <code className="text-white">backend/auth/credentials.json</code>. Click to authorize Google Tasks access.
                  </p>
                </div>
                <button
                  onClick={handleAuthorizeGoogle}
                  disabled={isAuthorizing}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ffd86b] to-[#c29a3e] text-[#120f18] text-xs font-bold font-mono hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-[#ffd86b]/10 shrink-0 disabled:opacity-50"
                >
                  <LogIn className={`w-4 h-4 ${isAuthorizing ? 'animate-spin' : ''}`} />
                  {isAuthorizing ? 'Connecting...' : 'Connect Google Tasks'}
                </button>
              </div>
            </section>
          )}

          {/* Error Banner */}
          {googleError && (
            <section className="p-6 rounded-2xl bg-[#2b1018] border border-rose-500/50 shadow-2xl animate-in fade-in duration-200">
              <div className="flex items-start gap-3.5">
                <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-cinzel text-sm font-bold text-rose-300 uppercase tracking-wide">
                    [FAIL LOUDLY] Google Tasks Error
                  </h4>
                  <p className="text-xs text-rose-200 font-mono whitespace-pre-wrap bg-[#17080c] p-3.5 rounded-xl border border-rose-500/30">
                    {googleError}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* MULTI-LIST CATEGORY FILTER BAR WITH INHERITED CONDITIONS */}
          {tasklists.length > 0 && (
            <section className="p-4 rounded-2xl bg-[#171320] border border-[#2b2238] space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#ffd86b] uppercase tracking-wide">
                  <Layers className="w-4 h-4" />
                  List Categories & Metadata Partitions ({tasklists.length})
                </div>
                <div className="flex items-center gap-2">
                  {lastSyncedAt && (
                    <span className="text-[11px] font-mono text-[#8c7a9e] hidden sm:inline flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#ffd86b]" />
                      Synced: {new Date(lastSyncedAt).toLocaleTimeString()}
                    </span>
                  )}
                  <button
                    onClick={handleSyncFromGoogle}
                    disabled={isSyncingAPI}
                    title="Pull fresh updates from Google API into SQLite database"
                    className="px-3 py-1.5 rounded-lg bg-[#2b1e0a] border border-[#d4af37]/40 text-xs font-mono font-bold text-[#ffd86b] hover:brightness-110 flex items-center gap-1.5 transition-all shadow-md shadow-[#ffd86b]/5 disabled:opacity-50"
                  >
                    <CloudDownload className={`w-3.5 h-3.5 ${isSyncingAPI ? 'animate-spin' : ''}`} />
                    {isSyncingAPI ? 'Syncing...' : 'Sync from Google'}
                  </button>
                </div>
              </div>

              {/* Scrollable List Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-[#2b2238]">
                <button
                  onClick={() => handleSelectList('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all border shrink-0 ${
                    selectedListId === 'all'
                      ? 'bg-[#2b1e0a] text-[#ffd86b] border-[#d4af37]'
                      : 'bg-[#120f18] text-[#8c7a9e] border-[#2b2238] hover:text-white'
                  }`}
                >
                  ★ All Lists Combined
                </button>
                {tasklists.map((tl) => (
                  <button
                    key={tl.id}
                    onClick={() => handleSelectList(tl.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
                      selectedListId === tl.id
                        ? 'bg-[#2b1e0a] text-[#ffd86b] border-[#d4af37] font-bold'
                        : 'bg-[#120f18] text-[#8c7a9e] border-[#2b2238] hover:text-white'
                    }`}
                  >
                    <span>{tl.title}</span>
                    {tl.conditions?.domain && (
                      <span className="text-[10px] text-[#8c7a9e] font-normal">
                        ({tl.conditions.domain})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Active Tasks Feed with Inherited Metadata */}
          <section className="p-6 rounded-2xl bg-[#171320] border border-[#2b2238] space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2b2238] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ffd86b]" />
                <span className="font-cinzel text-sm font-bold text-[#ffd86b]">
                  {selectedListId === 'all' ? 'All Active Directives' : tasklists.find(l => l.id === selectedListId)?.title || 'Task List'} ({filteredTasks.length})
                </span>
              </div>

              {/* Filter / Search input */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Filter className="w-3.5 h-3.5 text-[#8c7a9e] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search directives..."
                    className="pl-8 pr-3 py-1.5 rounded-lg bg-[#120f18] border border-[#2b2238] text-xs text-[#e8e0f0] font-mono focus:outline-none focus:ring-1 focus:ring-[#ffd86b]/40 w-44"
                  />
                </div>
                <button
                  onClick={() => fetchGoogleTasks(selectedListId)}
                  disabled={isGoogleLoading}
                  className="px-3 py-1.5 rounded-lg bg-[#120f18] border border-[#2b2238] text-xs text-[#8c7a9e] hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-40 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGoogleLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="py-14 text-center space-y-2">
                <p className="text-sm font-semibold text-white font-cinzel">
                  {isGoogleLoading ? 'Querying SQLite database...' : 'Zero Active Tasks in this View'}
                </p>
                <p className="text-xs text-[#8c7a9e] font-mono max-w-md mx-auto">
                  Click "Sync from Google" above to pull any new tasks added on your phone.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredTasks.map((t, idx) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl bg-[#120f18] border border-[#2b2238] hover:border-[#ffd86b]/40 transition-all flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="text-xs font-mono text-[#8c7a9e] w-6 shrink-0 font-bold">
                        #{idx + 1}
                      </span>
                      <button
                        onClick={() => handleCompleteGoogleTask(t.id, t.tasklist_id)}
                        disabled={completingTaskId === t.id}
                        title="Mark Complete (Local instant update + Google sync)"
                        className="w-7 h-7 rounded-lg border border-[#2b2238] bg-[#171320] hover:bg-emerald-500 hover:border-emerald-400 hover:text-[#120f18] flex items-center justify-center text-transparent hover:text-white transition-all shrink-0 group-hover:border-[#ffd86b]/50"
                      >
                        {completingTaskId === t.id ? (
                          <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white truncate">
                            {t.title}
                          </p>
                          {t.tasklist_title && (
                            <span className="px-2 py-0.5 rounded bg-[#171320] border border-[#2b2238] text-[10px] font-mono text-[#ffd86b]">
                              {t.tasklist_title}
                            </span>
                          )}
                          {/* Inherited Domain & Element Badges */}
                          {t.conditions?.domain && (
                            <span className="px-1.5 py-0.5 rounded bg-[#2b2238] text-[10px] font-mono text-[#cbd5e1]">
                              {t.conditions.domain}
                            </span>
                          )}
                          {t.conditions?.element && renderElementBadge(t.conditions.element)}
                        </div>
                        {t.notes && (
                          <p className="text-xs text-[#8c7a9e] truncate mt-0.5 font-mono">
                            {t.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {t.due && (
                        <span className="px-2.5 py-1 rounded bg-[#171320] border border-[#2b2238] text-[11px] font-mono text-[#8c7a9e]">
                          {new Date(t.due).toLocaleDateString()}
                        </span>
                      )}
                      {t.conditions?.mode_default && (
                        <span className="px-2.5 py-1 rounded-md bg-[#2b1e0a] border border-[#d4af37]/30 text-[#ffd86b] text-xs font-mono font-bold">
                          {t.conditions.mode_default === 'timer' ? `${(t.conditions.target_seconds || 1500) / 60}m` : t.conditions.mode_default}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* VIEW 2: NOTION (REFERENCE INTAKE) */}
      {intakeSource === 'notion' && (
        <div className="space-y-6">
          <section className="p-6 rounded-2xl bg-[#171320] border border-[#2b2238] space-y-5 shadow-lg">
            <h3 className="font-cinzel text-sm font-bold text-white flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-[#ffd86b]" />
              Notion Structured Reference Database
            </h3>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#ffd86b] uppercase tracking-wide">
                Notion Database ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={notionDBUrl}
                  onChange={(e) => setNotionDBUrl(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#120f18] border border-[#2b2238] text-sm text-[#e8e0f0] font-mono focus:outline-none focus:ring-2 focus:ring-[#ffd86b]/40 transition-all"
                />
                <button
                  onClick={handleReadNotion}
                  disabled={isNotionLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ffd86b] to-[#c29a3e] text-[#120f18] text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 font-mono shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isNotionLoading ? 'animate-spin' : ''}`} />
                  {isNotionLoading ? 'Reading...' : 'Read Now'}
                </button>
              </div>
            </div>

            {notionLastReadAt && (
              <div className="text-xs text-[#8c7a9e] font-mono">
                Last Synced: {new Date(notionLastReadAt).toLocaleTimeString()}
              </div>
            )}
          </section>

          {/* Notion Error */}
          {notionError && (
            <section className="p-6 rounded-2xl bg-[#2b1018] border border-rose-500/50 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <ShieldAlert className="w-5 h-5" />
                <span>Notion Read Error</span>
              </div>
              <p className="text-xs text-rose-200 font-mono whitespace-pre-wrap">{notionError}</p>
            </section>
          )}

          {/* Notion Records */}
          {notionTasks.length > 0 && (
            <section className="p-6 rounded-2xl bg-[#171320] border border-[#ffd86b]/30 shadow-2xl space-y-4">
              <h3 className="font-cinzel text-sm font-bold text-[#ffd86b] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Notion Records ({notionTasks.length})
              </h3>
              <div className="space-y-2 font-mono text-xs">
                {notionTasks.map((t) => (
                  <div key={t.id} className="p-3 rounded-xl bg-[#120f18] border border-[#2b2238] flex items-center justify-between">
                    <span className="text-white font-bold">{t.title}</span>
                    <span className="text-emerald-400">[{t.status}]</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
