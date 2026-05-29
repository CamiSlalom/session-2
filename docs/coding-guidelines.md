# Coding Guidelines

This document defines coding standards for contributors working in this repository.

## Objectives

- Keep the codebase readable, predictable, and easy to maintain.
- Prefer consistency over personal style.
- Ship changes with appropriate tests and documentation updates.
- Reduce regressions by enforcing small, reviewable changes.

## Repository Structure

- Frontend code lives in packages/frontend.
- Backend code lives in packages/backend.
- Cross-cutting project documentation lives in docs.

Follow existing structure and naming patterns before creating new folders.

## Language and Typing Standards

- Frontend: TypeScript-first for new code (.ts and .tsx).
- Frontend: Use explicit types for props, state models, API shapes, and shared helpers.
- Backend: Existing JavaScript files may remain JavaScript unless a migration is in scope.
- Avoid any and implicit unknown shapes in new TypeScript code.
- Prefer narrow, composable types over broad catch-all interfaces.

## General Code Style

- Write small, focused functions with one clear responsibility.
- Favor early returns to reduce nesting.
- Keep side effects at boundaries (API calls, I/O, storage).
- Use descriptive names for variables and functions.
- Avoid magic numbers and unexplained literals.
- Keep modules cohesive and avoid circular dependencies.

## Formatting Rules

- Use a single automated formatting baseline across the repo.
- Use ESLint to enforce lint and style quality rules.
- Use Prettier (or the configured formatter) for consistent whitespace and line wrapping.
- Do not manually format files in ways that conflict with configured tooling.
- Keep lines readable and avoid dense, multi-purpose expressions.
- Prefer trailing commas where tooling allows to improve diff quality.
- Prefer single-responsibility statements over chained side effects.
- Keep JSX readable by breaking long props and complex conditions across lines.
- Run formatting and lint checks before opening a pull request.

## Naming Conventions

- Favor intention-revealing names over abbreviations.
- Avoid ambiguous names like data, value, item, and temp unless scope is trivial.
- Components: PascalCase and file names in PascalCase for component modules.
- Hooks: camelCase starting with use (example: useTodoFilters).
- Types, interfaces, enums, and type aliases: PascalCase.
- Variables and functions: camelCase.
- Boolean variables and predicates: start with is, has, can, should, or did.
- Constants: UPPER_SNAKE_CASE only for true compile-time constants.
- Event handlers: start with handle (example: handleSubmit).
- Async functions: use verb-first names that describe effect (example: fetchTodos, updateTodoOrder).
- Test files: behavior-aligned names ending in .test.ts/.test.tsx (or existing .js patterns where already established).

## Import Order and Organization

- Keep imports grouped and sorted consistently.
- Use this order with one blank line between groups:
  1. Built-in and framework imports (React, Node core, platform libs).
  2. Third-party packages.
  3. Internal absolute imports (app modules, aliases).
  4. Relative imports from parent/sibling files.
  5. Style imports (CSS) when applicable.
- Within each group, sort alphabetically by module path.
- Prefer named exports/imports for shared utilities to improve discoverability and refactoring safety.
- Avoid deep relative traversal when a stable alias exists.
- Remove unused imports immediately.

## Frontend Guidelines

- Prefer function components and hooks.
- Keep presentational concerns separate from business logic where practical.
- Reuse existing UI components and patterns before creating new ones.
- Use theme tokens for spacing, typography, and color instead of hardcoded values.
- Support responsive behavior using the viewport expectations in docs/ui-guidelines.md.
- Prioritize accessible markup and keyboard-friendly interactions.

## React Frontend Best Practices

- Keep components small and focused on one responsibility.
- Extract non-UI logic into hooks, services, or utility modules.
- Keep component props minimal and explicit; avoid passing large mutable objects when smaller props are sufficient.
- Prefer derived state over duplicated state.
- Avoid storing data that can be computed from props/state during render.
- Use controlled components for forms unless there is a clear performance reason not to.
- Keep effects predictable:
  - Use useEffect for side effects only.
  - Keep dependency arrays correct and explicit.
  - Move effect-heavy logic to custom hooks when complexity grows.
- Memoize only when there is a measured performance need.
- Prefer composition over inheritance and avoid over-abstracting early.
- Keep render branches explicit for loading, error, empty, and success states.
- Use semantic HTML and accessible roles before adding ARIA attributes.

## Separation of Concerns

- Separate UI rendering, state orchestration, and data access.
- Keep API clients and transport details outside UI components.
- Keep mapping/normalization logic close to data boundaries.
- Avoid mixing validation, formatting, and persistence logic in one function.
- Keep backend routes responsible for HTTP concerns and delegate business logic to services.
- Place shared logic in dedicated modules to avoid copy-paste across layers.

## Reusability Guidelines

- Build reusable modules only for repeated or clearly reusable behavior.
- Prefer composition of small primitives over large generic abstractions.
- Design utilities with explicit input/output contracts.
- Keep shared components configurable through clear props, not hidden conventions.
- Avoid creating one-off abstractions that are used only once.
- Document assumptions and constraints for shared helpers and components.
- Reuse existing patterns before introducing a new API shape.

## Backend Guidelines

- Keep route handlers thin; move logic into service/helper functions.
- Validate inputs at API boundaries.
- Return consistent status codes and response shapes.
- Handle error paths explicitly and avoid swallowing exceptions.
- Prefer environment-driven configuration over hardcoded runtime values.

## Error Handling and Logging

- Fail fast on invalid inputs and impossible states.
- Return user-safe error messages to clients.
- Log actionable diagnostic details on the server side.
- Avoid logging sensitive values.

## Testing Requirements

- Add or update tests for all behavior changes.
- Choose the lowest effective level first:
  - Unit tests for isolated logic.
  - Integration tests for API behavior.
  - E2E tests for critical user journeys.
- Keep tests deterministic and independent.
- Follow standards in docs/testing-guidelines.md.

## Performance and Maintainability

- Avoid premature optimization.
- Optimize only after identifying a bottleneck.
- Prefer simple data flow over deeply coupled abstractions.
- Remove dead code and unused dependencies.

## Security and Data Handling

- Treat all external input as untrusted.
- Sanitize or validate request payloads and query params.
- Do not commit secrets or tokens.
- Keep credentials in environment variables.

## Pull Request Expectations

Before merge, ensure:

- The change is scoped and reviewable.
- Code follows these guidelines and project docs.
- Relevant tests pass locally.
- Documentation is updated when behavior, APIs, or workflow changes.

## Definition of Done

A code change is complete when:

- It meets functional requirements.
- It follows coding, UI, and testing guidelines.
- It includes appropriate tests.
- It is readable and maintainable for the next contributor.
