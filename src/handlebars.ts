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
    tab: "TabStaff",
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

// TODO Define TypeScript interfaces for part/score/staff structures
// and use them as applicable for helper inputs etc.

/**
 * This helper function extracts the contents of the Nepenthe "Global" tag
 * into the main Handlebars context, to be injected into each part during rendering.
 * @param context
 * @returns
 */
export function extractGlobal(context: any) {
    var inner = function extractGlobalHelper(options: any) {
        if (options !== undefined) {
            var content = options.fn(this);
            context["global"] = new hbs.SafeString(content);
        }
    };
    return inner;
}

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
    var inner = function partHelper(options: any) {
        if (context["parts"] == undefined) {
            context["parts"] = {};
        }
        if (options !== undefined) {
            var content = options.fn(this);
            context["parts"][options.hash.name] = {
                name: options.hash.name,
                content: new hbs.SafeString(content),
                options: options.hash,
            };
        }
    };
    return inner;
}

/**
 * Handlebars helper function that takes the `mode` attribute from a Nepenthe
 * `part` tag and maps it to the appropriate LilyPond equivalent. If no
 * matching value is found, throws an `UnrecognizedModeError`.
 * @param part
 * @returns string
 */
export function modeHelper(part: any) {
    if (part.mode in modeMap) {
        return modeMap[part.mode];
    } else {
        throw new UnrecognizedModeError(`Unrecognized mode in part "${part.name}": ${part.mode}`);
    }
}

export function scoreHelper(options: any) {
    var context = Object.assign({}, options.hash, { scoreContent: options.fn });
    var scorePartial = hbs.partials["scorePartial"];
    scorePartial = hbs.compile(scorePartial, { compat: true });
    return new hbs.SafeString(scorePartial(context));
}

/**
 * This Handlebars helper is used by the {{global}} tag in the `part.hbs` partial template,
 * and simply outputs the contents of the `global` context variable that was set during
 * the pre-flight rendering step.
 *
 * @param context
 * @returns hbs.SafeString
 */
export function globalHelper(context: any) {
    // ('global' is already a SafeString)
    return context.data.root.global;
}

/**
 * This helper attempts to represent conventional notation for the fifth string of
 * a five-string banjo, which is the G note of the desired duration with an additional
 * vertical 16th note flag.
 *
 * Known issues: Because this tag uses two voices to display two note stems, it breaks
 * beaming with any adjacent notes, making it of limited use in its current form.
 *
 * @param options
 * @returns hbs.SafeString
 */
export function banjo5thStrHelper(options: any) {
    var pitch = options.hash.pitch === undefined ? "g" : options.hash.pitch;
    var duration = options.hash.duration;

    // Given the duration specified, calculate the necessary duration override
    // multiplier for the extra vertical sixteenth note used to indicate that
    // the node should be sounded on the 5th string
    if (duration.slice(-1) == ".") {
        var denominator = parseInt(duration.slice(0, -1));
        while (denominator / 2 < 1) {
            denominator = denominator * 2;
        }
        var numerator = denominator + denominator / 2;
        var multiplier = `${numerator}/${denominator}`;
    } else {
        var baseDuration = parseInt(duration);
        var multiplier = (16 / baseDuration).toString();
    }

    var context = {
        pitch: pitch,
        duration: duration,
        multiplier: multiplier,
    };
    var banjo5thStrPartial = hbs.partials["banjo5thStrPartial"];
    banjo5thStrPartial = hbs.compile(banjo5thStrPartial);

    return new hbs.SafeString(banjo5thStrPartial(context));
}

export function staffHelper(options: any) {
    var part = options.hash.part;
    var staffType = options.hash.type === undefined ? "staff" : options.hash.type;
    // TODO
    //  1. Default clef to 'tab' for TabStaff even if `clef` has been set for part
    //  2. ...but, allow 'clef' to also be set as a `staff` tag attribute, in which case that value always takes precedence
    var clef =
        staffType.toLowerCase() == "tab" ? "tab" : options.data.root.parts[part].options.clef;
    var context = {
        staffType: staffTypeMap[staffType.toLowerCase()],
        staffPart: part,
        clef: clef,
        instrumentName: options.data.root.parts[part].options.instrumentName,
        shortInstrumentName: options.data.root.parts[part].options.shortInstrumentName,
    };
    var staffPartial = hbs.partials["staffPartial"];
    staffPartial = hbs.compile(staffPartial);
    return new hbs.SafeString(staffPartial(context));
}
