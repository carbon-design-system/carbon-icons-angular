#!/usr/bin/env bash

set -e # exit with nonzero exit code if anything fails

cd dist
npm pack
mv carbon-icons-angular-0.0.0.tgz ../
cd ../

cd tests/integration

echo "installing dependencies"
npm i

echo "testing"
npm run test

echo "building"
npm run build
