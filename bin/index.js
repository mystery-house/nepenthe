const fs = require('fs');
const { ArgumentParser } = require('argparse')
const yamlFront = require('yaml-front-matter');
const lilypond = require('../lilypond.js')
const { exit } = require('process');

const parser = new ArgumentParser({
    description: 'PitcherPlant - Lilypond pre-processor'
});
parser.add_argument({dest: 'inputFile', help: 'the path to the file to be processed'})

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
    process.stdout.write(lilypond.render(fm))
});
