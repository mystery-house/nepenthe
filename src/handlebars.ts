/**
 * @file Provides Handlebars helper functions used to process Nepenthe documents into Lilypond documents.
 */

import hbs from 'handlebars';
import fs from 'fs';
import path from 'path';

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

// TODO TypeScript interfaces for part/layout/staff structures and use them as applicable for helper inputs etc.

export function partHelper(options: any) {
    // return new hbs.SafeString(`${options.hash.name} = {\n\t${options.fn(context)}\n}`)
    var partPartial = hbs.partials['partPartial']
    partPartial = hbs.compile(partPartial)
    var context = Object.assign({}, options.hash, {'partContent': options.fn})
    return  new hbs.SafeString(partPartial(context))
}

export function layoutHelper(options: any) {
    var context = Object.assign({}, options.hash, {'layoutContent': options.fn})
    var layoutPartial = hbs.partials['layoutPartial']
    layoutPartial = hbs.compile(layoutPartial)
    return new hbs.SafeString(layoutPartial(context))
}

export function staffHelper(options: any) {
    var staffType = options.hash.type === undefined ? 'staff' : options.hash.type
    var context = {'staffType': staffTypeMap[staffType.toLowerCase()], 'staffPart': options.hash.part}
    var staffPartial = hbs.partials['staffPartial']
    staffPartial = hbs.compile(staffPartial)
    return new hbs.SafeString(staffPartial(context))
}
