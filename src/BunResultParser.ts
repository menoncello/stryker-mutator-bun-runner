import {Logger} from '@stryker-mutator/api/logging';
import {BunTestResult, BunTestResultData} from './BunTestRunnerOptions';
import {SourceMapHandler} from './utils/SourceMapHandler.js';

export class BunResultParser {
    private readonly log: Logger;
    private readonly sourceMapHandler: SourceMapHandler;

    private static readonly PASSED_PATTERN = /(?:✓|\(pass\))\s+(.+?)(?:\s+\[(\d+(?:\.\d+)?)ms\])?$/;
    private static readonly FAILED_PATTERN = /(?:✗|\(fail\))\s+(.+?)(?:\s+\[(\d+(?:\.\d+)?)ms\])?$/;
    private static readonly SKIPPED_PATTERN = /(?:⏭|\(skip\))\s+(.+)/;
    private static readonly SUMMARY_PATTERN = /(\d+)\s+pass\s*\|\s*(\d+)\s+fail/;
    private static readonly DURATION_PATTERN = /(\d+(?:\.\d+)?)ms\)/;

    constructor(logger: Logger) {
        this.log = logger;
        this.sourceMapHandler = new SourceMapHandler(logger);
    }

    public async parse(output: string): Promise<BunTestResult> {
        this.log.debug('Parsing Bun test output');

        const lines = output.split('\n');
        const parseResult = await this.parseTestLines(lines);
        const duration = this.extractDuration(output);

        this.log.debug(`Parsed ${parseResult.total} tests: ${parseResult.passed} passed, ${parseResult.failed} failed`);

        return {
            ...parseResult,
            duration,
            failedTests: parseResult.failedTests.length > 0 ? parseResult.failedTests : undefined
        };
    }

    // eslint-disable-next-line complexity
    private async parseTestLines(lines: string[]) {
        const tests: BunTestResultData[] = [];
        let passed = 0;
        let failed = 0;
        let currentTest: Partial<BunTestResultData> | null = null;
        let errorBuffer: string[] = [];

        for (const line of lines) {
            const result = this.processLine(line, currentTest);

            if (result.test) {
                // Map error stack trace if test failed
                if (result.test.status === 'failed' && result.test.error) {
                    result.test.error = await this.sourceMapHandler.mapStackTrace(result.test.error);
                }

                tests.push(result.test);
                if (result.test.status === 'passed') passed++;
                if (result.test.status === 'failed') failed++;
                errorBuffer = [];
            }

            if (result.updateCounts) {
                passed = result.updateCounts.passed;
                failed = result.updateCounts.failed;
            }

            currentTest = result.currentTest;

            // Collect error lines for failed tests
            if (currentTest && currentTest.status === 'failed' && line.trim()) {
                errorBuffer.push(line);
            }
        }

        if (currentTest) {
            // Map error stack trace for remaining test
            if (currentTest.status === 'failed' && errorBuffer.length > 0) {
                currentTest.error = await this.sourceMapHandler.mapStackTrace(errorBuffer.join('\n'));
            }
            tests.push(currentTest as BunTestResultData);
        }

        return {
            tests,
            passed,
            failed,
            total: tests.length || passed + failed,
            failedTests: tests.filter(t => t.status === 'failed')
        };
    }

    private processLine(
        line: string,
        currentTest: Partial<BunTestResultData> | null
    ): {
        test?: BunTestResultData;
        updateCounts?: { passed: number; failed: number };
        currentTest: Partial<BunTestResultData> | null;
    } {
        if (line.includes('✓') || line.includes('(pass)')) {
            return this.handlePassedTest(line);
        }

        if (line.includes('✗') || line.includes('(fail)')) {
            return this.handleFailedTest(line);
        }

        if (line.includes('⏭') || line.includes('(skip)')) {
            return this.handleSkippedTest(line);
        }

        const summaryResult = this.handleSummaryLine(line);
        if (summaryResult) {
            return summaryResult;
        }

        return this.handleErrorLine(line, currentTest);
    }

    private handlePassedTest(line: string) {
        const match = BunResultParser.PASSED_PATTERN.exec(line);
        if (!match) return {currentTest: null};

        return {
            test: {
                name: match[1]?.trim() ?? 'unknown',
                status: 'passed' as const,
                duration: match[2] ? parseFloat(match[2]) : undefined
            },
            currentTest: null
        };
    }

    private handleFailedTest(line: string) {
        const match = BunResultParser.FAILED_PATTERN.exec(line);
        if (!match) return {currentTest: null};

        return {
            test: {
                name: match[1]?.trim() ?? 'unknown',
                status: 'failed' as const,
                duration: match[2] ? parseFloat(match[2]) : undefined
            },
            currentTest: null
        };
    }

    private handleSkippedTest(line: string) {
        const match = BunResultParser.SKIPPED_PATTERN.exec(line);
        if (!match) return {currentTest: null};

        return {
            test: {
                name: match[1]?.trim() ?? 'unknown',
                status: 'skipped' as const
            },
            currentTest: null
        };
    }

    private handleSummaryLine(line: string) {
        const summaryMatch = BunResultParser.SUMMARY_PATTERN.exec(line);
        if (!summaryMatch) return null;

        return {
            updateCounts: {
                passed: parseInt(summaryMatch[1] ?? '0', 10),
                failed: parseInt(summaryMatch[2] ?? '0', 10)
            },
            currentTest: null
        };
    }

    // eslint-disable-next-line complexity
    private handleErrorLine(line: string, currentTest: Partial<BunTestResultData> | null) {
        if (!currentTest || !line.trim() || line.startsWith(' ')) {
            return {currentTest};
        }

        const isNewTest = line.includes('✓') || line.includes('✗') || line.includes('⏭') ||
            line.includes('(pass)') || line.includes('(fail)') || line.includes('(skip)') ||
            line.trim() === '';
        if (isNewTest) {
            return {
                test: currentTest as BunTestResultData,
                currentTest: null
            };
        }

        if (!currentTest.error) {
            currentTest.error = line.trim();
        }

        return {currentTest};
    }

    private extractDuration(output: string): number | undefined {
        const durationMatch = BunResultParser.DURATION_PATTERN.exec(output);
        return durationMatch ? parseFloat(durationMatch[1] ?? '0') : undefined;
    }

    public async dispose(): Promise<void> {
        await this.sourceMapHandler.dispose();
    }
}