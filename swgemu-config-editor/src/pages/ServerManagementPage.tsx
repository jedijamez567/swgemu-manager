import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress,
  Chip,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Alert,
  Snackbar,
  ListItemSecondaryAction,
  Tab,
  Tabs,
} from '@mui/material';
import {
  PlayArrow,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Refresh as RestartIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Article as LogsIcon,
} from '@mui/icons-material';
import { dockerService } from '../services/DockerService';
import { configurationService, ConfigurationMetadata } from '../services/ConfigurationService';

const ServerManagementPage: React.FC = () => {
  // Server status
  const [serverStatus, setServerStatus] = useState<{
    running: boolean;
    uptime?: string;
    loading: boolean;
  }>({
    running: false,
    loading: true,
  });

  // Configurations
  const [configurations, setConfigurations] = useState<ConfigurationMetadata[]>([]);
  const [configLoading, setConfigLoading] = useState(true);
  
  // Server logs
  const [serverLogs, setServerLogs] = useState<{
    logs: string;
    loading: boolean;
    error?: string;
    streaming: boolean;
  }>({
    logs: '',
    loading: false,
    streaming: false,
  });
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Dialog states
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);

  // Form states
  const [configName, setConfigName] = useState('');
  const [configDescription, setConfigDescription] = useState('');
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);

  // Alert/Snackbar
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // Fetch server status and configurations on load
  useEffect(() => {
    fetchServerStatus();
    fetchConfigurations();
  }, []);

  // Fetch logs when server is running and tab changes to logs
  useEffect(() => {
    if (serverStatus.running && activeTab === 1 && !serverLogs.logs) {
      fetchServerLogs();
    }
  }, [serverStatus.running, activeTab]);

  // Refresh server status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchServerStatus();
    }, 30000); // every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchServerStatus = async () => {
    setServerStatus(prev => ({ ...prev, loading: true }));
    try {
      const status = await dockerService.getServerStatus();
      setServerStatus({
        running: status.running,
        uptime: status.uptime,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching server status:', error);
      setServerStatus({
        running: false,
        loading: false,
      });
    }
  };

  const fetchConfigurations = async () => {
    setConfigLoading(true);
    try {
      const configs = await configurationService.listConfigurations();
      setConfigurations(configs);
    } catch (error) {
      console.error('Error fetching configurations:', error);
    } finally {
      setConfigLoading(false);
    }
  };

  const fetchServerLogs = async (lines: number = 100) => {
    setServerLogs(prev => ({ ...prev, loading: true, error: undefined }));
    try {
      const result = await dockerService.getServerLogs(lines);
      if (result.success) {
        setServerLogs(prev => ({
          ...prev,
          logs: result.logs,
          loading: false,
          streaming: false
        }));
      } else {
        setServerLogs(prev => ({
          ...prev,
          logs: '',
          loading: false,
          error: result.message || 'Failed to retrieve logs',
          streaming: false
        }));
      }
    } catch (error) {
      console.error('Error fetching server logs:', error);
      setServerLogs(prev => ({
        ...prev,
        logs: '',
        loading: false,
        error: `Error fetching logs: ${error}`,
        streaming: false
      }));
    }
  };

  const handleServerAction = async (action: 'start' | 'stop' | 'restart') => {
    try {
      let result;
      
      if (action === 'start') {
        result = await dockerService.startServer();
      } else if (action === 'stop') {
        result = await dockerService.stopServer();
      } else {
        result = await dockerService.restartServer();
      }
      
      if (result.success) {
        setAlert({
          open: true,
          message: result.message,
          severity: 'success',
        });
        
        // Refresh status after a short delay to allow the server to change state
        setTimeout(() => {
          fetchServerStatus();
          
          // Fetch logs if server was started or restarted
          if ((action === 'start' || action === 'restart') && activeTab === 1) {
            setTimeout(() => {
              fetchServerLogs();
            }, 2000); // Additional delay to give server time to generate logs
          }
        }, 3000);
      } else {
        setAlert({
          open: true,
          message: result.message,
          severity: 'error',
        });
      }
    } catch (error) {
      setAlert({
        open: true,
        message: `Failed to ${action} server: ${error}`,
        severity: 'error',
      });
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSaveConfiguration = async () => {
    if (!configName.trim()) {
      setAlert({
        open: true,
        message: 'Configuration name is required',
        severity: 'error',
      });
      return;
    }
    
    try {
      const result = await configurationService.saveConfiguration(
        configName,
        configDescription
      );
      
      setSaveDialogOpen(false);
      setConfigName('');
      setConfigDescription('');
      
      setAlert({
        open: true,
        message: `Configuration "${result.name}" saved successfully`,
        severity: 'success',
      });
      
      fetchConfigurations();
    } catch (error) {
      setAlert({
        open: true,
        message: `Failed to save configuration: ${error}`,
        severity: 'error',
      });
    }
  };

  const handleEditConfiguration = async () => {
    if (!selectedConfigId || !configName.trim()) {
      setAlert({
        open: true,
        message: 'Configuration name is required',
        severity: 'error',
      });
      return;
    }
    
    try {
      await configurationService.updateConfiguration(selectedConfigId, {
        name: configName,
        description: configDescription,
      });
      
      setEditDialogOpen(false);
      setSelectedConfigId(null);
      setConfigName('');
      setConfigDescription('');
      
      setAlert({
        open: true,
        message: 'Configuration updated successfully',
        severity: 'success',
      });
      
      fetchConfigurations();
    } catch (error) {
      setAlert({
        open: true,
        message: `Failed to update configuration: ${error}`,
        severity: 'error',
      });
    }
  };

  const handleDeleteConfiguration = async () => {
    if (!selectedConfigId) return;
    
    try {
      const result = await configurationService.deleteConfiguration(selectedConfigId);
      
      setConfirmDialogOpen(false);
      setSelectedConfigId(null);
      
      setAlert({
        open: true,
        message: result.message,
        severity: result.success ? 'success' : 'error',
      });
      
      if (result.success) {
        fetchConfigurations();
      }
    } catch (error) {
      setAlert({
        open: true,
        message: `Failed to delete configuration: ${error}`,
        severity: 'error',
      });
    }
  };

  // State for the restart confirmation dialog
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  
  const handleApplyConfiguration = async () => {
    if (!selectedConfigId) return;
    
    try {
      const result = await configurationService.applyConfiguration(selectedConfigId);
      
      setApplyDialogOpen(false);
      setSelectedConfigId(null);
      
      // Handle detailed response including partial success
      if (result.success) {
        // Show warning for partial success
        if (result.partial) {
          setAlert({
            open: true,
            message: result.message,
            severity: 'warning',
          });
        } else {
          setAlert({
            open: true,
            message: result.message,
            severity: 'success',
          });
        }
        
        // Prompt to restart the server if changes were successful
        if (serverStatus.running) {
          setRestartDialogOpen(true);
        }
      } else {
        setAlert({
          open: true,
          message: result.message,
          severity: 'error',
        });
      }
      
      // Log details if available
      if (result.details) {
        console.log('Configuration apply details:', result.details);
      }
      
    } catch (error) {
      setAlert({
        open: true,
        message: `Failed to apply configuration: ${error}`,
        severity: 'error',
      });
    }
  };
  
  // Handle restart after config apply
  const handleRestartAfterApply = async () => {
    setRestartDialogOpen(false);
    
    try {
      const result = await dockerService.restartServer();
      
      if (result.success) {
        setAlert({
          open: true,
          message: "Server restarted successfully. Configuration changes are now active.",
          severity: 'success',
        });
        
        // Refresh status after a short delay
        setTimeout(() => {
          fetchServerStatus();
        }, 3000);
      } else {
        setAlert({
          open: true,
          message: `Failed to restart server: ${result.message}`,
          severity: 'error',
        });
      }
    } catch (error) {
      setAlert({
        open: true,
        message: `Error restarting server: ${error}`,
        severity: 'error',
      });
    }
  };

  const openEditDialog = (config: ConfigurationMetadata) => {
    setSelectedConfigId(config.id);
    setConfigName(config.name);
    setConfigDescription(config.description);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (configId: string) => {
    setSelectedConfigId(configId);
    setConfirmDialogOpen(true);
  };

  const openApplyDialog = (configId: string) => {
    setSelectedConfigId(configId);
    setApplyDialogOpen(true);
  };

  // Start live streaming logs
  const startLogStream = async () => {
    setServerLogs(prev => ({ ...prev, loading: true }));
    
    try {
      // Start the log stream
      const result = await dockerService.startLogStream((logs, isError) => {
        // This callback will be called whenever new logs are received
        setServerLogs(prev => ({
          ...prev,
          // Append new logs to existing logs
          logs: prev.logs + logs,
          loading: false,
          streaming: true
        }));
        
        // Auto-scroll to bottom
        const logContainer = document.querySelector('.log-container');
        if (logContainer) {
          logContainer.scrollTop = logContainer.scrollHeight;
        }
      });
      
      if (!result.success) {
        setServerLogs(prev => ({
          ...prev,
          loading: false,
          streaming: false,
          error: result.message
        }));
      }
    } catch (error) {
      console.error('Error starting log stream:', error);
      setServerLogs(prev => ({
        ...prev,
        loading: false,
        streaming: false,
        error: `Failed to start log streaming: ${error}`
      }));
    }
  };
  
  // Stop live streaming logs
  const stopLogStream = async () => {
    try {
      await dockerService.stopLogStream();
      setServerLogs(prev => ({
        ...prev,
        streaming: false
      }));
      
      setAlert({
        open: true,
        message: 'Log streaming stopped',
        severity: 'info'
      });
    } catch (error) {
      console.error('Error stopping log stream:', error);
      setAlert({
        open: true,
        message: `Failed to stop log streaming: ${error}`,
        severity: 'error'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Server Management
      </Typography>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        variant="fullWidth"
        sx={{ mb: 2 }}
      >
        <Tab label="Status & Configurations" />
        <Tab 
          label="Server Logs" 
          disabled={!serverStatus.running}
          icon={<LogsIcon />}
          iconPosition="start"
        />
      </Tabs>

      {activeTab === 0 ? (
        <Box>
          <Grid container spacing={3}>
            {/* Server Status Card */}
            <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1.5 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Server Status
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {serverStatus.loading ? (
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                    ) : (
                      <Chip
                        label={serverStatus.running ? "Running" : "Stopped"}
                        color={serverStatus.running ? "success" : "error"}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                    )}
                    {serverStatus.running && serverStatus.uptime && (
                      <Typography variant="body2" color="text.secondary" component="span">
                        Uptime: {serverStatus.uptime}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Start Server">
                      <span>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<StartIcon />}
                          onClick={() => handleServerAction('start')}
                          disabled={serverStatus.running || serverStatus.loading}
                          size="small"
                        >
                          Start
                        </Button>
                      </span>
                    </Tooltip>

                    <Tooltip title="Stop Server">
                      <span>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<StopIcon />}
                          onClick={() => handleServerAction('stop')}
                          disabled={!serverStatus.running || serverStatus.loading}
                          size="small"
                        >
                          Stop
                        </Button>
                      </span>
                    </Tooltip>

                    <Tooltip title="Restart Server">
                      <span>
                        <Button
                          variant="contained"
                          color="warning"
                          startIcon={<RestartIcon />}
                          onClick={() => handleServerAction('restart')}
                          disabled={!serverStatus.running || serverStatus.loading}
                          size="small"
                        >
                          Restart
                        </Button>
                      </span>
                    </Tooltip>

                    <Button
                      variant="outlined"
                      onClick={fetchServerStatus}
                      startIcon={<RefreshIcon />}
                      size="small"
                    >
                      Refresh
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Server Actions Card */}
            <Grid sx={{ width: { xs: '100%', md: '50%' }, padding: 1.5 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Configuration Actions
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={() => {
                        setConfigName('');
                        setConfigDescription('');
                        setSaveDialogOpen(true);
                      }}
                      size="small"
                    >
                      Save Current Configuration
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={fetchConfigurations}
                      startIcon={<RefreshIcon />}
                      size="small"
                    >
                      Refresh List
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Configurations List */}
          <Paper sx={{ mt: 3, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Saved Configurations
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {configLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : configurations.length === 0 ? (
              <Alert severity="info">
                No configurations saved yet. Save your current configuration to see it here.
              </Alert>
            ) : (
              <List>
                {configurations.map((config) => (
                  <ListItem
                    key={config.id}
                    alignItems="flex-start"
                    divider
                    secondaryAction={
                      <Box>
                        <Tooltip title="Apply Configuration">
                          <IconButton
                            edge="end"
                            aria-label="apply"
                            onClick={() => openApplyDialog(config.id)}
                            color="primary"
                          >
                            <PlayArrow />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            edge="end"
                            aria-label="edit"
                            onClick={() => openEditDialog(config)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => openDeleteDialog(config.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={config.name}
                      secondary={
                        <>
                          {config.description && (
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                              sx={{ display: 'block' }}
                            >
                              {config.description}
                            </Typography>
                          )}
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                          >
                            Created: {formatDate(config.createdAt)}
                            {config.updatedAt !== config.createdAt &&
                              ` • Updated: ${formatDate(config.updatedAt)}`}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Box>
      ) : (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Server Logs</Typography>
            <Box>
              {!serverLogs.streaming ? (
                <>
                  <Button 
                    startIcon={<RefreshIcon />} 
                    variant="outlined" 
                    onClick={() => fetchServerLogs()}
                    disabled={serverLogs.loading}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    Refresh
                  </Button>
                  <Button 
                    startIcon={<RefreshIcon />} 
                    variant="outlined" 
                    onClick={() => fetchServerLogs(500)}
                    disabled={serverLogs.loading}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    Load More (500 lines)
                  </Button>
                  <Button 
                    variant="contained" 
                    color="success"
                    onClick={startLogStream}
                    disabled={serverLogs.loading}
                    size="small"
                  >
                    Start Live Stream
                  </Button>
                </>
              ) : (
                <Button 
                  variant="contained" 
                  color="error"
                  onClick={stopLogStream}
                  size="small"
                >
                  Stop Stream
                </Button>
              )}
            </Box>
          </Box>
          
          {serverLogs.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : serverLogs.error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {serverLogs.error}
            </Alert>
          ) : (
            <Box 
              className="log-container"
              sx={{
                backgroundColor: '#000',
                color: '#00ff00',
                p: 2,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                maxHeight: '60vh',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}
            >
              {serverLogs.logs || 'No logs available.'}
            </Box>
          )}
        </Paper>
      )}

      {/* Save Configuration Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Current Configuration</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will save all current configuration files as a new configuration that you can restore later.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Configuration Name"
            type="text"
            fullWidth
            variant="outlined"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            required
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={configDescription}
            onChange={(e) => setConfigDescription(e.target.value)}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveConfiguration} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Configuration Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Configuration</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Configuration Name"
            type="text"
            fullWidth
            variant="outlined"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            required
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={configDescription}
            onChange={(e) => setConfigDescription(e.target.value)}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditConfiguration} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this configuration? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfiguration} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Apply Configuration Dialog */}
      <Dialog open={applyDialogOpen} onClose={() => setApplyDialogOpen(false)}>
        <DialogTitle>Apply Configuration</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will apply the selected configuration, overwriting your current settings. 
            The server will need to be restarted after applying the configuration for changes to take effect.
            Do you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleApplyConfiguration} color="primary" variant="contained">Apply</Button>
        </DialogActions>
      </Dialog>
      
      {/* Restart Server Confirmation Dialog */}
      <Dialog open={restartDialogOpen} onClose={() => setRestartDialogOpen(false)}>
        <DialogTitle>Restart Server Required</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Configuration has been successfully applied, but the server needs to be restarted 
            for the changes to take effect. Would you like to restart the server now?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestartDialogOpen(false)}>Later</Button>
          <Button onClick={handleRestartAfterApply} color="warning" variant="contained">
            Restart Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert
          onClose={() => setAlert({ ...alert, open: false })}
          severity={alert.severity}
          variant="filled"
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ServerManagementPage;
