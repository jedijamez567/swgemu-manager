// Using require instead of import to avoid ESM URL scheme issues
const { ipcRenderer } = window.require('electron');
// eslint-disable-next-line import/first
import path from 'path';

/**
 * Interface for configuration metadata
 */
export interface ConfigurationMetadata {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for configuration details
 */
export interface ConfigurationDetails extends ConfigurationMetadata {
  files: string[]; // List of file paths included in this configuration
}

/**
 * Interface for configuration apply response
 */
export interface ApplyConfigurationResult {
  success: boolean;
  message: string;
  partial?: boolean;
  details?: {
    success: string[];
    failures: Array<{ path: string; error: string }>;
  };
}

/**
 * Service to manage server configurations
 */
export class ConfigurationService {
  /**
   * Save current server configuration with a name
   * @param name Name of the configuration
   * @param description Optional description
   * @returns The saved configuration details
   */
  async saveConfiguration(name: string, description: string = ''): Promise<ConfigurationDetails> {
    try {
      const result = await ipcRenderer.invoke('config-save', { name, description });
      if (!result.success) {
        throw new Error(result.error || 'Failed to save configuration');
      }
      return result.configuration;
    } catch (error) {
      console.error('Error saving configuration:', error);
      throw error;
    }
  }

  /**
   * Get a list of all saved configurations
   * @returns Array of configuration metadata
   */
  async listConfigurations(): Promise<ConfigurationMetadata[]> {
    try {
      const result = await ipcRenderer.invoke('config-list');
      if (!result.success) {
        throw new Error(result.error || 'Failed to list configurations');
      }
      return result.configurations;
    } catch (error) {
      console.error('Error listing configurations:', error);
      return [];
    }
  }

  /**
   * Get details of a specific configuration
   * @param id Configuration ID
   * @returns Configuration details
   */
  async getConfigurationDetails(id: string): Promise<ConfigurationDetails> {
    try {
      const result = await ipcRenderer.invoke('config-details', id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to get configuration details');
      }
      return result.configuration;
    } catch (error) {
      console.error('Error getting configuration details:', error);
      throw error;
    }
  }

  /**
   * Apply a saved configuration
   * @param id Configuration ID to apply
   * @returns Result of the operation
   */
  async applyConfiguration(id: string): Promise<ApplyConfigurationResult> {
    try {
      const result = await ipcRenderer.invoke('config-apply', id);
      return result;
    } catch (error) {
      console.error('Error applying configuration:', error);
      return { success: false, message: `Failed to apply configuration: ${error}` };
    }
  }

  /**
   * Delete a saved configuration
   * @param id Configuration ID to delete
   * @returns Result of the operation
   */
  async deleteConfiguration(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await ipcRenderer.invoke('config-delete', id);
      return result;
    } catch (error) {
      console.error('Error deleting configuration:', error);
      return { success: false, message: `Failed to delete configuration: ${error}` };
    }
  }

  /**
   * Update configuration metadata (name, description)
   * @param id Configuration ID
   * @param data New data (name, description)
   * @returns Updated configuration
   */
  async updateConfiguration(
    id: string, 
    data: { name?: string; description?: string }
  ): Promise<ConfigurationDetails> {
    try {
      const result = await ipcRenderer.invoke('config-update', { id, ...data });
      if (!result.success) {
        throw new Error(result.error || 'Failed to update configuration');
      }
      return result.configuration;
    } catch (error) {
      console.error('Error updating configuration:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const configurationService = new ConfigurationService();
export default configurationService;
