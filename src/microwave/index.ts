import type {
  MicrowaveConfig,
  IMicrowaveReport,
  MicrowaveSuiteHooks,
  MicrowaveSuiteHookType,
  MicrowaveSuiteExclusions,
  MicrowaveContext,
  MicrowaveTestCallback,
  TestCaseResultsStatus,
  SuiteName,
  SuitesMapping,
  MicrowaveSuiteStore,
  IMicrowaveSuite,
} from "./types"
import { format } from "./utils"
import { MicrowaveReport, TestSuiteSummary, TestCaseSummary } from "./report"
import { MicrowaveSuite } from "./suite"

const createDefaultSuiteHooks = (): MicrowaveSuiteHooks => ({
  before: [],
  after: [],
  beforeEach: [],
  afterEach: [],
})

const createDefaultSuiteExclusions = (): MicrowaveSuiteExclusions => ({
  only: [],
  skip: [],
})

const createDefaultContext = <T = MicrowaveContext>(ctx: T): T => ctx

const createDefaultMicrowaveSuiteStore = <T = MicrowaveContext>(
  numSuites: number,
  newSuite: IMicrowaveSuite,
  ctx: T
): MicrowaveSuiteStore<T> => ({
  ctx: createDefaultContext(ctx),
  order: numSuites,
  suite: newSuite,
  tests: [],
  hasOnly: false,
  ...createDefaultSuiteHooks(),
  ...createDefaultSuiteExclusions(),
})

const defaultMicrowaveConfig = {
  appName: "Test Project",
  verbose: false,
  reporters: {
    html: true,
    console: false,
    json: false,
  },
}

export class Microwave {
  private isRunning: boolean = false
  public config?: MicrowaveConfig = { ...defaultMicrowaveConfig }
  public appName?: string
  public MICROWAVE_SUITES: SuitesMapping = {}
  public MICROWAVE_SUITE_ORDER: SuiteName[] = []
  public MICROWAVE_SUITE_QUEUE: SuiteName[][] = []

  private constructor() {
    this.appName = defaultMicrowaveConfig.appName
    this.registerTestCase = this.registerTestCase.bind(this)
    this.registerHook = this.registerHook.bind(this)
    this.registerExclusion = this.registerExclusion.bind(this)
  }

  public static create() {
    const microwave = new Microwave()
    return microwave
  }

  public updateConfig(config: MicrowaveConfig) {
    this.config = config
    this.appName = config.appName ?? this.appName
  }

  public getConfig() {
    return this.config
  }

  public registerTestCase(suiteName: string, testCase: { description: string; test: MicrowaveTestCallback }) {
    const suite = this.getMostRecentSuite(suiteName)
    if (suite) return suite.tests.push(testCase)

    if (this.config?.verbose)
      console.warn(
        `Attempted to register test case: ${testCase.description} hook for suite ${suiteName} that doesn't exist.`
      )
  }

  public registerHook(suiteName: string, hookType: MicrowaveSuiteHookType, cb: MicrowaveTestCallback) {
    const suite = this.getMostRecentSuite(suiteName)
    if (suite) return suite[hookType].push(cb)

    if (this.config?.verbose)
      console.warn(`Attempted to register ${hookType} hook for suite ${suiteName} that doesn't exist.`)
  }

  public registerExclusion(
    suiteName: string,
    exclusionType: "skip" | "only",
    testCase: { description: string; test: MicrowaveTestCallback }
  ) {
    const suite = this.getMostRecentSuite(suiteName)
    if (suite) return suite[exclusionType].push(testCase)

    if (this.config?.verbose)
      console.warn(`Attempted to register test.${exclusionType} for suite ${suiteName} that doesn't exist.`)
  }

  public suite = (suiteName: string = "") => {
    if (!suiteName) return console.warn(`All test suites need a name. Skipping.`)

    const numSuites = Object.keys(this.MICROWAVE_SUITES).length
    const newSuite = MicrowaveSuite.create(suiteName, this.registerTestCase, this.registerHook, this.registerExclusion)

    let mostRecentQueue = this.getMostRecentlyAddedSuiteQueue()
    // if no current queues exist, or if the most recent one already has this suite,
    // create a new queue with this suite as the first one
    if (!mostRecentQueue || mostRecentQueue.includes(suiteName)) {
      mostRecentQueue = [suiteName]
      this.MICROWAVE_SUITE_QUEUE.push(mostRecentQueue)
    } else {
      mostRecentQueue.push(suiteName)
    }

    const ctx = { __suite__: suiteName, __test__: "" }
    if (!Array.isArray(this.MICROWAVE_SUITES[suiteName])) {
      this.MICROWAVE_SUITES[suiteName] = []
    }
    this.MICROWAVE_SUITES[suiteName].push(createDefaultMicrowaveSuiteStore(numSuites, newSuite, ctx))

    return newSuite
  }

  public deferredExec = async (deferMs = 25): Promise<IMicrowaveReport> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const report = await this.exec()
        resolve(report)
      }, deferMs)
    })
  }

  public exec = async (): Promise<IMicrowaveReport> => {
    if (this.isRunning) return await this.deferredExec()

    if (this.config?.verbose) console.log("Executing tests...")
    this.isRunning = true

    // start timer
    const report = new MicrowaveReport(this.appName)

    // get the ordered list of suites to execute from the queue
    if (!this.MICROWAVE_SUITE_QUEUE.length) {
      if (this.config?.verbose) console.warn("No test suites registered yet. Skipping execution.")
      return report
    }
    const suiteNames = this.MICROWAVE_SUITE_QUEUE.shift() as SuiteName[]

    // extract the actual test suites
    const suitesToExec: MicrowaveSuiteStore[] = []
    for (const suiteName of suiteNames) {
      if (this.MICROWAVE_SUITES[suiteName]?.length) {
        const suite: MicrowaveSuiteStore = this.MICROWAVE_SUITES[suiteName].shift() as MicrowaveSuiteStore
        suitesToExec.push(suite)
        // purge this suite if nothing left in the queue
        if (!this.MICROWAVE_SUITES[suiteName].length) {
          delete this.MICROWAVE_SUITES[suiteName]
        }
      } else {
        if (this.config?.verbose) console.warn(`No suite found for '${suiteName}'`)
      }
    }

    // check for any onlys
    let runOnly = false
    for (const suite of suitesToExec) {
      if (suite.only.length) {
        runOnly = true
        break
      }
    }

    // reuse variable for iterating over hooks
    let hook: any
    for (const existingTestSuite of suitesToExec) {
      const { suite, order, tests, ctx } = existingTestSuite
      // get hooks
      const { before, beforeEach, after, afterEach } = existingTestSuite
      // get exclusions
      const { only, skip } = existingTestSuite
      const skipMapping = skip.reduce((acc, curr) => {
        return { ...acc, [curr.description]: true }
      }, {})
      // filter tests to run when dealing with onlys
      const testsToRun = runOnly ? only : tests

      // start suite timer
      const testSuiteSummary = new TestSuiteSummary(suite.suiteName, order, tests.length)

      if (testsToRun.length) {
        // set suite name on ctx
        ctx.__suite__ = suite.suiteName
        // run before hooks
        for (hook of before) await hook(ctx)

        for (let testCaseOrder = 0; testCaseOrder < testsToRun.length; testCaseOrder++) {
          const testCase = testsToRun[testCaseOrder]
          // start timer
          const testCaseSummary = new TestCaseSummary(testCaseOrder, testCase.description, suite.suiteName)
          let results = {
            e: undefined as undefined | string,
            retries: 0,
            status: "passed" as TestCaseResultsStatus,
            name: testCase.description,
          }

          // if need to skip it...
          if (skipMapping[testCase.description as keyof typeof skipMapping]) {
            // short circuit that thang
            results.status = "skipped"
            testCaseSummary.processTestCaseResults(results)
            testSuiteSummary.processTestCaseResultsSummary(testCaseSummary)
            continue
          }

          // set suite name on ctx
          ctx.__test__ = testCase.description
          // run beforeEach hooks
          for (hook of beforeEach) await hook(ctx)

          try {
            await testCase.test(ctx)
          } catch (e) {
            results.e = format(testCase.description, e, suite.suiteName)
            results.status = "failed"
          } finally {
            // finish test case timer
            testCaseSummary.processTestCaseResults(results)
            testSuiteSummary.processTestCaseResultsSummary(testCaseSummary)
          }

          // run afterEach hooks
          for (hook of afterEach) await hook(ctx)
        }

        // run after hooks
        for (hook of after) await hook(ctx)
      }
      // finalize test suite timer
      testSuiteSummary.finalizeSummary()
      // process test suite results
      report.processTestSuiteSummary(testSuiteSummary)
      report.finalizeReport()
    }

    if (this.config?.verbose) console.log("Finished executing tests")

    this.isRunning = false

    return report
  }

  /*============================================================
                        PRIVATE METHODS
   ============================================================*/

  private getMostRecentSuite(suiteName: string): MicrowaveSuiteStore | null {
    const suiteArray = this.MICROWAVE_SUITES[suiteName]
    return Array.isArray(suiteArray) ? suiteArray[suiteArray.length - 1] : null
  }

  private getMostRecentlyAddedSuiteQueue(): SuiteName[] {
    return this.MICROWAVE_SUITE_QUEUE[this.MICROWAVE_SUITE_QUEUE.length - 1]
  }
}

const microwave = Microwave.create()

export const updateConfig = (config: MicrowaveConfig) => microwave.updateConfig(config)
export const getConfig = () => microwave.getConfig()
export const suite = microwave.suite
export const test = () => suite()
export const exec = microwave.exec
