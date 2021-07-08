/**
 * @file Provides Handlebars helper functions used to process Nepenthe documents into Lilypond documents.
 */

import hbs from 'handlebars';
import fs from 'fs';
import path from 'path';
import { privateEncrypt } from 'crypto';

/**
 * Describes a simple dictionary-like object whose keys and values are
 * all strings.
 */
interface StringDict {
    [key: string]: string
}

/**
 * Maps case-insensitive staff type keys to their case-sensitive LilyPond equivalents
 */
const staffTypeMap:StringDict = {
    "staff": "Staff",
    "tabstaff": "TabStaff",
    "chordnames": "ChordNames",
    "lyrics": "Lyrics",
    "rhythmicstaff": "RhythmicStaff",
    "drumstaff": "DrumStaff",    
}

/**
 * Maps case-insensitive mode type keys to their case-sensitive LilyPond equivalents
 */
const modeMap:StringDict = {
    "chord": "chordmode",
    "lyric": "lyricmode",
    "drum": "drummode",
    "figure": "figuremode",
    "markup": "markup"
}


// TODO TypeScript interfaces for part/score/staff structures and use them as applicable for helper inputs etc.

/**
 * This is a handlebars helper function that extracts the contents of 
 * each "part" block found into the given context dict, so it can
 * can then be used elsewhere in the same template.
 * 
 * It does not do any rendering of its own.
 * 
 * The purpose of this approach is to allow global access to all of the
 * `part` tags declared in a Nepenthe document without requiring end-users
 * to use handlebars' partial syntax to pass contexts around; the goal
 * is simplicity.
 *
 * Thanks to Brian Woodward and his handlebars-helper-variable package
 * (https://github.com/helpers/handlebars-helper-variable)
 * for the nudge in the right direction.
 */
export function extractParts(context: any) {
    /**
     * Auto-generated Handlebars helper function that extracts any
     * `#part` block tags into the provided context object.
     *
     */
    var inner = function partHelper (options: any) {
        if(context['parts'] == undefined) {
            context['parts'] = []
        }
        if(options !== undefined) {
            var content = options.fn(this)
            context['parts'].push({
                "name": options.hash.name,
                "content": new hbs.SafeString(content),
                "options": options.hash
            })
        }
    };
    return inner
}

// export function partHelper(options: any) {
//     if('mode' in options.hash) {
//         options.hash.mode = modeMap[options.hash.mode]
//     }
//     var partPartial = hbs.partials['partPartial']
//     partPartial = hbs.compile(partPartial, {compat: true})
//     var context = Object.assign({}, options.hash, {'partContent': options.fn})
//     return  new hbs.SafeString(partPartial(context))
// }

export function scoreHelper(options: any) {
    var context = Object.assign({}, options.hash, {'scoreContent': options.fn})
    var scorePartial = hbs.partials['scorePartial']
    scorePartial = hbs.compile(scorePartial, {compat: true})
    return new hbs.SafeString(scorePartial(context))
}

export function staffHelper(options: any) {
    var staffType = options.hash.type === undefined ? 'staff' : options.hash.type
    var context = {'staffType': staffTypeMap[staffType.toLowerCase()], 'staffPart': options.hash.part}
    var staffPartial = hbs.partials['staffPartial']
    staffPartial = hbs.compile(staffPartial)
    return new hbs.SafeString(staffPartial(context))
}
