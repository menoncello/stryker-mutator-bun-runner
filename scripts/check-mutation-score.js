#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const BASELINE_FILE = join(projectRoot, '.mutation-baseline.json');
const STRYKER_REPORT = join(projectRoot, 'reports', 'mutation', 'mutation.json');

/**
 * Get list of changed files in the current commit
 * @returns {string[]} Array of changed file paths
 */
function getChangedFiles() {
  try {
    // Get staged files
    const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(file => file.endsWith('.ts') && !file.includes('test') && file.startsWith('src/'));

    return staged;
  } catch (error) {
    console.error('Error getting changed files:', error.message);
    return [];
  }
}

/**
 * Load baseline mutation scores
 * @returns {Object} Baseline scores by file
 */
function loadBaseline() {
  if (!existsSync(BASELINE_FILE)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(BASELINE_FILE, 'utf8'));
  } catch (error) {
    console.error('Error loading baseline:', error.message);
    return {};
  }
}

/**
 * Save baseline mutation scores
 * @param {Object} baseline - Baseline scores to save
 */
function saveBaseline(baseline) {
  writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2));
}

/**
 * Extract mutation scores from Stryker report
 * @param {Object} report - Stryker mutation report
 * @returns {Object} Scores by file
 */
function extractScores(report) {
  const scores = {};

  if (!report.files) {
    return scores;
  }

  for (const [filePath, fileData] of Object.entries(report.files)) {
    const relativePath = filePath.replace(projectRoot + '/', '');

    if (fileData.metrics) {
      scores[relativePath] = {
        mutationScore: fileData.metrics.mutationScore || 0,
        totalMutants: fileData.metrics.totalMutants || 0,
        killedMutants: fileData.metrics.killedMutants || 0,
        survivedMutants: fileData.metrics.survivedMutants || 0,
        coverage: fileData.metrics.coverage || 0
      };
    }
  }

  return scores;
}

/**
 * Run Stryker on specific files
 * @param {string[]} files - Files to test
 * @returns {boolean} True if successful
 */
function runStryker(files) {
  if (files.length === 0) {
    console.log('No source files changed, skipping mutation testing');
    return true;
  }

  console.log(`Running mutation testing on ${files.length} changed file(s)...`);

  // Create a temporary Stryker config that only tests changed files
  const tempConfig = {
    $schema: './node_modules/@stryker-mutator/core/schema/stryker-schema.json',
    packageManager: 'npm',
    reporters: ['json', 'progress', 'clear-text'],
    testRunner: 'command',
    commandRunner: {
      command: 'bun test test/ --bail'
    },
    coverageAnalysis: 'perTest',
    mutate: files,
    thresholds: {
      high: 80,
      low: 60,
      break: 0
    },
    tempDirName: '.stryker-tmp',
    cleanTempDir: true,
    concurrency: 4,
    timeoutMS: 10000,
    jsonReporter: {
      fileName: 'reports/mutation/mutation.json'
    }
  };

  const tempConfigPath = join(projectRoot, '.stryker-temp.json');
  writeFileSync(tempConfigPath, JSON.stringify(tempConfig, null, 2));

  try {
    execSync(`npx stryker run ${tempConfigPath}`, {
      stdio: 'inherit',
      cwd: projectRoot
    });

    // Clean up temp config
    execSync(`rm -f ${tempConfigPath}`, { cwd: projectRoot });
    return true;
  } catch (error) {
    // Clean up temp config even on error
    execSync(`rm -f ${tempConfigPath}`, { cwd: projectRoot });
    return false;
  }
}

/**
 * Check if mutation scores have decreased
 * @param {Object} baseline - Baseline scores
 * @param {Object} current - Current scores
 * @param {string[]} changedFiles - List of changed files
 * @returns {Object} Check result with passed status and details
 */
function checkScores(baseline, current, changedFiles) {
  const results = {
    passed: true,
    details: []
  };

  for (const file of changedFiles) {
    const baselineScore = baseline[file];
    const currentScore = current[file];

    if (!currentScore) {
      // New file or no mutations in file
      continue;
    }

    if (baselineScore) {
      // Check for regression
      if (currentScore.mutationScore < baselineScore.mutationScore) {
        results.passed = false;
        results.details.push({
          file,
          type: 'mutation_score_decreased',
          baseline: baselineScore.mutationScore,
          current: currentScore.mutationScore,
          diff: currentScore.mutationScore - baselineScore.mutationScore
        });
      }

      if (currentScore.coverage < baselineScore.coverage) {
        results.passed = false;
        results.details.push({
          file,
          type: 'coverage_decreased',
          baseline: baselineScore.coverage,
          current: currentScore.coverage,
          diff: currentScore.coverage - baselineScore.coverage
        });
      }
    }
  }

  return results;
}

/**
 * Main execution
 */
async function main() {
  const changedFiles = getChangedFiles();

  if (changedFiles.length === 0) {
    console.log('✅ No source files to check');
    process.exit(0);
  }

  // Run Stryker
  const strykerSuccess = runStryker(changedFiles);

  if (!strykerSuccess) {
    console.error('❌ Stryker execution failed');
    process.exit(1);
  }

  // Check if report exists
  if (!existsSync(STRYKER_REPORT)) {
    console.error('❌ Mutation report not found');
    process.exit(1);
  }

  // Load report and extract scores
  const report = JSON.parse(readFileSync(STRYKER_REPORT, 'utf8'));
  const currentScores = extractScores(report);

  // Load baseline
  const baseline = loadBaseline();

  // Check for regressions
  const checkResult = checkScores(baseline, currentScores, changedFiles);

  if (!checkResult.passed) {
    console.error('\n❌ Mutation testing failed: Score regression detected\n');

    for (const detail of checkResult.details) {
      if (detail.type === 'mutation_score_decreased') {
        console.error(`  📉 ${detail.file}`);
        console.error(
          `     Mutation score: ${detail.baseline.toFixed(2)}% → ${detail.current.toFixed(2)}% (${detail.diff.toFixed(2)}%)`
        );
      } else if (detail.type === 'coverage_decreased') {
        console.error(`  📉 ${detail.file}`);
        console.error(
          `     Coverage: ${detail.baseline.toFixed(2)}% → ${detail.current.toFixed(2)}% (${detail.diff.toFixed(2)}%)`
        );
      }
    }

    console.error('\n💡 Tip: Improve your tests to kill more mutants or fix the regression before committing');
    process.exit(1);
  }

  // Update baseline with new scores
  const updatedBaseline = { ...baseline };
  for (const [file, score] of Object.entries(currentScores)) {
    if (changedFiles.includes(file)) {
      updatedBaseline[file] = score;
    }
  }
  saveBaseline(updatedBaseline);

  console.log('✅ Mutation testing passed: No regression detected');

  // Show current scores
  for (const file of changedFiles) {
    const score = currentScores[file];
    if (score) {
      console.log(
        `  📊 ${file}: ${score.mutationScore.toFixed(2)}% mutation score, ${score.coverage.toFixed(2)}% coverage`
      );
    }
  }
}

// Run main
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
