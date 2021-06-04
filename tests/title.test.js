const { render } = require('../lilypond.js')
const { parseInputFile } = require('../bin/index.js')

test(
    'Tests expected Lilypond title output', () => {
        console.log(`${__dirname}`)
        let data = parseInputFile(`${__dirname}/test.lyp`, 'utf-8')
        console.dir()
        let lilypond = render(data)
        expect(lilypond).toContain('title = "Test Composition"')
    }
)
