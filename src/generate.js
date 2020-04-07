/**
 * Copyright IBM Corp. 2018, 2018
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

const icons = require('@carbon/icons/build-info.json');
const { reporter } = require('@carbon/cli-reporter');
const fs = require('fs-extra');
const { dirname } = require('path');

const { createEmitCallback } = require('ng-packagr/lib/ngc/create-emit-callback');

const ts = require('typescript');
const ng = require('@angular/compiler-cli');
const rollup = require('rollup');

const { moduleTemplate, rootPublicApi } = require('./templates');

// local utilities
const paths = require('./paths');

const reformatIcons = () => {
  let iconMap = new Map();
  for (const icon of icons) {
    /**
     * index.js is generally the implied default import for a path
     * ex: `import { Foo } from '@bar/foo';` would try to import `Foo` from
     * `@bar/foo/index.js`, however `@carbon/icons` uses this for 'glyph' size icons.
     * This block swaps that for a `glyph.ts` which is more useful.
     */
    if (icon.outputOptions.file.endsWith('index.js')) {
      icon.outputOptions.file = icon.outputOptions.file.replace(
        'index.js',
        'glyph.ts'
      );
      icon.size = 'glyph';
    }

    // set the correct output options
    icon.outputOptions.file = icon.outputOptions.file
      .replace('es', 'ts')
      .replace('.js', '.ts');

    // the namespace consists of 1 or more values, seperated by a `/`
    // effectivly, the icon path without the root directory (`ts`) or output filename
    icon.namespace = dirname(icon.outputOptions.file.replace('ts/', ''));

    // add our modified icon descriptor to the output map by namespace
    if (iconMap.has(icon.namespace)) {
      iconMap.get(icon.namespace).push(icon);
    } else {
      iconMap.set(icon.namespace, [icon]);
    }
  }
  return iconMap;
};

function emitModule(namespace, scriptTarget) {
  const baseFilePath = '';
  const sourceFile = '';
  const moduleType = '';

  const options = {
    fileName: 'icon.ts',
    scriptTarget
  };

  ngCompile(options)
}

function ngCompile(options) {

  const config = ng.readConfiguration(`${__dirname}/tsconfig.json`, {

  });

  const tsHost = ts.createCompilerHost(config.options);

  const ngHost = ng.createCompilerHost({
    options: config.options,
    tsHost
  });

  const program = ng.createProgram({
    host: ngHost,
    oldProgram: null,
    options: config.options
  });

  const result = program.emit({
    emitFlags: ng.EmitFlags.JS,
    emitCallback: createEmitCallback(config.options)
  });
}

function writeMegaBundle() {
  const formats = ["fesm5", "fesm2015", "bundles"];
  const bundles = [];

  const bundle = rollup.rollup();
}

async function writeMetadata() {
  const packageJson = require('../package.json');

  packageJson.esm5 = '';
  packageJson.esm2015 = '';
  packageJson.fesm5 = '';
  packageJson.fesm2015 = '';
  packageJson.bundles = '';
  packageJson.main = '';
  packageJson.module = '';
  packageJson.typings = './index.d.ts';
  packageJson.metadata = './index.metadata.json';

  await fs.writeFile(packageJson);

  const metadataJson = {
    exports: []
  };

  const iconMap = reformatIcons();

  for (const [namespace, icons] of iconMap) {
    metadataJson.exports.push({
      from: `./${namespace}`
    });
  }

  await fs.writeFile('index.metadata.json', JSON.stringify(metadataJson));
}

async function writeIndexes() {
  await Promise.all([
    fs.writeFile('dist/index.d.ts', rootPublicApi(namespaces)),
    fs.writeFile('dist/esm5/index.js', rootPublicApi(namespaces)),
    fs.writeFile('dist/esm2015/index.js', rootPublicApi(namespaces)),
    fs.writeFile('dist/fesm5/index.js', rootPublicApi(namespaces)),
    fs.writeFile('dist/fesm2015/index.js', rootPublicApi(namespaces))
  ]);
}

async function generateComponents(iconMap) {
  for (const [namespace, icons] of iconMap) {
    await fs.ensureDir(`ts/${namespace}`);

    const moduleString = moduleTemplate(namespace, icons);
    await fs.writeFile(`ts/${namespace}/icon.ts`, moduleString);
  }

  // get all the namespaces to build the import definitions
  const namespaces = Array.from(iconMap.keys());
  await fs.writeFile('ts/index.ts', rootPublicApi(namespaces));
  return Array.from(iconMap);
}

async function generate() {
  reporter.log('Prepping build dirs...');
  try {
    // ensure our build directories are created
    await Promise.all([fs.ensureDir(paths.STORIES), fs.ensureDir(paths.TS)]);
  } catch (err) {
    reporter.error(err);
  }

  const iconMap = reformatIcons();

  reporter.log('Generating source components...');
  await writeIndexes(iconMap);
  await generateComponents(iconMap);
}

module.exports = {
  generate,
  writeMegaBundle,
  writeMetadata,
  emitModule
};
