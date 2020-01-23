#!/usr/bin/env bash

set -e # exit with nonzero exit code if anything fails

cd tests/integration

echo "installing dependencies"
npm i

echo "copying compiled icons"
cp -R ../../dist/ node_modules/@carbon/icons-angular/

echo "building"
npm run build
