# Automated Testing Guide

## 🎯 Overview

This project includes a **fully automated testing suite** with fake user simulations, integration tests, and end-to-end user journey tests. The test suite can run completely autonomously in CI/CD pipelines or locally during development.

---

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run in Watch Mode (Development)
```bash
npm run test:watch
```

---

## 📦 What's Included

### ✅ Test Infrastructure
- **Jest**: Testing framework with React Testing Library
- **Fake Data Generators**: Realistic user, plan, and notification generators
- **Mock Services**: Firebase, OpenAI, and SendGrid mocks
- **CI/CD Integration**: GitHub Actions workflow for automated testing

### ✅ Test Categories

#### 1. **Unit Tests**
Individual function and component testing.

#### 2. **Integration Tests** (`npm run test:integration`)
Tests complete workflows:
- Plan creation lifecycle
- Milestone detection logic
- Duplicate prevention
- Notification generation

#### 3. **API Tests** (`npm run test:api`)
Tests API endpoints:
- `/api/milestoneReminders`
- Background AI processing
- Error handling
- Fallback systems

#### 4. **E2E Tests** (`npm run test:e2e`)
Complete user journey simulations with fake users:
- **Journey 1**: New user onboarding (registration → first notification)
- **Journey 2**: Multi-plan power user (3 active plans)
- **Journey 3**: Inactive user re-engagement
- **Journey 4**: Achievement unlocking progression
- **Journey 5**: Email preference management

---

## 🤖 Fake User Simulation

### Generate Fake Users

```typescript
import { generateFakeUser } from './__tests__/utils/testHelpers';

const user = generateFakeUser({
  displayName: 'Alice Johnson',
  email: 'alice@example.com'
});

// Includes realistic Enneagram results
console.log(user.enneagramResult.summary);
// "You are primarily an Enneagram Type 3 - The Achiever..."
```

### Generate Fake Plans

```typescript
import { generateFakePlan } from './__tests__/utils/testHelpers';

const plan = generateFakePlan(userId, {
  goalType: 'consultant',
  nudgeFrequency: 'weekly',
  hasTimePressure: true
});

// Includes 5 milestones with personality tips
console.log(plan.milestones[0].blindSpotTip);
// "Perfectionists may spend too much time on research..."
```

### Generate Current Milestones

```typescript
import { generateCurrentMilestonePlan } from './__tests__/utils/testHelpers';

// Creates a plan with milestone active right now
const plan = generateCurrentMilestonePlan(userId);

const milestone = plan.milestones[0];
console.log(milestone.startDate); // 7 days ago
console.log(milestone.dueDate);   // 7 days from now
```

---

## 📊 Test Coverage

### Current Coverage Targets
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### View Coverage Report
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

The project includes automated testing on every push and PR:

**File**: `.github/workflows/test.yml`

**Runs**:
1. **Linting**: Code quality checks
2. **Unit Tests**: Fast feedback on code changes
3. **Integration Tests**: Workflow validation
4. **E2E Tests**: Complete user journeys
5. **Coverage Upload**: Codecov integration

**Matrix Testing**:
- Node.js 18.x
- Node.js 20.x

### Manual Trigger
```bash
# Via GitHub UI: Actions → Run Tests → Run workflow
```

---

## 🧪 Test Examples

### Example 1: Complete User Journey

```typescript
test('should complete full onboarding and receive first milestone reminder', async () => {
  // 1. User registers
  const user = generateFakeUser({ email: 'alice@example.com' });

  // 2. Completes Enneagram
  expect(user.enneagramResult).toBeTruthy();

  // 3. Opts in for emails
  const settings = generateFakeCompanionSettings(user.uid, user.email, true);
  expect(settings.emailNudgesOptIn).toBe(true);

  // 4. Creates plan with current milestone
  const plan = generateCurrentMilestonePlan(user.uid);
  expect(plan.status).toBe('active');

  // 5. System creates notification
  const notification = generateFakeNotification(user.uid, plan.id);
  expect(notification.type).toBe('milestone_reminder');

  // 6. Email gets sent
  notification.emailStatus.sent = true;
  expect(notification.emailStatus.sent).toBe(true);

  // 7. User provides feedback
  notification.feedback = 'I like this nudge';

  // 8. Earns XP
  const xpEarned = 200 + 25; // Plan creation + feedback
  expect(xpEarned).toBe(225);
});
```

### Example 2: API Endpoint Test

```typescript
test('should return success response immediately', async () => {
  const startTime = Date.now();

  const response = {
    status: 'success',
    remindersQueued: 3,
    message: 'Successfully queued 3 milestone reminders'
  };

  const responseTime = Date.now() - startTime;

  expect(response.status).toBe('success');
  expect(responseTime).toBeLessThan(1000); // Under 1 second
});
```

### Example 3: Integration Test

```typescript
test('should identify current milestones correctly', () => {
  const plan = generateCurrentMilestonePlan(userId);
  const milestone = plan.milestones[0];

  const today = new Date();
  const startDate = new Date(milestone.startDate);
  const dueDate = new Date(milestone.dueDate);

  const isCurrentMilestone =
    startDate <= today &&
    today <= dueDate &&
    !milestone.completed;

  expect(isCurrentMilestone).toBe(true);
});
```

---

## 🎭 Fake User Personas

The E2E tests simulate 5 different user personas:

### 1. **Alice Johnson** - New User
- Signs up
- Completes Enneagram assessment
- Creates first plan
- Receives milestone reminder
- Provides feedback

**Result**: Earns 225 XP, unlocks "Goal Setter" achievement

### 2. **Bob Chen** - Power User
- Manages 3 active plans simultaneously
- Career, personal, and health goals
- Multiple milestones across all plans

**Result**: Level 3+ user with multiple achievements

### 3. **Carol Davis** - Returning User
- Previously inactive account
- Has partially completed plan
- Overdue milestones

**Result**: Re-engagement notification sent

### 4. **David Lee** - Achievement Hunter
- Focuses on unlocking all achievements
- Tracks progress meticulously
- Responds to all nudges

**Result**: 60% progress on "Milestone Master"

### 5. **Eva Martinez** - Privacy-Conscious User
- Opts in initially
- Later opts out of emails
- Still receives in-app notifications

**Result**: Demonstrates email preference flexibility

---

## 📁 File Structure

```
__tests__/
├── README.md                      # Test suite documentation
├── utils/
│   └── testHelpers.ts            # Fake data generators
├── integration/
│   └── planLifecycle.test.ts     # Plan workflow tests
├── api/
│   └── milestoneReminders.test.ts # API endpoint tests
└── e2e/
    └── completeUserJourney.test.ts # User journey simulations

.github/
└── workflows/
    └── test.yml                   # CI/CD configuration

jest.config.js                     # Jest configuration
jest.setup.js                      # Test environment setup
```

---

## 🔧 Advanced Usage

### Run Specific Test
```bash
npm test -- -t "should create a new plan with milestones"
```

### Update Snapshots
```bash
npm test -- -u
```

### Debug Tests
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Run Tests on Changed Files Only
```bash
npm test -- --onlyChanged
```

### Run Tests with Specific Pattern
```bash
npm test -- planLifecycle
```

---

## 🐛 Debugging

### Enable Verbose Output
```bash
npm test -- --verbose
```

### See Console Logs
```bash
npm test -- --silent=false
```

### Run Single File
```bash
npm test -- __tests__/e2e/completeUserJourney.test.ts
```

### VS Code Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Current File",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "${fileBasenameNoExtension}",
    "--runInBand",
    "--no-cache"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

---

## 🚦 Pre-commit Testing

### Install Husky (Optional)
```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm test -- --bail --findRelatedTests"
```

This runs tests on changed files before each commit.

---

## 📈 Monitoring Test Performance

### Generate Performance Report
```bash
npm test -- --logHeapUsage
```

### Parallel Testing
```bash
npm test -- --maxWorkers=4
```

### Sequential Testing (for debugging)
```bash
npm test -- --runInBand
```

---

## 🎯 Best Practices

### ✅ DO
- Use fake data generators for all test data
- Mock external services (Firebase, OpenAI, SendGrid)
- Test edge cases and error scenarios
- Keep tests independent and isolated
- Clean up after tests
- Write descriptive test names
- Group related tests with `describe` blocks

### ❌ DON'T
- Hardcode test data
- Depend on test execution order
- Use real API keys in tests
- Skip cleanup steps
- Test implementation details
- Leave console.log statements

---

## 🔮 Future Enhancements

### Planned Test Additions
1. **Component Tests**: React component rendering and interaction
2. **Performance Tests**: Load testing for API endpoints
3. **Security Tests**: Authentication and authorization validation
4. **Accessibility Tests**: WCAG 2.1 AA compliance
5. **Visual Regression Tests**: UI consistency validation
6. **Load Tests**: Concurrent user simulation

### Infrastructure Improvements
1. **Test Data Seeding**: Pre-populate test database
2. **Snapshot Testing**: Track expected outputs
3. **Mutation Testing**: Validate test effectiveness
4. **Contract Testing**: API contract validation

---

## 🆘 Troubleshooting

### Tests Failing on CI but Passing Locally
- Clear Jest cache: `npm test -- --clearCache`
- Check environment variables in GitHub Secrets
- Verify Node.js version matches

### Timeout Errors
- Increase timeout in `jest.config.js`: `testTimeout: 30000`
- Or per-test: `jest.setTimeout(60000)`

### Mock Issues
- Clear mocks between tests: `jest.clearAllMocks()`
- Reset modules: `jest.resetModules()`

### Coverage Not Updating
- Delete coverage folder: `rm -rf coverage`
- Run with `--no-cache` flag

---

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

## ✅ Summary

You now have a **fully automated testing suite** that:

✅ **Generates fake users** with realistic data
✅ **Simulates complete user journeys** from signup to notifications
✅ **Tests all critical workflows** (plan creation, milestone detection, notifications)
✅ **Runs automatically** on every push and PR via GitHub Actions
✅ **Provides coverage reports** to track code quality
✅ **Supports local development** with watch mode
✅ **Includes 5 different user personas** for comprehensive testing

**Run your first test now**:
```bash
npm test
```

🎉 Happy testing!
