import { useState } from 'react';
import { useServerStats } from './hooks/useServerStats';
import { useServerVersion } from './hooks/useServerVersion';
import { useGalaxy } from './hooks/useGalaxy';
import { StatusBanner } from './components/StatusBanner';
import { ServerInfo } from './components/ServerInfo';
import { PlayerStatsSection } from './components/PlayerStats';
import { AiStatsSection } from './components/AiStats';
import { MissionStatsSection } from './components/MissionStats';
import { TabNav } from './components/TabNav';
import { PlayersPage } from './components/pages/PlayersPage';
import { ChatPage } from './components/pages/ChatPage';
import { ConfigPage } from './components/pages/ConfigPage';
import { ConsolePage } from './components/pages/ConsolePage';
import { AdminCommandsPage } from './components/pages/AdminCommandsPage';
import type { TabId } from './lib/types';

const DEFAULT_TOKEN = 'swgemu_secure_api_token_12345';

function App() {
  const [token, setToken] = useState(DEFAULT_TOKEN);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [showRaw, setShowRaw] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const { stats, prevStats, isConnected, error, lastFetchTime } =
    useServerStats(token, refreshInterval, true);
  const { version } = useServerVersion(token);
  const { galaxy } = useGalaxy();

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
        galaxyName={galaxy?.name}
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

      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      <main>
        {activeTab === 'dashboard' && (
          <>
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
          </>
        )}

        {activeTab === 'players' && <PlayersPage token={token} galaxy={galaxy} />}
        {activeTab === 'chat' && <ChatPage token={token} />}
        {activeTab === 'config' && <ConfigPage token={token} />}
        {activeTab === 'console' && <ConsolePage token={token} />}
        {activeTab === 'lootgen' && <AdminCommandsPage token={token} />}
      </main>
    </div>
  );
}

export default App;
