/**
 * @file Provides Handlebars helper functions used to process Nepenthe documents into Lilypond documents.
 */

const hbs = require('handlebars')
const fs = require('fs')
const path = require('path')

module.exports = {part, whichGrouping, whichStave, stringTuning, addClef, isTabStave, instrumentName, findPartials}

/**
 * Provides a "#part" Handlebars block helper that extracts
 * the contents of each "part" block found into the given context dict,
 * which can then be used elsewhere in the same template.
 * 
 * Thanks to Brian Woodward and his handlebars-helper-variable package
 * (https://github.com/helpers/handlebars-helper-variable)
 * for the nudge in the right direction.
 * 
 * @param {object} context A Handlebars context data object
 * @returns {part~inner} The returned Handlebars helper function 
 */
function part(context) {
    /**
     * Auto-generated Handlebars helper function that extracts any
     * `#part` block tags into the provided context object.
     *
     * @param {string} name - The part name
     * @param {object} options - An object containing any additional kwargs defined in the `#part` opening tag.
     */
    var inner = function partHelper (name, options) {
        if(context['parts'] == undefined) {
            context['parts'] = {}
        }
        var content = options.fn(this);
        context['parts'][name] = {
            "name": name,
            "content": new hbs.SafeString(content),
            "options": options.hash
        }
    };
    return inner
}


/**
 * Given a `tab-*` instruction in a `layout` front-matter dict, formats a string
 * for use by the Lilypond 'stringTunings' instruction. If the layout is simply
 * specified as `tab`, it will default to standard guitar tuning.
 *
 * @param {string} tabInfo - A string starting with `tab`, with additional instrument and tuning information corresponding to Lilypond's built-in string tunings.
 * @return {string} A Lilypond-friendly string that can be used for Lilypond's `stringTunings` feature 
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
 * @param {(string|undefined)} grouping - The `grouping` key from a Nepenthe document header.
 * @return {hbs.SafeString} A Lilypond `\new [GroupedStaffType]` statement
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
 * @param {string} stave - A key from a Nepenthe `layout` dict
 * @return {string} The handlebars partial that should be used to format the given stave.
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
 * @param {object} info
 * @return {hbs.SafeString} Lilypond `instrumentName` and `shortInstrumentName` instructions as applicable
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
 * @param {string} info - A key from a Nepenthe `layout` dict
 * @return {(boolean|string[])} Whether or not the given key indicates a Tab stave
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
 * being formatted as a basic staff, returns a formatted Lilypond 
 * `\clef` instruction accordingly.
 *
 * @param {object} stave
 * @return {(hbs.SafeString|string)} A Lilypond `\clef` instruction if applicable, or an empty string. 
 */
function addClef(stave) {
    try {
        if(stave.staveInfo == 'default' && stave.clef != undefined){
            return new hbs.SafeString(`\\clef "${stave.clef}"`)
        }
    }
    catch (e) {
        return ""
    }
}


/**
 * Recursive function to build a dict of Handlebar partials in a given
 * directory.
 * 
 * @param {path} dir - The directory to scan for partials
 * @param {string} baseDir - The top-level directory (Set automatically during recursion)
 * @param {object} partialsDict - A dict mapping Handlebars partial names to files (Set automatically during recursion)
 * @return {object} The complete dict of partials found under the path that was initially passed to the function. 
 */
 function findPartials(dir, baseDir, partialsDict) {

    let localFiles = fs.readdirSync(dir)
    baseDir = baseDir || dir
    partialsDict = partialsDict || {}
    localFiles.forEach(function(file) {
        let localPath = path.join(dir, file)

        if(fs.statSync(localPath).isDirectory()) {            
            partialsDict = findPartials(localPath, baseDir, partialsDict)
        }
        else {
            // Drop the baseDir from the path info
            var re = new RegExp("^" + baseDir + "/", "g")
            // Split the localized path into an array
            let pathInfo = localPath.replace(re, "").split(path.sep)
            let fileName = pathInfo.pop()

            // (Only include .hbs files)
            if(fileName.slice(-4).toLowerCase() == '.hbs') {
                let slug = fileName.slice(0, -4)      
                pathInfo.push(slug)
                // Add the partial path to the dict, using the localized
                // pathInfo to build a snake-case key
                partialsDict[pathInfo.join("_")] = path.join(dir, fileName)
            }                     
        }
    })
    return partialsDict
}