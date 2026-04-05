interface StatusBannerProps {
  isConnected: boolean;
  error: string | null;
  lastFetchTime: Date | null;
  refreshInterval: number;
  onRefreshChange: (seconds: number) => void;
  galaxyName?: string;
}

export function StatusBanner({
  isConnected,
  error,
  lastFetchTime,
  refreshInterval,
  onRefreshChange,
  galaxyName,
}: StatusBannerProps) {
  return (
    <header className="status-banner">
      <div className="status-banner-left">
        <h1>SWGEmu Server Monitor{galaxyName ? ` — ${galaxyName}` : ''}</h1>
        <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
        <span className="status-text">{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>
      <div className="status-banner-right">
        {lastFetchTime && (
          <span className="last-update">
            Last update: {lastFetchTime.toLocaleTimeString()}
          </span>
        )}
        <label className="refresh-control">
          Refresh:
          <select
            value={refreshInterval}
            onChange={(e) => onRefreshChange(Number(e.target.value))}
          >
            <option value={5}>5s</option>
            <option value={10}>10s</option>
            <option value={30}>30s</option>
            <option value={60}>60s</option>
          </select>
        </label>
      </div>
      {error && !isConnected && (
        <div className="error-bar">Cannot connect to REST API: {error}</div>
      )}
    </header>
  );
}
