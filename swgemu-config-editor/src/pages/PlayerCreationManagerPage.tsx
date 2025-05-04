import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
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
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from '@mui/material';
import { SaveOutlined as SaveIcon } from '@mui/icons-material';
import luaService from '../services/LuaService';

// Define the structure of player creation manager properties we want to edit
interface PlayerCreationManagerValues {
  freeGodMode: boolean;
  startingCash: number;
  startingBank: number;
  skillPoints: number;
  professions: string[];
}

const PlayerCreationManagerPage: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filePath, setFilePath] = useState('../player_creation_manager/player_creation_manager.lua');
  const [fileContent, setFileContent] = useState('');
  const [values, setValues] = useState<PlayerCreationManagerValues>({
    freeGodMode: false,
    startingCash: 100,
    startingBank: 1000,
    skillPoints: 250,
    professions: []
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
      
      // Handle freeGodMode
      if (extractedValues.freeGodMode !== undefined) {
        updatedValues.freeGodMode = Number(extractedValues.freeGodMode) === 1;
      }
      
      // Handle numeric values
      if (extractedValues.startingCash !== undefined) {
        updatedValues.startingCash = Number(extractedValues.startingCash);
      }
      
      if (extractedValues.startingBank !== undefined) {
        updatedValues.startingBank = Number(extractedValues.startingBank);
      }
      
      if (extractedValues.skillPoints !== undefined) {
        updatedValues.skillPoints = Number(extractedValues.skillPoints);
      }
      
      // Handle professions array
      if (extractedValues.professions && Array.isArray(extractedValues.professions)) {
        updatedValues.professions = extractedValues.professions;
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
      
      // Update freeGodMode
      updatedContent = luaService.updateSimpleValue(updatedContent, 'freeGodMode', values.freeGodMode ? 1 : 0);
      
      // Update numeric values
      updatedContent = luaService.updateSimpleValue(updatedContent, 'startingCash', values.startingCash);
      updatedContent = luaService.updateSimpleValue(updatedContent, 'startingBank', values.startingBank);
      updatedContent = luaService.updateSimpleValue(updatedContent, 'skillPoints', values.skillPoints);
      
      // Note: We're not modifying the professions array since it's more complex and would require
      // additional parsing logic to update correctly in the Lua file
      
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

  // Handle value changes for numeric values
  const handleValueChange = (key: keyof PlayerCreationManagerValues, value: number) => {
    setValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle value changes for boolean values
  const handleBooleanChange = (key: keyof PlayerCreationManagerValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues(prev => ({
      ...prev,
      [key]: event.target.checked
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
          Player Creation Manager
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
          <FormControlLabel
            control={
              <Switch 
                checked={values.freeGodMode} 
                onChange={handleBooleanChange('freeGodMode')}
                color="warning"
              />
            }
            label={
              <Tooltip title="Give admin abilities to all new characters. Use with caution!">
                <Typography>
                  Enable Free God Mode
                </Typography>
              </Tooltip>
            }
          />
          
          <Box>
            <Typography gutterBottom>Starting Cash Credits: {values.startingCash}</Typography>
            <Slider
              value={values.startingCash}
              onChange={(_, value) => handleValueChange('startingCash', value as number)}
              step={100}
              min={0}
              max={10000}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Starting Bank Credits: {values.startingBank}</Typography>
            <Slider
              value={values.startingBank}
              onChange={(_, value) => handleValueChange('startingBank', value as number)}
              step={500}
              min={0}
              max={50000}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Starting Skill Points: {values.skillPoints}</Typography>
            <Slider
              value={values.skillPoints}
              onChange={(_, value) => handleValueChange('skillPoints', value as number)}
              step={10}
              min={0}
              max={500}
              valueLabelDisplay="auto"
            />
          </Box>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Available Professions
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          The following professions are currently configured for character creation. Editing profession list requires manual file editing.
        </Typography>
        <List>
          {values.professions.map((profession, index) => (
            <ListItem key={index}>
              <ListItemText 
                primary={profession ? `${profession.charAt(0).toUpperCase()}${profession.slice(1).replace(/_/g, ' ')}` : 'Unknown Profession'} 
              />
            </ListItem>
          ))}
        </List>
      </Paper>
      
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PlayerCreationManagerPage;
