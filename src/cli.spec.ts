import main, { getArgumentParser } from './cli';


describe("getArgumentParser() function", () => {
    test("Output directory should default to './'", () => {
        var args = getArgumentParser().parse_args(['test.ly'])
        expect(args.output_directory).toEqual('./')
    })

    test("Output format should default to 'ly'", () => {
        var args = getArgumentParser().parse_args(['test.ly'])
        expect(args.format).toEqual('ly')
    })

    test("Overwrite should default to false.", () => {
        var args = getArgumentParser().parse_args(['test.ly'])
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
})
