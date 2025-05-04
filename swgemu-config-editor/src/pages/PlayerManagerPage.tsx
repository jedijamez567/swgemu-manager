import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Paper,
  Slider,
  TextField,
  Typography,
  useTheme,
  Snackbar,
  Alert,
} from '@mui/material';
import { SaveOutlined as SaveIcon } from '@mui/icons-material';
import luaService from '../services/LuaService';

// Define the structure of player manager properties we want to edit
interface PlayerManagerValues {
  onlineCharactersPerAccount: number;
  allowSameAccountPvpRatingCredit: number;
  performanceBuff: number;
  medicalBuff: number;
  performanceDuration: number;
  medicalDuration: number;
  groupExpMultiplier: number;
  globalExpMultiplier: number;
  baseStoredCreaturePets: number;
  baseStoredFactionPets: number;
  baseStoredDroids: number;
  baseStoredVehicles: number;
  baseStoredShips: number;
}

const PlayerManagerPage: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filePath, setFilePath] = useState('../player_manager/player_manager.lua'); // Adjust the path as needed
  const [fileContent, setFileContent] = useState('');
  const [values, setValues] = useState<PlayerManagerValues>({
    onlineCharactersPerAccount: 5,
    allowSameAccountPvpRatingCredit: 0,
    performanceBuff: 2800,
    medicalBuff: 3200,
    performanceDuration: 18000,
    medicalDuration: 18000,
    groupExpMultiplier: 1.2,
    globalExpMultiplier: 10.0,
    baseStoredCreaturePets: 2,
    baseStoredFactionPets: 3,
    baseStoredDroids: 5,
    baseStoredVehicles: 3,
    baseStoredShips: 3
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
      
      for (const key of Object.keys(updatedValues) as (keyof PlayerManagerValues)[]) {
        if (extractedValues[key] !== undefined) {
          updatedValues[key] = extractedValues[key];
        }
      }
      
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
      
      for (const key of Object.keys(values) as (keyof PlayerManagerValues)[]) {
        updatedContent = luaService.updateSimpleValue(updatedContent, key, values[key]);
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

  // Handle value changes
  const handleValueChange = (key: keyof PlayerManagerValues, value: number) => {
    setValues(prev => ({
      ...prev,
      [key]: value
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
          Player Manager Configuration
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

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          General Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography gutterBottom>Online Characters Per Account: {values.onlineCharactersPerAccount}</Typography>
            <Slider
              value={values.onlineCharactersPerAccount}
              onChange={(_, value) => handleValueChange('onlineCharactersPerAccount', value as number)}
              step={1}
              min={1}
              max={10}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Same Account PVP Rating Credit</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography>Disabled</Typography>
              <Slider
                value={values.allowSameAccountPvpRatingCredit}
                onChange={(_, value) => handleValueChange('allowSameAccountPvpRatingCredit', value as number)}
                step={1}
                min={0}
                max={1}
                marks
                valueLabelDisplay="auto"
              />
              <Typography>Enabled</Typography>
            </Box>
          </Box>
          
          <Box>
            <Typography gutterBottom>Global Experience Multiplier: {values.globalExpMultiplier}x</Typography>
            <Slider
              value={values.globalExpMultiplier}
              onChange={(_, value) => handleValueChange('globalExpMultiplier', value as number)}
              step={0.1}
              min={1}
              max={50}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Group Experience Multiplier: {values.groupExpMultiplier}x</Typography>
            <Slider
              value={values.groupExpMultiplier}
              onChange={(_, value) => handleValueChange('groupExpMultiplier', value as number)}
              step={0.1}
              min={1}
              max={3}
              valueLabelDisplay="auto"
            />
          </Box>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Buff Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography gutterBottom>Performance Buff: {values.performanceBuff}</Typography>
            <Slider
              value={values.performanceBuff}
              onChange={(_, value) => handleValueChange('performanceBuff', value as number)}
              step={100}
              min={1000}
              max={5000}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Medical Buff: {values.medicalBuff}</Typography>
            <Slider
              value={values.medicalBuff}
              onChange={(_, value) => handleValueChange('medicalBuff', value as number)}
              step={100}
              min={1000}
              max={5000}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Performance Duration: {Math.floor(values.performanceDuration / 60)} minutes</Typography>
            <Slider
              value={values.performanceDuration}
              onChange={(_, value) => handleValueChange('performanceDuration', value as number)}
              step={300}
              min={3600}
              max={36000}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${Math.floor(value / 60)} min`}
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Medical Duration: {Math.floor(values.medicalDuration / 60)} minutes</Typography>
            <Slider
              value={values.medicalDuration}
              onChange={(_, value) => handleValueChange('medicalDuration', value as number)}
              step={300}
              min={3600}
              max={36000}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${Math.floor(value / 60)} min`}
            />
          </Box>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Storage Limits
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography gutterBottom>Base Stored Creature Pets: {values.baseStoredCreaturePets}</Typography>
            <Slider
              value={values.baseStoredCreaturePets}
              onChange={(_, value) => handleValueChange('baseStoredCreaturePets', value as number)}
              step={1}
              min={1}
              max={10}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Base Stored Faction Pets: {values.baseStoredFactionPets}</Typography>
            <Slider
              value={values.baseStoredFactionPets}
              onChange={(_, value) => handleValueChange('baseStoredFactionPets', value as number)}
              step={1}
              min={1}
              max={10}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Base Stored Droids: {values.baseStoredDroids}</Typography>
            <Slider
              value={values.baseStoredDroids}
              onChange={(_, value) => handleValueChange('baseStoredDroids', value as number)}
              step={1}
              min={1}
              max={15}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Base Stored Vehicles: {values.baseStoredVehicles}</Typography>
            <Slider
              value={values.baseStoredVehicles}
              onChange={(_, value) => handleValueChange('baseStoredVehicles', value as number)}
              step={1}
              min={1}
              max={10}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Base Stored Ships: {values.baseStoredShips}</Typography>
            <Slider
              value={values.baseStoredShips}
              onChange={(_, value) => handleValueChange('baseStoredShips', value as number)}
              step={1}
              min={1}
              max={10}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
        </Box>
      </Paper>
      
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PlayerManagerPage;
