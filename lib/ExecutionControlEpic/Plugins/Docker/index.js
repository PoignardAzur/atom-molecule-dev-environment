"use babel";
// @flow

import type {
  GeneratedPlanObject,
  PlanConfig,
} from "../../PlanConfigurationFeature/Types/types";
import type { PackageTesterResult } from "../../../ProjectSystemEpic/PackageFeature/Types/types";
import type { Plugin } from "../../DevtoolLoadingFeature/Types/types";
import path from "path";
import yaml from "js-yaml";
import fs from "fs";

const plugin: Plugin = {
  info: {
    name: "docker",
    dominantColor: "#339fee",
    iconUri: "atom://molecule/images/plugins/docker.svg",
  },

  configSchema: {
    type: "object",
    schemas: {
      command: {
        type: "enum",
        label: "command",
        default: "start",
        enum: [
          { value: "build", description: "build" },
          { value: "start", description: "start" },
          { value: "upload", description: "upload" },
        ],
      },
      serviceName: {
        type: "string",
        label: "service name",
        placeholder: "myDockerService",
        default: "",
      },
    },
  },

  getStrategyForPlan(plan: PlanConfig) {
    return {
      strategy: {
        type: "node",
        path: path.join(__dirname, "lsp"),
        cwd: path.dirname(plan.packageInfo.path),
        args: [
          plan.packageInfo.path,
          plan.config.command,
          plan.config.serviceName,
        ],
        lsp: true,
      },
    };
  },

  async isPackage(packagePath: string): PackageTesterResult {
    if (!packagePath.endsWith(".yaml")) {
      return false;
    }

    const rawData = await new Promise((resolve, reject) => {
      fs.readFile(packagePath, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
    const fileConfig = yaml.safeLoad(rawData);
    return "version" in fileConfig && "services" in fileConfig;
  },

  async generatePlansForPackage(
    packagePath: string,
  ): Array<GeneratedPlanObject> {
    const rawData = await new Promise((resolve, reject) => {
      fs.readFile(packagePath, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
    const fileConfig = yaml.safeLoad(rawData);

    return Object.keys(fileConfig.services || {}).map(serviceName => ({
      name: serviceName,
      value: {
        command: "start",
        serviceName: serviceName,
      },
      autorun: false,
    }));
  },
};

export default plugin;
