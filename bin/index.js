const fs = require('fs');
const { ArgumentParser } = require('argparse')
const yamlFront = require('yaml-front-matter');
const lilypond = require('../lilypond.js')
const { exit } = require('process');

const parser = new ArgumentParser({
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

fs.readFile(inputFile, 'utf8', (err, data) => {
    if(err) {
        console.error(err)
        return
    }
    let fm = yamlFront.loadFront(data)

    let outputData = lilypond.render(fm)

    if(args.outputFile == '-') {
        process.stdout.write(outputData)
    }
    else {
        fs.writeFileSync(args.outputFile, outputData)
    }
});
