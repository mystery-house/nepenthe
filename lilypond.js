/**
 * Functionality related to LilyPond formatting
 */
const hbs = require("handlebars")
const fs = require('fs')
const path = require('path')

/**
 * Given the contents of an `*.lyp` file processed with `yaml-front-matter`,
 * Render them as standard LilyPond.
 * 
 * @param {object} data 
 * @returns {String} Rendered Lilypond data.
 */
function render(data) {
    // Register template partials
    let partials = {
        'header': 'header', 
        'score_default': path.join('score', 'default')
    }
    let partialsDir = path.join(__dirname, 'templates')
    Object.keys(partials).forEach((partial) => {
        let template = fs.readFileSync(path.join(partialsDir, `${partials[partial]}.hbs`), 'utf-8')
        hbs.registerPartial(partial, template)
    })

    // Load and render the main template
    let template = fs.readFileSync('./templates/lilypond.hbs', 'utf-8')
    let lilypondTemplate = hbs.compile(template)

    return lilypondTemplate(data)
}

module.exports = {render}
