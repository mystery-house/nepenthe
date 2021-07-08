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
const { score, extractParts } = require('./handlebars')

//  const { part, 
//      whichGrouping, 
//      whichStave, 
//      stringTuning,
//      addClef, 
//      isTabStave,
//      instrumentName,
//      findPartials } = require('./handlebars.js')
//  module.exports = {parseInputFile, prepareGrouping, prepareLayouts, render}
// module.exports = {parseInput, parseInputFile}


/**
 * Reads Nepenthe input and prepares it for rendering.
 * @param inputData 
 * @returns 
 */
export function parseInput(inputData: string) {
    // Create a `data` object by parsing the YAML front-matter.
    // `data` will eventually be used as the main Handlebars
    // context:
    let data = yamlFront.loadFront(inputData)

    // Include package.json version and homepage in template data:
    data.nepentheVersion = version
    data.homepage = homepage

    // Unfold midi repeats by default
    // if(data.midi && data.midi_unfold_repeats == undefined) {
    //     data.midi_unfold_repeats = true
    // }

    // After processing YAML front-matter, the actual input is left in the __content
    // property of the `data` object. The next step is to preprocess __content on 
    // its own to extract any parts that may have been explicitly declared; this is
    // done by passing `data` into the `part` helper, which extracts the contents of 
    // any {{part}}..{{/part}} blocks in the `__content` of the input file into a 
    // 'parts' dict that is put back into the main `data` dict:
    hbs.registerHelper('part', extractParts(data))

    // Compile `__content`. This will add the `parts` key to the `data` object,
    hbs.compile(data.__content)()

    // The part helper is only used during this first pass; unregister it
    hbs.unregisterHelper('part') 

    // Return `__content` in the template context for further processing
    data['input'] = data.__content

    // Everything we need is now in the `data` variable; drop `__content`:
    delete data['__content']

    return data
}


/**
 * Wrapper for the `parseInputFile` function which takes handles loading
 * Nepenthe data from a given filename.
 * @param fileName 
 * @returns 
 */
export function parseInputFile(fileName: string) {
    let fileData = fs.readFileSync(fileName, 'utf-8')
    return parseInput(fileData)
}
