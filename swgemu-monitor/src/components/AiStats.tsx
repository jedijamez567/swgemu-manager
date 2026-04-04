import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { AiStats as AiStatsType } from '../lib/types';

interface AiStatsProps {
  ai: AiStatsType | undefined;
}

function parseZoneData(ai: AiStatsType) {
  const zones: { zone: string; count: number }[] = [];
  for (const [key, value] of Object.entries(ai)) {
    if (key.startsWith('countAiAgents') && key !== 'countAiAgentsTotal') {
      const zone = key.replace('countAiAgents', '');
      zones.push({ zone, count: value as number });
    }
  }
  return zones.sort((a, b) => b.count - a.count);
}

export function AiStatsSection({ ai }: AiStatsProps) {
  const zoneData = ai ? parseZoneData(ai) : [];

  return (
    <section>
      <h2>AI Agents</h2>
      <div className="card-row">
        <div className="metric-card">
          <span className="metric-label">Total Agents</span>
          <span className="metric-value">{ai?.countAiAgentsTotal ?? '--'}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Active Move Events</span>
          <span className="metric-value">{ai?.activeMoveEvents ?? '--'}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Recovery Events</span>
          <span className="metric-value">{ai?.activeRecoveryEvents ?? '--'}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Exceptions</span>
          <span className="metric-value">{ai?.countExceptions ?? '--'}</span>
        </div>
      </div>
      {zoneData.length > 0 && (
        <div className="chart-container">
          <h3>Agents by Zone</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={zoneData} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" />
              <YAxis type="category" dataKey="zone" width={75} />
              <Tooltip />
              <Bar dataKey="count" fill="#4fc3f7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
