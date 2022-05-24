export type AnyFunction<P extends Parameters<any> = Parameters<any>, R = any> = (...args: P) => R

export type MicrowaveReporters = {
  json?: boolean
  console?: boolean
  html?: boolean
}

export type MicrowaveConfig = {
  appName?: string
  verbose?: boolean
  debug?: boolean
  reporters?: Partial<MicrowaveReporters> // not using this at the moment
  // add more testing config here later
}

export type MicrowaveContext = Record<string, any>
export type MicrowaveTestBaseCallback<T> = (context: T) => Promise<void> | void

export interface MicrowaveBaseHook<T> {
  (hook: MicrowaveTestBaseCallback<T>): Promise<void> | void
  each?: (hook: MicrowaveTestBaseCallback<T>) => void
}

export interface MicrowaveExclusionFunctions<T> {
  only(description: string, cb: MicrowaveTestBaseCallback<T>): void
  skip(description?: string, cb?: MicrowaveTestBaseCallback<T>): void
}

export interface RegisterMicrowaveTestCase<T> extends MicrowaveExclusionFunctions<T> {
  (description: string, cb: MicrowaveTestBaseCallback<T>): void
  // only(description: string, cb: MicrowaveTestBaseCallback<T>): void
  // skip(description?: string, cb?: MicrowaveTestBaseCallback<T>): void
  before: MicrowaveBaseHook<T>
  after: MicrowaveBaseHook<T>
  run(): IMicrowaveSuite // basically works as register now instead
}

export type MicrowaveTest<T> = RegisterMicrowaveTestCase<T>
export type MicrowaveTestCallback<T = MicrowaveContext> = MicrowaveTestBaseCallback<T>
export type MicrowaveHook<T = MicrowaveContext> = MicrowaveBaseHook<T>

export type RegisterTestCase<T = MicrowaveContext> = (
  suiteName: string,
  testCase: { description: string; cb: MicrowaveTestCallback<T> }
) => void

export type RegisterHook<T = MicrowaveContext> = (
  suiteName: string,
  hookType: MicrowaveSuiteHookType,
  cb: MicrowaveTestCallback<T>
) => void

export type RegisterExclusion<T = MicrowaveContext> = (
  suiteName: string,
  exclusionType: MicrowaveSuiteExclusionType<T>,
  testCase: { description: string; cb: MicrowaveTestCallback<T> }
) => void

export type MicrowaveSuiteHooks<T = MicrowaveContext> = {
  before: MicrowaveTestCallback<T>[]
  after: MicrowaveTestCallback<T>[]
  beforeEach: MicrowaveTestCallback<T>[]
  afterEach: MicrowaveTestCallback<T>[]
}

export type MicrowaveSuiteExclusions<T = MicrowaveContext> = {
  only: Array<{ description: string; cb: MicrowaveTestCallback<T> }>
  skip: Array<{ description: string; cb: MicrowaveTestCallback<T> }>
}

export type MicrowaveSuiteHookType = keyof MicrowaveSuiteHooks
export type MicrowaveSuiteExclusionType<T = MicrowaveContext> = keyof MicrowaveSuiteExclusions<T>
export interface MicrowaveSuiteTestCase<T = MicrowaveContext> extends Partial<MicrowaveExclusionFunctions<T>> {
  (description: string, cb: MicrowaveTestCallback<T>): void
}

export interface IMicrowaveSuite<T = MicrowaveContext> {
  suiteName: string
  isRegistered: boolean
  registerTestCase: RegisterTestCase
  registerHook: RegisterHook
  registerExclusion: RegisterExclusion

  test: MicrowaveSuiteTestCase<T>
  before: MicrowaveBaseHook<T>
  after: MicrowaveBaseHook<T>
  beforeEach: MicrowaveBaseHook<T>
  afterEach: MicrowaveBaseHook<T>
  run: () => IMicrowaveSuite<T>
}

export type MicrowaveSuiteStore<T = MicrowaveContext> = MicrowaveSuiteHooks &
  MicrowaveSuiteExclusions & {
    order: number
    ctx: T
    suite: IMicrowaveSuite
    tests: { description: string; cb: MicrowaveTestCallback<T> }[]
    hasOnly: boolean
  }

export type SuitesMapping = Record<string, MicrowaveSuiteStore[]>
export type SuiteName = keyof SuitesMapping

/*============================================================
                         REPORT
==============================================================*/

export type IReportTimer = {
  startTs: number
  finishTs: number
  duration: number
}

export type ReportStats = IReportTimer & {
  total: number
  passed: number
  failed: number
  skipped: number
  ok: boolean
}

export type TestCaseResultsStatus = "passed" | "failed" | "timedOut" | "skipped"

export type TestCaseSummaryResults = IReportTimer & {
  order: number
  description: string
  suiteName: string
  annotations: { type: string; description?: string }[]
  ok: boolean
  retry: number
  errors: string[]
  status: TestCaseResultsStatus
}

export type TestSuiteSummaryResults = {
  suiteOrder: number
  suiteName: string
  tests: TestCaseSummaryResults[]
  stats: ReportStats
}

export type MicrowaveReportJson = {
  suites: TestSuiteSummaryResults[]
  stats: ReportStats
  projectName?: string
}

export interface IMicrowaveTimer {
  startTs: number
  finishTs?: number
  duration?: number
  stopTimer: () => string | number
}

export interface ITestCaseSummary {
  results: TestCaseSummaryResults

  processTestCaseResults(testCaseResults: {
    e?: string
    name?: string
    status: TestCaseSummaryResults["status"]
    retries?: number
  }): void
  finalizeSummary(): void
  toJson(): TestCaseSummaryResults
}

export interface ITestSuiteSummary {
  summary: TestSuiteSummaryResults

  processTestCaseResultsSummary(testCaseSummary: ITestCaseSummary): void
  finalizeSummary(): void
  toJson(): TestSuiteSummaryResults
}

export interface IMicrowaveReport {
  report: MicrowaveReportJson

  processTestSuiteSummary(testSuiteSummary: ITestSuiteSummary): void
  finalizeReport(): void
  toJson(): MicrowaveReportJson
}
