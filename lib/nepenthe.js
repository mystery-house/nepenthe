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
const { part, 
    whichGrouping, 
    whichStave, 
    stringTuning,
    addClef, 
    isTabStave,
    instrumentName,
    findPartials } = require('./handlebars.js')

module.exports = {parseInputFile, prepareGrouping, prepareLayouts, render}


/**
 * Reads Nepenthe input and prepares it for rendering.
 *
 * @param {string} file - The filename to be parsed, or `-` to read fron `STDIN`
 * @return {object} A Handlebars context object containing data parsed from the file.
 */
function parseInputFile(file) {
    let fileData = fs.readFileSync(file, 'utf-8')
    let data = yamlFront.loadFront(fileData)

    // Include package.json version and homepage in template data
    data.nepentheVersion = version
    data.homepage = homepage

    // Unfold midi repeats by default
    if(data.midi && data.midi_unfold_repeats == undefined) {
        data.midi_unfold_repeats = true
    }

    // After processing YAML front-matter, the actual input is left in the __content
    // property of the `data` object. The next step is to preprocess __content on 
    // its own to extract any parts that may have been explicitly declared; this is
    // done by passing `data` into the `part` helper, which adds a sort of preprocessor 
    // function to extract the contents of any {{part}}..{{/part}} blocks in
    // the `__content` of the input file into a 'parts' dict that is put back into
    // the main `data` dict:
    hbs.registerHelper('part', part(data))

    // Compile `__content` to extract `parts` data:
    let input = hbs.compile(data.__content)()

    // If no parts were explicitly defined then create a single default part
    // using the entire input
    if(data['parts'] == undefined) {
        data['parts'] = {'part1': {
            'name': 'part1',
            'content': input,
            'options': {'clef': 'treble'}
        }}
        data['input'] = ''

    // If there *were* some parts in the input, then pass along whatever's left
    // to the `data` dict as `input`. It will be added after parts are rendered:
    } else {
        data['input'] = input
    }

    // Everything we need is now in the `data` variable; drop `__content`:
    delete data['__content']

    // Add the `layout` property if needed:
    prepareLayouts(data);   

    return data
}


/**
 * Given a data object as extracted from the front-matter of a 
 * Nepenthe file, checks for the presence of the 'grouping'
 * property and adds a default as needed.
 *
 * @param {object} data - A Handlebars context data object
 */
function prepareGrouping(data) {
    if (data['grouping'] == undefined) {
        data['grouping'] = 'default'
    }
}


/**
 * Checks that the given data object contains at least one key 
 * starting with the string `layout`. If none are found, adds
 * one with a basic staff for each part in the document.
 *
 * @param {object} data - A Handlebars context data object
 */
function prepareLayouts(data) {

    if (Object.keys(data).filter(k => k.startsWith('layout').length == 0)) {
        data['layout'] = []
        for (let part of Object.keys(data.parts)) {
            let theLayout = {};
            theLayout[part] = ["default"];
            data['layout'].push(theLayout);
        }
    }
}


/**
 * Given the contents of an `*.lyp` file processed with `yaml-front-matter`
 * and the name of one of the layout(s) defined in the front-matter,
 * render that layout as standard LilyPond.
 * 
 * @param {object} data - A Handlebars context data object
 * @param {string} layoutKey - A key from a Nepenthe header `layout` dict
 * @returns {String} Rendered Lilypond data.
 */
function render(data, layoutKey) {    
    // Register handlebars helpers:
    hbs.registerHelper('whichGrouping', whichGrouping)
    hbs.registerHelper('whichStave', whichStave) 
    hbs.registerHelper('stringTuning', stringTuning)
    hbs.registerHelper('addClef', addClef)
    hbs.registerHelper('isTabStave', isTabStave)
    hbs.registerHelper('instrumentName', instrumentName)

    // Find and register partials:
    let partialsDir = path.join(__dirname, '..', 'templates', 'partials')
    let partials = findPartials(partialsDir)
    Object.keys(partials).forEach((partial) => {
        let template = fs.readFileSync(partials[partial], 'utf-8')
        hbs.registerPartial(partial, template)
    })
    // Load and render the main template
    var templateFile = path.join(__dirname, '..', 'templates', 'main.hbs')
    var template = fs.readFileSync(templateFile, 'utf-8')
    var lilypondTemplate = hbs.compile(template)
    // Templates use 'renderLayout' to render the appropriate parts/staves:
    data['renderLayout'] = data[layoutKey]
    return lilypondTemplate(data)
}
