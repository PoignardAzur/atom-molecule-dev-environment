"use babel";
// @flow

import { ResponseError, ErrorCodes } from "vscode-jsonrpc";
import { ConsoleLogError } from "../../ConsoleFeature/Types/types";
import type { JsonRPCStreams } from "../Types/jsonrpc-stream";
import type { PlanConfig } from "../../PlanConfigurationFeature/Types/types";
import type { GetStrategyForPlanResult } from "../../DevtoolLoadingFeature/Types/types";
import LanguageClientConnection from "./LanguageClientConnection";
import { requireDevtool } from "../../DevtoolLoadingFeature/Model/DevtoolLoadingManager";
import EventEmitter from "events";
import { getStrategyRunner } from "./strategyRunnerHelpers";
import PluginApi from "./PluginApi";
import HelperApi from "../../TaskExecutionFeature/Model/HelperAPI";
import os from "os";

// TODO - Check whether createFilesWatcherObservable is used anywhere
/*
import { createFilesWatcherObservable } from "../../../EventSystemEpic/FileFeature/Model/createFilesWatcherObservable";
import { watchman } from "fb-watchman";
import { fileEventsHelpers } from "../../../EventSystemEpic/FileFeature/Model/fileEventsHelpers";
*/

export class Controller extends EventEmitter {
  constructor() {
    super();
  }

  kill() {
    this.emit("kill");
  }
}

function _makeError(message) {
  return new ResponseError(ErrorCodes.InvalidParams, message);
}

function _checkDevtool(devtool) {
  if (devtool.getStrategyForPlan == null) {
    throw _makeError("devtool has no getStrategyForPlan method");
  }
  if (typeof devtool.getStrategyForPlan !== "function") {
    throw _makeError("devtool.getStrategyForPlan must be a function");
  }
}

function _checkStrategy(execConfig) {
  if (execConfig.strategy == null) {
    throw _makeError("devtool.getStrategyForPlan(...) has no strategy fied");
  }
  if (typeof execConfig.strategy !== "object") {
    throw _makeError(
      "devtool.getStrategyForPlan(...).strategy must be an object",
    );
  }

  const controller = execConfig.controller;

  if (controller.onData && typeof controller.onData !== "function") {
    throw _makeError("controller.onData must be a function");
  }
  if (controller.onExit && typeof controller.onExit !== "function") {
    throw _makeError("controller.onExit must be a function");
  }
  if (controller.onError && typeof controller.onError !== "function") {
    throw _makeError("controller.onError must be a function");
  }
}

export function runController(config: {
  plan: PlanConfig,
  streams: JsonRPCStreams,
  actions: {
    kill: () => void,
  },
}): Controller {
  const connection = new LanguageClientConnection({
    ...config.streams,
  });

  let strategyRunner = null;
  const controller = new Controller();
  let execConfig: ?GetStrategyForPlanResult = null;

  connection.onRequest("strategy/init", async () => {
    const devtool = requireDevtool(config.plan);
    _checkDevtool(devtool);

    execConfig = devtool.getStrategyForPlan(config.plan, HelperApi);
    execConfig.controller = execConfig.controller || {};
    _checkStrategy(execConfig);

    return execConfig.strategy;
  });

  connection.onRequest("initialize", async initializeOptions => {
    if (execConfig == null) {
      throw _makeError("'strategy/init' must be called before 'initialize'");
    }

    // These intermediary variables must be set
    // to avoid flowtype errors
    const configStrategy = execConfig.strategy;
    const configController = execConfig.controller;

    const StrategyRunner = getStrategyRunner(configStrategy);
    const shellSelection = os.platform() === "win32" ? "cmd.exe /c" : "bash -c";

    strategyRunner = new StrategyRunner({
      strategy: configStrategy,
      shell: shellSelection,
    });
    // We set a local variable to avoid flowtype errors
    const runner = strategyRunner;

    const taskAPI = PluginApi(connection.sendNotification.bind(connection));

    runner.on("data", ({ data }) => {
      if (configController.onData) {
        configController.onData(data, taskAPI, HelperApi);
      }
      if (configStrategy.type === "terminal")
        connection.terminalOutput({ data });
    });

    runner.on("errorData", ({ data }) => {
      connection.sendNotification("window/logMessage", {
        type: ConsoleLogError,
        message: `stderr: ${data}`,
      });
    });

    runner.on("exit", exitCode => {
      if (configController.onExit) {
        configController.onExit(exitCode, taskAPI, HelperApi);
      }
      config.actions.kill();
    });

    runner.on("error", err => {
      if (configController.onError) {
        if (
          !(err.code === "EIO" && err.errno === "EIO" && err.syscall === "read")
        )
          configController.onError(err, taskAPI, HelperApi);
      }
      config.actions.kill();
    });

    runner.run();

    if (runner.isStrategyLanguageServer() && runner.connection == null) {
      runner.stop();
      throw _makeError("Cannot load process for devtool");
    }

    controller.on("kill", () => {
      runner.stop();
    });

    if (configStrategy.type === "terminal") {
      connection.onNotification("terminal/input", ({ data }) => {
        runner.emit("terminal/input", { data });
      });
      connection.onNotification("terminal/resize", ({ cols, rows }) => {
        runner.emit("terminal/resize", { cols, rows });
      });
    }

    if (!runner.isLanguageClient()) {
      connection.onRequest("shutdown", async () => null);
    }

    if (runner.isLanguageClient()) {
      const notificationsToLS = [
        "initialized",
        "$/cancelRequest",
        "workspace/didChangeConfiguration",
        "workspace/didChangeWatchedFiles",
        "textDocument/didOpen",
        "textDocument/didChange",
        "textDocument/willSave",
        "textDocument/didSave",
        "textDocument/didClose",
      ];

      const requestsToLS = [
        "shutdown",
        "workspace/symbol",
        "workspace/executeCommand",
        "textDocument/willSaveWaitUntil",
        "textDocument/completion",
        "completionItem/resolve",
        "textDocument/hover",
        "textDocument/signatureHelp",
        "textDocument/references",
        "textDocument/documentHighlight",
        "textDocument/documentSymbol",
        "textDocument/formatting",
        "textDocument/rangeFormatting",
        "textDocument/onTypeFormatting",
        "textDocument/definition",
        "textDocument/codeAction",
        "textDocument/codeLens",
        "codeLens/resolve",
        "textDocument/documentLink",
        "documentLink/resolve",
        "textDocument/rename",
      ];

      const notificationsFromLS = [
        "$/cancelRequest",
        "window/showMessage",
        "window/logMessage",
        "telemetry/event",
        "textDocument/publishDiagnostics",
      ];

      const requestsFromLS = [
        "window/showMessageRequest",
        "client/registerCapability",
        "client/unregisterCapability",
        "workspace/applyEdit",
      ];

      for (const notificationTitle of notificationsToLS) {
        connection.onNotification(notificationTitle, data => {
          return runner.connection.sendNotification(notificationTitle, data);
        });
      }

      for (const requestTitle of requestsToLS) {
        connection.onRequest(requestTitle, data => {
          return runner.connection.sendRequest(requestTitle, data);
        });
      }

      for (const notificationTitle of notificationsFromLS) {
        runner.connection.onNotification(notificationTitle, data => {
          connection.sendNotification(notificationTitle, data);
        });
      }

      for (const requestTitle of requestsFromLS) {
        runner.connection.onRequest(requestTitle, data => {
          return connection.sendRequest(requestTitle, data);
        });
      }
    }

    if (runner.isLanguageClient()) {
      return runner.connection.sendRequest("initialize", initializeOptions);
    } else {
      return { capabilities: {} };
    }
  });

  connection.onNotification("exit", () => {
    if (strategyRunner != null && strategyRunner.isLanguageClient() === false) {
      strategyRunner.stop();
    }
    config.actions.kill();
  });

  connection.listen();

  return controller;
}

export default runController;
