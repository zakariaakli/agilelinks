# Automated Testing Suite

## Overview

This test suite provides comprehensive automated testing for the AgileLinks platform, including unit tests, integration tests, and end-to-end user journey simulations.

## Test Structure

```
__tests__/
├── utils/
│   └── testHelpers.ts         # Fake data generators and test utilities
├── integration/
│   └── planLifecycle.test.ts  # Plan lifecycle integration tests
├── api/
│   └── milestoneReminders.test.ts  # API endpoint tests
└── e2e/
    └── completeUserJourney.test.ts  # Complete user journey simulations
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Unit tests only
npm test -- __tests__/utils

# Integration tests only
npm test -- __tests__/integration

# API tests only
npm test -- __tests__/api

# E2E tests only
npm test -- __tests__/e2e
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Tests in Watch Mode (for development)
```bash
npm test -- --watch
```

### Run Specific Test File
```bash
npm test -- __tests__/integration/planLifecycle.test.ts
```

## Test Coverage

The test suite covers:

### ✅ Plan Creation Flow
- User input validation
- AI question generation
- Milestone creation (template-based and AI-generated)
- Personality tip integration
- Firestore storage

### ✅ Automated Monitoring
- Current milestone detection logic
- Duplicate prevention (daily vs weekly)
- Date range calculations
- Status filtering (active/completed/paused)

### ✅ AI Nudge Generation
- Background processing workflow
- Notification data preparation
- Fallback message generation
- Error handling

### ✅ Email Delivery
- Opt-in checking
- Email template generation
- SendGrid integration
- Delivery status tracking

### ✅ User Interaction
- Notification viewing
- Feedback collection
- XP calculation
- Achievement unlocking

## Fake User Generation

The test suite includes utilities to generate realistic fake users and data:

### Generate Fake User
```typescript
import { generateFakeUser } from './__tests__/utils/testHelpers';

const user = generateFakeUser({
  displayName: 'John Doe',
  email: 'john@example.com'
});
```

### Generate Fake Plan
```typescript
import { generateFakePlan } from './__tests__/utils/testHelpers';

const plan = generateFakePlan(userId, {
  goalType: 'consultant',
  nudgeFrequency: 'weekly'
});
```

### Generate Current Milestone Plan
```typescript
import { generateCurrentMilestonePlan } from './__tests__/utils/testHelpers';

// Creates a plan with a milestone that's currently active
const plan = generateCurrentMilestonePlan(userId);
```

## Complete User Journey Tests

The E2E test suite simulates 5 different user personas:

### Journey 1: New User Onboarding
Complete flow from registration to first milestone reminder:
1. User registration
2. Enneagram assessment
3. Email opt-in
4. Plan creation
5. Milestone detection
6. Notification creation
7. Email delivery
8. User interaction
9. Feedback submission
10. XP earning

### Journey 2: Multi-Plan Power User
Tests a user with multiple active plans across different goal types:
- Career advancement
- Personal development
- Health & fitness

### Journey 3: Inactive to Re-engaged User
Tests re-engagement flow for users returning after inactivity:
- Partial plan completion
- Overdue milestone handling
- Re-engagement notifications

### Journey 4: Achievement Unlocking
Tests gamification progression:
- Achievement tracking
- Progress calculation
- Level progression
- XP accumulation

### Journey 5: Email Preference Management
Tests email opt-in/opt-out flow:
- Initial opt-in
- Email delivery
- Opt-out
- Notification retention for in-app viewing

## CI/CD Integration

### GitHub Actions (Recommended)

Create `.github/workflows/test.yml`:

```yaml
name: Run Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test -- --coverage

    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info
```

### Pre-commit Hook (Optional)

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm test -- --bail --findRelatedTests
```

## Continuous Testing

### Watch Mode for Development
```bash
npm test -- --watch
```

This runs tests automatically whenever you save a file.

### Coverage Threshold

Tests will fail if coverage drops below:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Mock Data Cleanup

All test data uses identifiable prefixes:
- User IDs: `test-user-*`
- Emails: `*@example.com`

To clean up test data from Firestore (if needed):

```typescript
import { isTestData } from './__tests__/utils/testHelpers';

if (isTestData(email)) {
  // This is test data, safe to delete
}
```

## Best Practices

### 1. Keep Tests Independent
Each test should be able to run in isolation without depending on other tests.

### 2. Use Fake Data Generators
Always use the provided helper functions instead of hardcoding test data.

### 3. Test Edge Cases
Include tests for:
- Empty states
- Error conditions
- Boundary values
- Invalid inputs

### 4. Mock External Services
All external API calls (OpenAI, SendGrid, Firebase) should be mocked.

### 5. Clean Up After Tests
Use `beforeEach` and `afterEach` to reset state.

## Debugging Tests

### Run Single Test
```bash
npm test -- -t "should create a new plan with milestones"
```

### Enable Verbose Output
```bash
npm test -- --verbose
```

### Debug in VS Code
Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Current File",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "${fileBasenameNoExtension}",
    "--config",
    "jest.config.js"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Future Enhancements

### Planned Test Coverage
1. **Component Tests**: React component rendering and interaction
2. **Performance Tests**: Load testing for API endpoints
3. **Security Tests**: Authentication and authorization
4. **Accessibility Tests**: WCAG compliance testing
5. **Visual Regression Tests**: UI consistency checks

### Test Data Management
1. **Seed Data Scripts**: Pre-populate test database
2. **Snapshot Testing**: Track expected outputs
3. **Test Data Versioning**: Maintain test data consistency

### Advanced Scenarios
1. **Concurrent User Tests**: Multiple users interacting simultaneously
2. **Long-Running Journey Tests**: Multi-week user engagement
3. **Error Recovery Tests**: System resilience testing

## Contributing

When adding new features, please:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain coverage above 70%
4. Update this README if adding new test categories

## Support

For questions or issues with tests:
1. Check test output for detailed error messages
2. Review test documentation in code comments
3. Refer to Jest documentation: https://jestjs.io/
4. Open an issue in the repository
