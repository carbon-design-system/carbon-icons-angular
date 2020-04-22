#!/usr/bin/env bash

set -e # exit with nonzero exit code if anything fails

cd tests/integration

echo "installing dependencies"
npm i

echo "testing"
npm run test

echo "building"
npm run build
