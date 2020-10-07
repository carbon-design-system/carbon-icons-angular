/**
 * Copyright IBM Corp. 2018, 2018
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

const iconMetadata = require('@carbon/icons/metadata.json');
const { reporter } = require('@carbon/cli-reporter');
const fs = require('fs-extra');

const { createEmitCallback } = require('ng-packagr/lib/ngc/create-emit-callback');
const { downlevelConstructorParameters } = require('ng-packagr/lib/ts/ctor-parameters');

const ts = require('typescript');
const ng = require('@angular/compiler-cli');
const rollup = require('rollup');
const { pascal } = require('change-case');

const {
  moduleTemplate,
  rootPublicApi,
  tsRootPublicApi,
  jsRootPublicApi,
  flatRootPublicApi
} = require('./templates');

// local utilities
const paths = require('./paths');

const getNamespace = (iconMeta) => {
  if (iconMeta.namespace.length > 0) {
    return `${iconMeta.namespace.join('/')}/${iconMeta.name}`;
  }
  return iconMeta.name;
};

/**
 *
 * @param {*} namespace
 * @param {*} scriptTarget ts.ScriptTarget
 */
function emitModule(namespace, scriptTarget) {
  let modulePath = '';
  if (scriptTarget === ts.ScriptTarget.ES2015) {
    modulePath = 'esm2015';
  } else if (scriptTarget === ts.ScriptTarget.ES5) {
    modulePath = 'esm5';
  }

  const options = {
    fileName: 'icon.ts',
    scriptTarget,
    outPath: `${paths.DIST}/${modulePath}/${namespace}`,
    moduleId: `${namespace.split('/').join('-')}`,
    sourceFile: `${paths.TS}/${namespace}/icon.ts`,
    declarationPath: `${paths.DIST}/${namespace}`,
    sourcePath: `${paths.TS}/${namespace}`
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
    basePath: options.sourcePath,
    rootDir: options.sourcePath,
    declarationDir: options.declarationPath,
  };

  config.options = { ...config.options, ...overrideOptions };
  config.rootNames = [options.sourceFile];

  // typescript compiler host, used by ngc
  const tsHost = ts.createCompilerHost(config.options, true);

  // ngc compiler host
  const ngHost = ng.createCompilerHost({
    options: config.options,
    tsHost
  });

  // create the program (typecheck, etc)
  const program = ng.createProgram({
    rootNames: config.rootNames,
    options: config.options,
    host: ngHost
  });

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

  // don't emit if the program won't compile
  if (ng.exitCodeFromResult(diagMessages) === 0) {
    const emitFlags = config.options.declaration ? config.emitFlags : ng.EmitFlags.JS;
    const result = program.emit({
      emitFlags,
      emitCallback: createEmitCallback(config.options),
      customTransformers: {
        beforeTs
      }
    });
    diagMessages.push(...result.diagnostics);
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

const getRollupInputOptions = ({sourceType, namespace}) => ({
  external: [
    '@angular/core',
    '@carbon/icon-helpers'
  ],
  input: `${paths.DIST}/${sourceType}/${namespace ? namespace : ''}/index.js`,
  onwarn(warning) {
    if (warning.code === 'UNUSED_EXTERNAL_IMPORT') {
      return;
    }
  }
});

const getRollupOutputOptions = ({file, format, name}) => ({
  file,
  format,
  globals: {
    '@angular/core': 'ng.core',
    '@carbon/icon-helpers': 'CarbonIconHelpers'
  },
  name
});

async function writeMegaBundle() {
  const inputOptions = getRollupInputOptions({
    sourceType: 'esm5'
  });

  const outputOptions = getRollupOutputOptions({
    file: `${paths.BUNDLES}/carbon-icons-angular.umd.js`,
    format: 'umd',
    name: 'CarbonIconsAngular'
  });

  const bundle = await rollup.rollup(inputOptions);
  return bundle.write(outputOptions);
}

async function writeBundles(namespace) {
  const formats = ['esm5', 'esm2015', 'bundles'];
  const bundles = [];

  for (const format of formats) {
    const inputOptions = getRollupInputOptions({
      sourceType: format === 'bundles' ? 'esm5' : format,
      namespace
    });

    let outputOptions = {};

    if (format === 'bundles') {
      outputOptions = getRollupOutputOptions({
        file: `${paths.BUNDLES}/${namespace.split('/').join('-')}.umd.js`,
        format: 'umd',
        name: `CarbonIconsAngular.${pascal(namespace)}`
      });
    } else {
      outputOptions = getRollupOutputOptions({
        file: `${paths.DIST}/f${format}/${namespace.split('/').join('-')}.js`,
        format: 'es',
        name: `CarbonIconsAngular.${pascal(namespace)}`
      });
    }


    const bundle = await rollup.rollup(inputOptions);
    bundles.push(bundle.write(outputOptions));
  }

  return Promise.all(bundles);
}

async function writeMetadata() {
  const packageJson = require('../package.json');

  // use paths relative to the built files and the `package.json`s final location next to them
  packageJson.esm5 = './esm5/index.js';
  packageJson.esm2015 = './esm2015/index.js';
  packageJson.fesm5 = './fesm5/index.js';
  packageJson.fesm2015 = './fesm2015/index.js';
  packageJson.bundles = './bundles/carbon-icons-angular.umd.js';
  packageJson.main = './bundles/carbon-icons-angular.umd.js';
  packageJson.module = './fesm5/index.js';
  packageJson.typings = './index.d.ts';
  packageJson.metadata = './index.metadata.json';

  const metadataJson = {
    __symbolic: 'module',
    version: 4,
    metadata: {},
    exports: [],
    importAs: '@carbon/icons-angular'
  };

  for (const iconMeta of iconMetadata.icons) {
    metadataJson.exports.push({
      from: `./${getNamespace(iconMeta)}`
    });
  }

  await fs.writeFile(`${paths.DIST}/package.json`, JSON.stringify(packageJson));
  await fs.writeFile(`${paths.DIST}/index.metadata.json`, JSON.stringify(metadataJson));
}

async function writeIndexes(icons) {
  const namespaces = icons.map(iconMeta => getNamespace(iconMeta));
  await Promise.all([
    fs.writeFile(`${paths.DIST}/index.d.ts`, tsRootPublicApi(namespaces)),
    fs.writeFile(`${paths.ESM5}/index.js`, jsRootPublicApi(namespaces)),
    fs.writeFile(`${paths.ESM2015}/index.js`, jsRootPublicApi(namespaces)),
    fs.writeFile(`${paths.FESM5}/index.js`, flatRootPublicApi(namespaces)),
    fs.writeFile(`${paths.FESM2015}/index.js`, flatRootPublicApi(namespaces))
  ]);
}

async function generateComponents(icons) {
  for (const iconMeta of icons) {
    const namespace = getNamespace(iconMeta);
    await fs.ensureDir(`${paths.TS}/${namespace}`);

    const moduleString = moduleTemplate(namespace, iconMeta);
    await fs.writeFile(`${paths.TS}/${namespace}/icon.ts`, moduleString);
  }

  // get all the namespaces to build the import definitions
  const namespaces = icons.map(iconMeta => getNamespace(iconMeta));
  await fs.writeFile(`${paths.TS}/index.ts`, rootPublicApi(namespaces));
  return namespaces;
}

async function generate() {
  reporter.log('Prepping build dirs...');
  try {
    // ensure our build directories are created
    await Promise.all([
      fs.ensureDir(paths.TS),
      fs.ensureDir(paths.DIST),
      fs.ensureDir(paths.ESM5),
      fs.ensureDir(paths.ESM2015),
      fs.ensureDir(paths.FESM5),
      fs.ensureDir(paths.FESM2015),
      fs.ensureDir(paths.BUNDLES)
    ]);
  } catch (err) {
    reporter.error(err);
  }

  reporter.log('Generating source components...');
  await writeIndexes(iconMetadata.icons);
  return await generateComponents(iconMetadata.icons);
}

module.exports = {
  generate,
  writeMegaBundle,
  writeMetadata,
  emitModule,
  writeBundles,
  getNamespace
};
