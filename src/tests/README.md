# Tests Directory

This directory contains all test files for the application.

## Structure

- `unit/` - Unit tests for individual components and functions
- `e2e/` - End-to-end tests using Playwright
- `mocks/` - Mock data and test utilities

## Testing Guidelines

- Unit tests should be co-located with the code they test
- Use meaningful test descriptions
- Follow the AAA pattern (Arrange, Act, Assert)
- Keep tests focused and isolated
- Use appropriate test coverage thresholds
- Mock external dependencies appropriately

## Running Tests

```bash
# Run unit tests
pnpm test

# Run e2e tests
pnpm test:e2e

# Run tests with coverage
pnpm test:coverage
```
