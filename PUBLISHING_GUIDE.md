# Publishing Guide for Stryker Bun Runner Plugin

This document provides a step-by-step guide to publish the `@stryker-mutator/bun-runner` plugin to NPM.

**Last updated**: January 2025

## Prerequisites

1. **NPM Account**: Create an account at [npmjs.com](https://www.npmjs.com/) if you don't have one
2. **NPM Authentication**: Run `npm login` in the terminal and authenticate
3. **Node.js and NPM**: Updated versions installed
4. **Bun**: Make sure Bun is installed for local testing

## 1. Code Preparation

### 1.1 Code Quality Verification

```bash
# Run linting
npm run lint

# Run tests
npm test

# Run build
npm run build

# Run mutation tests
npx stryker run
```

### 1.2 Documentation Update

- [ ] Update README.md with:
  - Badges (npm version, downloads, build status)
  - Clear installation instructions
  - Usage examples
  - Available configurations
  - Link to complete documentation

- [ ] Create/update CHANGELOG.md
- [ ] Verify all code comments are updated

## 2. Package.json Configuration

### 2.1 Essential Fields

```json
{
  "name": "@stryker-mutator/bun-runner",
  "version": "0.1.0",
  "description": "A Stryker test runner plugin for running tests using Bun",
  "keywords": [
    "stryker",
    "stryker-plugin",
    "stryker-test-runner",
    "bun",
    "test-runner",
    "mutation-testing"
  ],
  "author": "Eduardo Menoncello <your-email@example.com>",
  "license": "Apache-2.0",
  "homepage": "https://github.com/stryker-mutator/stryker-js/tree/master/packages/bun-runner#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/your-username/stryker-bun.git"
  },
  "bugs": {
    "url": "https://github.com/your-username/stryker-bun/issues"
  }
}
```

### 2.2 Publishing Configuration

```json
{
  "main": "dist/src/index.js",
  "types": "dist/src/index.d.ts",
  "files": [
    "dist/src/**/*.js",
    "dist/src/**/*.d.ts",
    "dist/src/**/*.js.map",
    "README.md",
    "LICENSE"
  ],
  "engines": {
    "node": ">=18.0.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

### 2.3 NPM Scripts

```json
{
  "scripts": {
    "prepare": "npm run build",
    "prepublishOnly": "npm test && npm run lint",
    "version": "npm run format && git add -A src",
    "postversion": "git push && git push --tags"
  }
}
```

## 3. TypeScript Configuration

### 3.1 Verify tsconfig.json

```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist"
  }
}
```

## 4. Control Files

### 4.1 Create .npmignore

```
# Development files
src/
test/
*.test.ts
*.spec.ts
tsconfig.json
.eslintrc*
.prettierrc*

# Configurations
stryker.config.json
.vscode/
.idea/

# Logs and temporary files
*.log
.stryker-tmp/
coverage/
.nyc_output/

# Development documentation
CONTRIBUTING.md
DEVELOPMENT.md
```

### 4.2 Verify .gitignore

Make sure `dist/` is not in .gitignore if you want to commit the compiled files.

## 5. Local Testing

### 5.1 Test with npm link

```bash
# In the plugin directory
npm link

# In a test project
npm link @stryker-mutator/bun-runner

# Test the installation
npx stryker init
# Select bun as test runner
```

### 5.2 Test with npm pack

```bash
# Create package locally
npm pack --dry-run  # See what will be included
npm pack           # Create the .tgz file

# In a test project
npm install ../path/to/stryker-mutator-bun-runner-0.1.0.tgz
```

## 6. Security

### 6.1 Dependency Audit

```bash
npm audit
npm audit fix
```

### 6.2 Leak Verification

```bash
# Install verification tool
npm install -g @lirantal/is-website-vulnerable

# Check for accidental secrets
grep -r "password\|secret\|key\|token" . --exclude-dir=node_modules --exclude-dir=dist
```

## 7. Versioning

### 7.1 Semantic Versioning

- **MAJOR** (1.0.0): Incompatible changes with previous versions
- **MINOR** (0.1.0): New compatible features
- **PATCH** (0.0.1): Compatible bug fixes

### 7.2 Current Version

The project is already at version `0.3.0`. For the next release:

- For fixes: `0.3.1`
- For new features: `0.4.0`
- For stable version: `1.0.0`

## 8. Publishing

### 8.1 Final Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bump in package.json
- [ ] Build generated without errors
- [ ] Local test with npm link working

### 8.2 Publishing Commands

```bash
# Verify if logged in
npm whoami

# Tag the version (if first time publishing)
npm version minor

# Publish (with public scope)
npm publish --access public

# Or if already configured in package.json
npm publish
```

### 8.3 Post-Publishing Verification

```bash
# Verify on NPM
npm view @stryker-mutator/bun-runner

# Test installation in clean project
mkdir test-install && cd test-install
npm init -y
npm install @stryker-mutator/bun-runner
```

## 9. Post-Publishing Maintenance

### 9.1 Monitoring

- Monitor issues on GitHub
- Respond to community questions
- Monitor downloads on npm

### 9.2 Updates

1. For bug fixes: `npm version patch`
2. For new features: `npm version minor`
3. For breaking changes: `npm version major`

### 9.3 Deprecation (if necessary)

```bash
npm deprecate @stryker-mutator/bun-runner@"< 1.0.0" "Version discontinued, use 1.0.0 or higher"
```

## 10. CI/CD and Automation

### 10.1 GitHub Actions for Automatic Release

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Publish to NPM
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}

      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body: |
            See CHANGELOG.md for change details.
          draft: false
          prerelease: false
```

### 10.2 Configure NPM Token

1. Go to npmjs.com → Account Settings → Access Tokens
2. Create an "Automation" type token
3. On GitHub: Settings → Secrets → Actions → New repository secret
4. Name: `NPM_TOKEN`, value: the created token

### 10.3 CI Workflow for PRs

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

## 11. Stryker Ecosystem Integration

### 11.1 Request Official Inclusion

1. Open issue in [stryker-js](https://github.com/stryker-mutator/stryker-js) repository
2. Create PR if requested to add to official plugin list
3. Update Stryker documentation if necessary

### 11.2 NPM Tags

Make sure package.json includes the correct tags:

- `stryker-plugin`
- `stryker-test-runner`

## 12. Project-Specific Preparation

### 12.1 Remove Debug Files

Before publishing, remove or exclude:

- Diagnostic scripts in `scripts/`
- Local test configurations
- Stryker temporary files

```bash
# Clean temporary files
npm run cleanup
rm -rf .stryker-tmp/
rm -rf coverage/
rm -rf reports/
```

### 12.2 Verify Compatibility

```bash
# Test with different Bun versions
bun --version  # Verify minimum supported version

# Test with different Node versions
nvm use 18 && npm test
nvm use 20 && npm test
nvm use 22 && npm test
```

### 12.3 Update Examples

Make sure the `example/` directory is updated:

- Working configuration
- Clear README with instructions
- Working example tests

## Useful Commands

```bash
# See package information before publishing
npm pack --dry-run

# Verify what will be published
npm publish --dry-run

# See all published versions
npm view @stryker-mutator/bun-runner versions

# Unpublish version (use carefully, only within 72h)
npm unpublish @stryker-mutator/bun-runner@0.1.0
```

## Troubleshooting

### Permission Error

If you receive error 403, verify:

- If logged in: `npm login`
- If package name is available
- If using correct scope

### Build Error

- Clean dist: `rm -rf dist/`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Verify TypeScript: `npx tsc --noEmit`

### Package Doesn't Appear on NPM

- May take a few minutes to appear
- Check at: https://www.npmjs.com/package/@stryker-mutator/bun-runner

## FAQ

### Q: Do I need to be a member of @stryker-mutator organization to publish?

A: Not initially. You can publish as a scoped package, but for official inclusion, you'll need to coordinate with the Stryker team.

### Q: How to test if the plugin works before publishing?

A: Use `npm link` to test locally or publish a beta version: `npm publish --tag beta`

### Q: How long does it take for the package to appear on NPM?

A: Usually appears in seconds, but may take up to 5 minutes to be fully available.

### Q: Can I publish automatically via CI?

A: Yes! Use GitHub Actions with an automation NPM token (see section 10).

### Q: How to handle breaking changes?

A: Increment MAJOR version and clearly document changes in CHANGELOG.md

## Additional Resources

- [NPM Docs - Publishing](https://docs.npmjs.com/cli/v10/commands/npm-publish) (updated for 2025)
- [Stryker Plugin Guide](https://stryker-mutator.io/docs/stryker-js/guides/create-a-plugin/)
- [TypeScript Publishing Guide](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html)
- [Semantic Versioning](https://semver.org/)
- [NPM Best Practices 2025](https://docs.npmjs.com/packages-and-modules/publishing-packages)
