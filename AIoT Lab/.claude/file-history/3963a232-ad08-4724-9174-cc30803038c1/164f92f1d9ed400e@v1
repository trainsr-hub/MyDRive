import React from 'react';
import { Database, Key, Moon, Sun, RefreshCw, Plus, Layers, Table as TableIcon, PanelLeft, Zap, Sparkles, Scissors } from 'lucide-react';

interface HeaderProps {
  mode: 'schema' | 'data';
  setMode: (m: 'schema' | 'data') => void;
  isConnected: boolean;
  isSyncing: boolean;
  onSync: () => void;
  onOpenAuth: () => void;
  hasAuthKey: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onNewRecord?: () => void;
  isMobile: boolean;
  onToggleOutliner?: () => void;
  isOutlinerOpen?: boolean;
  onSwitchToHazard?: () => void;
  onSwitchToPrompt?: () => void;
  onSwitchToHair?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  isConnected,
  isSyncing,
  onSync,
  onOpenAuth,
  hasAuthKey,
  theme,
  toggleTheme,
  onNewRecord,
  isMobile,
  onToggleOutliner,
  isOutlinerOpen,
  onSwitchToHazard,
  onSwitchToPrompt,
  onSwitchToHair,
}) => {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.6rem 1rem',
      borderBottom: '1px solid var(--border-light)',
      background: 'var(--bg-card)',
      gap: '0.75rem',
      flexWrap: 'nowrap',
      zIndex: 10,
    }}>
      {/* Brand & Connection */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {onToggleOutliner && (
          <button
            onClick={onToggleOutliner}
            title={isOutlinerOpen ? 'Hide Workspace Outliner' : 'Show Workspace Outliner'}
            style={{
              background: isOutlinerOpen ? 'var(--accent-bg)' : 'transparent',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              color: isOutlinerOpen ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            <PanelLeft size={16} />
          </button>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontWeight: 700,
          fontSize: '16px',
          letterSpacing: '-0.02em',
          cursor: 'pointer',
        }}>
          <span style={{ color: 'var(--accent)' }}>PK</span>
          <span style={{ color: 'var(--text-primary)' }}>Network</span>
          <span className="badge" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>Edge</span>
        </div>

        {/* Status Dot */}
        <div
          title={isConnected ? 'Turso Cloud SQLite: Online' : 'Turso Offline / Checking...'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.2rem 0.5rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-light)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: isConnected ? 'var(--success)' : 'var(--text-dim)',
          }}
        >
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: isConnected ? 'var(--success)' : 'var(--danger)',
            boxShadow: isConnected ? '0 0 6px var(--success)' : 'none',
          }} />
          {!isMobile && <span>{isConnected ? 'Turso Live' : 'Offline'}</span>}
        </div>
      </div>

      {/* Mode Switcher */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-canvas)',
        padding: '2px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-light)',
      }}>
        <button
          onClick={() => setMode('schema')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'calc(var(--radius-sm) - 2px)',
            border: 'none',
            background: mode === 'schema' ? 'var(--accent)' : 'transparent',
            color: mode === 'schema' ? '#000' : 'var(--text-tertiary)',
            fontWeight: mode === 'schema' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.15s ease',
          }}
        >
          <Layers size={14} />
          <span>Schema</span>
        </button>

        <button
          onClick={() => setMode('data')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'calc(var(--radius-sm) - 2px)',
            border: 'none',
            background: mode === 'data' ? 'var(--accent)' : 'transparent',
            color: mode === 'data' ? '#000' : 'var(--text-tertiary)',
            fontWeight: mode === 'data' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.15s ease',
          }}
        >
          <TableIcon size={14} />
          <span>Data Entry</span>
        </button>
      </div>

      {/* Subdomain Switchers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {onSwitchToHazard && (
          <button
            onClick={onSwitchToHazard}
            title="Switch to Hazard Trigger Arena Subdomain"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              background: 'rgba(2, 132, 199, 0.15)',
              color: '#38bdf8',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
            <Zap size={14} />
            {!isMobile && <span>Hazard Trigger</span>}
          </button>
        )}

        {onSwitchToPrompt && (
          <button
            onClick={onSwitchToPrompt}
            title="Switch to Prompt Studio Subdomain"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={14} />
            {!isMobile && <span>Prompt Studio</span>}
          </button>
        )}

        {onSwitchToHair && (
          <button
            onClick={onSwitchToHair}
            title="Switch to Hair Visual Codex Subdomain"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              background: 'rgba(244, 63, 94, 0.15)',
              color: '#fb7185',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
            <Scissors size={14} />
            {!isMobile && <span>Hair Codex</span>}
          </button>
        )}
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {mode === 'data' && onNewRecord && (
          <button className="btn primary" onClick={onNewRecord} title="Create new record">
            <Plus size={15} />
            {!isMobile && <span>New Record</span>}
          </button>
        )}

        <button
          className="btn icon-only"
          onClick={onSync}
          disabled={isSyncing}
          title="Sync with Turso Cloud"
        >
          <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
        </button>

        <button
          className="btn icon-only"
          onClick={onOpenAuth}
          title={hasAuthKey ? 'Auth Key: Saved' : 'Enter Passcode / Auth Key'}
          style={{ color: hasAuthKey ? 'var(--accent)' : 'var(--text-dim)' }}
        >
          <Key size={14} />
        </button>

        <button
          className="btn icon-only"
          onClick={toggleTheme}
          title="Toggle Light / Dark Mode"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  );
};
