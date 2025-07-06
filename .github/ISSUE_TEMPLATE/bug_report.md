---
name: Bug report
about: Create a report to help us improve
title: '[Bug] '
labels: 'bug'
assignees: ''

---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Configuration used: 
```json
{
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "bun": {
    // Your configuration here
  }
}
```
2. Command run: `npx stryker run`
3. Error message or unexpected behavior

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots/Logs**
If applicable, add screenshots or log output to help explain your problem.

**Environment:**
 - OS: [e.g. macOS 14.0, Ubuntu 22.04]
 - Node version: [e.g. 20.10.0]
 - Bun version: [e.g. 1.0.25]
 - @stryker-mutator/bun-runner version: [e.g. 0.3.0]
 - @stryker-mutator/core version: [e.g. 9.0.1]

**Additional context**
Add any other context about the problem here.

**Possible Solution**
If you have an idea of how to fix the bug, please describe it here.