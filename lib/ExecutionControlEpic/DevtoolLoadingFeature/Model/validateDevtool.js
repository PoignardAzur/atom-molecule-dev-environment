"use babel";
// @flow

export function validateDevtool(devtool: PluginInfo) {
  if (devtool.info == null) {
    throw new Error("devtool has no .info attribute");
  }
  if (typeof devtool.info !== "object" || Array.isArray(devtool.info)) {
    throw new Error("devtool.info must be an object");
  }
  if (devtool.info.name == null) {
    throw new Error("devtool.info has no .name attribute");
  }
  if (typeof devtool.info.name !== "string") {
    throw new Error("devtool.info.name must be a string");
  }
  if (devtool.info.iconUri == null) {
    throw new Error("devtool.info has no .iconUri attribute");
  }
  if (typeof devtool.info.iconUri !== "string") {
    throw new Error("devtool.info.iconUri must be a string");
  }
  // TODO - devtool.info.dominantColor
  // TODO - devtool.info.defaultDiagnosticsMode
  // TODO - Validate DiagnosticView ?
  if (devtool.configSchema == null) {
    throw new Error("devtool has no .configSchema attribute");
  }
  // TODO - Check devtool.configSchema validity
  if (devtool.getStrategyForPlan == null) {
    throw new Error("devtool has no .getStrategyForPlan method");
  }
  if (typeof devtool.getStrategyForPlan !== "function") {
    throw new Error("devtool.getStrategyForPlan must be a function");
  }
  if (
    devtool.generatePlansForPackage != null &&
    typeof devtool.generatePlansForPackage !== "function"
  ) {
    throw new Error("devtool.generatePlansForPackage must be a function");
  }
  if (devtool.isPackage == null) {
    throw new Error("devtool has no .isPackage attribute");
  }
  if (
    typeof devtool.isPackage !== "string" &&
    typeof devtool.isPackage !== "function" &&
    !(devtool.isPackage instanceof RegExp)
  ) {
    throw new Error("devtool.isPackage has an invalid type");
  }
  return;
}
