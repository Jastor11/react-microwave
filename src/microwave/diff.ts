// An almost direct re-export of UVU.diff, but geared towards the browser and html-formatted output

import * as diff from "diff"

const colors = {
  "--": "--",
  "··": "··",
  "++": "++",
}

type ColorSymbol = keyof typeof colors

type DiffObject = { removed?: boolean; added?: boolean; value: string }

type SortK = string | number | any

const HTMLColoredFormatter: Record<string, (str: string) => string> = {
  "--": (str: string) =>
    `<span class="html-colored-formatter diff-removed red" style="color: var(--color-scale-red-5)">${str}</span>`,
  "··": (str: string) =>
    `<span class="html-colored-formatter diff-stayed grey" style="color: var(--color-scale-gray-4)">${str}</span>`,
  "++": (str: string) =>
    `<span class="html-colored-formatter diff-added green" style="color: var(--color-scale-green-4)">${str}</span>`,
  TITLE: (str: string) => `<span class="html-colored-formatter title italic">${str}</span>`,
  TAB: (str: string) => `<span class="html-colored-formatter tab dim">${str}</span>`,
  DIM: (str: string) => `<span class="html-colored-formatter dim">${str}</span>`,
  dim: (str: string) => `<span class="html-colored-formatter dim">${str}</span>`,
  SPACE: (str: string) => `<span class="html-colored-formatter space dim">${str}</span>`,
  NL: (str: string) => `<span class="html-colored-formatter new-line dim">${str}</span>`,
  UNDERLINE: (str: string) => `<span class="html-colored-formatter underline">${str}</span>`,
  underline: (str: string) => `<span class="html-colored-formatter underline">${str}</span>`,
}

const HTMLLOG = (sym: ColorSymbol, str: string) => sym + HTMLPRETTY(str) + "\n\n"
const HTMLLINE = (num: number, x: number) => "L" + String(num).padStart(x, "0") + " "
const HTMLPRETTY = (str: string) => {
  const prettifiedString = str
    .replace(/[ ]/g, "&nbsp;")
    .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
    .replace(/(\r?\n)/g, "<br /><br />")

  return `<span class="pretty">${prettifiedString}</span>`
}

export function line(obj: DiffObject, prev: number, pad?: number) {
  let char: ColorSymbol = obj.removed ? "--" : obj.added ? "++" : "··"
  let arr = obj.value.replace(/\r?\n$/, "").split("\n")
  let i = 0
  let tmp
  let out = ""

  if (obj.added) out += "Expected:" + "\n"
  else if (obj.removed) out += "Actual:" + "\n"

  for (; i < arr.length; i++) {
    tmp = arr[i]
    if (tmp != null) {
      if (prev) out += HTMLLINE(prev + i, pad as number)
      out += HTMLLOG(char, tmp || "\n")
    }
  }

  return out
}

export function lines(input: string, expect: string, linenum = 0) {
  let i = 0
  let tmp
  let output = ""
  let arr = diff.diffLines(input, expect)
  let pad = String(expect.split(/\r?\n/g).length - linenum).length

  for (; i < arr.length; i++) {
    output += line((tmp = arr[i]), linenum, pad)
    if (linenum && !tmp.removed) linenum += tmp?.count ?? 0
  }

  return output
}

export function circular() {
  const cache = new Set()

  return function print(key: string, val: any) {
    if (val === void 0) return "[__VOID__]"
    if (typeof val === "number" && val !== val) return "[__NAN__]"
    if (!val || typeof val !== "object") return val
    if (cache.has(val)) return "[Circular]"
    cache.add(val)
    return val
  }
}

export function stringify(input: any) {
  return JSON.stringify(input, circular(), 2)
    .replace(/"\[__NAN__\]"/g, "NaN")
    .replace(/"\[__VOID__\]"/g, "undefined")
}

export function arrays(input: Array<any>, expect: Array<any>) {
  let arr = diff.diffArrays(input, expect)
  let i = 0
  let j = 0
  let k = 0
  let tmp
  let val
  let char: keyof typeof HTMLColoredFormatter
  let isObj
  let str
  let out = HTMLLOG("··", "[")

  for (; i < arr.length; i++) {
    char = (tmp = arr[i]).removed ? "--" : tmp.added ? "++" : "··"

    if (tmp.added) {
      out += HTMLColoredFormatter[char](HTMLColoredFormatter.underline(HTMLColoredFormatter.TITLE("Expected:")) + "\n")
    } else if (tmp.removed) {
      out += HTMLColoredFormatter[char](HTMLColoredFormatter.underline(HTMLColoredFormatter.TITLE("Actual:")) + "\n")
    }

    for (j = 0; j < tmp.value.length; j++) {
      isObj = tmp.value[j] && typeof tmp.value[j] === "object"
      val = stringify(tmp.value[j]).split(/\r?\n/g)
      for (k = 0; k < val.length; ) {
        str = "  " + val[k++] + (isObj ? "" : ",")
        if (isObj && k === val.length && j + 1 < tmp.value.length) str += ","
        out += HTMLLOG(char as ColorSymbol, str)
      }
    }
  }

  return out + HTMLLOG("··", "]")
}

export function direct(input: any, expect: any, lenA = String(input).length, lenB = String(expect).length) {
  let gutter = 4
  let lenC = Math.max(lenA, lenB)
  let typeA = typeof input
  let typeB = typeof expect

  if (typeA !== typeB) {
    gutter = 2

    let delA = gutter + lenC - lenA
    let delB = gutter + lenC - lenB

    input += " ".repeat(delA) + HTMLColoredFormatter.dim(`[${typeA}]`)
    expect += " ".repeat(delB) + HTMLColoredFormatter.dim(`[${typeB}]`)

    lenA += delA + typeA.length + 2
    lenB += delB + typeB.length + 2
    lenC = Math.max(lenA, lenB)
  }

  let output =
    HTMLColoredFormatter["++"](
      "++" + expect + " ".repeat(gutter + lenC - lenB) + HTMLColoredFormatter.TITLE("(Expected)")
    ) + "\n"
  return (
    output +
    HTMLColoredFormatter["--"](
      "--" + input + " ".repeat(gutter + lenC - lenA) + HTMLColoredFormatter.TITLE("(Actual)")
    ) +
    "\n"
  )
}

export function chars(input: string, expect: string) {
  let arr = diff.diffChars(input, expect)
  let i = 0
  let output = ""
  let tmp

  let l1 = input.length
  let l2 = expect.length

  let p1 = HTMLPRETTY(input)
  let p2 = HTMLPRETTY(expect)

  tmp = arr[i]

  if (l1 === l2) {
    // no length offsets
  } else if (tmp.removed && arr[i + 1]) {
    let del = (tmp?.count ?? 0) - (arr[i + 1].count ?? 0)
    if (del == 0) {
      // wash~
    } else if (del > 0) {
      expect = " ".repeat(del) + expect
      p2 = " ".repeat(del) + p2
      l2 += del
    } else if (del < 0) {
      input = " ".repeat(-del) + input
      p1 = " ".repeat(-del) + p1
      l1 += -del
    }
  }

  output += direct(p1, p2, l1, l2)

  if (l1 === l2) {
    for (tmp = "  "; i < l1; i++) {
      tmp += input[i] === expect[i] ? " " : "^"
    }
  } else {
    for (tmp = "  "; i < arr.length; i++) {
      tmp += (arr[i].added || arr[i].removed ? "^" : " ").repeat(Math.max(arr[i]?.count ?? 0, 0))
      if (i + 1 < arr.length && ((arr[i].added && arr[i + 1].removed) || (arr[i].removed && arr[i + 1].added))) {
        ;(arr[i + 1].count as number) -= arr[i]?.count ?? 0
      }
    }
  }

  return output + tmp
}

export function sort(input: any, expect: any) {
  var k: SortK
  var i = 0
  var tmp: any
  var isArr = Array.isArray(input)
  var keys: Array<SortK> = []
  var out: any[] | Record<string | number, any> = isArr ? Array(input.length) : {}

  if (isArr) {
    for (i = 0; i < (out?.length ?? 0); i++) {
      tmp = input[i]
      if (!tmp || typeof tmp !== "object") {
        out[i] = tmp
      } else {
        out[i] = sort(tmp, expect[i]) // might not be right
      }
    }
  } else {
    for (k in expect) keys.push(k)

    for (; i < keys.length; i++) {
      if (Object.prototype.hasOwnProperty.call(input, (k = keys[i]))) {
        if (!(tmp = input[k]) || typeof tmp !== "object") out[k as keyof typeof out] = tmp
        else out[k as keyof typeof out] = sort(tmp, expect[k])
      }
    }

    for (k in input) {
      if (!out.hasOwnProperty(k)) {
        out[k as keyof typeof out] = input[k] // expect didnt have
      }
    }
  }

  return out
}

export function compare(input: any, expect: any) {
  if (Array.isArray(expect) && Array.isArray(input)) return arrays(input, expect)
  if (expect instanceof RegExp) return chars("" + input, "" + expect)

  let isA = input && typeof input == "object"
  let isB = expect && typeof expect == "object"

  if (isA && isB) input = sort(input, expect)
  if (isB) expect = stringify(expect)
  if (isA) input = stringify(input)

  if (expect && typeof expect == "object") {
    input = stringify(sort(input, expect))
    expect = stringify(expect)
  }

  isA = typeof input == "string"
  isB = typeof expect == "string"

  if (isA && /\r?\n/.test(input)) return lines(input, "" + expect)
  if (isB && /\r?\n/.test(expect)) return lines("" + input, expect)
  if (isA && isB) return chars(input, expect)

  return direct(input, expect)
}
