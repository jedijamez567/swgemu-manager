import React from 'react';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Person as PlayerIcon,
  Storage as LootIcon,
  Assignment as MissionIcon,
  Public as PlanetIcon,
  PersonAdd as PlayerCreationIcon,
  Code as CommandsIcon,
  Settings as ServerManagementIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Player Manager',
      description: 'Configure player settings, experience rates, and veteran rewards',
      icon: <PlayerIcon sx={{ fontSize: 60, color: theme.palette.primary.main }} />,
      path: '/player-manager',
    },
    {
      title: 'Loot Manager',
      description: 'Adjust loot chances, quality rates, and item stats',
      icon: <LootIcon sx={{ fontSize: 60, color: theme.palette.primary.main }} />,
      path: '/loot-manager',
    },
    {
      title: 'Mission Manager',
      description: 'Modify mission rewards, types, and difficulty settings',
      icon: <MissionIcon sx={{ fontSize: 60, color: theme.palette.primary.main }} />,
      path: '/mission-manager',
    },
    {
      title: 'Planet Manager',
      description: 'Manage planetary settings and configurations',
      icon: <PlanetIcon sx={{ fontSize: 60, color: theme.palette.primary.main }} />,
      path: '/planet-manager',
    },
    {
      title: 'Player Creation',
      description: 'Customize player creation options and starting conditions',
      icon: <PlayerCreationIcon sx={{ fontSize: 60, color: theme.palette.primary.main }} />,
      path: '/player-creation-manager',
    },
    {
      title: 'Commands',
      description: 'Edit skill commands and their effects',
      icon: <CommandsIcon sx={{ fontSize: 60, color: theme.palette.primary.main }} />,
      path: '/commands',
    },
    {
      title: 'Server Management',
      description: 'Restart server, save and manage server configurations',
      icon: <ServerManagementIcon sx={{ fontSize: 60, color: theme.palette.primary.main }} />,
      path: '/server-management',
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          SWGEmu Configuration Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Welcome to the Star Wars Galaxies Emulator Configuration Tool. 
          Select a category below to modify game server settings.
        </Typography>
      </Box>

      {/* Flexbox-based card layout */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3,
        justifyContent: 'center'
      }}>
        {cards.map((card) => (
          <Box key={card.title} sx={{ width: { xs: '100%', sm: '45%', md: '30%' } }}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 6px 12px rgba(255, 223, 0, 0.2)`,
                  border: `1px solid ${theme.palette.primary.main}`,
                },
              }}
            >
              <CardActionArea 
                sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                onClick={() => navigate(card.path)}
              >
                <CardContent sx={{ width: '100%' }}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      mb: 2 
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography gutterBottom variant="h5" component="div" align="center">
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    {card.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Dashboard;
