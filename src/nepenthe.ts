
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
import { EngraveArgs } from "./commands"
import { version as nepentheVersion, homepage as nepentheHomepage} from "../package.json";
import { extractGlobal, extractParts } from "./handlebars";

/**
 * An object as initially returned by the parseInput() function 
 * from a .nep file or STDIN, with properties extracted from YAML 
 * front-matter and the remaining document body in the 'input' property.
 */
export interface NepentheObject {
    nepentheVersion: string,
    nepentheHomepage: string,
    title?: string,
    subtitle?: string,
    subsubtitle?: string,
    version?: string,
    composer?: string,
    arranger?: string,
    copyright?: string,
    dedication?: string,
    poet?: string,
    meter?: string,
    instrument?: string,
    piece?: string,
    opus?: string,
    transpose?: string,
    input: string,
    content?: string  // This is where the "pre-render" stage of the nepenthe template is stored by the engrave() function
}


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
 * @deprecated
 */
export enum PathType {
    FILE,
    DIR,
    STDIO,
    INVALID,
}

/* istanbul ignore next */
/**
 * Helper function for determining whether a given path is a
 * file, directory, STDIO stream, or none of the above.
 * @deprecated This function is no longer used/needed with the newer CLI arg scheme
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
 * Builds an output path based on arguments passed to the nepenthe command.
 * @param args 
 * @returns 
 * @throws TypeError
 */
export function getOutputFilename(args: EngraveArgs): string {

    var outputDir = args.output_directory

    // TODO use node equivalent of python os.pathsep instead of hard-coded '/' ?
    if(outputDir.substr(outputDir.length - 1) != '/') {
        outputDir += '/'
    }

    if(args.base_filename == '-') {
        throw TypeError("Can't build an output filename when the base_filename argument is set to '-' for STDOUT")
    }

    var baseFilename = args.base_filename

    if(baseFilename === undefined) {
        var inputPath = args['input-document'][0]
        if(inputPath == '-') {
            baseFilename = dateFormat(Date.now(), "yyyy-mm-dd_HH-MM");
        }
        else {
            baseFilename = path.basename(inputPath, path.extname(inputPath));
        }
    }


    return `${outputDir}${baseFilename}.${args.format}`

}

/* istanbul ignore next */
/**
 * Helper function for deriving the base filename for the file(s) to be generated.
 * @deprecated args now have separate explicit options for output dir and base output filename; use getOutputFilename() instead
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
        console.debug(`${pathName} is not writeable.`)
        return false;
    }
}


/**
 * Reads Nepenthe input and prepares it for rendering.
 * @param inputData
 * @returns any
 */
export function parseInput(inputData: string): NepentheObject {
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
 * Wrapper for the `parseInput` function which takes handles loading
 * Nepenthe data from a given filename.
 * @param fileName
 * @returns
 */
export function parseInputFile(fileName: string): NepentheObject {
    let fileData = fs.readFileSync(fileName, "utf-8");
    return parseInput(fileData);
}
