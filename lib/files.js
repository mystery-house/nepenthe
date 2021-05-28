const fs = require('fs')
const path = require('path')

module.exports = { findPartials}


/**
 * Recursive function to build a dict of Handlebar partials in a given
 * directory.
 * 
 * @param {*} dir
 * @param {*} baseDir
 * @param {*} partialsDict
 * @return {*} 
 */
function findPartials(dir, baseDir, partialsDict) {

    let localFiles = fs.readdirSync(dir)
    baseDir = baseDir || dir
    partialsDict = partialsDict || {}
    localFiles.forEach(function(file) {
        let localPath = path.join(dir, file)

        if(fs.statSync(localPath).isDirectory()) {            
            partialsDict = findPartials(localPath, baseDir, partialsDict)
        }
        else {
            // Drop the baseDir from the path info
            var re = new RegExp("^" + baseDir + "/", "g")
            // Split the localized path into an array
            let pathInfo = localPath.replace(re, "").split(path.sep)
            let fileName = pathInfo.pop()

            // (Only include .hbs files)
            if(fileName.slice(-4).toLowerCase() == '.hbs') {
                let slug = fileName.slice(0, -4)      
                pathInfo.push(slug)
                // Add the partial path to the dict, using the localized
                // pathInfo to build a snake-case key
                partialsDict[pathInfo.join("_")] = path.join(dir, fileName)
            }                     
        }
    })
    return partialsDict
}
