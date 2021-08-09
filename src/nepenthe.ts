/**
 * @file Contains functionality related to the actual processing of Nepenthe
 * documents.
 * @author Andy Chase
 */

var hbs = require("handlebars");
var dateFormat = require("dateformat");
var path = require("path");
const fs = require("fs");
const yamlFront = require("yaml-front-matter");
const { version, homepage } = require("../package.json");
const { extractGlobal, extractParts, banjo5thStrHelper } = require("./handlebars");

//  const { part,
//      whichGrouping,
//      whichStave,
//      stringTuning,
//      addClef,
//      isTabStave,
//      instrumentName,
//      findPartials } = require('./handlebars.js')
//  module.exports = {parseInputFile, prepareGrouping, prepareLayouts, render}
// module.exports = {parseInput, parseInputFile}

/**
 * Valid values for the --output-format CLI option
 */
export enum OutputFormat {
    Ly = "ly",
    Pdf = "pdf",
    Png = "png",
    Svg = "svg",
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
    var stats = fs.statSync(pathName);
    if (pathName == "-") {
        result = PathType.STDIO;
    }
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

export function getOutputFilename(
    inputPath: string,
    outputPath: string,
    format: OutputFormat
): string {

    var outputPathType = pathType(outputPath);
    var finalOutputPath;
    if (outputPathType == PathType.STDIO || outputPathType == PathType.FILE) {
        finalOutputPath = outputPath;
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
        // TODO: trim path separator from output path before formatting string
        finalOutputPath = `${outputPath}/${baseFilename}.${format}`;
    } else {
        console.log(outputPathType)
        throw new Error(`Invalid output path: ${outputPath}`);
    }
    return finalOutputPath;
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
 * @returns
 */
export function parseInput(inputData: string) {
    // Create a `data` object by parsing the YAML front-matter.
    // `data` will eventually be used as the main Handlebars
    // context:
    let data = yamlFront.loadFront(inputData);

    // Include package.json version and homepage in template data:
    data.nepentheVersion = version;
    data.homepage = homepage;

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
    hbs.registerHelper("banjo5thStr", banjo5thStrHelper);
    hbs.registerPartial(
        "banjo5thStrPartial",
        fs.readFileSync("./src/templates/partials/banjo5thStr.hbs", "utf-8")
    );

    // Compile `__content`. This will add the `parts` key to the `data` object,
    hbs.compile(data.__content)();

    // The global and part block helpers are only used during this first pass; unregister them
    hbs.unregisterHelper("global");
    hbs.unregisterHelper("part");
    hbs.unregisterHelper("banjo5thStr");

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
export function parseInputFile(fileName: string) {
    let fileData = fs.readFileSync(fileName, "utf-8");
    return parseInput(fileData);
}
