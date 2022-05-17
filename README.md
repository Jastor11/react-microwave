# React Microwave Testing Framework · [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Jastor11/microwave/blob/master/LICENSE) [![Test Status](https://github.com/Jastor11/microwave/actions/workflows/test.yml/badge.svg)](https://github.com/Jastor11/microwave/actions/workflows/test.yml)

A testing framework designed entirely for executing React application specs directly in the browser.

The Microwave testing framework has a very narrow focus. It is meant - and only meant - to run React application tests and targets only the browser environment. It's a re-write and expansion of the fantastic [uvu](https://github.com/lukeed/uvu) library, exposing test result internals as JSON for use in reports and the like.

The API is very similar to `uvu`, but makes a few adjustments to accommodate React-centric implementations. See the `differences` section below.

Warning: This package is very experimental at the moment. Use at your own caution.

## Installation

```bash
$ npm install react-microwave
```

## Usage

Here's an example of how to create a test suite with microwave

```tsx
import * as microwave from "react-microwave"
import * as sinon from "sinon"
import { waitFor, render } from "@testing-library/react"

// It's not necessary to do this in a function, but it can be useful
export const testApp(App) {
  // register a test suite
  const FeatureTestSuite = microwave.suite("FEATURE 001: The `App` component")

  // setup any before/after/before each/after each hooks
  FeatureTestSuite.before((ctx) => {
    ctx.sandbox = sinon.createSandbox()
  })

  FeatureTestSuite.after.each((ctx) => {
    ctx.sandbox.restore()
  })

  // create a test case
  FeatureTestSuite.test("The App.jsx component exists and renders without crashing", async (ctx) => {
    const { container, queryByText } = render(<App />)
    microwave.assert.ok(container, "The App.jsx component should render without crashing.")

    await waitFor(() => queryByText("Hello"), {
      container,
      timeout: 100,
    })
  })

  // ensure that this test suite gets run
  return FeatureTestSuite.run()
}

```

## Differences

In general, `uvu` is built with speed as the primary goal. A direct result of that is the internals of the test suite are harder to access. A few adjustments have been made to the `microwave` api to account for that.

### Registering tests

TODO: Finish this section

```tsx
import * as microwave from "react-microwave"

const FeatureTestSuite = microwave.suite("FEATURE 001: The `App` component")

// do test stuff here...

// register the actual test suite with .run() so its tests will be executed
export const registeredSuite = FeatureTestSuite.run()
```

### Executing tests

To actually run all registered test suites, do the following:

```tsx
import * as microwave from "react-microwave"

export async function getTestResults() {
  const results = await microwave.exec()

  return results.toJson()
}
```

## API

TODO: Coming soon!
