import fs from "fs";
import path from "path";
import hbs from "handlebars";

import { parseInputFile, OutputFormat, getOutputFilename } from "./nepenthe";
var hasbin = require("hasbin");
import {
    modeHelper,
    scoreHelper,
    staffHelper,
    globalHelper,
    banjo5thStrHelper,
} from "./handlebars";

export interface EngraveArgs {
    'input-document':  string[],
    output_directory: string,
    base_filename: string,
    format: OutputFormat,
    overwrite: false
}


/**
 * The default 'engrave' subcommand for nepenthe.
 */
export function engrave(args: EngraveArgs): any {

    // PREFLIGHT:
    // TODO:
    // - Function to check for / initialize config file
    // - If lilypond binary is found but not in ~/.config/nepenthe/nepenthe_config.json, then add it
    // - If lilypond binary is not found and user has requested a graphic output format, throw an error
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

    // TODO if input-document is '-', read data from STDIN and use `parseInput` instead
    let data = parseInputFile(args["input-document"][0]);

    // Compile and render the template data from the Nepenthe document
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

    let tpl = hbs.compile(data.input);
    data.content = tpl(data);

    // Compile and render the base template (passing the rendered Nepenthe doc
    // body from the previous step.)
    let base = hbs.compile(fs.readFileSync("./src/templates/base.hbs", "utf-8"));
    let lilypondData = base(data);

    
    if(args.base_filename == '-') {
        console.log(lilypondData)
    } else {

        var outputFileName = getOutputFilename(args)

        if(fs.existsSync(outputFileName) && !args.overwrite) {
            console.error(`File '${outputFileName}' already exists. (Use '-o' and/or '-b' to specify a different output file name, or '-y' to overwrite)`)
            process.exitCode = 1;
            return
        }

        if(args.format == 'ly') {
            fs.writeFileSync(outputFileName, lilypondData)
        } else {
            // TODO:
            // - else: execute lilypond with appropriate options + return
            console.info("Coming soon: hand-off to lilypond for pdf/png/svg")
        }
    } 

    return
}
