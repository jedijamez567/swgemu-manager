import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  useTheme,
  Snackbar,
  Alert,
} from '@mui/material';
import { SaveOutlined as SaveIcon } from '@mui/icons-material';
import luaService from '../services/LuaService';

const CommandsPage: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [commandFiles, setCommandFiles] = useState<string[]>([]);
  const [selectedCommand, setSelectedCommand] = useState('');
  const [commandContent, setCommandContent] = useState('');
  const [editedCommandContent, setEditedCommandContent] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Load the list of command files when the component mounts
  useEffect(() => {
    loadCommandFiles();
  }, []);

  // Load the selected command file when changed
  useEffect(() => {
    if (selectedCommand) {
      loadCommandFile(selectedCommand);
    }
  }, [selectedCommand]);

  // Load the list of command files
  const loadCommandFiles = async () => {
    try {
      setListLoading(true);
      const files = await luaService.getLuaFilesInDirectory('../commands');
      
      // Extract just the filenames
      const filenames = files.map(file => {
        const parts = file.split('/');
        return parts[parts.length - 1];
      }).sort();
      
      setCommandFiles(filenames);
      setListLoading(false);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load command files:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load command files. Check the console for details.',
        severity: 'error'
      });
      setListLoading(false);
      setLoading(false);
    }
  };

  // Load a specific command file
  const loadCommandFile = async (filename: string) => {
    try {
      setLoading(true);
      const content = await luaService.readLuaFile(`../commands/${filename}`);
      setCommandContent(content);
      setEditedCommandContent(content);
      setLoading(false);
    } catch (error) {
      console.error(`Failed to load command file ${filename}:`, error);
      setSnackbar({
        open: true,
        message: `Failed to load command file ${filename}. Check the console for details.`,
        severity: 'error'
      });
      setLoading(false);
    }
  };

  // Handle saving the edited command file
  const saveCommandFile = async () => {
    if (!selectedCommand) return;
    
    try {
      setSaving(true);
      
      // Write the updated content back to the file
      await luaService.writeLuaFile(`../commands/${selectedCommand}`, editedCommandContent);
      
      // Save successful
      setCommandContent(editedCommandContent);
      setSnackbar({
        open: true,
        message: 'Command file saved successfully!',
        severity: 'success'
      });
      
      setSaving(false);
    } catch (error) {
      console.error(`Failed to save command file ${selectedCommand}:`, error);
      setSnackbar({
        open: true,
        message: `Failed to save command file ${selectedCommand}. Check the console for details.`,
        severity: 'error'
      });
      setSaving(false);
    }
  };

  // Handle command selection
  const handleCommandChange = (event: SelectChangeEvent) => {
    setSelectedCommand(event.target.value);
  };

  // Handle command content editing
  const handleCommandContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedCommandContent(event.target.value);
  };

  // Close the snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = commandContent !== editedCommandContent;

  if (listLoading) {
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
          Commands Configuration
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<SaveIcon />}
          onClick={saveCommandFile}
          disabled={saving || !selectedCommand || !hasUnsavedChanges}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Select Command
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ minWidth: 200 }}>
          <FormControl fullWidth>
            <InputLabel id="command-select-label">Command File</InputLabel>
            <Select
              labelId="command-select-label"
              id="command-select"
              value={selectedCommand}
              label="Command File"
              onChange={handleCommandChange}
            >
              {commandFiles.map((file) => (
                <MenuItem key={file} value={file}>
                  {file.replace('.lua', '').replace(/([A-Z])/g, ' $1').trim()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>
      
      {selectedCommand && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Edit {selectedCommand}
            </Typography>
            {loading && <CircularProgress size={24} />}
          </Box>
          <Divider sx={{ mb: 2 }} />
          <TextField
            fullWidth
            multiline
            minRows={20}
            maxRows={30}
            variant="outlined"
            value={editedCommandContent}
            onChange={handleCommandContentChange}
            disabled={loading}
            sx={{
              fontFamily: 'monospace',
              '& .MuiInputBase-input': {
                fontFamily: 'monospace',
              }
            }}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Note: Be careful when editing command files directly. Incorrect syntax may cause server errors.
            </Typography>
          </Box>
        </Paper>
      )}
      
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CommandsPage;
