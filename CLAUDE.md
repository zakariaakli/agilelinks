# Project Configuration

## Development Philosophy

- Implement ONLY explicitly requested features
- Choose the simplest solution that meets requirements
- Write production-grade code from the start (no placeholders)
- Design for scalability, but avoid premature optimization

## Code Architecture Standards

### General Principles

- Follow SOLID principles and clean architecture patterns
- Maximum file size: 300 lines (refactor into modules if needed)
- Design for testability with clear separation of concerns
- Use dependency injection where appropriate

### Quality Requirements

- Include comprehensive type safety (TypeScript/Python type hints)
- Implement proper error handling and validation
- Add logging hooks for observability
- Document architectural decisions in code comments

## Implementation Workflow

Before implementing:

1. Analyze the request and existing codebase context
2. Propose approach and identify potential issues
3. Wait for confirmation before proceeding
4. Implement with proper error handling and tests
5. Explain architectural decisions made

## Constraints

- No dummy implementations - all code must be functional
- Avoid over-engineering: implement only requested features
- No speculative features or "nice to have" additions
- Follow established patterns in the existing codebase

## Available Customizations

- Rules: See `.claude/rules/` for domain-specific patterns
- Skills: Use `/list-skills` to see available workflows

## Documentation

- Each time you are asked for a commit message, check first if the changes where documented. if not, ask the user if a documentation is needed. If the response is yes, look into the existing .md files and see if the changes documentatin can be done there, if not create a new md. file and document the changes
- Documentation should be always consice and expert level without overdetailing technical implemntation
- All documentation should go in the folder: Functional Documentation

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
