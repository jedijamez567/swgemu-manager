import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { MissionStats as MissionStatsType } from '../lib/types';
import { MISSION_TYPES } from '../lib/types';

interface MissionStatsProps {
  missions: MissionStatsType | undefined;
}

function parseMissionData(missions: MissionStatsType) {
  return MISSION_TYPES.map((type) => ({
    type,
    completed:
      missions[`numberOfCompletedMissions${type}` as keyof MissionStatsType] ?? 0,
    credits:
      missions[`creditsGeneratedFromMissions${type}` as keyof MissionStatsType] ?? 0,
  }));
}

function formatCredits(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

export function MissionStatsSection({ missions }: MissionStatsProps) {
  const data = missions ? parseMissionData(missions) : [];
  const hasData = data.some((d) => d.completed > 0 || d.credits > 0);

  if (!missions) {
    return (
      <section>
        <h2>Missions</h2>
        <p className="no-data">No mission data available</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Missions</h2>
      {hasData ? (
        <div className="charts-row">
          <div className="chart-container">
            <h3>Completed Missions</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data}>
                <XAxis dataKey="type" angle={-35} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" fill="#81c784" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-container">
            <h3>Credits Generated</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data}>
                <XAxis dataKey="type" angle={-35} textAnchor="end" height={60} />
                <YAxis tickFormatter={formatCredits} />
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
                <Bar dataKey="credits" fill="#ffb74d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <p className="no-data">No missions completed yet</p>
      )}
    </section>
  );
}
