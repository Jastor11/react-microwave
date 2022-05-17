import { expect, jest, test, describe } from "@jest/globals"
import * as assert from "../src/microwave/assert"

describe("assert", () => {
  describe("ok", () => {
    test("Should be a function", () => {
      expect(assert.ok).toBeInstanceOf(Function)
    })

    test("should be able to assert that a value is truthy", () => {
      expect(() => assert.ok(false, "Should throw")).toThrow()
      expect(() => assert.ok(true, "Should throw")).not.toThrow()
    })
  })
})
