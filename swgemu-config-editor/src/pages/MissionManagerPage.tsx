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
} from '@mui/material';
import { SaveOutlined as SaveIcon } from '@mui/icons-material';
import luaService from '../services/LuaService';

// Define the structure of mission manager properties we want to edit
interface MissionManagerValues {
  enableFactionalCraftingMissions: boolean;
  enableFactionalReconMissions: boolean;
  enableFactionalEntertainerMissions: boolean;
  enableSameAccountBountyMissions: boolean;
  playerBountyKillBufferMinutes: number;
  playerBountyDebuffLengthDays: number;
  destroyMissionBaseDistance: number;
  destroyMissionDifficultyDistanceFactor: number;
  destroyMissionRandomDistance: number;
  destroyMissionDifficultyRandomDistance: number;
  destroyMissionBaseReward: number;
  destroyMissionDifficultyRewardFactor: number;
  destroyMissionRandomReward: number;
  destroyMissionDifficultyRandomReward: number;
}

const MissionManagerPage: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filePath, setFilePath] = useState('../mission_manager/mission_manager.lua');
  const [fileContent, setFileContent] = useState('');
  const [values, setValues] = useState<MissionManagerValues>({
    enableFactionalCraftingMissions: true,
    enableFactionalReconMissions: true,
    enableFactionalEntertainerMissions: true,
    enableSameAccountBountyMissions: false,
    playerBountyKillBufferMinutes: 30,
    playerBountyDebuffLengthDays: 3,
    destroyMissionBaseDistance: 100,
    destroyMissionDifficultyDistanceFactor: 0,
    destroyMissionRandomDistance: 100,
    destroyMissionDifficultyRandomDistance: 0,
    destroyMissionBaseReward: 10000,
    destroyMissionDifficultyRewardFactor: 375,
    destroyMissionRandomReward: 10000,
    destroyMissionDifficultyRandomReward: 15
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
      
      // Handle boolean values (stored as strings in Lua)
      if (extractedValues.enable_factional_crafting_missions !== undefined) {
        updatedValues.enableFactionalCraftingMissions = extractedValues.enable_factional_crafting_missions === "true";
      }
      
      if (extractedValues.enable_factional_recon_missions !== undefined) {
        updatedValues.enableFactionalReconMissions = extractedValues.enable_factional_recon_missions === "true";
      }
      
      if (extractedValues.enable_factional_entertainer_missions !== undefined) {
        updatedValues.enableFactionalEntertainerMissions = extractedValues.enable_factional_entertainer_missions === "true";
      }
      
      if (extractedValues.enable_same_account_bounty_missions !== undefined) {
        updatedValues.enableSameAccountBountyMissions = extractedValues.enable_same_account_bounty_missions === "true";
      }
      
      // Convert time values from milliseconds to more readable units
      if (extractedValues.playerBountyKillBuffer !== undefined) {
        updatedValues.playerBountyKillBufferMinutes = extractedValues.playerBountyKillBuffer / (60 * 1000);
      }
      
      if (extractedValues.playerBountyDebuffLength !== undefined) {
        updatedValues.playerBountyDebuffLengthDays = extractedValues.playerBountyDebuffLength / (24 * 60 * 60 * 1000);
      }
      
      // Handle direct numeric mappings
      // Handle direct numeric values individually
      if (extractedValues.destroyMissionBaseDistance !== undefined) {
        updatedValues.destroyMissionBaseDistance = Number(extractedValues.destroyMissionBaseDistance);
      }
      
      if (extractedValues.destroyMissionDifficultyDistanceFactor !== undefined) {
        updatedValues.destroyMissionDifficultyDistanceFactor = Number(extractedValues.destroyMissionDifficultyDistanceFactor);
      }
      
      if (extractedValues.destroyMissionRandomDistance !== undefined) {
        updatedValues.destroyMissionRandomDistance = Number(extractedValues.destroyMissionRandomDistance);
      }
      
      if (extractedValues.destroyMissionDifficultyRandomDistance !== undefined) {
        updatedValues.destroyMissionDifficultyRandomDistance = Number(extractedValues.destroyMissionDifficultyRandomDistance);
      }
      
      if (extractedValues.destroyMissionBaseReward !== undefined) {
        updatedValues.destroyMissionBaseReward = Number(extractedValues.destroyMissionBaseReward);
      }
      
      if (extractedValues.destroyMissionDifficultyRewardFactor !== undefined) {
        updatedValues.destroyMissionDifficultyRewardFactor = Number(extractedValues.destroyMissionDifficultyRewardFactor);
      }
      
      if (extractedValues.destroyMissionRandomReward !== undefined) {
        updatedValues.destroyMissionRandomReward = Number(extractedValues.destroyMissionRandomReward);
      }
      
      if (extractedValues.destroyMissionDifficultyRandomReward !== undefined) {
        updatedValues.destroyMissionDifficultyRandomReward = Number(extractedValues.destroyMissionDifficultyRandomReward);
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
      
      // Update boolean values
      updatedContent = luaService.updateSimpleValue(updatedContent, 'enable_factional_crafting_missions', values.enableFactionalCraftingMissions ? "true" : "false");
      updatedContent = luaService.updateSimpleValue(updatedContent, 'enable_factional_recon_missions', values.enableFactionalReconMissions ? "true" : "false");
      updatedContent = luaService.updateSimpleValue(updatedContent, 'enable_factional_entertainer_missions', values.enableFactionalEntertainerMissions ? "true" : "false");
      updatedContent = luaService.updateSimpleValue(updatedContent, 'enable_same_account_bounty_missions', values.enableSameAccountBountyMissions ? "true" : "false");
      
      // Update time values (convert from minutes/days back to milliseconds)
      updatedContent = luaService.updateSimpleValue(updatedContent, 'playerBountyKillBuffer', values.playerBountyKillBufferMinutes * 60 * 1000);
      updatedContent = luaService.updateSimpleValue(updatedContent, 'playerBountyDebuffLength', values.playerBountyDebuffLengthDays * 24 * 60 * 60 * 1000);
      
      // Update numeric values
      const directMappings: Record<string, keyof MissionManagerValues> = {
        destroyMissionBaseDistance: 'destroyMissionBaseDistance',
        destroyMissionDifficultyDistanceFactor: 'destroyMissionDifficultyDistanceFactor',
        destroyMissionRandomDistance: 'destroyMissionRandomDistance',
        destroyMissionDifficultyRandomDistance: 'destroyMissionDifficultyRandomDistance',
        destroyMissionBaseReward: 'destroyMissionBaseReward',
        destroyMissionDifficultyRewardFactor: 'destroyMissionDifficultyRewardFactor',
        destroyMissionRandomReward: 'destroyMissionRandomReward',
        destroyMissionDifficultyRandomReward: 'destroyMissionDifficultyRandomReward'
      };
      
      for (const [luaKey, stateKey] of Object.entries(directMappings)) {
        updatedContent = luaService.updateSimpleValue(updatedContent, luaKey, values[stateKey]);
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

  // Handle value changes for boolean values
  const handleBooleanChange = (key: keyof MissionManagerValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues(prev => ({
      ...prev,
      [key]: event.target.checked
    }));
  };

  // Handle value changes for number values
  const handleValueChange = (key: keyof MissionManagerValues, value: number) => {
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
          Mission Manager Configuration
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
          Mission Types Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={<Switch checked={values.enableFactionalCraftingMissions} onChange={handleBooleanChange('enableFactionalCraftingMissions')} />}
            label="Enable Factional Crafting Missions"
          />
          
          <FormControlLabel
            control={<Switch checked={values.enableFactionalReconMissions} onChange={handleBooleanChange('enableFactionalReconMissions')} />}
            label="Enable Factional Recon Missions"
          />
          
          <FormControlLabel
            control={<Switch checked={values.enableFactionalEntertainerMissions} onChange={handleBooleanChange('enableFactionalEntertainerMissions')} />}
            label="Enable Factional Entertainer Missions"
          />
          
          <FormControlLabel
            control={<Switch checked={values.enableSameAccountBountyMissions} onChange={handleBooleanChange('enableSameAccountBountyMissions')} />}
            label="Enable Same Account Bounty Missions"
          />
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Bounty Hunter Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography gutterBottom>Player Bounty Kill Buffer: {values.playerBountyKillBufferMinutes} minutes</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Time before a player bounty can be reposted after target is killed
            </Typography>
            <Slider
              value={values.playerBountyKillBufferMinutes}
              onChange={(_, value) => handleValueChange('playerBountyKillBufferMinutes', value as number)}
              step={5}
              min={0}
              max={120}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value} min`}
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Player Bounty Debuff Length: {values.playerBountyDebuffLengthDays} days</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Time before a player's bounty resets from the minimum amount
            </Typography>
            <Slider
              value={values.playerBountyDebuffLengthDays}
              onChange={(_, value) => handleValueChange('playerBountyDebuffLengthDays', value as number)}
              step={1}
              min={1}
              max={14}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value} days`}
            />
          </Box>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Destroy Mission Distance Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography gutterBottom>Base Distance: {values.destroyMissionBaseDistance}</Typography>
            <Slider
              value={values.destroyMissionBaseDistance}
              onChange={(_, value) => handleValueChange('destroyMissionBaseDistance', value as number)}
              step={10}
              min={10}
              max={500}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Difficulty Distance Factor: {values.destroyMissionDifficultyDistanceFactor}</Typography>
            <Slider
              value={values.destroyMissionDifficultyDistanceFactor}
              onChange={(_, value) => handleValueChange('destroyMissionDifficultyDistanceFactor', value as number)}
              step={1}
              min={0}
              max={50}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Random Distance: {values.destroyMissionRandomDistance}</Typography>
            <Slider
              value={values.destroyMissionRandomDistance}
              onChange={(_, value) => handleValueChange('destroyMissionRandomDistance', value as number)}
              step={10}
              min={0}
              max={500}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Difficulty Random Distance: {values.destroyMissionDifficultyRandomDistance}</Typography>
            <Slider
              value={values.destroyMissionDifficultyRandomDistance}
              onChange={(_, value) => handleValueChange('destroyMissionDifficultyRandomDistance', value as number)}
              step={1}
              min={0}
              max={50}
              valueLabelDisplay="auto"
            />
          </Box>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Destroy Mission Reward Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography gutterBottom>Base Reward: {values.destroyMissionBaseReward} credits</Typography>
            <Slider
              value={values.destroyMissionBaseReward}
              onChange={(_, value) => handleValueChange('destroyMissionBaseReward', value as number)}
              step={1000}
              min={1000}
              max={50000}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Difficulty Reward Factor: {values.destroyMissionDifficultyRewardFactor}</Typography>
            <Slider
              value={values.destroyMissionDifficultyRewardFactor}
              onChange={(_, value) => handleValueChange('destroyMissionDifficultyRewardFactor', value as number)}
              step={25}
              min={0}
              max={1000}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Random Reward: {values.destroyMissionRandomReward} credits</Typography>
            <Slider
              value={values.destroyMissionRandomReward}
              onChange={(_, value) => handleValueChange('destroyMissionRandomReward', value as number)}
              step={1000}
              min={0}
              max={50000}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Difficulty Random Reward: {values.destroyMissionDifficultyRandomReward}</Typography>
            <Slider
              value={values.destroyMissionDifficultyRandomReward}
              onChange={(_, value) => handleValueChange('destroyMissionDifficultyRandomReward', value as number)}
              step={5}
              min={0}
              max={100}
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

export default MissionManagerPage;
