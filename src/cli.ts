#!/usr/bin/env node

import process from "process";
import { exit } from "process";
import { engrave } from "./commands";
import { Command } from "commander";

function main() {
    const program = new Command();
    program.version(String(process.env.npm_package_version));

    // 'Engrave' is currently the only feature implemented, but it's implemented
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
        .action((nepentheDoc, outputFormat, outputFile) => {
            engrave(nepentheDoc, outputFormat, outputFile);
        });
    program.parse(process.argv);
}

// If the cli module has been imported by the `nepenthe` bin, run the main() function:
if (require.main === module) {
    main();
    exit(0);
}
