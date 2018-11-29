#!/usr/bin/env bash

# Install dependencies
yarn

# Build the src
yarn build

# Parse a XML file
yarn parse -s SAFT_DEMOSINF_01-01-2016_31-12-2016.xml

# Run the server from the parsed file
yarn serve
