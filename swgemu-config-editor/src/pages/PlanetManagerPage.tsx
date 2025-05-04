import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControlLabel,
  Paper,
  Slider,
  Switch,
  TextField,
  Typography,
  useTheme,
  Snackbar,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { SaveOutlined as SaveIcon } from '@mui/icons-material';
import luaService from '../services/LuaService';

// Define the structure of planet manager properties we want to edit
interface PlanetManagerValues {
  shuttleportAwayTime: number;
  starportAwayTime: number;
  shuttleportLandingTime: number;
  starportLandingTime: number;
  shuttleportLandedTime: number;
  starportLandedTime: number;
  planetWeatherEnabled: Record<string, boolean>;
  planetGcwEnabled: Record<string, boolean>;
}

// List of planets in the game
const planets = [
  'corellia',
  'dantooine',
  'dathomir',
  'endor',
  'lok',
  'naboo',
  'rori',
  'talus',
  'tatooine',
  'yavin4'
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PlanetManagerPage: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filePath, setFilePath] = useState('../planet_manager/planet_manager.lua');
  const [fileContent, setFileContent] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [values, setValues] = useState<PlanetManagerValues>({
    shuttleportAwayTime: 300,
    starportAwayTime: 60,
    shuttleportLandingTime: 11,
    starportLandingTime: 14,
    shuttleportLandedTime: 120,
    starportLandedTime: 120,
    planetWeatherEnabled: planets.reduce((acc, planet) => ({ ...acc, [planet]: true }), {}),
    planetGcwEnabled: planets.reduce((acc, planet) => ({ ...acc, [planet]: true }), {})
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Load the file when the component mounts
  useEffect(() => {
    loadFile();
  }, []);

  // Handle loading the Lua file
  const loadFile = async () => {
    try {
      setLoading(true);
      const content = await luaService.readLuaFile(filePath);
      setFileContent(content);
      
      // Extract values from the file
      const extractedValues = luaService.extractValues(content);
      
      // Update our state with the extracted values
      const updatedValues = { ...values };
      
      // Handle global timing settings
      if (extractedValues.shuttleportAwayTime !== undefined) {
        updatedValues.shuttleportAwayTime = Number(extractedValues.shuttleportAwayTime);
      }
      
      if (extractedValues.starportAwayTime !== undefined) {
        updatedValues.starportAwayTime = Number(extractedValues.starportAwayTime);
      }
      
      if (extractedValues.shuttleportLandingTime !== undefined) {
        updatedValues.shuttleportLandingTime = Number(extractedValues.shuttleportLandingTime);
      }
      
      if (extractedValues.starportLandingTime !== undefined) {
        updatedValues.starportLandingTime = Number(extractedValues.starportLandingTime);
      }
      
      if (extractedValues.shuttleportLandedTime !== undefined) {
        updatedValues.shuttleportLandedTime = Number(extractedValues.shuttleportLandedTime);
      }
      
      if (extractedValues.starportLandedTime !== undefined) {
        updatedValues.starportLandedTime = Number(extractedValues.starportLandedTime);
      }
      
      // Handle planet-specific settings
      const planetWeatherEnabled: Record<string, boolean> = { ...updatedValues.planetWeatherEnabled };
      const planetGcwEnabled: Record<string, boolean> = { ...updatedValues.planetGcwEnabled };
      
      for (const planet of planets) {
        if (extractedValues[planet] && typeof extractedValues[planet] === 'object') {
          const planetData = extractedValues[planet];
          
          if (planetData.weatherEnabled !== undefined) {
            planetWeatherEnabled[planet] = Number(planetData.weatherEnabled) === 1;
          }
          
          if (planetData.gcwEnabled !== undefined) {
            planetGcwEnabled[planet] = Number(planetData.gcwEnabled) === 1;
          }
        }
      }
      
      updatedValues.planetWeatherEnabled = planetWeatherEnabled;
      updatedValues.planetGcwEnabled = planetGcwEnabled;
      
      setValues(updatedValues);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load file:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load file. Check the console for details.',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  // Handle saving the updated values back to the file
  const saveFile = async () => {
    try {
      setSaving(true);
      
      // Update file content with our new values
      let updatedContent = fileContent;
      
      // Update global timing settings
      const globalSettings = [
        'shuttleportAwayTime',
        'starportAwayTime',
        'shuttleportLandingTime',
        'starportLandingTime',
        'shuttleportLandedTime',
        'starportLandedTime'
      ];
      
      for (const setting of globalSettings) {
        updatedContent = luaService.updateSimpleValue(
          updatedContent, 
          setting, 
          values[setting as keyof PlanetManagerValues] as number
        );
      }
      
      // Update planet-specific settings
      for (const planet of planets) {
        // Create regex pattern to find the planet's weather and gcw enabled settings
        const weatherEnabledPattern = new RegExp(`(${planet}\\s*=\\s*{[^}]*?)(weatherEnabled\\s*=\\s*\\d)([^}]*})`, 's');
        const gcwEnabledPattern = new RegExp(`(${planet}\\s*=\\s*{[^}]*?)(gcwEnabled\\s*=\\s*\\d)([^}]*})`, 's');
        
        const weatherValue = values.planetWeatherEnabled[planet] ? 1 : 0;
        const gcwValue = values.planetGcwEnabled[planet] ? 1 : 0;
        
        updatedContent = updatedContent.replace(
          weatherEnabledPattern, 
          `$1weatherEnabled = ${weatherValue}$3`
        );
        
        updatedContent = updatedContent.replace(
          gcwEnabledPattern, 
          `$1gcwEnabled = ${gcwValue}$3`
        );
      }
      
      // Write the updated content back to the file
      await luaService.writeLuaFile(filePath, updatedContent);
      
      // Save successful
      setFileContent(updatedContent);
      setSnackbar({
        open: true,
        message: 'Changes saved successfully!',
        severity: 'success'
      });
      
      setSaving(false);
    } catch (error) {
      console.error('Failed to save file:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save changes. Check the console for details.',
        severity: 'error'
      });
      setSaving(false);
    }
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle value changes for number values
  const handleValueChange = (key: keyof PlanetManagerValues, value: number) => {
    setValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle planet setting changes
  const handlePlanetSettingChange = (settingType: 'planetWeatherEnabled' | 'planetGcwEnabled', planet: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues(prev => ({
      ...prev,
      [settingType]: {
        ...prev[settingType],
        [planet]: event.target.checked
      }
    }));
  };

  // Close the snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Planet Manager Configuration
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<SaveIcon />}
          onClick={saveFile}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            aria-label="planet configuration tabs"
          >
            <Tab label="Global Settings" />
            {planets.map((planet, index) => (
              <Tab key={planet} label={planet.charAt(0).toUpperCase() + planet.slice(1)} />
            ))}
          </Tabs>
        </Box>
        
        {/* Global Settings Tab */}
        <TabPanel value={tabValue} index={0}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Shuttle Timing Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography gutterBottom>Shuttleport Away Time: {values.shuttleportAwayTime} seconds</Typography>
                <Slider
                  value={values.shuttleportAwayTime}
                  onChange={(_, value) => handleValueChange('shuttleportAwayTime', value as number)}
                  step={10}
                  min={30}
                  max={600}
                  valueLabelDisplay="auto"
                />
              </Box>
              
              <Box>
                <Typography gutterBottom>Starport Away Time: {values.starportAwayTime} seconds</Typography>
                <Slider
                  value={values.starportAwayTime}
                  onChange={(_, value) => handleValueChange('starportAwayTime', value as number)}
                  step={5}
                  min={10}
                  max={300}
                  valueLabelDisplay="auto"
                />
              </Box>
              
              <Box>
                <Typography gutterBottom>Shuttleport Landing Time: {values.shuttleportLandingTime} seconds</Typography>
                <Slider
                  value={values.shuttleportLandingTime}
                  onChange={(_, value) => handleValueChange('shuttleportLandingTime', value as number)}
                  step={1}
                  min={5}
                  max={30}
                  valueLabelDisplay="auto"
                />
              </Box>
              
              <Box>
                <Typography gutterBottom>Starport Landing Time: {values.starportLandingTime} seconds</Typography>
                <Slider
                  value={values.starportLandingTime}
                  onChange={(_, value) => handleValueChange('starportLandingTime', value as number)}
                  step={1}
                  min={5}
                  max={30}
                  valueLabelDisplay="auto"
                />
              </Box>
              
              <Box>
                <Typography gutterBottom>Shuttleport Landed Time: {values.shuttleportLandedTime} seconds</Typography>
                <Slider
                  value={values.shuttleportLandedTime}
                  onChange={(_, value) => handleValueChange('shuttleportLandedTime', value as number)}
                  step={10}
                  min={30}
                  max={300}
                  valueLabelDisplay="auto"
                />
              </Box>
              
              <Box>
                <Typography gutterBottom>Starport Landed Time: {values.starportLandedTime} seconds</Typography>
                <Slider
                  value={values.starportLandedTime}
                  onChange={(_, value) => handleValueChange('starportLandedTime', value as number)}
                  step={10}
                  min={30}
                  max={300}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Box>
          </Paper>
        </TabPanel>
        
        {/* Planet-specific Tabs */}
        {planets.map((planet, index) => (
          <TabPanel key={planet} value={tabValue} index={index + 1}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {planet.charAt(0).toUpperCase() + planet.slice(1)} Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={values.planetWeatherEnabled[planet]} 
                      onChange={handlePlanetSettingChange('planetWeatherEnabled', planet)}
                    />
                  }
                  label="Enable Weather Effects"
                />
                
                <FormControlLabel
                  control={
                    <Switch 
                      checked={values.planetGcwEnabled[planet]} 
                      onChange={handlePlanetSettingChange('planetGcwEnabled', planet)}
                    />
                  }
                  label="Enable Galactic Civil War"
                />
              </Box>
            </Paper>
          </TabPanel>
        ))}
      </Box>
      
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PlanetManagerPage;
