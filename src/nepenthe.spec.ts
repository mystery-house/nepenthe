import { truncateSync } from "fs";
import { getArgumentParser } from './cli';
const { isWriteable, getOutputFilename } = require('./nepenthe')
const { NepentheArgs } = require('./commands')
const fs = require('fs')
const os = require('os')
const path = require('path')
const tmp = require('tmp');

const testPrefix = 'nepentheTest'


describe("isWriteable function", () => {
    test("It should return true when a directory is writable", () => {
        var tmpDir = tmp.dirSync({mode: 0o777})
        expect(isWriteable(tmpDir.name)).toEqual(true)
        tmpDir.removeCallback()
    })

    test("It should return false when a directory is not writable", () => {
        var tmpDir = tmp.dirSync({mode: 0o440})
        expect(isWriteable(tmpDir.name)).toEqual(false)
        tmpDir.removeCallback()
    })
})


describe("getOutputPath function", () => {

    test("It should use the base_filename arg if provided", () => {
        var args = getArgumentParser().parse_args(['-b', 'my-custom-output-filename', 'input_file.nep'])
        expect(getOutputFilename(args)).toEqual('./my-custom-output-filename.ly')

    })

    test("It should throw a Type error when the base_filename arg is '-'", () => {
        var args = getArgumentParser().parse_args(['-b', '-', 'input_file.nep'])
        expect(() => {getOutputFilename(args)}).toThrow(TypeError)
    })

    test("It should use the output_directory arg if provided", () => {
        var args = getArgumentParser().parse_args(['-o', '/some/other/dir/', 'my-test.nep'])
        expect(getOutputFilename(args)).toEqual('/some/other/dir/my-test.ly')
    })

    test("It should add a trailing slash to the output_directory arg if needed", () => {
        var args = getArgumentParser().parse_args(['-o', '/tmp', 'test.nep'])
        expect(getOutputFilename(args)).toEqual('/tmp/test.ly')
    })

    test("It should use a timestamp for the filename if base_filename is not specified and input file is '-' (STDIN)", () => {
        jest
            .spyOn(global.Date, 'now')
            .mockImplementationOnce(() =>
            new Date('1985-10-26T01:21:00.000Z').valueOf()
        );

        var args = getArgumentParser().parse_args(['-'])
        expect(getOutputFilename(args)).toEqual('./1985-10-26_01-21.ly')

    })

    test("It should use derive base_filename from the input filename if not otherwise specified.", () => {
        var args = getArgumentParser().parse_args(['my-input-file.nep'])
        expect(getOutputFilename(args)).toEqual('./my-input-file.ly')
    })
})
