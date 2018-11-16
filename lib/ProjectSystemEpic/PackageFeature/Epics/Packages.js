"use babel";
// @flow

import Rx from "rxjs";
import { packagesRefreshed } from "../Actions/PackagesRefreshed";
import { packageRefreshCompleted } from "../Actions/PackageRefreshCompleted";
import type { PackageFinder } from "../Model/FindPackages";
import fs from "fs";

const packagesEpic = (
  findPackages: PackageFinder,
  File: any,
  Directory: any,
  concurrentPluginsLoaded: number,
  lstat: typeof fs.lstat = fs.lstat,
) => (action$: Observable) => {
  return action$
    .ofType("REFRESH_PACKAGES")
    .groupBy(a => a.payload.rootPath, null, () => Rx.Observable.timer(300))
    .map(g => g.toArray())
    .mergeAll()
    .filter(actions => actions && actions.length > 0)
    .map(actions => {
      const rootPath = actions[0].payload.rootPath;
      const plugins = actions.reduce((acc, curr) => {
        acc.push(
          ...curr.payload.plugins.filter(
            item => !acc.find(test => test.tool.id === item.tool.id),
          ),
        );
        return acc;
      }, []);

      const fileStat$ = Rx.Observable.bindNodeCallback(lstat)(rootPath);
      return fileStat$
        .map(fileStat =>
          fileStat.isDirectory ? new Directory(rootPath) : new File(rootPath),
        )
        .flatMap(fileOrDir =>
          Rx.Observable.from(plugins)
            .map(plugin =>
              findPackages(fileOrDir, plugin)
                // For each plugin, call `isPackage` 1 file at a time
                // $FlowFixMe
                .mergeAll(1)
                .toArray()
                .map(packageInfos =>
                  packagesRefreshed(rootPath, packageInfos, [plugin]),
                )
                .catch(error => {
                  // TODO - Replace with proper LOAD_PACKAGE_ERROR action
                  console.error(
                    `Error loading plugin ${plugin.tool.name}: `,
                    error,
                  );
                  // TODO - For some reason, `return Observable.empty()`
                  // doesn't work
                  return () => Observable.empty();
                }),
            )
            // $FlowFixMe
            .mergeAll(concurrentPluginsLoaded)
            .concat(
              Rx.Observable.of(
                packageRefreshCompleted(rootPath, actions.length),
              ),
            ),
        );
    })
    .mergeAll();
};

export default packagesEpic;
