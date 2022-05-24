import type {
  RegisterTestCase,
  RegisterHook,
  RegisterExclusion,
  MicrowaveTestCallback,
  MicrowaveSuiteTestCase,
  // MicrowaveContext,
  MicrowaveHook,
  IMicrowaveSuite,
} from "./types"

export class MicrowaveSuite implements IMicrowaveSuite {
  public suiteName: string
  public isRegistered: boolean = false
  public registerTestCase: RegisterTestCase
  public registerHook: RegisterHook
  public registerExclusion: RegisterExclusion

  public static create(
    suiteName: string = "",
    registerTestCase: RegisterTestCase,
    registerHook: RegisterHook,
    registerExclusion: RegisterExclusion
  ) {
    const microwaveSuite = new MicrowaveSuite(suiteName, registerTestCase, registerHook, registerExclusion)
    microwaveSuite.before.each = microwaveSuite.beforeEach
    microwaveSuite.after.each = microwaveSuite.afterEach
    microwaveSuite.test.only = microwaveSuite.only
    microwaveSuite.test.skip = microwaveSuite.skip
    return microwaveSuite
  }

  private constructor(
    suiteName: string = "",
    registerTestCase: RegisterTestCase,
    registerHook: RegisterHook,
    registerExclusion: RegisterExclusion
  ) {
    this.suiteName = suiteName
    this.registerTestCase = registerTestCase
    this.registerHook = registerHook
    this.registerExclusion = registerExclusion
  }

  public test: MicrowaveSuiteTestCase = (description: string, cb: MicrowaveTestCallback) => {
    this.registerTestCase(this.suiteName, { description, cb })
  }

  public before: MicrowaveHook = (cb: MicrowaveTestCallback) => {
    this.registerHook(this.suiteName, "before", cb)
  }

  public beforeEach = (cb: MicrowaveTestCallback) => {
    this.registerHook(this.suiteName, "beforeEach", cb)
  }

  public after: MicrowaveHook = (cb: MicrowaveTestCallback) => {
    this.registerHook(this.suiteName, "after", cb)
  }

  public afterEach = (cb: MicrowaveTestCallback) => {
    this.registerHook(this.suiteName, "afterEach", cb)
  }

  public only = (description: string, cb: MicrowaveTestCallback) => {
    this.registerExclusion(this.suiteName, "only", { description, cb })
  }

  public skip = (description: string, cb: MicrowaveTestCallback) => {
    this.registerExclusion(this.suiteName, "skip", { description, cb })
  }

  public run = () => {
    this.isRegistered = true
    return this
  }
}
