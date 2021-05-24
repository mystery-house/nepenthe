const fs = require('fs');
const { ArgumentParser } = require('argparse')
const yamlFront = require('yaml-front-matter');
const lilypond = require('../lilypond.js')
const { exit } = require('process');

const parser = new ArgumentParser({
    description: 'PitcherPlant - Lilypond pre-processor'
});
parser.add_argument({dest: 'inputFile', help: 'the path to the file to be processed'})
parser.add_argument({dest: 'outputFile', help: 'the path to the output file. (use `-` to send output to STDOUT.)'})
let args = parser.parse_args()

if(!fs.existsSync(args.inputFile)) {
    process.stderr.write(`\nNo such file \`${args.inputFile}\`\n\n`)
    exit(1)
}

fs.readFile(args.inputFile, 'utf8', (err, data) => {
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
