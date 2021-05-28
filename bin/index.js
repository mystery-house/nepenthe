const fs = require('fs');
const { ArgumentParser } = require('argparse')
const yamlFront = require('yaml-front-matter');
const { renderLilypond } = require('../lib/lilypond.js')
const { exit } = require('process');
const { version } = require('../package.json')
const { homepage } = require('../package.json')
const hbs = require('handlebars')
const { part } = require('../lib/handlebars.js')
//const util = require('util')


module.exports = {parseInputFile, main}


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

    // After processing YAML front-matter, the actual input is left in the __content
    // property of the `data` object. The next step is to preprocess __content on 
    // its own to extract any parts that may have been explicitly declared.
    // There is probably a cleverer/built-in way to do this, but it's a start:

    hbs.registerHelper('part', part(data))
    hbs.registerHelper('whichStave', (stave) => {return `staves_${stave}`})
    let input = hbs.compile(data.__content)()

    // If no parts were explicitly defined then create a single default part
    // using the entire input
    if(data['parts'] == undefined) {
        data['parts'] = {'part1': input}
        data['input'] = ''
    // If there were some parts in the input, then pass along whatever's left
    // in the processed input.
    } else {
        data['input'] = input
    }

    // console.dir(data)

    // If no layout instructions were explicitly defined then create a simple
    // default with a staff for each part.
    if(data['layout'] == undefined) {
        data['layout'] = []
        for (let [part, val] of Object.entries(data['parts'])) {
            let layout = {}
            layout[part] = ["default"]
            data['layout'].push(layout)
        }
    }

    // Remove __content now that we're done with it.
    delete data['__content']

    // Now Render the internal templates
    let outputData = renderLilypond(data)
    
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
