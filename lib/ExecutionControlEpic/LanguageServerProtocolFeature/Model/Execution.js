"use babel";
// @flow

import { Terminal } from "xterm";
import type { Task } from "../../TaskExecutionFeature/Types/types";
import EventEmitter from "events";

export default class Execution {
  terminal: ?Terminal;
  task: ?Task;
  broker: EventEmitter;
  _handlers: { [handlerName: string]: (...params: Array<any>) => void };
  constructor({ task }: { task: ?Task }) {
    this.task = task;
    this.broker = new EventEmitter();
    this.terminal = null;
    this._handlers = {};
  }

  initTerminal() {
    this.terminal = new Terminal({
      cols: 80,
      rows: 17,
    });
    return this.terminal;
  }

  stopTerminal() {
    if (this.terminal == null) {
      return;
    }
    if (this._handlers.onTerminalResize) {
      this.terminal.off("resize", this._handlers.onTerminalResize);
    }
    if (this._handlers.onTerminalData) {
      this.terminal.off("data", this._handlers.onTerminalData);
    }
  }

  onTerminalResize(cb: (info: { cols: number, rows: number }) => void) {
    if (this.terminal == null) {
      throw new Error("terminal was not initialized");
    }
    if (this._handlers.onTerminalResize) {
      this.terminal.off("resize", this._handlers.onTerminalResize);
    }
    this._handlers.onTerminalResize = cb;
    this.terminal.on("resize", cb);
  }

  onTerminalData(cb: (data: string) => void) {
    if (this.terminal == null) {
      throw new Error("terminal was not initialized");
    }
    if (this._handlers.onTerminalData) {
      this.terminal.off("data", this._handlers.onTerminalData);
    }
    this._handlers.onTerminalData = cb;
    this.terminal.on("data", cb);
  }
}
