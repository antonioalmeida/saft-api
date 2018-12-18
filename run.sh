#!/usr/bin/env bash

# Install dependencies
yarn

# Build the src
yarn build

# Parse a XML file
yarn parse -s $1

# Run the server from the parsed file
yarn serve
