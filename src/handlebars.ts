/**
 * @file Provides Handlebars helper functions used to process Nepenthe documents into Lilypond documents.
 * @author Andy Chase
 */

import hbs from "handlebars";
import { UnrecognizedModeError } from "./errors";

/**
 * Describes a simple dictionary-like object whose keys and values are
 * all strings.
 */
interface StringDict {
    [key: string]: string;
}

/**
 * Maps case-insensitive staff type keys to their case-sensitive LilyPond equivalents
 */
const staffTypeMap: StringDict = {
    staff: "Staff",
    tabstaff: "TabStaff",
    chordnames: "ChordNames",
    lyrics: "Lyrics",
    rhythmicstaff: "RhythmicStaff",
    drumstaff: "DrumStaff",
};

/**
 * Maps case-insensitive mode type keys to their case-sensitive LilyPond equivalents
 */
const modeMap: StringDict = {
    chord: "chordmode",
    lyric: "lyricmode",
    drum: "drummode",
    figure: "figuremode",
    markup: "markup",
};

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
     */
    var inner = function partHelper(options: any) {
        if (context["parts"] == undefined) {
            context["parts"] = [];
        }
        if (options !== undefined) {
            var content = options.fn(this);
            context["parts"].push({
                name: options.hash.name,
                content: new hbs.SafeString(content),
                options: options.hash,
            });
        }
    };
    return inner;
}

/**
 * Handlebars helper function that takes the `mode` attribute from a Nepenthe
 * `part` tag and maps it to the appropriate LilyPond equivalent. If no
 * matching value is found, throws an `UnrecognizedModeError`.
 * @param part
 * @returns
 */
export function modeHelper(part: any) {
    if (part.mode in modeMap) {
        return modeMap[part.mode];
    } else {
        throw new UnrecognizedModeError(`Unrecognized mode in part "${part.name}": ${part.mode}`);
    }
}

/**
 * Handlebars helper function that renders the `score` tag.
 *
 * @param options
 * @returns
 */
export function scoreHelper(options: any) {
    var context = Object.assign({}, options.hash, { scoreContent: options.fn });
    var scorePartial = hbs.partials["scorePartial"];
    scorePartial = hbs.compile(scorePartial, { compat: true });
    return new hbs.SafeString(scorePartial(context));
}

/**
 * Handlebars helper function that renders the `staff` tag.
 *
 * Accepts two options:
 *
 *   - "type" (The type of staff to be rendered)
 *   - "part" (The part to be displayed on this staff)
 *
 * @param options
 * @returns
 */
export function staffHelper(options: any) {
    var staffType = options.hash.type === undefined ? "staff" : options.hash.type;
    var context = {
        staffType: staffTypeMap[staffType.toLowerCase()],
        staffPart: options.hash.part,
    };
    var staffPartial = hbs.partials["staffPartial"];
    staffPartial = hbs.compile(staffPartial);
    return new hbs.SafeString(staffPartial(context));
}
