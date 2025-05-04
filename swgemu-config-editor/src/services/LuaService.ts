// Using require instead of import to avoid ESM URL scheme issues
const { ipcRenderer } = window.require('electron');
// eslint-disable-next-line import/first
import * as luaparse from 'luaparse';

interface LuaParseOptions {
  comments?: boolean;
  scope?: boolean;
  locations?: boolean;
  ranges?: boolean;
  luaVersion?: '5.1' | '5.2' | '5.3';
}

/**
 * Service to handle reading, parsing, and writing Lua files
 */
export class LuaService {
  private parseOptions: LuaParseOptions = {
    comments: true,
    locations: true,
    ranges: true,
    luaVersion: '5.1',
  };

  /**
   * Reads a Lua file from the given path
   * @param filePath Path to the Lua file
   * @returns The file content as a string
   */
  async readLuaFile(filePath: string): Promise<string> {
    try {
      const result = await ipcRenderer.invoke('read-file', filePath);
      if (!result.success) {
        throw new Error(result.error || 'Failed to read file');
      }
      return result.content;
    } catch (error) {
      console.error('Error reading Lua file:', error);
      throw error;
    }
  }

  /**
   * Writes content to a Lua file
   * @param filePath Path to the Lua file
   * @param content Content to write
   */
  async writeLuaFile(filePath: string, content: string): Promise<void> {
    try {
      // Create a backup before writing
      await this.createBackup(filePath);

      const result = await ipcRenderer.invoke('write-file', { 
        filePath, 
        content 
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to write file');
      }
    } catch (error) {
      console.error('Error writing Lua file:', error);
      throw error;
    }
  }

  /**
   * Creates a backup of the file before modifying it
   * @param filePath Path to the file to back up
   */
  async createBackup(filePath: string): Promise<string> {
    try {
      const result = await ipcRenderer.invoke('create-backup', filePath);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create backup');
      }
      return result.backupPath;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  /**
   * Parses a Lua string into an AST (Abstract Syntax Tree)
   * @param luaContent The Lua content as a string
   * @returns The parsed AST
   */
  parseLua(luaContent: string): any {
    try {
      return luaparse.parse(luaContent, this.parseOptions);
    } catch (error) {
      console.error('Error parsing Lua content:', error);
      throw error;
    }
  }

  /**
   * Extracts values from Lua content
   * @param luaContent The Lua content as a string
   * @returns Object with variable names as keys and their values
   */
  extractValues(luaContent: string): Record<string, any> {
    try {
      const ast = this.parseLua(luaContent);
      const values: Record<string, any> = {};

      for (const node of ast.body) {
        if (node.type === 'AssignmentStatement') {
          for (let i = 0; i < node.variables.length; i++) {
            const variable = node.variables[i];
            const init = node.init[i];

            if (variable && variable.type === 'Identifier' && init) {
              const name = variable.name;
              let value;

              switch (init.type) {
                case 'NumericLiteral':
                  value = init.value;
                  break;
                case 'StringLiteral':
                  value = init.value;
                  break;
                case 'BooleanLiteral':
                  value = init.value;
                  break;
                case 'NilLiteral':
                  value = null;
                  break;
                case 'TableConstructorExpression':
                  value = this.extractTableValue(init);
                  break;
                default:
                  value = this.getNodeSourceCode(luaContent, init);
                  break;
              }

              values[name] = value;
            }
          }
        }
      }

      return values;
    } catch (error) {
      console.error('Error extracting values:', error);
      return {};
    }
  }

  /**
   * Extracts a table value from a TableConstructorExpression node
   * @param node The TableConstructorExpression node
   * @returns The extracted table as a JavaScript object or array
   */
  private extractTableValue(node: any): any {
    if (!node.fields || !Array.isArray(node.fields)) {
      return {};
    }

    // Check if it's an array-like table with sequential numeric keys
    const isArray = node.fields.every((field: any, index: number) => 
      field.type === 'TableValue' || 
      (field.type === 'TableKeyString' && 
       field.key.type === 'NumericLiteral' && 
       field.key.value === index + 1)
    );

    if (isArray) {
      return node.fields.map((field: any) => {
        if (field.type === 'TableValue') {
          return this.extractFieldValue(field.value);
        } else {
          return this.extractFieldValue(field.value);
        }
      });
    } else {
      const result: Record<string, any> = {};
      
      for (const field of node.fields) {
        if (field.type === 'TableKeyString') {
          const key = field.key.name || field.key.value;
          result[key] = this.extractFieldValue(field.value);
        } else if (field.type === 'TableKey') {
          const keyNode = field.key;
          if (keyNode.type === 'StringLiteral' || keyNode.type === 'NumericLiteral') {
            const key = keyNode.value.toString();
            result[key] = this.extractFieldValue(field.value);
          }
        }
      }
      
      return result;
    }
  }

  /**
   * Extracts a value from a node
   * @param node The node to extract from
   * @returns The extracted value
   */
  private extractFieldValue(node: any): any {
    switch (node.type) {
      case 'NumericLiteral':
        return node.value;
      case 'StringLiteral':
        return node.value;
      case 'BooleanLiteral':
        return node.value;
      case 'NilLiteral':
        return null;
      case 'TableConstructorExpression':
        return this.extractTableValue(node);
      default:
        return undefined;
    }
  }

  /**
   * Gets the source code for a node from the original content
   * @param source The original source code
   * @param node The node to get the source for
   * @returns The source code for the node
   */
  private getNodeSourceCode(source: string, node: any): string {
    if (node.range) {
      return source.substring(node.range[0], node.range[1]);
    }
    return '';
  }

  /**
   * Updates a simple variable in Lua content
   * @param luaContent The original Lua content
   * @param variableName The name of the variable to update
   * @param newValue The new value
   * @returns The updated Lua content
   */
  updateSimpleValue(luaContent: string, variableName: string, newValue: any): string {
    try {
      const ast = this.parseLua(luaContent);
      
      for (const node of ast.body) {
        if (node.type === 'AssignmentStatement') {
          for (let i = 0; i < node.variables.length; i++) {
            const variable = node.variables[i];
            
            if (variable && variable.type === 'Identifier' && variable.name === variableName) {
              const init = node.init[i];
              if (!init) continue;
              
              const range = init.range;
              if (!range) continue;
              
              let valueStr;
              if (typeof newValue === 'string') {
                valueStr = `"${newValue}"`;
              } else if (typeof newValue === 'boolean') {
                valueStr = newValue ? 'true' : 'false';
              } else if (newValue === null) {
                valueStr = 'nil';
              } else {
                valueStr = String(newValue);
              }
              
              return luaContent.substring(0, range[0]) + valueStr + luaContent.substring(range[1]);
            }
          }
        }
      }
      
      return luaContent;
    } catch (error) {
      console.error('Error updating value:', error);
      return luaContent;
    }
  }

  /**
   * Get a list of all Lua files in a directory
   * @param dirPath Path to the directory
   * @returns Array of file paths
   */
  async getLuaFilesInDirectory(dirPath: string): Promise<string[]> {
    try {
      const result = await ipcRenderer.invoke('get-directory-contents', dirPath);
      if (!result.success) {
        throw new Error(result.error || 'Failed to get directory contents');
      }
      
      return result.contents
        .filter((item: any) => !item.isDirectory && item.name.endsWith('.lua'))
        .map((item: any) => item.path);
    } catch (error) {
      console.error('Error getting Lua files:', error);
      throw error;
    }
  }

  /**
   * Show file open dialog
   * @returns Selected file path or undefined
   */
  async showOpenFileDialog(): Promise<string | undefined> {
    try {
      const result = await ipcRenderer.invoke('show-open-dialog');
      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        return result.filePaths[0];
      }
      return undefined;
    } catch (error) {
      console.error('Error showing open dialog:', error);
      throw error;
    }
  }

  /**
   * Show file save dialog
   * @returns Selected file path or undefined
   */
  async showSaveFileDialog(): Promise<string | undefined> {
    try {
      const result = await ipcRenderer.invoke('show-save-dialog');
      if (!result.canceled && result.filePath) {
        return result.filePath;
      }
      return undefined;
    } catch (error) {
      console.error('Error showing save dialog:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const luaService = new LuaService();
export default luaService;
