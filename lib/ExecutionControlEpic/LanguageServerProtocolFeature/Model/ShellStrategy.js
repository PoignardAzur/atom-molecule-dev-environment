"use babel";
// @flow

import Strategy from "./StrategyRunner";
import { spawn } from "child_process";
import type { ChildProcess } from "child_process";
import type {
  Shell,
  ShellStrategyType,
} from "../../TaskExecutionFeature/Types/types";

export default class ShellStrategy extends Strategy {
  child: ?ChildProcess;
  config: { strategy: ShellStrategyType, shell: Shell };
  isLS: boolean;

  constructor(config: { strategy: ShellStrategyType, shell: Shell }) {
    super();

    this.child = null;
    this.config = config;
    this.isLS = config.strategy.lsp || false;
  }

  run() {
    const child = spawn(
      this.config.shell.split(" ")[0],
      this.config.shell
        .split(" ")
        .slice(1)
        .concat(this.config.strategy.command),
      {
        cwd: this.config.strategy.cwd,
        env: this.config.strategy.env,
      },
    );
    this.child = child;

    if (child == null) {
      throw new Error(
        `Cannot start process to run ${this.config.strategy.command}`,
      );
    }

    child.stdout.on("data", data => this.emit("data", { data }));
    child.stderr.on("data", data => this.emit("errorData", { data }));
    child.on("close", exitCode => this.emit("exit", { code: exitCode }));
    child.on("error", err => this.emit("error", { error: err }));
    this.setupLanguageClient({
      inStream: child.stdout,
      outStream: child.stdin,
    });
  }

  stop() {
    if (this.child) {
      this.child.kill();
    }
  }

  isStrategyLanguageServer() {
    return this.isLS;
  }
}
