# Project Structure

This document defines the organization and folder structure conventions for this project.

## Root Directory
```
.
├── .kiro/              # Kiro configuration and steering files
│   └── steering/       # AI assistant guidance documents
├── src/                # Source code (to be created)
├── tests/              # Test files (to be created)
├── docs/               # Documentation (to be created)
├── config/             # Configuration files (to be created)
└── README.md           # Project overview (to be created)
```

## Folder Conventions
- **src/**: Main application source code
- **tests/**: Unit tests, integration tests, and test utilities
- **docs/**: Project documentation, API docs, and guides
- **config/**: Configuration files for different environments
- **.kiro/**: Kiro-specific files (steering rules, settings)

## File Naming
- Use lowercase with hyphens for multi-word files: `user-service.js`
- Use descriptive names that indicate purpose
- Group related files in appropriate subdirectories
- Keep file names concise but meaningful

## Code Organization
- Separate concerns into logical modules
- Use consistent directory structure across similar components
- Place shared utilities in common directories
- Keep configuration separate from business logic

## Documentation Structure
- README.md at root for project overview
- API documentation in docs/api/
- User guides in docs/guides/
- Architecture decisions in docs/architecture/

## Best Practices
- Maintain a clean root directory
- Use consistent naming patterns
- Group related functionality together
- Keep the structure scalable and maintainable
- Document any deviations from standard patterns