# SWGEmu Configuration Editor

A React and Electron based application for editing configuration files for Star Wars Galaxies Emulator servers in the swgemu-manager project.

## Features

- Star Wars themed user interface
- Easy-to-use controls for modifying server settings
- Automatic backup of files before modifications
- Support for modifying multiple configuration areas:
  - Player Manager settings
  - Loot Manager settings
  - Mission Manager settings
  - Planet Manager settings
  - Player Creation Manager settings
  - Command settings

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Docker (for containerized development) (Not yet implemented)

### Getting Started

1. Clone the repository
2. Navigate to the project directory

```bash
cd swgemu-manager/swgemu-config-editor
```

3. Install dependencies and start the application.

```bash
npm install
npm start
```

4. The application will be available at http://localhost:3000

### Project Structure

- `public/`: Static assets and HTML entry point
- `src/`: Source code
  - `components/`: Reusable React components
  - `pages/`: Application pages for each configuration area
  - `services/`: Services for interacting with the filesystem and parsing Lua
  - `themes/`: Theme configuration for Star Wars styling
  - `utils/`: Utility functions

## Building for Production

To build the Electron application for production:

```bash
npm run build
```

This will create distributable packages in the `dist` directory.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
