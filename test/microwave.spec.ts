import { expect, jest, test, describe } from "@jest/globals"
// import {suite, test as testCase, exec, updateConfig} from './microwave'
import { Microwave } from "../src/microwave/index"

describe("Microwave", () => {
  test("should be able to create a Microwave instance", () => {
    const microwave = Microwave.create()
    const suite = microwave.suite
    const test = () => suite()
    const exec = microwave.exec

    expect(microwave).toBeInstanceOf(Microwave)
    expect(suite).toBeInstanceOf(Function)
    expect(test).toBeInstanceOf(Function)
    expect(exec).toBeInstanceOf(Function)
  })
})
