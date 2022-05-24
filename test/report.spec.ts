import { expect, test, describe } from "@jest/globals"
import * as report from "../src/microwave/report"
import * as types from "../src/microwave/types"

const { MicrowaveReport, TestSuiteSummary, TestCaseSummary } = report

const passingTest = (name = "") => ({ e: undefined, retries: 0, status: "passed" as types.TestCaseResultsStatus, name })
const failingTest = (name = "", e = "error") => ({
  ...passingTest(name),
  status: "failed" as types.TestCaseResultsStatus,
  e,
})
const skippedTest = (name = "") => ({ ...passingTest(name), status: "skipped" as types.TestCaseResultsStatus })

const sampleTestsSkeleton = {
  "test suite 1": {
    "test case 1.1": {},
    "test case 1.2": {},
    "test case 1.3": {},
  },
  "test suite 2": {
    "test case 2.1": {},
    "test case 2.2": {},
    "test case 2.3": {},
    "test case 2.4": {},
  },
  "test suite 3": {
    "test case 3.1": {},
  },
  "test suite 4": {
    "test case 4.1": {},
    "test case 4.2": {},
  },
}

const samplePassingTests = Object.fromEntries(
  Object.entries(sampleTestsSkeleton).map(([suiteName, suite]) => [
    suiteName,
    Object.fromEntries(Object.entries(suite).map(([testName, test]) => [testName, passingTest(testName)])),
  ])
)

const sampleFailingTests = Object.fromEntries(
  Object.entries(sampleTestsSkeleton).map(([suiteName, suite]) => [
    suiteName,
    Object.fromEntries(Object.entries(suite).map(([testName, test]) => [testName, failingTest(testName)])),
  ])
)

const sampleSkippedTests = Object.fromEntries(
  Object.entries(sampleTestsSkeleton).map(([suiteName, suite]) => [
    suiteName,
    Object.fromEntries(Object.entries(suite).map(([testName, test]) => [testName, skippedTest(testName)])),
  ])
)

const sampleOnlyTests = { ...sampleSkippedTests, "test suite 3": { ...samplePassingTests["test suite 3"] } }

const sampleFailPassOnlyComboTests = {
  ...sampleSkippedTests,
  "test suite 3": { ...samplePassingTests["test suite 3"] },
  "test suite 4": { ...sampleFailingTests["test suite 4"] },
}

const samplePassAndFailComboTests = {
  ...samplePassingTests,
  "test suite 4": { ...sampleFailingTests["test suite 4"] },
}

type TestsSample =
  | typeof samplePassingTests
  | typeof sampleFailingTests
  | typeof sampleSkippedTests
  | typeof sampleOnlyTests
  | typeof sampleFailPassOnlyComboTests
  | typeof samplePassAndFailComboTests

function processTests(testsMapping: TestsSample, reportName = "summarize stats") {
  const report = new MicrowaveReport(reportName)

  const suiteNames = Object.keys(testsMapping)
  expect(suiteNames.length).toBe(4)

  for (let i = 0; i < suiteNames.length; i++) {
    const suiteName = suiteNames[i]
    const testCaseDescriptions = Object.keys(testsMapping[suiteName as keyof TestsSample])
    const testSuiteSummary = new TestSuiteSummary(suiteName, i, testCaseDescriptions.length)

    for (let j = 0; j < testCaseDescriptions.length; j++) {
      const desc = testCaseDescriptions[j]
      const testCaseSummary = new TestCaseSummary(j, desc, suiteName)

      const testCaseResults = testsMapping[suiteName as keyof TestsSample][desc as keyof TestsSample[keyof TestsSample]]
      testCaseSummary.processTestCaseResults(testCaseResults as types.ITestCaseSummaryToProcess)
      testSuiteSummary.processTestCaseResultsSummary(testCaseSummary)
    }

    testSuiteSummary.finalizeSummary()
    report.processTestSuiteSummary(testSuiteSummary)
  }

  report.finalizeReport()

  return report
}

describe("MicrowaveReport", () => {
  test("should be able to create a new report", () => {
    const reportInstance = new MicrowaveReport("test")

    expect(reportInstance).toBeInstanceOf(MicrowaveReport)
  })

  test("report calculates passing stats correctly", () => {
    const report = processTests(samplePassingTests)

    const json = report.toJson()

    expect(json.stats.total).toBe(10)
    expect(json.stats.failed).toBe(0)
    expect(json.stats.passed).toBe(10)
    expect(json.stats.skipped).toBe(0)
  })

  test("report calculates failing stats correctly", () => {
    const report = processTests(sampleFailingTests, "failing")

    const json = report.toJson()

    expect(json.stats.total).toBe(10)
    expect(json.stats.failed).toBe(10)
    expect(json.stats.passed).toBe(0)
    expect(json.stats.skipped).toBe(0)
  })

  test("report calculates skipped stats correctly", () => {
    const report = processTests(sampleSkippedTests, "skipped")

    const json = report.toJson()

    expect(json.stats.total).toBe(10)
    expect(json.stats.failed).toBe(0)
    expect(json.stats.passed).toBe(0)
    expect(json.stats.skipped).toBe(10)
  })

  test("report calculates only stats correctly", () => {
    const report = processTests(sampleOnlyTests, "skipped")

    const json = report.toJson()

    expect(json.stats.total).toBe(10)
    expect(json.stats.failed).toBe(0)
    expect(json.stats.passed).toBe(1)
    expect(json.stats.skipped).toBe(9)
  })

  test("report calculates fail-pass-only stats correctly", () => {
    const report = processTests(sampleFailPassOnlyComboTests, "combo")

    const json = report.toJson()

    expect(json.stats.total).toBe(10)
    expect(json.stats.failed).toBe(2)
    expect(json.stats.passed).toBe(1)
    expect(json.stats.skipped).toBe(7)
  })

  test("report calculates pass and fail stats correctly", () => {
    const report = processTests(samplePassAndFailComboTests, "pass-and-fail")

    const json = report.toJson()

    expect(json.stats.total).toBe(10)
    expect(json.stats.failed).toBe(2)
    expect(json.stats.passed).toBe(8)
    expect(json.stats.skipped).toBe(0)
  })
})
