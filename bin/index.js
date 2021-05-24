const fs = require('fs');
const { ArgumentParser } = require('argparse')
const yamlFront = require('yaml-front-matter');
const lilypond = require('../lilypond.js')
const { exit } = require('process');
const { version } = require('../package.json')
const { homepage } = require('../package.json')


function parseInputFile(file) {
    let data = fs.readFileSync(file, 'utf-8')
    let fm = yamlFront.loadFront(data)

    // Include package version and homepage in template data
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
    
    let outputData = lilypond.render(data)
    
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

module.exports = {parseInputFile, main}