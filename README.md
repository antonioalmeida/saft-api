# saft-api (WIP)

Ever wanted to create a Web API straight from a SAF-T (Portuguese) XML file? Of course not. Either way, this tools helps you do that. 

### How it works
The tools first converts a [SAF-T (PT) v1.04_01](http://info.portaldasfinancas.gov.pt/apps/saft-pt04/SAFTPT1.04_01.xsd) XML file into a JSON "database", makes some adjustments to it and then serves it through [json-server](https://github.com/typicode/json-server).

### Using the tool

```
# Install dependencies
yarn

# Build the src
yarn build

# Parse a XML file
yarn parse -s file.xml

# Run the server from the parsed file
yarn serve
```

*Note:* this is a proof of concept created in under two hours as a helper tool for a university project and will be extended given the project's needs
