"use babel";
// @flow

import type { PlanConfig } from "../PlanConfigurationFeature/Types/types.js.flow";
import type { TaskAPI } from "../DevtoolLoadingFeature/Types/types.js.flow";
import moment from "moment";
import path from "path";
import { File } from "atom";
import type { HelperApi } from "../TaskExecutionFeature/Model/HelperApi";
import stripAnsi from "strip-ansi";
import hasbin from "hasbin";

export default {
  infos: {
    name: "now",
    dominantColor: "#000000",
    iconUri:
      "atom://molecule-dev-environment/.storybook/public/devtool-icon-now.png",
  },
  configSchema: {
    type: "object",
    schemas: {
      directory: {
        type: "string",
        default: "",
        label: "path",
        placeholder: "ex: /usr/src/my_project, github_user/repo#ref",
      },
      public: {
        type: "boolean",
        label: "is public",
      },
      name: {
        type: "string",
        default: "",
        label: "name",
        placeholder: "my_project",
      },
      binary: {
        type: "enum",
        label: "binary",
        enum: [
          { value: "local", description: "local" },
          { value: "global", description: "global" },
        ],
      },
    },
  },
  getStrategyForPlan(plan: PlanConfig, helperAPI: HelperApi) {
    let binaryPath;
    if (plan.config.binary.value === "local")
      binaryPath = path.join(
        path.dirname(plan.packageInfos.path),
        "node_modules",
        ".bin",
        "now",
      );
    else binaryPath = "now";

    let options = "deploy ";
    options += plan.config.directory;
    options += plan.config.name != "" ? ` --name=${plan.config.name}` : "";
    options += plan.config.public ? " --public" : "";

    return {
      strategy: {
        type: "terminal",
        command: `${binaryPath} ${options}`,
        cwd: path.dirname(plan.packageInfos.path),
      },
      controller: {
        onData(data: string, taskAPI: TaskAPI, helperAPI: HelperApi): void {
          for (const line of data.toString().split("\n")) {
            if (line.match(/Are you sure you want to proceed/)) {
              taskAPI.addDiagnostics([
                {
                  type: "info",
                  message: stripAnsi(line),
                  date: moment().unix(),
                },
              ]);
            }
            if (line.match(/Deployment aborted/)) {
              taskAPI.addDiagnostics([
                {
                  type: "error",
                  message: stripAnsi(line),
                  date: moment().unix(),
                },
              ]);
            }
          }
        },
        onError(err: any, taskAPI: TaskAPI, helperAPI: HelperApi): void {
          taskAPI.addDiagnostics([
            {
              type: "error",
              message: { data: err },
              date: moment().unix(),
            },
          ]);
        },
      },
    };
  },
  isPackage: async (packageName: string, dirname: string) => {
    if (
      path.basename(packageName) === "Dockerfile" ||
      path.basename(packageName) === "package.json" ||
      path.basename(packageName) === "index.html"
    ) {
      const pathToNow = path.join(
        path.dirname(packageName),
        "node_modules",
        "now",
      );

      const hasLocalNow = new File(pathToNow).exists();
      const hasGlobalNow = new Promise((resolve, reject) => {
        hasbin("now", resolve);
      });
      return (await hasLocalNow) || (await hasGlobalNow);
    }
    return false;
  },
};
