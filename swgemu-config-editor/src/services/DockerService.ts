// Using require instead of import to avoid ESM URL scheme issues
const { ipcRenderer } = window.require('electron');

// Generate a unique client ID
const CLIENT_ID = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Service to handle Docker operations
 */
export class DockerService {
  /**
   * Check if the SWGEmu server is running
   * @returns Boolean indicating if server is running
   */
  async isServerRunning(): Promise<boolean> {
    try {
      const result = await ipcRenderer.invoke('docker-status');
      return result.running;
    } catch (error) {
      console.error('Error checking server status:', error);
      return false;
    }
  }

  /**
   * Get detailed status of the SWGEmu server
   * @returns Server status object
   */
  async getServerStatus(): Promise<{ running: boolean; uptime?: string; containerInfo?: any }> {
    try {
      const result = await ipcRenderer.invoke('docker-status');
      return result;
    } catch (error) {
      console.error('Error getting server status:', error);
      return { running: false };
    }
  }

  /**
   * Restart the SWGEmu server
   * @returns Result of the restart operation
   */
  async restartServer(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await ipcRenderer.invoke('docker-restart');
      return result;
    } catch (error) {
      console.error('Error restarting server:', error);
      return { success: false, message: `Failed to restart server: ${error}` };
    }
  }

  /**
   * Stop the SWGEmu server
   * @returns Result of the stop operation
   */
  async stopServer(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await ipcRenderer.invoke('docker-stop');
      return result;
    } catch (error) {
      console.error('Error stopping server:', error);
      return { success: false, message: `Failed to stop server: ${error}` };
    }
  }

  /**
   * Start the SWGEmu server
   * @returns Result of the start operation
   */
  async startServer(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await ipcRenderer.invoke('docker-start');
      return result;
    } catch (error) {
      console.error('Error starting server:', error);
      return { success: false, message: `Failed to start server: ${error}` };
    }
  }

  /**
   * Get server logs
   * @param lines Optional number of lines to retrieve (default: 100)
   * @returns Server logs as a string
   */
  async getServerLogs(lines: number = 100): Promise<{ success: boolean; logs: string; message?: string }> {
    try {
      const result = await ipcRenderer.invoke('docker-logs', { lines });
      return { success: true, logs: result.logs };
    } catch (error) {
      console.error('Error getting server logs:', error);
      return { success: false, logs: '', message: `Failed to retrieve logs: ${error}` };
    }
  }

  // Store active stream ID
  private activeStreamId: string | null = null;
  
  // Store callback function
  private logCallback: ((logs: string, isError: boolean) => void) | null = null;
  
  /**
   * Start streaming server logs
   * @param callback Function that will be called whenever new logs are received
   * @returns Promise that resolves when streaming has started
   */
  async startLogStream(callback: (logs: string, isError: boolean) => void): Promise<{ success: boolean; message?: string }> {
    try {
      // Store the callback
      this.logCallback = callback;
      
      // If we already have an active stream, clean it up first
      if (this.activeStreamId) {
        this.stopLogStream();
      }
      
      // Start a new log stream
      const result = await ipcRenderer.invoke('docker-logs-stream-start', { clientId: CLIENT_ID });
      
      if (result.success) {
        this.activeStreamId = result.streamId;
        
        // Set up the listener for log data
        this.setupLogListener(result.streamId);
        
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error starting log stream:', error);
      return { success: false, message: `Failed to start log streaming: ${error}` };
    }
  }
  
  /**
   * Stop streaming server logs
   * @returns Promise that resolves when streaming has stopped
   */
  async stopLogStream(): Promise<{ success: boolean; message?: string }> {
    try {
      if (!this.activeStreamId) {
        return { success: true, message: 'No active log stream' };
      }
      
      // Remove the log data listener
      ipcRenderer.removeAllListeners(`docker-logs-stream-data-${this.activeStreamId}`);
      
      // Stop the stream
      const result = await ipcRenderer.invoke('docker-logs-stream-stop', { streamId: this.activeStreamId });
      
      // Clear the active stream ID
      this.activeStreamId = null;
      this.logCallback = null;
      
      return result;
    } catch (error) {
      console.error('Error stopping log stream:', error);
      return { success: false, message: `Failed to stop log streaming: ${error}` };
    }
  }
  
  /**
   * Set up the listener for log data
   * @param streamId The ID of the log stream
   */
  private setupLogListener(streamId: string): void {
    // Listen for log data
    ipcRenderer.on(`docker-logs-stream-data-${streamId}`, (event: any, data: any) => {
      if (this.logCallback) {
        this.logCallback(data.logs, data.error);
      }
    });
  }
}

// Create and export a singleton instance
export const dockerService = new DockerService();
export default dockerService;
