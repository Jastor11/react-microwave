import type {
  ReportStats,
  TestSuiteSummaryResults,
  ITestSuiteSummary,
  TestCaseSummaryResults,
  ITestCaseSummary,
  MicrowaveReportJson,
  SuiteName,
} from "./types"
import { MicrowaveTimer } from "./timer"

export const createEmptyStats = (): ReportStats => ({
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  ok: true,
  duration: 0,
  startTs: 0,
  finishTs: 0,
})

const createEmptyTestCaseResults = (
  order?: number,
  description?: string,
  suiteName?: string,
  startTs?: number
): TestCaseSummaryResults => ({
  order: order ?? -1,
  description: description ?? "",
  suiteName: suiteName ?? "",
  annotations: [],
  ok: true,
  retry: 0,
  errors: [],
  status: "passed",
  startTs: startTs ?? 0,
  finishTs: 0,
  duration: 0,
})

const createEmptyTestSuiteResults = (
  suiteName: SuiteName,
  suiteOrder: number,
  total: number,
  startTs?: number
): TestSuiteSummaryResults => ({
  suiteName,
  suiteOrder,
  tests: [],
  stats: {
    ...createEmptyStats(),
    startTs: startTs ?? 0,
    total,
  },
})

const createEmptyMicrowaveReport = (projectName: string, startTs?: number): MicrowaveReportJson => ({
  suites: [],
  stats: {
    ...createEmptyStats(),
    startTs: startTs ?? 0,
  },
  projectName,
})

export class TestCaseSummary implements ITestCaseSummary {
  public results: TestCaseSummaryResults
  private timer: MicrowaveTimer

  public constructor(order?: number, description?: string, suiteName?: string) {
    this.timer = new MicrowaveTimer()
    this.results = createEmptyTestCaseResults(order, description, suiteName, this.timer.startTs)
  }

  public processTestCaseResults(testCaseResults: {
    e?: string
    name?: string
    status: TestCaseSummaryResults["status"]
    retries?: number
  }): void {
    this.results.errors = testCaseResults.e ? [testCaseResults.e] : []
    this.results.status = testCaseResults.status
    this.results.ok = testCaseResults.status === "passed"
    this.results.retry = testCaseResults.retries ?? 0
    this.finalizeSummary()
  }

  public finalizeSummary(): void {
    this.timer.stopTimer()
    this.results.finishTs = this.timer.finishTs ?? 0
    this.results.duration = this.timer.duration ?? 0
  }

  public toJson(): TestCaseSummaryResults {
    return {
      ...this.results,
    }
  }
}

export class TestSuiteSummary implements ITestSuiteSummary {
  public summary: TestSuiteSummaryResults
  private timer: MicrowaveTimer

  constructor(suiteName: string = "", suiteOrder = 0, total = 0) {
    this.timer = new MicrowaveTimer()
    this.summary = createEmptyTestSuiteResults(suiteName, suiteOrder, total, this.timer.startTs)
  }

  public processTestCaseResultsSummary(testCaseSummary: ITestCaseSummary): void {
    const testCase = testCaseSummary.toJson()
    this.summary.tests.push(testCase)
    this.summary.stats.passed += testCase.ok ? 1 : 0
    this.summary.stats.failed += testCase.ok ? 0 : 1
    this.summary.stats.skipped += testCase.status === "skipped" ? 1 : 0
    this.summary.stats.ok = this.summary.stats.failed === 0
  }

  public finalizeSummary(): void {
    this.timer.stopTimer()
    this.summary.stats.finishTs = this.timer.finishTs ?? 0
    this.summary.stats.duration = this.timer.duration ?? 0
  }

  public toJson(): TestSuiteSummaryResults {
    return {
      ...this.summary,
    }
  }
}

export class MicrowaveReport {
  public report: MicrowaveReportJson
  private timer: MicrowaveTimer

  public constructor(projectName?: string) {
    this.timer = new MicrowaveTimer()
    this.report = createEmptyMicrowaveReport(projectName ?? "", this.timer.startTs)
  }

  public processTestSuiteSummary(testSuiteSummary: ITestSuiteSummary): void {
    const suite = testSuiteSummary.toJson()
    this.report.suites.push(suite)
    this.report.stats.total += suite.stats.total
    this.report.stats.passed += suite.stats.passed
    this.report.stats.failed += suite.stats.failed
    this.report.stats.skipped += suite.stats.skipped
    this.report.stats.ok = this.report.stats.failed === 0
  }

  public finalizeReport(): void {
    this.timer.stopTimer()
    this.report.stats.finishTs = this.timer.finishTs ?? 0
    this.report.stats.duration = this.timer.duration ?? 0
  }

  public toJson(): MicrowaveReportJson {
    return {
      ...this.report,
    }
  }
}
