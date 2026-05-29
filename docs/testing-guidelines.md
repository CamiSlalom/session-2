# Testing Guidelines

This document defines the testing strategy, standards, and workflow for this repository.

## Objectives

- Protect core TODO workflows from regressions.
- Keep tests fast, reliable, and easy to maintain.
- Validate behavior at the right level (unit, integration, E2E).
- Ensure test coverage for core requirements before merge.

## Testing Pyramid and Scope

Use this default pyramid:

- Unit tests (most): test isolated logic and components.
- Integration tests (some): test backend routes and API behavior using real HTTP requests.
- E2E tests (few): test critical user journeys through the browser.

### Unit Tests

Use unit tests for:

- Pure helper functions.
- React component behavior and rendering.
- Small backend modules with mocked dependencies.

Tools:

- Jest
- React Testing Library (frontend)

### Integration Tests

Use integration tests for:

- Express route behavior, status codes, and response payloads.
- API validation and error handling.
- Cross-module behavior inside backend boundaries.
- Backend API endpoints with real HTTP requests.

Tools:

- Jest
- Supertest

Backend integration test conventions:

- Use Jest + Supertest together for backend API endpoint integration tests.
- Place integration tests in packages/backend/__tests__/integration/.
- Use file names ending in *.test.js or *.test.ts.
- Name files by the API area under test (example: todos-api.test.js).

### End-to-End (E2E) Tests

Use E2E tests for:

- Critical TODO user journeys only.
- Cross-layer behavior from UI to API.
- Complete UI workflows through browser automation.

Tool:

- Playwright (required framework; single browser baseline)

E2E test conventions:

- Place E2E tests in tests/e2e/.
- Use file names ending in *.spec.js or *.spec.ts.
- Name files by the user journey under test (example: todo-workflow.spec.js).

Constraints:

- Keep E2E suite small (target 5 to 8 tests).
- Tests must be isolated and independent.
- Use Page Object Model (POM) for maintainability.

## Test Locations and Naming

Preferred structure:

- Frontend unit/component tests: packages/frontend/src/__tests__/
- Backend unit/integration tests: packages/backend/__tests__/
- Backend integration subfolder: packages/backend/__tests__/integration/
- E2E tests: tests/e2e/

Naming conventions:

- Unit and integration: *.test.ts or *.test.tsx (preferred), *.test.js allowed for existing code.
- Backend integration specifically: *.test.js or *.test.ts.
- E2E: *.spec.js or *.spec.ts.
- Name files by behavior under test (example: todo-workflow.spec.js).

## TypeScript-First Testing Standard

- New tests should be written in TypeScript where practical.
- Use explicit types for test helpers, fixture builders, and page objects.
- Existing JavaScript tests can remain until touched or migrated.
- Avoid introducing untyped shared test utilities for new work.

## Command Reference

Run from repository root:

- Frontend tests: npm run test:frontend
- Backend tests: npm run test:backend
- Backend integration tests: npm run test:integration
- E2E tests: npm run test:e2e
- Full test suite: npm run test:all
- Install Playwright browser baseline: npm run test:e2e:install

Package-level commands:

- Frontend watch mode: npm run test:watch --workspace=frontend
- Frontend one-shot coverage run: npm run test --workspace=frontend
- Backend tests: npm run test --workspace=backend

## Port Configuration for App and CI

Use environment variables with sensible defaults so local, CI, and deployed environments can control ports without code changes.

- Backend port config (required): `const PORT = process.env.PORT || 3030;`
- Frontend default port is 3000 and can be overridden with the `PORT` environment variable.
- This convention allows CI/CD workflows to dynamically detect and assign ports.

## Coverage Expectations

Coverage is a signal, not a goal by itself. Prioritize meaningful assertions.

Minimum expectation before merge:

- Core requirement flows are covered:
  - Create TODO item
  - Mark TODO item done/undone
  - Reorder TODO items
- New or changed logic has tests at the appropriate layer.
- Error and empty states are covered where applicable.

Recommended coverage baseline (adjust by team agreement):

- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## Quality Rules for Tests

- Arrange-Act-Assert structure is clear.
- Test names describe behavior, not implementation.
- One primary reason to fail per test.
- Avoid asserting internal implementation details.
- Prefer user-visible assertions in frontend tests.
- Keep mocks minimal; prefer realistic behavior when possible.
- Do not use flaky timing patterns. Prefer wait-for conditions.
- Keep tests deterministic and order-independent.
- All new features must include appropriate tests at the correct test layer.
- Tests must remain maintainable and follow established best practices.

## Frontend Testing Rules

- Use React Testing Library queries in this order when possible:
  - ByRole
  - ByLabelText
  - ByText
  - ByTestId (last resort)
- Verify accessibility-relevant behavior (labels, roles, focus) for interactive UI.
- Mock network calls with MSW for component and integration-style frontend tests.
- Validate loading, success, empty, and error states.

## React Frontend Testing Best Practices

- Test from the user perspective: assert visible behavior, not component internals.
- Keep tests focused on one behavior per test case.
- Prefer semantic queries (role, label, text) over implementation-coupled selectors.
- Use userEvent for realistic interactions instead of low-level event simulation.
- Cover key state transitions: initial, loading, success, empty, and error.
- Keep mocks explicit and minimal; avoid mocking what can be exercised realistically.
- Use deterministic setup and teardown so tests are order-independent.
- Avoid brittle snapshots for dynamic UI; prefer explicit assertions on important output.
- Assert accessibility-critical behaviors for forms, buttons, and keyboard navigation.
- Keep test data small, readable, and localized to each test file when possible.

## Backend Testing Rules

- Verify status code, response shape, and relevant side effects.
- Cover success paths and failure paths.
- For integration tests, avoid over-mocking internal modules.
- Keep fixtures small and explicit.

## E2E Testing Rules

- Focus on critical business journeys only.
- Limit E2E coverage to 5 to 8 critical user journeys.
- Keep each test independent with isolated setup/cleanup.
- Avoid sharing mutable state between tests.
- Use stable selectors and user-centric interactions.
- Use Playwright with one browser only (single browser baseline).
- Use the Page Object Model (POM) pattern for maintainability.
- Setup and teardown hooks are required so E2E tests are reliable across repeated runs.

## Pull Request Test Checklist

Before opening or merging a PR:

- Run tests relevant to your change locally.
- Run full suite for high-risk or cross-package changes.
- Ensure changed behavior has test coverage.
- Ensure no test flakiness or nondeterministic failures.
- Update tests with requirement changes.

## Suggested CI Policy

At minimum, CI should run:

- Frontend test suite
- Backend test suite
- Backend integration test suite

For protected branches, also run:

- E2E suite (or nightly if runtime is too high)

## Definition of Done for Testing

A change is test-complete when:

- Tests exist at the correct level for the change.
- Core user-facing behavior and error paths are validated.
- Relevant suites pass locally and in CI.
- Tests are readable, deterministic, and maintainable.
