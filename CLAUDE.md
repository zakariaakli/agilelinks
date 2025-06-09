# Claude Development Guidelines

## Commit Message Format

All commit messages must follow this format:

```
[action] Brief description of changes

- Detailed point about what was changed
- Another detailed point
- More specific details if needed
```

### Required Action Prefixes

Use one of these prefixes for every commit:

- **[add]** - When adding new features, files, or functionality
- **[update]** - When modifying existing features or improving functionality  
- **[fix]** - When fixing bugs or resolving issues
- **[delete]** - When removing files, features, or functionality

### Examples

```
[add] Weekly milestone reminder system for goal wizard

- Implemented intelligent current milestone detection (startDate ≤ today ≤ dueDate)
- Enhanced milestone structure with startDate for sequential planning
- Created AI-powered personalized nudge generation with progress context
```

```
[fix] Notification display issues in nudge page

- Fixed data serialization for Firestore timestamps
- Added proper error handling for undefined properties
- Enhanced type checking for milestone reminders
```

```
[update] Goal wizard UI with improved milestone management

- Added dual date inputs for start and due dates
- Enhanced milestone editing interface
- Improved responsive design for mobile devices
```

## Development Commands

When working on this project, run these commands to ensure code quality:

- `npm run lint` - Check for linting issues
- `npm run typecheck` - Verify TypeScript types
- `npm run build` - Build the project

Always run these commands before committing to ensure the codebase remains stable.