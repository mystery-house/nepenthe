/**
 * Functionality related to LilyPond formatting
 */

var hbs = require("handlebars")
const fs = require('fs')
const path = require('path')
const {findPartials} = require('../lib/files.js')

module.exports = {renderLilypond}

/**
 * Given the contents of an `*.lyp` file processed with `yaml-front-matter`,
 * Render them as standard LilyPond.
 * 
 * @param {object} data 
 * @returns {String} Rendered Lilypond data.
 */
function renderLilypond(data) {    

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
