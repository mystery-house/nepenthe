import { getArgumentParser } from "../src/cli"
import { engrave } from "../src/commands";
import { getOutputFilename, parseInputFile } from "../src/nepenthe"
const fs = require('fs')
const path = require('path')
const tmp = require('tmp')


describe("engrave() from file to file", () => {

    let self
    beforeEach(() => {
        self = {}
        self.tmpDir =  tmp.dirSync({mode: 0o777})
        self.inputFile = './__tests__/Herbert Ellis - Firefly Jig.nep'
        self.args = getArgumentParser().parse_args(['-o', self.tmpDir.name, '-b', 'test', self.inputFile])
        self.outputFile = getOutputFilename(self.args)
        engrave(self.args)

    })

    afterEach(() => {
        fs.rmdirSync(self.tmpDir.name, {recursive: true})
    })

        test("should create a lilypond file if base_filename is not '-'", () => {
        expect(fs.existsSync(self.outputFile)).toEqual(true)
        var fileData = fs.readFileSync(self.outputFile, {flag: 'r'}).toString()
        // TODO test complete generated lilypond when everything is more stable ?
        expect(fileData).toContain("title = \"Firefly Jig\"")
        expect(fileData).toContain("firstBanjoPart = {")
        expect(fileData).toContain("\\new Staff \\with {")

    })

})

describe("engrave from file to STDOUT", () => {
    let self
    beforeEach(() => {
        self = {}
        self.inputFile = './__tests__/Herbert Ellis - Firefly Jig.nep'
        self.args = getArgumentParser().parse_args(['-b', '-', self.inputFile])
    })
    
    test("It should send lilypond markup to STDOUT", () => {
        const mockLog = jest.spyOn(global.console, 'log').mockImplementation()
        engrave(self.args)
        // TODO test complete generated lilypond when everything is more stable ?
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("title = \"Firefly Jig\""))
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("firstBanjoPart = {"))
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("\\new Staff \\with {"))

        mockLog.mockRestore()
    })

})


describe("engrave() when file exists", () => {

    let self
    beforeEach(() => {
        self = {}
        self.tmpDir =  tmp.dirSync({mode: 0o777})
        self.inputFile = './__tests__/Herbert Ellis - Firefly Jig.nep'
    })

    afterEach(() => {
        fs.rmdirSync(self.tmpDir.name, {recursive: true})
    })

    test("process.exitStatus should be '1' if the output file exists and '-y' arg is not set", () => {

        var args = getArgumentParser().parse_args(['-o', self.tmpDir.name, '-b', 'test', self.inputFile])

        var tmpFilename = getOutputFilename(args)
        // Create an empty file
        fs.closeSync(fs.openSync(tmpFilename, 'w'))
        engrave(args)
        // engrave does not exit immediately, but does set exitStatus to 1
        expect(process.exitCode).toEqual(1)
        // File should still be empty
        expect(fs.statSync(tmpFilename).size).toEqual(0)
        // TODO test console.error message
    })
})


describe("engrave() called with lilypond executable available", () => {
    let self
    beforeEach(() => {
        self = {}
        self.tmpDir =  tmp.dirSync({mode: 0o777})
        self.inputFile = './__tests__/Herbert Ellis - Firefly Jig.nep'

    })

    afterEach(() => {
        fs.rmdirSync(self.tmpDir.name, {recursive: true})

    })

    test("an invalid format should set exitStatus to 1 and log a console error", () => {
        // Mock command-exists to always return 'true' when checking for lilypond
        const commandExists = require('command-exists')
        jest.mock('command-exists')
        const sync = jest.fn(() => true)
        commandExists.sync = sync

        const mockError = jest.spyOn(global.console, 'error').mockImplementation()
        
        var args = getArgumentParser().parse_args(['-o', self.tmpDir.name, '-b', 'test', '-f', 'foo', self.inputFile])

        engrave(args)
        expect(process.exitCode).toEqual(1)
        expect(mockError).toHaveBeenCalledWith(expect.stringContaining("Invalid output format: 'foo'"))
        mockError.mockRestore()
        jest.unmock('command-exists')
    })

})


describe("engrave() with no lilypond executable available", () => {

    let self

    beforeEach(() => {
        self = {}
        self.tmpDir =  tmp.dirSync({mode: 0o777})
        self.inputFile = './__tests__/Herbert Ellis - Firefly Jig.nep'

    })

    afterEach(() => {
        fs.rmdirSync(self.tmpDir.name, {recursive: true})
    })

    test("It should issue a console warning if output format is .ly and no lilypond binary was found", () => {
        // Mock command-exists to always return false
        const commandExists = require('command-exists')
        jest.mock('command-exists')
        const sync = jest.fn(() => false)
        commandExists.sync = sync

        const mockWarning = jest.spyOn(global.console, 'warn').mockImplementation()
        var args = getArgumentParser().parse_args(['-o', self.tmpDir.name, '-b', 'test', '-f', 'ly', self.inputFile])
        engrave(args)
        expect(mockWarning).toHaveBeenLastCalledWith(expect.stringContaining("Could not find lilypond."));
        
        mockWarning.mockRestore()
        jest.unmock('command-exists')
    }) //,

    //  (This test is disabled until such time as output formats other than 'ly' are supported):    
    //     test("It should set exitcode to 1 and log a console error if no lilypond binary was found when output format would require one", () => {

    //         const mockError = jest.spyOn(global.console, 'error').mockImplementation()
    //         var args = getArgumentParser().parse_args(['-o', self.tmpDir.name, '-b', 'test', '-f', 'pdf', self.inputFile])
    //         engrave(args)
    //         expect(mockError).toHaveBeenLastCalledWith(expect.stringContaining("You may need to install lilypond or add the directory where it's installed to your PATH."));
    //         expect(process.exitCode).toEqual(1)
            
    //         mockError.mockRestore()
    //     })
    // })
})
