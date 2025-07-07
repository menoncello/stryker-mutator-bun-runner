# Contributing to @stryker-mutator/bun-runner

We love your input! We want to make contributing to the Stryker Bun Runner as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. **Fork the repo** and create your branch from `main`.
2. **Install dependencies** with `npm install`.
3. **Make your changes** and add tests if applicable.
4. **Run the tests** with `npm test`.
5. **Run the linter** with `npm run lint`.
6. **Build the project** with `npm run build`.
7. **Test the example** by running mutation testing in the example directory.
8. **Update documentation** if you changed APIs or added features.
9. **Ensure the CI pipeline passes**.
10. **Issue the pull request**!

## Development Setup

### Prerequisites

- Node.js >= 20.0.0
- Bun >= 1.0.0
- npm (comes with Node.js)
- Git

### Optional Dependencies

- **Graphviz** (for dependency visualization):

  ```bash
  # macOS
  brew install graphviz

  # Ubuntu/Debian
  sudo apt-get install graphviz

  # Windows
  # Download from https://graphviz.org/download/
  ```

  Required for `npm run analyze:deps` to generate dependency diagrams. Without it, the analysis will still run but skip image generation.

### Getting Started

1. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/stryker-bun.git
cd stryker-bun
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

4. Run tests:

```bash
npm test
```

5. Test with the example:

```bash
cd example
npm install
bun test
npx stryker run
```

### Project Structure

```
src/
├── BunTestRunner.ts         # Main test runner implementation
├── BunTestAdapter.ts        # Bun process adapter
├── BunResultParser.ts       # Test result parser
├── BunTestRunnerOptions.ts  # Configuration options
└── coverage/               # Coverage analysis
    ├── MutantCoverageCollector.ts
    ├── TestFilter.ts
    └── CoverageTypes.ts
```

### Running Tests

- **Unit tests**: `npm test`
- **Unit tests with coverage**: `npm run test:coverage`
- **Watch mode**: `npm run test:watch`
- **Linting**: `npm run lint`
- **Linting with auto-fix**: `npm run lint:fix`
- **Build**: `npm run build`
- **Build watch mode**: `npm run build:watch`
- **Integration tests**: `cd example && npx stryker run`
- **Code analysis**: `npm run analyze`
  - Checks for duplicate code with jscpd
  - Checks for circular dependencies with madge
  - Skips dependency visualization without Graphviz

## Code Style

We use ESLint to maintain code quality. Please ensure your code passes linting:

```bash
npm run lint
```

Key style guidelines:

- Use TypeScript for type safety
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Write descriptive test names
- Keep functions focused and small

## Testing Guidelines

- Write unit tests for new functionality
- Test error conditions and edge cases
- Use descriptive test names that explain the behavior
- Mock external dependencies appropriately
- Ensure tests are deterministic
- Aim for 100% code coverage
- Run mutation testing to verify test quality

### Test Structure

```typescript
describe('Component/Feature', () => {
  describe('method/functionality', () => {
    test('should behave correctly when...', () => {
      // Arrange
      const input = setupTestData();

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toEqual(expectedOutput);
    });
  });
});
```

## Bug Reports

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/stryker-mutator/stryker-bun/issues).

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Feature Requests

We welcome feature requests! Please use the [GitHub issues](https://github.com/stryker-mutator/stryker-bun/issues) to discuss new features.

Include:

- **Use case**: Why do you need this feature?
- **Description**: What should the feature do?
- **API design**: How should it work?
- **Backwards compatibility**: Will this break existing functionality?

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible functionality additions
- **PATCH**: Backwards-compatible bug fixes

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a GitHub release
4. Publish to npm

## License

By contributing, you agree that your contributions will be licensed under the Apache-2.0 License.

## References

- [StrykerJS Documentation](https://stryker-mutator.io/docs/stryker-js/)
- [Bun Documentation](https://bun.sh/docs)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## Questions?

Don't hesitate to ask questions by [opening an issue](https://github.com/stryker-mutator/stryker-bun/issues) or reach out to the Stryker community on their [Slack workspace](https://join.slack.com/t/stryker-mutator/shared_invite/enQtOTUyMTYyNTg1NDQ0LTU4ODNmZDlmN2I3MmEyMTVhYjZlYmJkOThlNTY3NTM1M2QxYmM5YTM3ODQxYmJjY2YyYzllM2RkMmM1NjNjZjM).

Thank you for contributing! 🎉
