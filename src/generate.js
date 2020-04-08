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
const { downlevelConstructorParameters } = require('ng-packagr/lib/ts/ctor-parameters');

const ts = require('typescript');
const ng = require('@angular/compiler-cli');
const rollup = require('rollup');

const { moduleTemplate, rootPublicApi, jsRootPublicApi } = require('./templates');

// local utilities
const paths = require('./paths');

const reformatIcons = () => {
  let iconMap = new Map();
  let count = 0;
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
    count ++;
    if (count > 1) {
      break;
    }
  }
  return iconMap;
};

/**
 *
 * @param {*} namespace
 * @param {*} scriptTarget ts.ScriptTarget
 */
function emitModule(namespace, scriptTarget) {
  const baseOutFilePath = `${__dirname}/../dist`;
  const sourcePath = `${__dirname}/../ts`;
  let modulePath = '';
  if (scriptTarget === ts.ScriptTarget.ES2015) {
    modulePath = 'esm2015';
  } else if (scriptTarget === ts.ScriptTarget.ES5) {
    modulePath = 'esm5';
  }

  const options = {
    fileName: 'icon.ts',
    scriptTarget,
    outPath: `${baseOutFilePath}/${modulePath}/${namespace}`,
    moduleId: `${namespace.split('/').join('-')}`,
    sourceFile: `${sourcePath}/${namespace}/icon.ts`,
    declarationPath: `${baseOutFilePath}/${namespace}`,
    sourcePath: `${sourcePath}/${namespace}`
  };

  ngCompile(options);
}

/**
 *
 * @param {{
 * fileName: string,
 * scriptTarget: ScriptTarget,
 * outPath: string,
 * moduleId: string,
 * sourceFile: string,
 * sourcePath: string,
 * declarationPath: string
 * }} options
 */
function ngCompile(options) {
  const extraOptions = {
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    target: options.scriptTarget,
    experimentalDecorators: true,

    // sourcemaps
    sourceMap: false,
    inlineSources: true,
    inlineSourceMap: true,

    outDir: options.outPath,
    declaration: true,

    // ng compiler to options
    enableResourceInlining: true,

    // these are required to set the appropriate EmitFlags
    flatModuleId: options.moduleId,
    flatModuleOutFile: 'index.js',
  };

  // read the config from disk, and add/override some fields
  const config = ng.readConfiguration(`${__dirname}/tsconfig.json`, extraOptions);

  const overrideOptions = {
    // flatModuleId: options.moduleId,
    // flatModuleOutFile: 'index.js',
    basePath: options.sourcePath,
    rootDir: options.sourcePath,
    declarationDir: options.declarationPath,
  };

  config.options = { ...config.options, ...overrideOptions };

  config.rootNames = [options.sourceFile];

  console.log(config);

  console.log("ts host")
  // typescript compiler host, used by ngc
  const tsHost = ts.createCompilerHost(config.options, true);

  console.log("ngc host")
  // ngc compiler host
  const ngHost = ng.createCompilerHost({
    options: config.options,
    tsHost
  });

  console.log("program");
  // create the program (typecheck, etc)
  const program = ng.createProgram({
    rootNames: config.rootNames,
    options: config.options,
    host: ngHost
  });

  console.log("diag");
  // collect all diagnostic messages
  const diagMessages = [
    ...program.getTsOptionDiagnostics(),
    ...program.getNgOptionDiagnostics(),
    ...program.getTsSyntacticDiagnostics(),
    ...program.getTsSemanticDiagnostics(),
    ...program.getNgSemanticDiagnostics(),
    ...program.getNgStructuralDiagnostics()
  ];

  const beforeTs = [];
  if (!config.options.annotateForClosureCompiler) {
    beforeTs.push(downlevelConstructorParameters(() => program.getTsProgram().getTypeChecker()));
  }

  console.log("maybe emit?")
  // don't emit if the program won't compile
  if (ng.exitCodeFromResult(diagMessages) === 0) {
    console.log("do emit");
    const emitFlags = config.options.declaration ? config.emitFlags : ng.EmitFlags.JS;
    const result = program.emit({
      emitFlags,
      emitCallback: createEmitCallback(config.options),
      customTransformers: {
        beforeTs
      }
    });

    diagMessages.push(result.diagnostics);
  }

  // everything went well, no need to log anything
  if (diagMessages.length === 0) {
    return;
  }

  // error handling
  const exitCode = ng.exitCodeFromResult(diagMessages);
  const formattedDiagnostics = ng.formatDiagnostics(diagMessages);
  if (exitCode !== 0) {
    throw new Error(formattedDiagnostics);
  } else {
    console.log(formattedDiagnostics);
  }
}

function writeMegaBundle() {
  const formats = ["fesm5", "fesm2015", "bundles"];
  const bundles = [];

  const bundle = rollup.rollup();
}

async function writeMetadata() {
  const packageJson = require('../package.json');

  packageJson.esm5 = './esm5/index.js';
  packageJson.esm2015 = './esm2015/index.js';
  packageJson.fesm5 = './fesm5/index.js';
  packageJson.fesm2015 = './fesm2015/index.js';
  packageJson.bundles = './bundles/carbon-components-angular.js';
  packageJson.main = './bundles/carbon-components-angular.js';
  packageJson.module = './fesm5/index.js';
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

async function writeIndexes(iconMap) {
  const namespaces = Array.from(iconMap.keys());
  await Promise.all([
    fs.writeFile('dist/index.d.ts', rootPublicApi(namespaces)),
    fs.writeFile('dist/esm5/index.js', jsRootPublicApi(namespaces)),
    fs.writeFile('dist/esm2015/index.js', jsRootPublicApi(namespaces)),
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
    await Promise.all([
      fs.ensureDir(paths.STORIES),
      fs.ensureDir(paths.TS),
      fs.ensureDir('dist'),
      fs.ensureDir('dist/esm5'),
      fs.ensureDir('dist/esm2015'),
      fs.ensureDir('dist/fesm5'),
      fs.ensureDir('dist/fesm2015')
    ]);
  } catch (err) {
    reporter.error(err);
  }

  const iconMap = reformatIcons();

  reporter.log('Generating source components...');
  await writeIndexes(iconMap);
  return await generateComponents(iconMap);
}

module.exports = {
  generate,
  writeMegaBundle,
  writeMetadata,
  emitModule
};
