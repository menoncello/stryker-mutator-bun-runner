# Cleanup Analysis for Stryker Bun Runner

## 🚨 Critical Issues Found

### 1. **Massive Temporary File Accumulation**

- **8,485 temporary files** found in `/coverage/` directory
- All files match pattern `.lcov.info.*.tmp`
- These are consuming unnecessary disk space
- Should be cleaned immediately

### 2. **IDE Files Not Excluded**

- `.idea/` directory is present (IntelliJ IDEA)
- `.nyc_output/` directory exists
- These should not be in version control

## 📁 Files/Directories to Clean

### Immediate Deletion Required

```bash
# Remove all temporary coverage files (8,485 files!)
rm -f coverage/.lcov.info.*.tmp

# Remove NYC output directory
rm -rf .nyc_output/

# Remove IDE directory
rm -rf .idea/
```

### Files That Were Already Deleted (per git status)

- `stryker-safe.config.mjs`
- `stryker-self.config.mjs`
- `stryker.config.mjs`

## 📝 .gitignore Updates Needed

Add the following to `.gitignore`:

```gitignore
# IDE files
.idea/
*.iml
.vscode/
*.code-workspace

# NYC output
.nyc_output/

# Temporary files
*.tmp
*.temp
*.bak
*~
.*.swp
.*.swo

# OS files
Thumbs.db
Desktop.ini

# Additional test artifacts
test-results/
test-output/

# Bun specific
bun.lockb

# Size limit config (generated)
.size-limit.json
```

## ✅ Files to Keep and Commit

These untracked files should be committed:

- `.editorconfig` - Editor configuration
- `.nvmrc` - Node version specification
- `.prettierrc` - Code formatter configuration
- `PUBLISHING_GUIDE.md` - Documentation
- `SECURITY.md` - Security policy
- `scripts/cleanup-processes.cjs` - Utility script

## 📊 Disk Space Impact

Estimated space saved by cleanup:

- Temporary coverage files: ~100-200 MB (8,485 files)
- .idea directory: ~1-5 MB
- .nyc_output: ~1-2 MB

## 🔧 Cleanup Commands

Execute in order:

```bash
# 1. Clean temporary files
rm -f coverage/.lcov.info.*.tmp

# 2. Remove IDE and temp directories
rm -rf .idea/
rm -rf .nyc_output/

# 3. Update .gitignore
# (add the patterns listed above)

# 4. Commit important config files
git add .editorconfig .nvmrc .prettierrc
git add PUBLISHING_GUIDE.md SECURITY.md
git add scripts/cleanup-processes.cjs

# 5. Remove deleted config files from git
git rm stryker-safe.config.mjs stryker-self.config.mjs stryker.config.mjs

# 6. Verify cleanup
find . -name "*.tmp" | wc -l  # Should return 0
```

## 🛡️ Prevention

To prevent future accumulation:

1. Add proper cleanup in test scripts
2. Configure coverage tools to clean temporary files
3. Add a cleanup script to package.json:
   ```json
   "clean:temp": "rm -f coverage/*.tmp"
   ```
4. Run cleanup after test/coverage commands

## 📝 Additional Notes

- The diagnostic scripts in `/scripts/` appear to be useful utilities and should be kept
- Consider adding a pre-commit hook to prevent committing temporary files
- The `.size-limit.json` file was created during our session and can be kept or removed based on whether you plan to use size-limit
