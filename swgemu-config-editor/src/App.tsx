import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import starWarsTheme from './themes/starWarsTheme';
import Dashboard from './pages/Dashboard';
import PlayerManagerPage from './pages/PlayerManagerPage';
import LootManagerPage from './pages/LootManagerPage';
import MissionManagerPage from './pages/MissionManagerPage';
import PlanetManagerPage from './pages/PlanetManagerPage';
import PlayerCreationManagerPage from './pages/PlayerCreationManagerPage';
import CommandsPage from './pages/CommandsPage';
import ServerManagementPage from './pages/ServerManagementPage';
import Layout from './components/Layout';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={starWarsTheme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/player-manager" element={<PlayerManagerPage />} />
            <Route path="/loot-manager" element={<LootManagerPage />} />
            <Route path="/mission-manager" element={<MissionManagerPage />} />
            <Route path="/planet-manager" element={<PlanetManagerPage />} />
            <Route path="/player-creation-manager" element={<PlayerCreationManagerPage />} />
            <Route path="/commands" element={<CommandsPage />} />
            <Route path="/server-management" element={<ServerManagementPage />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
};

export default App;
