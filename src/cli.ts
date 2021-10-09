#!/usr/bin/env node

import process from "process";
import { exit } from "process";
import { engrave } from "./commands";
import { OutputFormat } from "./nepenthe"
import { ArgumentParser, ArgumentError } from "argparse";
const { version, homepage } = require("../package.json");


/**
 * The main Nepenthe CLI routine; executes when the `nepenthe` command is run
 * from a terminal.
 */
function main() {

    const parser = new ArgumentParser({
        description: `Engrave a Nepenthe document into another format.`,
        epilog: `Nepenthe v${version} - ${homepage}`
    });
    
    parser.add_argument("input-document", { nargs: 1, help: "A path to a Nepenthe document to be processed. (Use '-' for STDIN.)" })
    parser.add_argument("-V", "--version", { help: "Display the current version and exit.", action: "version", version });
    parser.add_argument("-o", "--output-directory", { help: "The directory where generated file(s) should be created. (Defaults to current directory.)", default: "./" });
    parser.add_argument("-b", "--base-filename", {help: "The base filename to use for generated file(s). Use \"-\" to send output to STDOUT. Defaults to the input filename minus extension. If input is STDIN, defaults to the document title. If document title is unset, defaults to a timestamp."})
    parser.add_argument("-f", "--format", { help: "The output format. (Currently only `ly` is supported.)", default: "ly"});
    parser.add_argument("-y", "--overwrite", { help: "If set, existing output files will be automatically overwritten without warning. (Defaults to `false`.)", action: "store_true", default: false})
    var args = parser.parse_args()
    console.log(args)
    engrave(args)
}

// If the cli module has been imported by the `nepenthe` bin, run the main() function:
if (require.main === module) {
    main();
    exit(0);
}
