"use babel";
// @flow

import type { PlanConfig } from "../PlanConfigurationFeature/Types/types.js.flow";
import type { TaskAPI } from "../DevtoolLoadingFeature/Types/types.js.flow";
import moment from "moment";
import path from "path";
import { File } from "atom";
import type { HelperApi } from "../TaskExecutionFeature/Model/HelperApi";

export default {
  infos: {
    name: "now",
    iconUri: "atom://molecule-dev-environment/.storybook/public/logo-now.png"
  },
  configSchema: {
    type: "object",
    schemas: {
      params: {
        type: "conditional",
        expression: {
          type: "enum",
          default: "deploy",
          label: "command",
          enum: [
            { value: "deploy", description: "deploy" },
            { value: "list", description: "list" },
            { value: "remove", description: "remove" }
          ]
        },
        cases: {
          deploy: {
            type: "object",
            schemas: {
              directory: {
                type: "string",
                default: "",
                label: "path",
                placeholder: "ex: /usr/src/my_project, github_user/repo#ref"
              },
              public: {
                type: "boolean",
                label: "is public"
              },
              name: {
                type: "string",
                default: "",
                label: "name",
                placeholder: "my_project"
              }
            }
          },
          list: {
            type: "string",
            default: "",
            label: "name",
            placeholder: "my_project"
          },
          remove: {
            type: "string",
            default: "",
            label: "url",
            placeholder: "ex: my_project-aeggxdyymd.now.sh"
          }
        }
      },
      binary: {
        type: "enum",
        label: "binary",
        enum: [
          { value: "local", description: "local" },
          { value: "global", description: "global" }
        ]
      }
    }
  },
  getStrategyForPlan(plan: PlanConfig, helperAPI: HelperApi) {
    let binaryPath;
    if (plan.config.binary.value === "local")
      binaryPath = path.join(
        path.dirname(plan.packageInfos.path),
        "node_modules",
        ".bin",
        "now"
      );
    else binaryPath = "now";

    let options = "";

    if (plan.config.params.expressionValue === "deploy") {
      options = "deploy ";
      options += plan.config.params.caseValue.directory;
      options +=
        plan.config.params.caseValue.name != ""
          ? ` --name=${plan.config.params.caseValue.name}`
          : "";
      options += plan.config.params.caseValue.public ? " --public" : "";
    } else if (plan.config.params.expressionValue === "list") {
      options = `list ${plan.config.params.caseValue.list}`;
    } else {
      options = `remove ${plan.config.params.caseValue.remove}`;
    }

    return {
      strategy: {
        type: "terminal",
        command: `${binaryPath} ${options}`,
        cwd: path.dirname(plan.packageInfos.path)
      },
      controller: {
        onData(data: string, taskAPI: TaskAPI, helperAPI: HelperApi): void {
          for (const line of data.toString().split("\n")) {
            if (line.match(/Are you sure you want to proceed/)) {
              taskAPI.addDiagnostics([
                {
                  type: "info",
                  message: {
                    text: helperAPI.outputToHTML(line),
                    html: true
                  },
                  date: moment().unix()
                }
              ]);
            }
            if (line.match(/Deployment aborted/)) {
              const htmlStr = helperAPI.outputToHTML(line);
              taskAPI.addDiagnostics([
                {
                  type: "error",
                  message: {
                    // Remove console special characters
                    text: htmlStr.slice(htmlStr.indexOf("<span")),
                    html: true
                  },
                  date: moment().unix()
                }
              ]);
            }
          }
        },
        onError(err: any, taskAPI: TaskAPI, helperAPI: HelperApi): void {
          taskAPI.addDiagnostics([
            {
              type: "error",
              message: { data: err },
              date: moment().unix()
            }
          ]);
        }
      }
    };
  },
  isPackage: (packageName: string, dirname: string) => {
    if (
      path.basename(packageName) === "Dockerfile" ||
      path.basename(packageName) === "package.json" ||
      path.basename(packageName) === "index.html"
    ) {
      const pathToNow = path.join(
        path.dirname(packageName),
        "node_modules",
        "now"
      );
      return new File(pathToNow).exists();
    }
    return false;
  }
};
