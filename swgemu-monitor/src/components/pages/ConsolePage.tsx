import { useState, useCallback } from 'react';
import { runConsoleCommand } from '../../lib/api';
import { ResultDisplay } from '../ResultDisplay';

interface ConsolePageProps {
  token: string;
}

interface HistoryEntry {
  command: string;
  args: string;
  result: unknown;
  error: string | null;
  timestamp: Date;
}

export function ConsolePage({ token }: ConsolePageProps) {
  const [command, setCommand] = useState('');
  const [args, setArgs] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const handleRun = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!command.trim() || loading) return;

      setLoading(true);
      const entry: HistoryEntry = {
        command: command.trim(),
        args: args.trim(),
        result: null,
        error: null,
        timestamp: new Date(),
      };

      try {
        entry.result = await runConsoleCommand(token, command.trim(), args.trim() || undefined);
      } catch (err) {
        entry.error = err instanceof Error ? err.message : 'Command failed';
      } finally {
        setLoading(false);
        setHistory((prev) => [entry, ...prev]);
      }
    },
    [token, command, args, loading]
  );

  return (
    <div className="page">
      <h2>Console</h2>

      <div className="warning-banner">
        Console commands execute immediately on the server. Use with caution.
      </div>

      <form className="console-form" onSubmit={handleRun}>
        <div className="console-inputs">
          <div className="form-field">
            <label className="form-label">Command</label>
            <input
              className="form-input"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="e.g. listAccounts, serverStatus"
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label">Arguments (optional)</label>
            <input
              className="form-input"
              value={args}
              onChange={(e) => setArgs(e.target.value)}
              placeholder="Command arguments"
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading || !command.trim()}>
          {loading ? 'Running...' : 'Run Command'}
        </button>
      </form>

      {history.length > 0 && (
        <div className="subsection">
          <h3>Command History</h3>
          <div className="console-history">
            {history.map((entry, i) => (
              <div key={i} className="console-entry">
                <div className="console-entry-header">
                  <span className="console-cmd">
                    {entry.command}
                    {entry.args ? ` ${entry.args}` : ''}
                  </span>
                  <span className="text-dim">{entry.timestamp.toLocaleTimeString()}</span>
                </div>
                <ResultDisplay result={entry.result} error={entry.error} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
