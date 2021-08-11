#!/usr/bin/env node

import process from "process";
import { exit } from "process";
import { engrave } from "./commands";
import { OutputFormat } from "./nepenthe"
import { ArgumentParser } from "argparse";
import { version } from "../package.json";


function main() {

    // TODO possible to implement subcommands with 'engrave' as the default
    // in the node implementation of argparse?
    // (without a ton of hacking? https://stackoverflow.com/a/26379693)
    const parser = new ArgumentParser({
        description: "Engrave a nepenthe document.",
    });
    
    parser.add_argument("input-document", { nargs: 1, help: "A path to a Nepenthe document to be processed. (Use '-' for STDIN.)" })
    parser.add_argument("-V", "--version", { action: "version", version });
    parser.add_argument("-o", "--output-path", { help: "The base name that should be used for the output file, or the path where the output file should be written. The file extension will automatically be set according to the `--format` option. Use '-' to send to STDOUT. If a output-file is a path, the file name will be based on the input filename and the output format. (If input is being read from STDIN, the output file will be named with a timestamp plus the output format.)" });
    // TODO constrain format to enum?
    parser.add_argument("-f", "--format", { help: "The output format. Output format. Options are 'pdf', 'png', 'svg', and 'ly'.", default: "pdf"});
    parser.add_argument("-y", "--overwrite", { help: "If set, existing output files will be automatically overwritten without warning.", action: "store_true"})

    console.dir(parser.parse_args());


}

// If the cli module has been imported by the `nepenthe` bin, run the main() function:
if (require.main === module) {
    main();
    exit(0);
}
