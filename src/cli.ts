#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { parseInputFile } from "./nepenthe";
import { exit } from 'process';
import { readFileSync } from "fs";
import {modeHelper, scoreHelper, staffHelper, globalHelper, banjo5thStrHelper} from "./handlebars"
import hbs from "handlebars";

module.exports = {main}

/**
 * The main function for the `nepenthe` command.
 */
function main() {

    let data = parseInputFile('test.nep')  // TODO parse input args
    // let input = hbs.compile(data['input'])
    hbs.registerHelper('mode', modeHelper)
    hbs.registerHelper('score', scoreHelper)
    hbs.registerHelper('staff', staffHelper)
    hbs.registerHelper('global', globalHelper)

    hbs.registerPartial('partPartial', fs.readFileSync('./src/templates/partials/part.hbs', 'utf-8'))
    hbs.registerPartial('scorePartial', fs.readFileSync('./src/templates/partials/score.hbs', 'utf-8'))
    hbs.registerPartial('staffPartial', fs.readFileSync('./src/templates/partials/staff.hbs', 'utf-8'))

    // Compile and render the template data from the Nepenthe document
    let tpl = hbs.compile(data.input)
    data.content = tpl(data)

    // Compile and render the base template (passing the rendered Nepenthe doc
    // body from the previous step.)
    let base = hbs.compile(fs.readFileSync('./src/templates/base.hbs', 'utf-8'))
    let final =     base(data)
    console.log(final)
}

 // If index.js has been invoked directly, run the main() function:
if(require.main === module) {
    main()
    exit(0)
}