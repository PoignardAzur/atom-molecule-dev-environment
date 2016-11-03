'use babel'
// @flow

import type {TargetConfig} from "../../Types/types.js.flow";
import {gulp, docker, npm} from "../../../DevToolsSummaryFeature/Fake/Data/DevTools";

export let gulpBuild: TargetConfig = {
  tool: gulp,
  config: "build",
  name: "build",
  pinned: false
};

export let gulpWatch: TargetConfig = {
  tool: gulp,
  config: "watch",
  name: "watch",
  pinned: false
};

export let dockerWeb: TargetConfig = {
  tool: docker,
  config: {
    image: "node"
  },
  name: "web",
  pinned: false
};

export let dockerDB: TargetConfig = {
  tool: docker,
  config: {
    image: "mongo"
  },
  name: "db",
  pinned: false
};

export let npmRunBuild: TargetConfig = {
  tool: npm,
  config: {
    type: "run",
    script: "build"
  },
  name: "run build",
  pinned: false
};

export let npmRunServe: TargetConfig = {
  tool: npm,
  config: {
    type: "run",
    script: "serve"
  },
  name: "run serve",
  pinned: false
};

let targetConfigs: Array<TargetConfig> = [gulpBuild, gulpWatch, dockerWeb, dockerDB, npmRunBuild, npmRunServe];

export default targetConfigs;