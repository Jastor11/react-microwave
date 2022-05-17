import { expect, jest, test, describe } from "@jest/globals"
import { suite, exec, updateConfig } from "../src/microwave"
import { MicrowaveSuite } from "../src/microwave/suite"

describe("MicrowaveSuite", () => {
  test("should be able to create a new suite", () => {
    const FeatureSuite = suite("FeatureSuite")

    expect(FeatureSuite).toBeInstanceOf(MicrowaveSuite)
  })
})
