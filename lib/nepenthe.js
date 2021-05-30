/**
 * Functionality related to the actual processing of Nepenthe
 * documents.
 */

var hbs = require("handlebars")
const fs = require('fs')
const path = require('path')
const {findPartials} = require('./files.js')

module.exports = {prepareGrouping, prepareLayout, render}


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
