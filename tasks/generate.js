/**
 * Copyright IBM Corp. 2018, 2018
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {
  generate,
  emitModule,
  writeBundles,
  writeMetadata,
  writeMegaBundle
} = require('../src/generate');
const { reporter } = require('@carbon/cli-reporter');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const ts = require('typescript');

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // handles distributing compilation tasks to workers
  // and reporting the state (finished/error/etc)
  const buildIcons = (iconArray, resolve, reject) => {
    console.log('starting parallel ng compile');
    let lastIcon = 0;
    let finishedWorkers = 0;
    for (const id in cluster.workers) {
      const worker = cluster.workers[id];

      worker.on('message', ({ state }) => {
        if ((state === 'done' || state === 'waiting') && lastIcon < iconArray.length) {
          worker.send({ namespace: iconArray[lastIcon][0] });
          lastIcon++;
          console.log(`${iconArray.length - lastIcon} icons left`);
        } else if (lastIcon >= iconArray.length) {
          finishedWorkers++;
          if (finishedWorkers === numCPUs) {
            resolve();
          }
        } else if (state === 'error') {
          reject("error in a worker");
          throw new Error("error in a worker");
        }
      });
    }
  }

  generate()
  .then(iconArray => {
    return new Promise((resolve, reject) => {
      buildIcons(iconArray, resolve, reject);
    });
  })
  .then(() => {
    console.log('writing the megabundle');
    writeMegaBundle()
  })
  .then(() => {
    console.log('writing metadata');
    return writeMetadata();
  })
  .then(() => {
    console.log('shutting down workers');
    for (const id in cluster.workers) {
      const worker = cluster.workers[id];
      worker.kill();
    }
  })
  .catch(error => {
    reporter.error(error);
  });

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died - ${code} : ${signal}`);
  });
} else {
  console.log(`Worker ${process.pid} started`);
  process.on('message', ({namespace}) => {
    console.log(`Worker ${process.pid} building ${namespace}`);
    emitModule(namespace, ts.ScriptTarget.ES2015);//es2015
    emitModule(namespace, ts.ScriptTarget.ES5);
    writeBundles(namespace).then(() =>{
      process.send({ state: 'done' });
    }).catch(() => {
      process.send({ state: 'error' });
    });
  });
  process.send({ state: 'waiting' });
}
