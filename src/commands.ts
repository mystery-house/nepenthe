import fs from "fs";
import path from "path";
import hbs from "handlebars";
import { parseInputFile, OutputFormat } from "./nepenthe";
import {
    modeHelper,
    scoreHelper,
    staffHelper,
    globalHelper,
    banjo5thStrHelper,
} from "./handlebars";

/**
 * The default 'engrave' subcommand for nepenthe.
 */
export function engrave(nepentheDoc: string, outputFormat: OutputFormat, outputFile: string) {
    // PREFLIGHT:
    // TODO function to check for / initialize config file

    // - TODO check for `lilypond` executable in $PATH.
    //      - If not set in nepenthe_config, add it
    //      - If not found and user has requested a graphic output format, throw an error

    // POSTFLIGHT:
    // - TODO If user has selected STDOUT, dump data and exit
    // - TODO If output file is a path, write appropriate file and
    //     Display success/failure message as appropriate

    let data = parseInputFile(nepentheDoc);

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
    let lilypond = base(data);

    // TODO if output format is lilypond: write to outputfile + return

    // TODO else: execute lilypond with appropriate options + return

}
