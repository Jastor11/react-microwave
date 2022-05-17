import { expect, jest, test, describe } from "@jest/globals"
import * as report from "../src/microwave/report"
// import { suite, exec, updateConfig } from "../src/microwave"
// import { MicrowaveSuite } from "../src/microwave/suite"

const { MicrowaveReport } = report

describe("MicrowaveReport", () => {
  test("should be able to create a new report", () => {
    const reportInstance = new MicrowaveReport("test")

    expect(reportInstance).toBeInstanceOf(MicrowaveReport)
  })
})
