import main, { getArgumentParser } from '../src/cli'
import * as CommandFactory from '../src/commands'


describe("getArgumentParser() function", () => {
    test("Output directory should default to './'", () => {
        var args = getArgumentParser().parse_args(['./__tests__/Herbert Ellis - Firefly Jig.nep'])
        expect(args.output_directory).toEqual('./')
    })

    test("Output format should default to 'ly'", () => {
        var args = getArgumentParser().parse_args(['./__tests__/Herbert Ellis - Firefly Jig.nep'])
        expect(args.format).toEqual('ly')
    })

    test("Overwrite should default to false.", () => {
        var args = getArgumentParser().parse_args(['./__tests__/Herbert Ellis - Firefly Jig.nep'])
        expect(args.overwrite).toEqual(false)
    })

})


describe("main() function", () => {
    test("It should exit with error code 2 if called without an input filename", () => {
        const mockExit = jest.spyOn(process, 'exit').mockImplementation((number) => {throw new Error("process.exit: " + number)})
        expect(() => {main()}).toThrow()
        expect(mockExit).toHaveBeenCalledWith(2)
        mockExit.mockRestore()
    })

    test("It should exit with an error message if called without an input filename", () => {
        const mockExit = jest.spyOn(process, 'exit').mockImplementation((number) => {throw new Error("process.exit: " + number)})
        const mockError = jest.spyOn(process.stderr, 'write').mockImplementation()
        expect(() => {main()}).toThrow()
        expect(mockError).toHaveBeenLastCalledWith(expect.stringContaining("the following arguments are required: input-document"));
        mockExit.mockRestore()
        mockError.mockRestore()
    })

    test("It should call engrave() with parsed arguments when called with an input filename", () => {

        const actualArgv = process.argv
        process.argv = [...actualArgv.slice(0, 2), '-o', '/tmp', './__tests__/Herbert Ellis - Firefly Jig.nep']

        const mockEngrave = jest.spyOn(CommandFactory, 'engrave')

        main()

        expect(mockEngrave).toHaveBeenCalledWith(expect.objectContaining({output_directory: '/tmp', format: 'ly', 'input-document':['./__tests__/Herbert Ellis - Firefly Jig.nep']}))

        mockEngrave.mockRestore()
        process.argv = actualArgv

    })
})