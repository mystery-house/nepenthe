const fs = require('fs');
const yamlFront = require('yaml-front-matter');
const lilypond = require('../lilypond.js')


fs.readFile('./test.lyp', 'utf8', (err, data) => {
    if(err) {
        console.error(err)
        return
    }
    let fm = yamlFront.loadFront(data)
    process.stdout.write(lilypond.render(fm))
});
