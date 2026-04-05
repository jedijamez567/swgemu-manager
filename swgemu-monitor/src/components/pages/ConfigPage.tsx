import { useState, useEffect, useCallback } from 'react';
import { fetchConfig, updateConfig, resetStats } from '../../lib/api';
import { ResultDisplay } from '../ResultDisplay';
import { ConfirmDialog } from '../ConfirmDialog';

interface ConfigPageProps {
  token: string;
}

function ConfigTree({
  data,
  path,
  token,
}: {
  data: Record<string, unknown>;
  path: string;
  token: string;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saveResult, setSaveResult] = useState<{ key: string; result: unknown } | null>(null);
  const [saveError, setSaveError] = useState<{ key: string; error: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (fullKey: string) => {
    setSaving(true);
    setSaveResult(null);
    setSaveError(null);
    try {
      const result = await updateConfig(token, fullKey, editValue);
      setSaveResult({ key: fullKey, result });
      setEditingKey(null);
    } catch (err) {
      setSaveError({ key: fullKey, error: err instanceof Error ? err.message : 'Failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="config-tree">
      {Object.entries(data).map(([key, value]) => {
        const fullKey = path ? `${path}/${key}` : key;

        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          return (
            <ConfigTreeNode key={key} label={key}>
              <ConfigTree data={value as Record<string, unknown>} path={fullKey} token={token} />
            </ConfigTreeNode>
          );
        }

        const displayValue = Array.isArray(value) ? JSON.stringify(value) : String(value ?? '');

        return (
          <div key={key} className="config-entry">
            <span className="config-key">{key}</span>
            {editingKey === key ? (
              <div className="config-edit">
                <input
                  className="form-input config-edit-input"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave(fullKey);
                    if (e.key === 'Escape') setEditingKey(null);
                  }}
                  autoFocus
                />
                <button className="btn btn-primary btn-sm" disabled={saving} onClick={() => handleSave(fullKey)}>
                  {saving ? '...' : 'Save'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditingKey(null)}>
                  Cancel
                </button>
              </div>
            ) : (
              <span className="config-value" onClick={() => { setEditingKey(key); setEditValue(displayValue); }}>
                {displayValue}
              </span>
            )}
            {saveResult?.key === fullKey && (
              <span className="config-save-ok">Saved</span>
            )}
            {saveError?.key === fullKey && (
              <span className="config-save-err">{saveError.error}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConfigTreeNode({ label, children }: { label: string; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="config-node">
      <button className="config-node-toggle" onClick={() => setExpanded(!expanded)}>
        <span className="config-node-arrow">{expanded ? '\u25BC' : '\u25B6'}</span>
        <span className="config-node-label">{label}</span>
      </button>
      {expanded && <div className="config-node-children">{children}</div>}
    </div>
  );
}

export function ConfigPage({ token }: ConfigPageProps) {
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetResult, setResetResult] = useState<unknown>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch Core3 config specifically — the bare /config/ endpoint crashes the cpprest SDK
      const result = await fetchConfig(token, 'Core3');
      setConfig(result.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load config');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleResetStats = async () => {
    setConfirmReset(false);
    setResetLoading(true);
    setResetError(null);
    setResetResult(null);
    try {
      const result = await resetStats(token);
      setResetResult(result);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="page">
      <h2>Server Configuration</h2>

      {loading && <div className="no-data">Loading configuration...</div>}
      {error && <div className="error-bar">{error}</div>}

      {config && (
        <div className="config-container">
          <div className="config-header">
            <span className="text-dim">Click any value to edit it. Press Enter to save, Escape to cancel.</span>
            <button className="btn btn-secondary btn-sm" onClick={loadConfig}>
              Refresh
            </button>
          </div>
          <ConfigTree data={config} path="" token={token} />
        </div>
      )}

      <div className="subsection">
        <h3>Statistics</h3>
        <button
          className="btn btn-danger"
          disabled={resetLoading}
          onClick={() => setConfirmReset(true)}
        >
          {resetLoading ? 'Resetting...' : 'Reset Statistics'}
        </button>
        <ResultDisplay result={resetResult} error={resetError} loading={resetLoading} />
      </div>

      {confirmReset && (
        <ConfirmDialog
          title="Reset Statistics"
          message="Are you sure you want to reset all server statistics? This cannot be undone."
          confirmLabel="Reset"
          danger
          onConfirm={handleResetStats}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}
