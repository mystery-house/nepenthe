#!/usr/bin/env node

const fs = require('fs');
const { ArgumentParser } = require('argparse')
const { parseInputFile, render } = require('../lib/nepenthe.js')
const { exit } = require('process');


module.exports = {main}


/**
 * The main callback for the `nepenthe` command.
 */
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
    
    // Process the input file into a handlebars-friendly dict:
    let data = parseInputFile(inputFile)

    // For each item in the `data` object that starts with the string 
    // 'layout', render to Lilypond:
    Object.keys(data).filter(k => k.startsWith('layout')).forEach(l => {

        let outputData = render(data, l)

         // Write to STDOUT or file per arguments:
        if(args.outputFile == '-') {
            process.stdout.write(outputData)
        }
        else {
            var fileName = args.outputFile
            var extendedName = l.replace('layout', '')
            // This will need to be smarter if rendering directly 
            // to pdf/png/etc is added
            if(extendedName != "") {
                fileName = args.outputFile.replace('.ly', `${extendedName}.ly`)
            }
            fs.writeFileSync(fileName, outputData)
        }
    })   
}

// If index.js has been invoked directly, run the main() function:
if(require.main === module) {
    main()
    exit(0)
}
