/**
 * Copyright IBM Corp. 2018, 2018
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { resolve } = require('path');

module.exports = {
  TS: resolve(__dirname, '../ts'),
  DIST: resolve(__dirname, '../dist'),
  ESM5: resolve(__dirname, '../dist/esm5'),
  ESM2015: resolve(__dirname, '../dist/esm2015'),
  FESM5: resolve(__dirname, '../dist/fesm5'),
  FESM2015: resolve(__dirname, '../dist/fesm2015'),
  BUNDLES: resolve(__dirname, '../dist/bundles')
};
