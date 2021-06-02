/**
 * Provides handlebars helpers
 */
const hbs = require('handlebars')

module.exports = {part, whichGrouping, whichStave, stringTuning, addClef, isTabStave, instrumentName}

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
        context['parts'][name] = {
            "name": name,
            "content": new hbs.SafeString(content),
            "options": options.hash
        }
        // console.dir(context['parts'][name])
    };
}


/**
 * Given a `tab-*` instruction in a `layout` front-matter dict, formats a string
 * for use by the Lilypond 'stringTunings' instruction. If the layout is simply
 * specified as `tab`, it will default to standard guitar tuning.
 *
 * @param {*} tabInfo
 * @return {*} 
 */
function stringTuning(tabInfo) {
    // Tab layout instructions may be formatted as follows:
    // tab (Guitar, standard tuning)
    // tab-[instrumentname] (Default Lilypond tuning for that instrument)
    // tab-[instrumentname]-[tuning] (Alternate Lilypond tuning for that instrument)
    // for example `banjo-c-tuning` or `guitar-dadgad-tuning`

    let meta = tabInfo.split("-")
    var tabTuning
    switch(meta.length) {
        case 1:
            tabTuning = `guitar-tuning`
            break;
        case 2:
            tabTuning = `${meta[1]}-tuning`
            break;
        case 3:
            tabTuning = `${meta[1]}-${meta[2]}-tuning`
    }
    return tabTuning
}


/**
 * Determines which type of Staff (if any) should be used to group staves
 * in the Lilypond output.
 *
 * @param {*} grouping
 * @return {*} 
 */
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


/**
 * Given the key of a Nepenthe `layout` frontmatter dict, determines which
 * template partial should be used for that part.
 *
 * @param {*} stave
 * @return {*} 
 */
function whichStave(stave) {
    // 'tab' layout instructions may be hyphenated to specify instrument name;
    // always use the first element to determine the basic stave type:
    return `staves_${stave.split('-')[0]}`
}


/**
 * When building attributes for a Lilypond `\with {}` block, adds
 * `instrumentName` and `shortInstrumentName` as applicable. If a
 * TabStaff is being formatted with an explicit instrument tuning,
 * that instrument will override any instrument info declared in the
 * {{#part}} block attributes.
 *
 * @param {*} info
 * @return {*} 
 */
function instrumentName(info) {
    // Return instrument name property/properties
    var instrumentInfo = []
    var staveInfoArr
    if(typeof(info.staveInfo) == 'string') {
        staveInfoArr = info.staveInfo.split('-')
    }
    else {
        staveInfoArr = false
    }
    if(staveInfoArr.length >= 2 && staveInfoArr[0] == 'tab'
        && typeof(staveInfoArr[1]) != 'undefined') {
        // This is a TabStaff with an explicitly-declared instrument;
        // Capitalize and use the instrument specified by the tuning
        // instead:
        instrumentInfo.push(`instrumentName = #"${staveInfoArr[1][0].toUpperCase()}${staveInfoArr[1].substring(1)}"`)
    }
    else {
        if(info['instrumentName']) {
            instrumentInfo.push(`instrumentName = #"${info['instrumentName']}"`)
        }        
        if(info['shortInstrumentName']) {
            instrumentInfo.push(`shortInstrumentName = #"${info.shortInstrumentName}"`)
        }
    }
    // If no instrument name specified, should return an empty string.
    return new hbs.SafeString(instrumentInfo.join("\n"))
}


/**
 * Determines whether a key specified in a `layout` Nepenthe header dict
 * should be formatted as a Lilypond TabStaff.
 *
 * @param {*} info
 * @return {*} 
 */
function isTabStave(info) {
    if(typeof(info) == 'string') {
        return info.split('-')[0] == 'tab'
    }
    else {
        return false
    }
}


/**
 * If a clef has been explicitly declared for a part, and the part is
 * being formatted as a basic staff, formats the Lilypond `\clef` instruction
 * accordingly.
 *
 * @param {*} stave
 * @return {*} 
 */
function addClef(stave) {
    try {
        if(stave.staveType == 'default' && stave.clef != undefined){
            return new hbs.SafeString(`\\clef "${stave.clef}"`)
        }
    }
    catch (e) {
        return ""
    }
}
