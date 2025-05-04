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

// Define the structure of loot manager properties we want to edit
interface LootManagerValues {
  yellowChance: number;
  exceptionalChance: number;
  legendaryChance: number;
  yellowModifier: number;
  exceptionalModifier: number;
  legendaryModifier: number;
  skillModChance: number;
  randomDotAttributeMin: number;
  randomDotAttributeMax: number;
  randomDotStrengthMin: number;
  randomDotStrengthMax: number;
  randomDotDurationMin: number;
  randomDotDurationMax: number;
  randomDotPotencyMin: number;
  randomDotPotencyMax: number;
  randomDotUsesMin: number;
  randomDotUsesMax: number;
  junkValueModifier: number;
}

const LootManagerPage: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filePath, setFilePath] = useState('../loot_manager/loot_manager.lua'); // Adjust the path as needed
  const [fileContent, setFileContent] = useState('');
  const [values, setValues] = useState<LootManagerValues>({
    yellowChance: 1000,
    exceptionalChance: 100000,
    legendaryChance: 1000000,
    yellowModifier: 1.5,
    exceptionalModifier: 2.5,
    legendaryModifier: 5.0,
    skillModChance: 500,
    randomDotAttributeMin: 0,
    randomDotAttributeMax: 8,
    randomDotStrengthMin: 10,
    randomDotStrengthMax: 200,
    randomDotDurationMin: 30,
    randomDotDurationMax: 240,
    randomDotPotencyMin: 1,
    randomDotPotencyMax: 100,
    randomDotUsesMin: 250,
    randomDotUsesMax: 9999,
    junkValueModifier: 5
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
      
      // Handle direct mappings
      const directMappings: Record<string, keyof LootManagerValues> = {
        yellowChance: 'yellowChance',
        exceptionalChance: 'exceptionalChance',
        legendaryChance: 'legendaryChance',
        yellowModifier: 'yellowModifier',
        exceptionalModifier: 'exceptionalModifier',
        legendaryModifier: 'legendaryModifier',
        skillModChance: 'skillModChance',
        junkValueModifier: 'junkValueModifier'
      };
      
      for (const [luaKey, stateKey] of Object.entries(directMappings)) {
        if (extractedValues[luaKey] !== undefined) {
          updatedValues[stateKey] = extractedValues[luaKey];
        }
      }
      
      // Handle array values
      if (extractedValues.randomDotAttribute && Array.isArray(extractedValues.randomDotAttribute) && extractedValues.randomDotAttribute.length >= 2) {
        updatedValues.randomDotAttributeMin = extractedValues.randomDotAttribute[0];
        updatedValues.randomDotAttributeMax = extractedValues.randomDotAttribute[1];
      }
      
      if (extractedValues.randomDotStrength && Array.isArray(extractedValues.randomDotStrength) && extractedValues.randomDotStrength.length >= 2) {
        updatedValues.randomDotStrengthMin = extractedValues.randomDotStrength[0];
        updatedValues.randomDotStrengthMax = extractedValues.randomDotStrength[1];
      }
      
      if (extractedValues.randomDotDuration && Array.isArray(extractedValues.randomDotDuration) && extractedValues.randomDotDuration.length >= 2) {
        updatedValues.randomDotDurationMin = extractedValues.randomDotDuration[0];
        updatedValues.randomDotDurationMax = extractedValues.randomDotDuration[1];
      }
      
      if (extractedValues.randomDotPotency && Array.isArray(extractedValues.randomDotPotency) && extractedValues.randomDotPotency.length >= 2) {
        updatedValues.randomDotPotencyMin = extractedValues.randomDotPotency[0];
        updatedValues.randomDotPotencyMax = extractedValues.randomDotPotency[1];
      }
      
      if (extractedValues.randomDotUses && Array.isArray(extractedValues.randomDotUses) && extractedValues.randomDotUses.length >= 2) {
        updatedValues.randomDotUsesMin = extractedValues.randomDotUses[0];
        updatedValues.randomDotUsesMax = extractedValues.randomDotUses[1];
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
      
      // Update direct values
      const directMappings: Record<string, keyof LootManagerValues> = {
        yellowChance: 'yellowChance',
        exceptionalChance: 'exceptionalChance',
        legendaryChance: 'legendaryChance',
        yellowModifier: 'yellowModifier',
        exceptionalModifier: 'exceptionalModifier',
        legendaryModifier: 'legendaryModifier',
        skillModChance: 'skillModChance',
        junkValueModifier: 'junkValueModifier'
      };
      
      for (const [luaKey, stateKey] of Object.entries(directMappings)) {
        updatedContent = luaService.updateSimpleValue(updatedContent, luaKey, values[stateKey]);
      }
      
      // Update array values - need to handle these specially to update the Lua array syntax
      const arrayPattern = (name: string) => new RegExp(`${name}\\s*=\\s*{[^}]*}`, 'g');
      
      updatedContent = updatedContent.replace(
        arrayPattern('randomDotAttribute'),
        `randomDotAttribute = {${values.randomDotAttributeMin}, ${values.randomDotAttributeMax}}`
      );
      
      updatedContent = updatedContent.replace(
        arrayPattern('randomDotStrength'),
        `randomDotStrength = {${values.randomDotStrengthMin}, ${values.randomDotStrengthMax}}`
      );
      
      updatedContent = updatedContent.replace(
        arrayPattern('randomDotDuration'),
        `randomDotDuration = {${values.randomDotDurationMin}, ${values.randomDotDurationMax}}`
      );
      
      updatedContent = updatedContent.replace(
        arrayPattern('randomDotPotency'),
        `randomDotPotency = {${values.randomDotPotencyMin}, ${values.randomDotPotencyMax}}`
      );
      
      updatedContent = updatedContent.replace(
        arrayPattern('randomDotUses'),
        `randomDotUses = {${values.randomDotUsesMin}, ${values.randomDotUsesMax}}`
      );
      
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
  const handleValueChange = (key: keyof LootManagerValues, value: number) => {
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
          Loot Manager Configuration
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
          Loot Quality Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography gutterBottom>Yellow Item Chance: 1 in {values.yellowChance}</Typography>
            <Slider
              value={values.yellowChance}
              onChange={(_, value) => handleValueChange('yellowChance', value as number)}
              step={50}
              min={50}
              max={5000}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Exceptional Item Chance: 1 in {values.exceptionalChance}</Typography>
            <Slider
              value={values.exceptionalChance}
              onChange={(_, value) => handleValueChange('exceptionalChance', value as number)}
              step={1000}
              min={1000}
              max={500000}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Legendary Item Chance: 1 in {values.legendaryChance}</Typography>
            <Slider
              value={values.legendaryChance}
              onChange={(_, value) => handleValueChange('legendaryChance', value as number)}
              step={10000}
              min={10000}
              max={2000000}
              valueLabelDisplay="auto"
            />
          </Box>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Loot Quality Modifiers
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography gutterBottom>Yellow Item Modifier: {values.yellowModifier.toFixed(1)}x</Typography>
            <Slider
              value={values.yellowModifier}
              onChange={(_, value) => handleValueChange('yellowModifier', value as number)}
              step={0.1}
              min={1.0}
              max={3.0}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Exceptional Item Modifier: {values.exceptionalModifier.toFixed(1)}x</Typography>
            <Slider
              value={values.exceptionalModifier}
              onChange={(_, value) => handleValueChange('exceptionalModifier', value as number)}
              step={0.1}
              min={1.5}
              max={5.0}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Legendary Item Modifier: {values.legendaryModifier.toFixed(1)}x</Typography>
            <Slider
              value={values.legendaryModifier}
              onChange={(_, value) => handleValueChange('legendaryModifier', value as number)}
              step={0.1}
              min={2.0}
              max={10.0}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>Skill Mod Chance: 1 in {values.skillModChance}</Typography>
            <Slider
              value={values.skillModChance}
              onChange={(_, value) => handleValueChange('skillModChance', value as number)}
              step={10}
              min={10}
              max={1000}
              valueLabelDisplay="auto"
            />
          </Box>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Random DOT Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography gutterBottom>DOT Attribute Range: {values.randomDotAttributeMin} - {values.randomDotAttributeMax}</Typography>
            <Slider
              value={[values.randomDotAttributeMin, values.randomDotAttributeMax]}
              onChange={(_, value) => {
                const [min, max] = value as number[];
                handleValueChange('randomDotAttributeMin', min);
                handleValueChange('randomDotAttributeMax', max);
              }}
              step={1}
              min={0}
              max={10}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>DOT Strength Range: {values.randomDotStrengthMin} - {values.randomDotStrengthMax}</Typography>
            <Slider
              value={[values.randomDotStrengthMin, values.randomDotStrengthMax]}
              onChange={(_, value) => {
                const [min, max] = value as number[];
                handleValueChange('randomDotStrengthMin', min);
                handleValueChange('randomDotStrengthMax', max);
              }}
              step={10}
              min={10}
              max={500}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>DOT Duration Range: {values.randomDotDurationMin} - {values.randomDotDurationMax} seconds</Typography>
            <Slider
              value={[values.randomDotDurationMin, values.randomDotDurationMax]}
              onChange={(_, value) => {
                const [min, max] = value as number[];
                handleValueChange('randomDotDurationMin', min);
                handleValueChange('randomDotDurationMax', max);
              }}
              step={10}
              min={10}
              max={300}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>DOT Potency Range: {values.randomDotPotencyMin} - {values.randomDotPotencyMax}</Typography>
            <Slider
              value={[values.randomDotPotencyMin, values.randomDotPotencyMax]}
              onChange={(_, value) => {
                const [min, max] = value as number[];
                handleValueChange('randomDotPotencyMin', min);
                handleValueChange('randomDotPotencyMax', max);
              }}
              step={1}
              min={1}
              max={100}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography gutterBottom>DOT Uses Range: {values.randomDotUsesMin} - {values.randomDotUsesMax}</Typography>
            <Slider
              value={[values.randomDotUsesMin, values.randomDotUsesMax]}
              onChange={(_, value) => {
                const [min, max] = value as number[];
                handleValueChange('randomDotUsesMin', min);
                handleValueChange('randomDotUsesMax', max);
              }}
              step={50}
              min={50}
              max={10000}
              valueLabelDisplay="auto"
            />
          </Box>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Junk Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography gutterBottom>Junk Value Modifier: {values.junkValueModifier}x</Typography>
            <Slider
              value={values.junkValueModifier}
              onChange={(_, value) => handleValueChange('junkValueModifier', value as number)}
              step={1}
              min={1}
              max={20}
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

export default LootManagerPage;
