#!/usr/bin/env node

import process from "process";
import { exit } from "process";
import { engrave } from "./commands";
import { Command } from "commander";

function main() {

    // PREFLIGHT:
    // - TODO check that output path exists and is writable
    //      - throw error if not
    // - TODO check for ~/.config/nepenthe/nepenthe_config.yml
    //      - If directory/file does not exist, create it and add an annotated 'example_config' file
    // - TODO check for `lilypond` executable in $PATH.
    //      - If not set in nepenthe_config, add it
    //      - If not found and user has requested a graphic output format, throw an error
    // - TODO Determine output filename if format is specified but

    // POSTFLIGHT:
    // - TODO If user has selected STDOUT, dump data and exit
    // - TODO If output file is a path, write appropriate file and
    //     Display success/failure message as appropriate
    const program = new Command();
    program.version(String(process.env.npm_package_version));

    // 'Engrave' is currently the only feature supported, but it's implemented
    // as a subcommand to support possible future subcommands/pluggable architecture.
    program
        .command("engrave")
        .alias("e")
        .argument(
            "<input-document>",
            "The path to a Nepenthe document.  (Use '-' to read from STDIN.)"
        )
        .option("-f, --output-format", "Output format. Options are 'pdf', 'png', 'svg', and 'ly'.", "pdf")
        .option(
            "-o, --output-file",
            "The base name that should be used for the output file. The file extension will automatically be set by the `--format` option. Use '-' to send to STDOUT. If a output-file is a path, the output file name will be based on the input filename plus the output format. (If input is being read from STDIN, the output file will be named with a timestamp plus the output format.)",
            "./"
        )
        .description("Engrave a nepenthe document.")
        .action((nepentheDoc) => {
            engrave(nepentheDoc);
        });
    program.parse(process.argv);
}

// If the cli module has been imported by the `nepenthe` bin, run the main() function:
if (require.main === module) {
    main();
    exit(0);
}
