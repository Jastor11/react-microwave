// Almost an identical re-write of UVU.assert

import { dequal } from "dequal"
import { compare, lines } from "./diff"
import { dedent } from "./utils"

type Opts = {
  message?: string
  details: false | string
  generated: boolean
  operator: string
  expects: any
  actual: any
}

export class Assertion extends Error {
  name: "Assertion"
  code: "ERR_ASSERTION"
  details: false | string
  generated: boolean
  operator: string
  expects: any
  actual: any

  constructor(opts: Opts) {
    super(opts.message ?? "")
    this.name = "Assertion"
    this.code = "ERR_ASSERTION"
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
    this.details = opts?.details || false
    this.generated = !!opts?.generated
    this.operator = opts?.operator
    this.expects = opts?.expects
    this.actual = opts?.actual
  }
}

type Types = "string" | "number" | "boolean" | "object" | "undefined" | "function"

export type Message = string | Error

export type Detailer<Actual = any, Expects = any> = (actual: Actual, expects: Expects) => string

function assert<Actual = any, Expects = any>(
  bool: boolean,
  actual: Actual,
  expects: Expects,
  operator: string,
  detailer?: false | Detailer<Actual, Expects>,
  backup?: string,
  msg?: Message
) {
  if (bool) return
  let message = msg || backup
  if (msg instanceof Error) throw msg
  let details = detailer && detailer(actual, expects)
  throw new Assertion({
    actual,
    expects,
    operator,
    message: message as string | undefined,
    details: details ?? false,
    generated: !msg,
  })
}

export function ok<T = any>(actual: T, msg?: Message): asserts actual
export function ok<T = any>(val: T, msg?: Message) {
  assert(!!val, false, true, "ok", false, "Expected value to be truthy", msg)
}

export function is(actual: any, expects: any, msg?: Message): void
export function is(val: any, exp: any, msg?: Message) {
  assert(val === exp, val, exp, "is", compare, "Expected values to be strictly equal:", msg)
}

export function equal(actual: any, expects: any, msg?: Message): void
export function equal(val: any, exp: any, msg?: Message) {
  assert(dequal(val, exp), val, exp, "equal", compare, "Expected values to be deeply equal:", msg)
}

export function unreachable(msg?: Message): void
export function unreachable(msg?: Message) {
  assert(false, true, false, "unreachable", false, "Expected not to be reached!", msg)
}

export function type(actual: any, expects: Types, msg?: Message): void
export function type(val: any, exp: Types, msg?: Message) {
  let tmp = typeof val
  assert(tmp === exp, tmp, exp, "type", false, `Expected "${tmp}" to be "${exp}"`, msg)
}

export function instance(actual: any, expects: any, msg?: Message): void
export function instance(val: any, exp: any, msg?: Message) {
  let name = "`" + (exp.name || exp.constructor.name) + "`"
  assert(val instanceof exp, val, exp, "instance", false, `Expected value to be an instance of ${name}`, msg)
}

export function match(actual: string, expects: string | RegExp, msg?: Message): void
export function match(val: any, exp: string | RegExp, msg?: Message) {
  if (typeof exp === "string") {
    assert(val.includes(exp), val, exp, "match", false, `Expected value to include "${exp}" substring`, msg)
  } else {
    assert(exp.test(val), val, exp, "match", false, `Expected value to match \`${String(exp)}\` pattern`, msg)
  }
}

export function snapshot(actual: string, expects: string, msg?: Message): void
export function snapshot(val: string, exp: string, msg?: Message) {
  val = dedent(val)
  exp = dedent(exp)
  assert(val === exp, val, exp, "snapshot", lines, "Expected value to match snapshot:", msg)
}

const lineNums = (x: string, y: string) => lines(x, y, 1)

export function fixture(actual: string, expects: string, msg?: Message): void
export function fixture(val: string, exp: string, msg?: Message) {
  val = dedent(val)
  exp = dedent(exp)
  assert(val === exp, val, exp, "fixture", lineNums, "Expected value to match fixture:", msg)
}

export function throws(fn: Function, expects?: Message | RegExp | Function, msg?: Message): void
export function throws(blk: Function, exp?: Message | RegExp | Function | null, msg?: Message) {
  if (!msg && typeof exp === "string") {
    msg = exp
    exp = null
  }

  try {
    blk()
    assert(false, false, true, "throws", false, "Expected function to throw", msg)
  } catch (err) {
    if (err instanceof Assertion) throw err

    if (typeof exp === "function") {
      assert(exp(err), false, true, "throws", false, "Expected function to throw matching exception", msg)
    } else if (exp instanceof RegExp) {
      assert(
        exp.test((err as Error).message),
        false,
        true,
        "throws",
        false,
        `Expected function to throw exception matching \`${String(exp)}\` pattern`,
        msg
      )
    }
  }
}

// ---
export function not(actual: any, msg?: Message): void
export function not(val: any, msg?: Message) {
  assert(!val, true, false, "not", false, "Expected value to be falsey", msg)
}

not.ok = not

is.not = function (val: any, exp: any, msg?: Message) {
  assert(val !== exp, val, exp, "is.not", false, "Expected values not to be strictly equal", msg)
}

not.equal = function (val: any, exp: any, msg?: Message) {
  assert(!dequal(val, exp), val, exp, "not.equal", false, "Expected values not to be deeply equal", msg)
}

not.type = function (val: any, exp: Types, msg?: Message) {
  let tmp = typeof val
  assert(tmp !== exp, tmp, exp, "not.type", false, `Expected "${tmp}" not to be "${exp}"`, msg)
}

not.instance = function (val: any, exp: any, msg?: Message) {
  let name = "`" + (exp.name || exp.constructor.name) + "`"
  assert(!(val instanceof exp), val, exp, "not.instance", false, `Expected value not to be an instance of ${name}`, msg)
}

not.snapshot = function (val: string, exp: string, msg?: Message) {
  val = dedent(val)
  exp = dedent(exp)
  assert(val !== exp, val, exp, "not.snapshot", false, "Expected value not to match snapshot", msg)
}

not.fixture = function (val: string, exp: string, msg?: Message) {
  val = dedent(val)
  exp = dedent(exp)
  assert(val !== exp, val, exp, "not.fixture", false, "Expected value not to match fixture", msg)
}

not.match = function match(val: any, exp: string | RegExp, msg?: Message) {
  if (typeof exp === "string") {
    assert(!val.includes(exp), val, exp, "not.match", false, `Expected value not to include "${exp}" substring`, msg)
  } else {
    assert(!exp.test(val), val, exp, "not.match", false, `Expected value not to match \`${String(exp)}\` pattern`, msg)
  }
}

not.throws = function (blk: Function, exp?: Message | RegExp | Function | null, msg?: Message) {
  if (!msg && typeof exp === "string") {
    msg = exp
    exp = null
  }

  try {
    blk()
  } catch (err) {
    if (typeof exp === "function") {
      assert(!exp(err), true, false, "not.throws", false, "Expected function not to throw matching exception", msg)
    } else if (exp instanceof RegExp) {
      assert(
        !exp.test((err as Error).message),
        true,
        false,
        "not.throws",
        false,
        `Expected function not to throw exception matching \`${String(exp)}\` pattern`,
        msg
      )
    } else if (!exp) {
      assert(false, true, false, "not.throws", false, "Expected function not to throw", msg)
    }
  }
}
