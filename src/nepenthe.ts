
/**
 * @file Contains functionality related to the actual processing of Nepenthe
 * documents.
 * @author Andy Chase
 */

var hbs = require("handlebars");
var dateFormat = require("dateformat");
var path = require("path");
const fs = require("fs")
const yamlFront = require("yaml-front-matter")
import { version as nepentheVersion, homepage as nepentheHomepage} from "../package.json";
import { extractGlobal, extractParts, banjo5thStrHelper } from "./handlebars";


/**
 * Valid values for the --output-format CLI option
 */
export enum OutputFormat {
    LILYPOND = "ly",
    // TODO: Planned feature: support for invoking lilypond directly
    // PDF = "pdf",
    // PNG = "png",
    // SVG = "svg",
}

/**
 * Enum used as return values by the pathType() function
 */
export enum PathType {
    FILE,
    DIR,
    STDIO,
    INVALID,
}

/**
 * Helper function for determining whether a given path is a
 * file, directory, STDIO stream, or none of the above.
 *
 * @param pathName
 * @returns
 */
export function pathType(pathName: string): PathType {
    var result;

    if (pathName == "-") {
        result = PathType.STDIO;
        return result;
    }
    
    var stats = fs.statSync(pathName);
    try {
        if (stats.isFile()) {
            result = PathType.FILE;
        } else if (stats.isDirectory()) {
            result = PathType.DIR;
        } else {
            result = PathType.INVALID;
        }
    } catch (err) {
        result = PathType.INVALID;
    }
    return result;
}


/**
 * Helper function for deriving the base filename for the file(s) to be generated.
 * @param inputPath
 * @param output 
 * @param format 
 * @returns 
 */
export function getBaseOutputFilename(
    inputPath: string,
    output: string
): string {

    var outputPathType = pathType(output);
    var finalBaseOutputPath;

    if (outputPathType == PathType.STDIO || outputPathType == PathType.FILE) {
        finalBaseOutputPath = output;
    } else if (outputPathType == PathType.DIR) {
        var baseFilename;
        var inputPathType = pathType(inputPath);
        if (inputPathType == PathType.STDIO) {
            baseFilename = dateFormat(new Date(), "yyyy-mm-dd_HH-MM");
        } else if (inputPathType == PathType.FILE) {
            baseFilename = path.basename(inputPath, path.extname(inputPath));
        } else {
            throw new Error(`Invalid input path: ${inputPath}`)
        }
        finalBaseOutputPath = `${output.replace(/\/$/, "")}/${baseFilename}`;
    } else {
        console.log(outputPathType)
        throw new Error(`Invalid output path: ${output}`);
    }
    return finalBaseOutputPath;
}

/**
 * Tests whether a given path is writeable.
 * @param pathName
 * @returns
 */
export function isWriteable(pathName: string): boolean {
    try {
        fs.accessSync(pathName, fs.constants.W_OK);
        return true;
    } catch (err) {
        return false;
    }
}


/**
 * Reads Nepenthe input and prepares it for rendering.
 * @param inputData
 * @returns any
 */
export function parseInput(inputData: string): any {
    // Create a `data` object by parsing the YAML front-matter.
    // `data` will eventually be used as the main Handlebars
    // context:
    let data = yamlFront.loadFront(inputData);
    // Include package.json version and homepage in template data:
    data.nepentheVersion = nepentheVersion;
    data.nepentheHomepage = nepentheHomepage;

    // Unfold midi repeats by default
    // if(data.midi && data.midi_unfold_repeats == undefined) {
    //     data.midi_unfold_repeats = true
    // }

    // After processing YAML front-matter, the actual input is left in the __content
    // property of the `data` object. The next step is to preprocess __content on
    // its own to extract any parts that may have been explicitly declared; this is
    // done by passing `data` into the `part` helper, which extracts the contents of
    // any {{part}}..{{/part}} blocks in the `__content` of the input file into a
    // 'parts' dict that is put back into the main `data` dict:
    hbs.registerHelper("global", extractGlobal(data));
    hbs.registerHelper("part", extractParts(data));
    // hbs.registerHelper("banjo5thStr", banjo5thStrHelper);
    // hbs.registerPartial(
    //     "banjo5thStrPartial",
    //     fs.readFileSync("./src/templates/partials/banjo5thStr.hbs", "utf-8")
    // );

    // Compile `__content`. This will add the `parts` key to the `data` object,
    hbs.compile(data.__content)

    // The global block helpers is only used during this first pass; unregister them
    hbs.unregisterHelper("global");
    // hbs.unregisterHelper("banjo5thStr");

    // Return `__content` in the template context for further processing
    data["input"] = data.__content;

    // Everything we need is now in the `data` variable; drop `__content`:
    delete data["__content"];

    return data;
}

/**
 * Wrapper for the `parseInputFile` function which takes handles loading
 * Nepenthe data from a given filename.
 * @param fileName
 * @returns
 */
export function parseInputFile(fileName: string): any {
    let fileData = fs.readFileSync(fileName, "utf-8");
    return parseInput(fileData);
}
