import commandLineArgs from 'command-line-args'

const optionDefinitions = [
    {name: 'source', alias: 's', type: String, defaultValue: 'db.xml'}
]

const options = commandLineArgs(optionDefinitions)

export default options;
