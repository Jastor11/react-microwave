import { compare } from "./diff"

export const GUTTER = "\n        "
export const IGNORE = /^\s*at.*(?:\(|\s)(?:node|(internal\/[\w/]*))/

export function stack(stack: string, idx: number) {
  let i = 0
  let line
  let out = ""
  let arr = stack.substring(idx).replace(/\\/g, "/").split("\n")
  for (; i < arr.length; i++) {
    line = arr[i].trim()
    if (line.length && !IGNORE.test(line)) {
      out += "\n    " + line
    }
  }

  return out + "\n"
}

export const format = (name: string, err: any, suite = "") => {
  let { details, operator = "" } = err
  let idx = err.stack && err.stack.indexOf("\n")
  if (err.name.startsWith("AssertionError") && !operator.includes("not")) details = compare(err.actual, err.expected) // TODO?

  let htmlStr = `<span>`
  htmlStr += `<span class="error-text suite-name">${" " + "✘ " + ` ${suite} >>> 🚀 `}</span>`
  htmlStr += `<span class="error-text test-name">${name}</span>`
  htmlStr += `</span>`

  htmlStr += "\n    " + err.message + (operator ? `  (${operator})` : "") + "\n"
  if (details) htmlStr += GUTTER + details.split("\n").join(GUTTER)
  if (!!~idx) htmlStr += stack(err.stack, idx)
  return htmlStr + "\n"
}

export function dedent(str: string) {
  str = str.replace(/\r?\n/g, "\n")
  let arr = str.match(/^[ \t]*(?=\S)/gm)
  let i = 0
  let min = 1 / 0
  let len = (arr || []).length
  for (; i < len; i++) min = Math.min(min, arr?.[i]?.length ?? Number.POSITIVE_INFINITY)
  return len && min ? str.replace(new RegExp(`^[ \\t]{${min}}`, "gm"), "") : str
}
