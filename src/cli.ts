#!/usr/bin/env node

import process from "process";
import { exit } from "process";
import { engrave } from "./commands";
import { OutputFormat } from "./nepenthe"
import { ArgumentParser } from "argparse";

// (Use 'require' package.json because TypeScript 
//  won't import from outside of `src`)
const {version} = require("../package.json");


/**
 * The main Nepenthe CLI routine; executes when the `nepenthe` command is run
 * from a terminal.
 */
function main() {

    const parser = new ArgumentParser({
        description: "Engrave a nepenthe document into another format.",
    });
    
    parser.add_argument("input-document", { nargs: 1, help: "A path to a Nepenthe document to be processed. (Use '-' for STDIN.)" })
    parser.add_argument("-V", "--version", { action: "version", version });
    parser.add_argument("-o", "--output", { help: "The path where generated file(s) should be created." });
    parser.add_argument("-f", "--format", { help: "The output format. (Currently only `ly` is supported.)", default: "ly"});
    parser.add_argument("-y", "--overwrite", { help: "If set, existing output files will be automatically overwritten without warning.", action: "store_true"})
    var args = parser.parse_args()
    engrave(args)

}

// If the cli module has been imported by the `nepenthe` bin, run the main() function:
if (require.main === module) {
    main();
    exit(0);
}
