/**
 * Provides handlebars helpers
 */
const hbs = require('handlebars')

module.exports = {part, whichGrouping, whichStave}

/**
 * Provides a "#part" Handlebars block helper that extracts
 * the contents of each "part" block found into the given context dict,
 * which can then be used elsewhere in the same template.
 * 
 * Thanks to Brian Woodward and his handlebars-helper-variable package
 * (https://github.com/helpers/handlebars-helper-variable)
 * for the nudge in the right direction.
 * 
 * @param {*} context 
 * @returns 
 */
function part(context) {
    return function partHelper (name, options) {
        if(context['parts'] == undefined) {
            context['parts'] = {}
        }
        var content = options.fn(this);
        context['parts'][name] = new hbs.SafeString(content)
    };
}

function whichGrouping(grouping) {
    // TODO can this support further parameters (IE instrument name for pianostaff) ?

    if(grouping == undefined) {
        return ""
    }

    var retGrouping

    switch(grouping.toLowerCase()) {
        case 'pianostaff':
            retGrouping = "PianoStaff"
            break;
        case 'choirstaff':
            retGrouping = "ChoirStaff"
            break;
        case 'grandstaff':
            retGrouping = "GrandStaff"  
            break;
        case 'staffgroup':
        default:
            retGrouping =  "StaffGroup"
            break;                            
    }            
    return new hbs.SafeString(`\\new ${retGrouping}`)
    
}

function whichStave(stave) {
    return `staves_${stave}`
}