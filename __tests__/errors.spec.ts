import {UnrecognizedModeError } from '../src/errors'

describe("UnrecognizedModeError", () => {
    test("It should have the right name property", () => {
        var testError = new UnrecognizedModeError("No such mode 'foo'")
        expect(testError.name).toBe('UnrecognizedModeError')
    })
})