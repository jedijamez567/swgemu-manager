import type { PlayerStats as PlayerStatsType } from '../lib/types';

interface PlayerStatsProps {
  players: PlayerStatsType | undefined;
  prevPlayers: PlayerStatsType | undefined;
}

function MetricCard({
  label,
  value,
  prevValue,
  subtitle,
}: {
  label: string;
  value: number | undefined;
  prevValue?: number;
  subtitle?: string;
}) {
  const delta =
    value !== undefined && prevValue !== undefined ? value - prevValue : null;

  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value ?? '--'}</span>
      {delta !== null && delta !== 0 && (
        <span className={`metric-delta ${delta > 0 ? 'positive' : 'negative'}`}>
          {delta > 0 ? '+' : ''}
          {delta}
        </span>
      )}
      {subtitle && <span className="metric-subtitle">{subtitle}</span>}
    </div>
  );
}

export function PlayerStatsSection({ players, prevPlayers }: PlayerStatsProps) {
  return (
    <section>
      <h2>Players</h2>
      <div className="card-row">
        <MetricCard
          label="Online"
          value={players?.onlineCount}
          prevValue={prevPlayers?.onlineCount}
        />
        <MetricCard
          label="Peak Online"
          value={players?.onlineMax}
          subtitle={players?.onlineMaxWhen}
        />
        <MetricCard
          label="Accounts"
          value={players?.accountsCount}
          prevValue={prevPlayers?.accountsCount}
        />
        <MetricCard
          label="Unique IPs"
          value={players?.distinctIPsCount}
          prevValue={prevPlayers?.distinctIPsCount}
        />
      </div>
    </section>
  );
}
