const fs = require('fs');
const { ArgumentParser } = require('argparse')
const yamlFront = require('yaml-front-matter');
const { prepareGrouping, prepareLayout, render } = require('../lib/nepenthe.js')
const { exit } = require('process');
const { version } = require('../package.json')
const { homepage } = require('../package.json')
const hbs = require('handlebars')
const { part, whichGrouping, whichStave } = require('../lib/handlebars.js')
//const util = require('util')


module.exports = {parseInputFile, main}


function parseInputFile(file) {
    let data = fs.readFileSync(file, 'utf-8')
    let fm = yamlFront.loadFront(data)

    // Include package.json version and homepage in template data
    fm.pplantVersion = version
    fm.homepage = homepage

    // Unfold midi repeats by default
    if(fm.midi && fm.midi_unfold_repeats == undefined) {
        fm.midi_unfold_repeats = true
    }
    return fm
}

function main() {
    let parser = new ArgumentParser({
        description: 'PitcherPlant - Lilypond pre-processor'
    });
    parser.add_argument({dest: 'inputFile', help: 'the path to the file to be processed (use `-` to read from STDIN.)'})
    parser.add_argument({dest: 'outputFile', help: 'the path to the output file (use `-` to send to STDOUT.)'})
    let args = parser.parse_args()
    
    let inputFile = args.inputFile
    if(inputFile == '-') {
        inputFile = process.stdin.fd
    }
    
    if(args.inputFile != '-' && !fs.existsSync(inputFile)) {
        process.stderr.write(`\nNo such file \`${inputFile}\`\n\n`)
        exit(1)
    }
    
    // TODO error handling if file can't be read
    
    let data = parseInputFile(inputFile)

    // After processing YAML front-matter, the actual input is left in the __content
    // property of the `data` object. The next step is to preprocess __content on 
    // its own to extract any parts that may have been explicitly declared; this is
    // done by passing `data` into the `part` helper, which adds a sort of preprocessor 
    // function to extract the contents of any {{part}}..{{/part}} blocks in
    // the `__content` of the input file into a 'parts' dict that is put back into
    // the main `data` dict:
    hbs.registerHelper('part', part(data))

    // Compile `__content` to extract `parts` data:
    let input = hbs.compile(data.__content)()

    // If no parts were explicitly defined then create a single default part
    // using the entire input
    if(data['parts'] == undefined) {
        data['parts'] = {'part1': input}
        data['input'] = ''

    // If there *were* some parts in the input, then pass along whatever's left
    // to the `data` dict as `input`. It will be added after parts are rendered:
    } else {
        data['input'] = input
    }

    // Everything we need is now in the `data` variable; drop `__content`:
    delete data['__content']

    // Add the `layout` property if needed:
    prepareLayout(data);

    // Register additional handlebars helpers:
    hbs.registerHelper('whichGrouping', whichGrouping)
    hbs.registerHelper('whichStave', whichStave)

    // Render to Lilypond:
    let outputData = render(data)
    
    // Write to STDOUT or file per arguments:
    if(args.outputFile == '-') {
        process.stdout.write(outputData)
    }
    else {
        fs.writeFileSync(args.outputFile, outputData)
    }
}

if(require.main === module) {
    main()
}


