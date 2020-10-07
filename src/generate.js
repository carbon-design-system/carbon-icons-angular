/**
 * Copyright IBM Corp. 2018, 2018
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

const iconMetadata = require('@carbon/icons/metadata.json');
const { reporter } = require('@carbon/cli-reporter');
const fs = require('fs-extra');

const { moduleTemplate, rootPublicApi } = require('./templates');

// local utilities
const paths = require('./paths');

const getNamespace = (iconMeta) => {
  if (iconMeta.namespace.length > 0) {
    return `${iconMeta.namespace.join('/')}/${iconMeta.name}`;
  }
  return iconMeta.name;
};

async function generateComponents(icons) {
  for (const iconMeta of icons) {
    const namespace = getNamespace(iconMeta);
    await fs.ensureDir(`ts/${namespace}`);

    const moduleString = moduleTemplate(namespace, iconMeta.output);
    await fs.writeFile(`ts/${namespace}/index.ts`, moduleString);
  }

  // get all the namespaces to build the import definitions
  const namespaces = icons.map(getNamespace);
  await fs.writeFile('ts/index.ts', rootPublicApi(namespaces));
}

async function generate() {
  reporter.log('Prepping build dirs...');
  try {
    // ensure our build directories are created
    await Promise.all([fs.ensureDir(paths.STORIES), fs.ensureDir(paths.TS)]);
  } catch (err) {
    reporter.error(err);
  }

  reporter.log('Generating source components...');
  await generateComponents(iconMetadata.icons);
}

module.exports = generate;
