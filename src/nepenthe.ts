/**
 * @file Contains functionality related to the actual processing of Nepenthe
 * documents.
 * @author Andy Chase
 */

var hbs = require("handlebars")
const fs = require('fs')
const path = require('path')
const yamlFront = require('yaml-front-matter');
const { version, homepage } = require('../package.json')
const { score } = require('./handlebars')

//  const { part, 
//      whichGrouping, 
//      whichStave, 
//      stringTuning,
//      addClef, 
//      isTabStave,
//      instrumentName,
//      findPartials } = require('./handlebars.js')
 
//  module.exports = {parseInputFile, prepareGrouping, prepareLayouts, render}
module.exports = {parseInput, parseInputFile}

/**
 * Reads Nepenthe input and prepares it for rendering.
 *
 * @param {string} nepentheData - A string of Nepenthe data
 * @return {object} A Handlebars context object containing data parsed from the file.
 */
export function parseInput(nepentheData: string): any {
    // let fileData = fs.readFileSync(file, 'utf-8')
    let data = yamlFront.loadFront(nepentheData)

    // Include package.json version and homepage in template data
    data.nepentheVersion = version
    data.homepage = homepage

    hbs.registerHelper('score', score)
    let tpl = hbs.compile(nepentheData)

    // // Unfold midi repeats by default
    // if(data.midi && data.midi_unfold_repeats == undefined) {
    //     data.midi_unfold_repeats = true
    // }

    // // After processing YAML front-matter, the actual input is left in the __content
    // // property of the `data` object. The next step is to preprocess __content on 
    // // its own to extract any parts that may have been explicitly declared; this is
    // // done by passing `data` into the `part` helper, which adds a sort of preprocessor 
    // // function to extract the contents of any {{part}}..{{/part}} blocks in
    // // the `__content` of the input file into a 'parts' dict that is put back into
    // // the main `data` dict:
    // hbs.registerHelper('part', part(data))

    // // Compile `__content` to extract `parts` data:
    // let input = hbs.compile(data.__content)()

    // // If no parts were explicitly defined then create a single default part
    // // using the entire input
    // if(data['parts'] == undefined) {
    //     data['parts'] = {'part1': {
    //         'name': 'part1',
    //         'content': input,
    //         'options': {'clef': 'treble'}
    //     }}
    //     data['input'] = ''

    // // If there *were* some parts in the input, then pass along whatever's left
    // // to the `data` dict as `input`. It will be added after parts are rendered:
    // } else {
    //     data['input'] = input
    // }

    // // Everything we need is now in the `data` variable; drop `__content`:
    // delete data['__content']

    // // Add the `score` property if needed:
    // prepareLayouts(data);   

    return data
}

/**
 * Reads Nepenthe input from a file or STDIN and prepares it for rendering.
 * 
 * @param {string} file - The filename to be parsed, or `-` to read fron `STDIN`
 * @return {object} A Handlebars context object containing data parsed from the file.
 */
function parseInputFile(filename: string): object {
    let nepentheData = fs.readFileSync(filename, 'utf-8')
    return parseInput(nepentheData)
}
