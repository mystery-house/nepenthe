#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { parseInput } from "./nepenthe";
import { exit } from 'process';
import { readFileSync } from "fs";
const yamlFront = require('yaml-front-matter');
import {partHelper, layoutHelper, staffHelper, staffTypeHelper} from "./handlebars"
import { hasSubscribers } from 'diagnostic_channel';
import hbs from "handlebars";

module.exports = {main}

/**
 * The main function for the `nepenthe` command.
 */
function main() {

    let fileData = fs.readFileSync('test.nep', 'utf-8')
    hbs.registerHelper('part', partHelper)
    hbs.registerHelper('layout', layoutHelper)
    hbs.registerHelper('staff', staffHelper)
    hbs.registerHelper('staffType', staffTypeHelper)


    hbs.registerPartial('layoutPartial', fs.readFileSync('./src/templates/partials/layout.hbs', 'utf-8'))
    hbs.registerPartial('staffPartial', fs.readFileSync('./src/templates/partials/staff.hbs', 'utf-8'))


    let tpl = hbs.compile(fileData)

    let lilypond = tpl({})

    console.log(lilypond)

}


 // If index.js has been invoked directly, run the main() function:
if(require.main === module) {
    main()
    exit(0)
}