import { truncateSync } from "fs";

const { isWriteable } = require('./nepenthe')

// const fs = require('fs')
const os = require('os')
const path = require('path')
const tmp = require('tmp');

const testPrefix = 'nepentheTest'


describe("isWriteable function", () => {
    test("It should return true when a directory is writable", () => {
        var tmpDir = tmp.dirSync({mode: 0o770})
        expect(isWriteable(tmpDir.name)).toEqual(true)
        tmpDir.removeCallback()
    }),
    test("It should return false when a directory is not writable", () => {
        var tmpDir = tmp.dirSync({mode: 0o440})
        expect(isWriteable(tmpDir.name)).toEqual(false)
        tmpDir.removeCallback()
    })
})