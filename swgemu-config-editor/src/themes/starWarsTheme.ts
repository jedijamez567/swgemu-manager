import { createTheme } from '@mui/material/styles';

// Star Wars themed color palette
const starWarsColors = {
  // Empire colors
  imperialDark: '#1A1A1A',
  imperialGray: '#444444',
  imperialRed: '#BB0000',
  
  // Rebel colors
  rebelBlue: '#0077BB',
  rebelOrange: '#FF6600',
  
  // Jedi/Sith colors
  lightsaberBlue: '#0088FF',
  lightsaberGreen: '#00CC66',
  lightsaberRed: '#FF0000',
  
  // UI colors
  background: '#121212',
  backgroundLight: '#242424',
  primaryText: '#F0F0F0',
  secondaryText: '#AAAAAA',
  highlight: '#FFDF00', // Star Wars yellow
  
  // Status colors
  success: '#00BB00',
  warning: '#FFAA00',
  error: '#DD0000',
  info: '#00AAFF',
};

// Create a dark Star Wars theme
const starWarsTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: starWarsColors.highlight,
      dark: '#D4BC00',
      light: '#FFEA40',
      contrastText: '#000000',
    },
    secondary: {
      main: starWarsColors.rebelBlue,
      dark: '#005C8F',
      light: '#4397D3',
      contrastText: '#FFFFFF',
    },
    error: {
      main: starWarsColors.lightsaberRed,
      dark: '#BB0000',
      light: '#FF3333',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: starWarsColors.rebelOrange,
      dark: '#CC5200',
      light: '#FF884D',
      contrastText: '#000000',
    },
    info: {
      main: starWarsColors.lightsaberBlue,
      dark: '#006AC0',
      light: '#40A3FF',
      contrastText: '#FFFFFF',
    },
    success: {
      main: starWarsColors.lightsaberGreen,
      dark: '#00A352',
      light: '#4DDB96',
      contrastText: '#000000',
    },
    background: {
      default: starWarsColors.background,
      paper: starWarsColors.backgroundLight,
    },
    text: {
      primary: starWarsColors.primaryText,
      secondary: starWarsColors.secondaryText,
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.05em',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: starWarsColors.imperialDark,
          borderBottom: `1px solid ${starWarsColors.highlight}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: starWarsColors.imperialDark,
          borderRight: `1px solid ${starWarsColors.highlight}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          borderColor: `rgba(255, 223, 0, 0.2)`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: `1px solid ${starWarsColors.imperialGray}`,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: `rgba(255, 223, 0, 0.3)`,
            },
            '&:hover fieldset': {
              borderColor: `rgba(255, 223, 0, 0.5)`,
            },
            '&.Mui-focused fieldset': {
              borderColor: starWarsColors.highlight,
            },
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: `rgba(255, 223, 0, 0.15)`,
            '&:hover': {
              backgroundColor: `rgba(255, 223, 0, 0.25)`,
            },
          },
        },
      },
    },
  },
});

export default starWarsTheme;
