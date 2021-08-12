import fs from "fs";
import path from "path";
import hbs from "handlebars";
import { parseInputFile, OutputFormat } from "./nepenthe";
var hasbin = require("hasbin");
import {
    modeHelper,
    scoreHelper,
    staffHelper,
    globalHelper,
    banjo5thStrHelper,
} from "./handlebars";

interface EngraveArgs {
    'input-document':  string[],
    output_path: string,
    format: OutputFormat,
    overwrite: false
}


/**
 * The default 'engrave' subcommand for nepenthe.
 */
export function engrave(args: EngraveArgs) {

    // PREFLIGHT:
    // TODO function to check for / initialize config file

    // - TODO check for `lilypond` executable in $PATH.
    //      - If not set in nepenthe_config, add it
    //      - If not found and user has requested a graphic output format, throw an error
    var lilypond = hasbin.first.sync(['lilypond'])
    if(lilypond === false) {
        if(args.format == OutputFormat.LILYPOND) {
            console.warn("Could not find lilypond.")
        }        
        else {
            console.error(`Could not find lilypond; unable to generate '${args.format}' output. You may need to install lilypond or add the directory where it's installed to your PATH.`)
            process.exitCode = 1;
            return
        }
    }

    // Validate output format:
    if (!Object.values(OutputFormat).includes(args.format)) {
        console.error(`Invalid output format: '${args.format}'`)
        process.exitCode = 1;
        return;
    }




    let data = parseInputFile(args["input-document"][0]);

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
    let lilypondData = base(data);

    console.log(lilypondData)

    // - TODO If user has selected STDOUT, dump data and exit
    // - TODO If output file is a path, write appropriate file and
    //     Display success/failure message as appropriate

    // TODO if output format is lilypond: write to outputfile + return
    // TODO else: execute lilypond with appropriate options + return
    return
}
