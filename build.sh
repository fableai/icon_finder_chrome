#!/bin/bash

# Install required tools if not already installed
if ! command -v uglifyjs &> /dev/null; then
    npm install -g uglify-js
fi

# Create build directory
rm -rf ./build
mkdir -p ./build

# Copy all files to build directory
cp manifest.json ./build/
cp popup.html ./build/
cp -r images ./build/

# Minify and obfuscate JavaScript
uglifyjs popup.js -c -m -o ./build/popup.js

# Create zip file for Chrome Web Store
cd build
zip -r ../chrome-extension.zip ./*
cd ..

echo "Build completed! chrome-extension.zip is ready for submission."
