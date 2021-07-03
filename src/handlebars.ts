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

export function staffTypeHelper(this: any):any  {
    var staffType = this.type === undefined ? 'staff': this.type.toLowerCase()
    return staffTypeMap[staffType]
}


export function partHelper(this: any, options: any) {
    return new hbs.SafeString(`${options.hash.name} = {\n\t${options.fn(this)}\n}`)
}

export function layoutHelper(this: any, options: any) {
    var layoutPartial = hbs.partials['layoutPartial']
    layoutPartial = hbs.compile(layoutPartial)
    return layoutPartial(options.fn(this))
}

export function staffHelper(this: any, options: any) {    
    var staffPartial = hbs.partials['staffPartial']
    staffPartial = hbs.compile(staffPartial)
    return staffPartial(options.hash)
}
