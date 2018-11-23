import parser from 'xml2json'
import args from './index.js'
import read from 'read-file'
import writeFile from 'write'

//Read and parse XML file contents
read(args.source, (err, buffer) => {
    //TODO: reading file errors

    // xml to json
    const json = parser.toJson(buffer);

    //TODO: read output file from args 
    writeFile.promise('db.json', json)
    .then(function() {
        //TODO: process errors
    });
});

