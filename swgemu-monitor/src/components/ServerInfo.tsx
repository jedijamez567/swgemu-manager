import type { CoreStats, VersionResponse } from '../lib/types';

interface ServerInfoProps {
  core: CoreStats | undefined;
  version: VersionResponse | null;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function ServerInfo({ core, version }: ServerInfoProps) {
  const uptime =
    core?.coreInitializedTimeMs
      ? formatDuration(Date.now() - core.coreInitializedTimeMs)
      : '--';

  const loadTime = core?.coreLoadMs ? formatDuration(core.coreLoadMs) : '--';

  return (
    <section className="card-row">
      <div className="info-card">
        <span className="info-label">Version</span>
        <span className="info-value">
          {version?.result?.core3_version ?? '--'}
        </span>
      </div>
      <div className="info-card">
        <span className="info-label">PID</span>
        <span className="info-value">{core?.pid ?? '--'}</span>
      </div>
      <div className="info-card">
        <span className="info-label">Uptime</span>
        <span className="info-value">{uptime}</span>
      </div>
      <div className="info-card">
        <span className="info-label">Load Time</span>
        <span className="info-value">{loadTime}</span>
      </div>
    </section>
  );
}
