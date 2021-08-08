#!/usr/bin/env node

import fs from "fs";
import path from "path";
import process, { mainModule } from "process";
import { parseInputFile } from "./nepenthe";
import { exit } from "process";
import { readFileSync } from "fs";
import {
    modeHelper,
    scoreHelper,
    staffHelper,
    globalHelper,
    banjo5thStrHelper,
} from "./handlebars";
import hbs from "handlebars";

import { Command } from "commander";

/**
 * The default 'engrave' subcommand for nepenthe.
 */
function engrave(nepentheDoc: string) {
    // TODO: move actual processing into its own function in nepenthe.ts;
    // main() should primarily deal with:

    // handle args:
    // Positional args:
    // input file ('-' for STDIN)

    // Optional args
    // -f output format; follows lilypond convention (pdf, png, svg) and adds `ly`. If a local lilypond binary is available, defaults to pdf. If not, defaults to `ly`.)
    // -o output file "Set the default output file to FILE or, if a folder with that name exists, direct the output to FOLDER, taking the file name from the input file. The appropriate suffix will be added (e.g. .pdf for pdf) in both cases. (If input file is STDIN, title will be generated from the `title` metadata. If there's no title, the output file will be named with a timestamp.)"
    // -h help summary
    // -v output version number and exit

    // (If you need to use advanced Lilypond command line options, use Nepenthe to generate your .ly file and process it separately with `lilypond`.)

    // PREFLIGHT:
    // - check that output path exists and is writable
    //      - throw error if not
    // - check for ~/.config/nepenthe/nepenthe_config.yml
    //      - If directory/file does not exist, create it and add an annotated 'example_config' file
    // - check for `lilypond` executable in $PATH.
    //      - If not set in nepenthe_config, add it
    //      - If not found and user has requested a graphic output format, throw an error
    // - Determine output filename if format is specified but

    // POSTFLIGHT:
    // - If user has selected STDOUT, dump data and exit
    // - If output file is a path, write appropriate file and
    //     Display success/failure message as appropriate

    let data = parseInputFile(nepentheDoc); // TODO parse input args

    hbs.registerHelper("mode", modeHelper);
    hbs.registerHelper("score", scoreHelper);
    hbs.registerHelper("staff", staffHelper);

    hbs.registerPartial(
        "partPartial",
        fs.readFileSync("./src/templates/partials/part.hbs", "utf-8")
    );
    hbs.registerPartial(
        "scorePartial",
        fs.readFileSync("./src/templates/partials/score.hbs", "utf-8")
    );
    hbs.registerPartial(
        "staffPartial",
        fs.readFileSync("./src/templates/partials/staff.hbs", "utf-8")
    );

    // Compile and render the template data from the Nepenthe document
    let tpl = hbs.compile(data.input);
    data.content = tpl(data);

    // Compile and render the base template (passing the rendered Nepenthe doc
    // body from the previous step.)
    let base = hbs.compile(fs.readFileSync("./src/templates/base.hbs", "utf-8"));
    let final = base(data);
    console.log(final);
}

function main() {
    const program = new Command();
    program.version(String(process.env.npm_package_version));

    // 'Engrave' is currently the only feature supported, but it's implemented
    // as a subcommand to support possible future subcommands/pluggable architecture.
    program
        .command("engrave", { isDefault: true })
        .alias("e")
        .argument("<nepenthe-doc>", "The path to a Nepenthe document.  Use '-' to read from STDIN")
        .description("(Default.) Engrave a nepenthe document.")
        .action((nepentheDoc) => {
            engrave(nepentheDoc);
        });
    program.parse(process.argv);

    // TODO default help message if no args are present? Might help avoid
    // confusion over 'nepenthe engrave' subcommand docs
    // See https://stackoverflow.com/a/44419466
}

// If the cli module has been imported by the `nepenthe` bin, run the main() function:
if (require.main === module) {

    main();
    exit(0);
}
