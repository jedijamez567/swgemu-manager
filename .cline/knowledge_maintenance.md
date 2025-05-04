# Knowledge Base Maintenance Guide

This document outlines how to maintain a personal knowledge base in the `.cline` directory to track important development information, configurations, and code insights for the swgemu-manager project.

## Purpose

The `.cline` folder serves as a personal knowledge repository that:

1. Documents key system components and their relationships
2. Records configurations and their effects on the system
3. Preserves context about code that might be forgotten over time
4. Creates a searchable reference for future development work

## Structure

The knowledge base is organized as follows:

- Individual markdown (`.md`) files for specific topics
- Clear, descriptive filenames (e.g., `swgemu_galaxy_config.md`)
- Consistent formatting with headers, code blocks, and explanations
- Cross-references to related files when applicable

## Content Guidelines

Each knowledge file should include:

1. **Overview**: Brief description of the topic
2. **Key Files and Locations**: Paths to relevant files
3. **Configuration/Implementation Details**: How the system works
4. **Reference Examples**: Code snippets or configuration examples
5. **Notes**: Important observations, cautions, or edge cases

## Maintenance Workflow

1. After completing significant code changes, document what was changed
2. When exploring complex systems, document findings for future reference
3. Update existing knowledge files when information becomes outdated
4. Create new files for previously undocumented areas of the codebase

## Key Components to Document

When creating or updating knowledge files, consider documenting these key components of the swgemu-manager system:

1. **Docker Configuration**:
   - Changes to Dockerfile or docker-compose.yml
   - Service relationships and dependencies
   - Volume mappings and port exposures

2. **Galaxy Settings**:
   - Galaxy name, ID, and address configuration
   - How galaxy configuration propagates through the system
   - Relationship between config files and database tables

3. **REST API**:
   - API endpoints and authentication
   - Configuration settings in config-local.lua
   - Integration with the Streamlit client application

4. **Core Game Mechanics**:
   - Resource managers and spawning systems
   - Loot tables and distribution algorithms
   - Planet and player managers configuration

5. **Infrastructure Changes**:
   - Network configuration and port mappings
   - Database schema modifications
   - Performance optimizations

## Instruction Prompt

To request knowledge base maintenance or updates, use the following prompt:

```
Please update the knowledge base in the .cline folder with what we've learned about [topic]. 
Make sure to document key files, code patterns, configuration options, and any gotchas or important notes.
If a relevant knowledge file already exists, update it; otherwise, create a new one with a descriptive name.
```

For targeted help with a specific knowledge file:

```
Please review and update the .cline/[filename].md file with our recent findings about [topic].
Add any new information about [specific aspect] and make sure it reflects the current state of the code.
```

## Best Practices

1. **Be Specific**: Include precise file paths and line numbers where appropriate
2. **Document Why, Not Just How**: Explain rationales behind patterns or configurations
3. **Include Examples**: Show real code or configuration snippets
4. **Link Related Knowledge**: Reference other knowledge files when topics interconnect
5. **Keep It Current**: Update documentation when code changes significantly
6. **Track System Changes**: Document version changes, such as the rename from swgemu-docker to swgemu-manager

## Example Knowledge Areas

The swgemu-manager project has several key areas that benefit from thorough documentation:

1. **Galaxy Configuration** (see `swgemu_galaxy_config.md`):
   - How galaxy settings in config.lua propagate to the database
   - The interaction between ConfigManager and ZoneServer classes

2. **REST API Setup**:
   - Configuration of the REST API in config-local.lua
   - Authentication mechanisms and security considerations
   - Available endpoints and their functionality

3. **Docker Environment**:
   - Container architecture and communication
   - Volume mount structure and data persistence
   - Network configuration and port exposure

4. **Game Mechanics**:
   - Resource spawning systems and customization
   - Player creation and management settings
   - Command implementations and modifications
