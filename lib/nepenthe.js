/**
 * Functionality related to the actual processing of Nepenthe
 * documents.
 */

var hbs = require("handlebars")
const fs = require('fs')
const path = require('path')
const {findPartials} = require('./files.js')
const yamlFront = require('yaml-front-matter');
const { version, homepage } = require('../package.json')
const { part, whichGrouping, whichStave } = require('./handlebars.js')


module.exports = {parseInputFile, prepareGrouping, prepareLayout, render}


/**
 * Reads Nepenthe input and prepares it for rendering.
 *
 * @param {*} file
 * @return {*} 
 */
function parseInputFile(file) {
    let fileData = fs.readFileSync(file, 'utf-8')
    let data = yamlFront.loadFront(fileData)

    // Include package.json version and homepage in template data
    data.pplantVersion = version
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
        data['parts'] = {'part1': input}
        data['input'] = ''

    // If there *were* some parts in the input, then pass along whatever's left
    // to the `data` dict as `input`. It will be added after parts are rendered:
    } else {
        data['input'] = input
    }

    // Everything we need is now in the `data` variable; drop `__content`:
    delete data['__content']

    // Add the `layout` property if needed:
    prepareLayout(data);   

    return data
}


/**
 * Given a data object as extracted from the front-matter of a 
 * Nepenthe file, checks for the presence of the 'grouping'
 * property and adds a default as needed.
 *
 * @param {*} data
 */
function prepareGrouping(data) {
    if (data['grouping'] == undefined) {
        data['grouping'] = 'default'
    }
}



/**
 * Given a data object as extracted from the front-matter of a 
 * Nepenthe file, normalizes the `layout` property.
 * If `layout` is not set, creates one with a basic staff for each part.
 *
 * @param {*} data
 */
function prepareLayout(data) {
    if (data['layout'] == undefined) {
        data['layout'] = [];
        for (let [part, val] of Object.entries(data['parts'])) {
            let layout = {};
            layout[part] = ["default"];
            data['layout'].push(layout);
        }
    }
}


/**
 * Given the contents of an `*.lyp` file processed with `yaml-front-matter`,
 * Render them as standard LilyPond.
 * 
 * @param {object} data 
 * @returns {String} Rendered Lilypond data.
 */
function render(data) {    
    // Register handlebars helpers:
    hbs.registerHelper('whichGrouping', whichGrouping)
    hbs.registerHelper('whichStave', whichStave) 

    // Find and register partials:
    let partialsDir = path.join(__dirname, '..', 'templates', 'partials')
    let partials = findPartials(partialsDir)
    Object.keys(partials).forEach((partial) => {
        let template = fs.readFileSync(partials[partial], 'utf-8')
        hbs.registerPartial(partial, template)
    })
    // Load and render the main template
    var template = fs.readFileSync('./templates/main.hbs', 'utf-8')
    var lilypondTemplate = hbs.compile(template)
    console.dir(data)
    return lilypondTemplate(data)
}
