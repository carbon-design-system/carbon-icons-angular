/**
 * Copyright IBM Corp. 2018, 2018
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { remove } = require('fs-extra');
const paths = require('./paths');

async function clean() {
  cleanSome([
    paths.TS,
    paths.DIST,
    paths.ESM5,
    paths.ESM2015,
    paths.FESM5,
    paths.FESM2015,
    paths.BUNDLES
  ]);
}

async function cleanSome(paths) {
  return Promise.all(paths.map(path => remove(path)));
}

module.exports = {
  clean,
  cleanSome,
};
