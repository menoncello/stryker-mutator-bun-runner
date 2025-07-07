# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 0.3.x   | :white_check_mark: |
| 0.2.x   | :x:                |
| 0.1.x   | :x:                |

## Reporting a Vulnerability

We take the security of the Stryker Bun Runner seriously. If you have discovered a security vulnerability, please follow these steps:

### 1. Do NOT Create a Public Issue

Security vulnerabilities should not be reported through public GitHub issues to prevent malicious exploitation.

### 2. Report Privately

Please report security vulnerabilities by emailing the maintainers directly. Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### 3. Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 5 business days
- **Fix Timeline**: Depends on severity
  - Critical: Within 7 days
  - High: Within 14 days
  - Medium: Within 30 days
  - Low: Next regular release

### 4. Disclosure Policy

- We will work with you to understand and validate the issue
- A fix will be prepared and tested privately
- We will coordinate the disclosure timeline with you
- Credit will be given to the reporter (unless anonymity is requested)

## Security Best Practices for Users

When using this plugin:

1. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm update
   ```

2. **Use Lock Files**
   Always commit your `package-lock.json` or `bun.lockb`

3. **Limit Permissions**
   Run tests with minimal required permissions

4. **Validate Configuration**
   Ensure your Stryker configuration files come from trusted sources

5. **Monitor for Vulnerabilities**
   ```bash
   npm audit fix
   ```

## Security Features

This plugin implements several security measures:

- Input validation for all configuration options
- Sandboxed test execution
- No execution of arbitrary code from configuration
- Limited file system access
- Process isolation for test runs

## Dependencies

We regularly update dependencies and monitor for security vulnerabilities using:
- GitHub Dependabot
- npm audit
- Snyk vulnerability scanning

## Contact

For security concerns, contact:
- Email: [security contact email]
- GPG Key: [if applicable]

Thank you for helping keep Stryker Bun Runner secure!