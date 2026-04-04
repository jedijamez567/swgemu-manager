import { useState } from 'react';
import { useServerStats } from './hooks/useServerStats';
import { useServerVersion } from './hooks/useServerVersion';
import { StatusBanner } from './components/StatusBanner';
import { ServerInfo } from './components/ServerInfo';
import { PlayerStatsSection } from './components/PlayerStats';
import { AiStatsSection } from './components/AiStats';
import { MissionStatsSection } from './components/MissionStats';

const DEFAULT_TOKEN = 'swgemu_secure_api_token_12345';

function App() {
  const [token, setToken] = useState(DEFAULT_TOKEN);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [showRaw, setShowRaw] = useState(false);

  const { stats, prevStats, isConnected, error, lastFetchTime } =
    useServerStats(token, refreshInterval, true);
  const { version } = useServerVersion(token);

  const result = stats?.result;
  const prevResult = prevStats?.result;

  return (
    <div className="app">
      <StatusBanner
        isConnected={isConnected}
        error={error}
        lastFetchTime={lastFetchTime}
        refreshInterval={refreshInterval}
        onRefreshChange={setRefreshInterval}
      />

      <div className="config-bar">
        <label>
          API Token:
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter API token"
          />
        </label>
      </div>

      <main>
        <ServerInfo core={result?.core} version={version} />
        <PlayerStatsSection
          players={result?.players}
          prevPlayers={prevResult?.players}
        />
        <AiStatsSection ai={result?.ai} />
        <MissionStatsSection missions={result?.missionStats} />

        <section>
          <button
            className="raw-toggle"
            onClick={() => setShowRaw(!showRaw)}
          >
            {showRaw ? 'Hide' : 'Show'} Raw JSON
          </button>
          {showRaw && stats && (
            <pre className="raw-json">{JSON.stringify(stats, null, 2)}</pre>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
