# Project Structure

This document defines the organization and folder structure conventions for this project.

## Current Structure
```
.
├── .kiro/
│   └── steering/          # AI assistant guidance documents
│       ├── product.md     # Product overview and goals
│       ├── tech.md        # Technology stack and tools
│       └── structure.md   # This file - project organization
```

## Folder Conventions
As the project grows, follow these organizational principles:

### Source Code
- **src/**: Main source code directory
- **lib/**: Reusable library code
- **components/**: UI components (if applicable)
- **utils/**: Utility functions and helpers
- **types/**: Type definitions (if using TypeScript)

### Configuration
- **config/**: Configuration files
- **.env**: Environment variables (never commit secrets)
- **package.json**: Dependencies and scripts (if Node.js)

### Documentation
- **docs/**: Project documentation
- **README.md**: Project overview and setup instructions
- **CHANGELOG.md**: Version history and changes

### Testing
- **tests/**: Test files
- **__tests__/**: Jest-style test directory (if applicable)
- **spec/**: Specification files

### Build & Deployment
- **build/**: Compiled/built files (should be gitignored)
- **dist/**: Distribution files (should be gitignored)
- **scripts/**: Build and deployment scripts

## File Naming Conventions
- Use kebab-case for directories: `user-profile/`
- Use camelCase for JavaScript/TypeScript files: `userProfile.js`
- Use PascalCase for components: `UserProfile.jsx`
- Use UPPER_CASE for constants: `API_ENDPOINTS.js`

## Import/Export Patterns
- Use absolute imports when possible
- Group imports: external libraries first, then internal modules
- Use index files for clean exports from directories

## Code Organization Principles
- Keep files focused and single-purpose
- Group related functionality together
- Separate concerns (business logic, UI, data access)
- Use consistent patterns across the codebase