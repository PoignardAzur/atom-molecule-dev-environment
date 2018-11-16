"use babel";
// @flow

import { connect } from "react-redux";
import { compose } from "recompose";
import ColorHash from "color-hash";
import { List, Map } from "immutable";
import DevToolsWithDiagnostics from "../Presenters/DevToolsWithDiagnostics";
import type { DevToolWithDiagnostics as DevToolWithDiagnosticsType } from "../Types/types";
import {
  selectDevtoolsReducer,
  selectDiagnosticsReducer,
  selectPlansReducer,
  selectTasksReducer,
} from "../../../GlobalSystem/Selectors";
import {
  selectPertinentTaskID,
  selectStateOfPlan,
  selectTaskOfID,
  selectTasksOfPlan,
} from "../../TaskExecutionFeature/Selectors/Tasks";
import { selectDevtools } from "../Selectors/DevToolsInfo";
import { selectPlansOfTool } from "../../PlanConfigurationFeature/Selectors/PlanConfigs";
import { selectDiagnosticsOfTask } from "../../DiagnosticsFeature/Selectors/Diagnostics";
import type { State } from "../../../GlobalSystem/types.js.flow";
import ExecutionsController from "../../LanguageServerProtocolFeature/Model/ExecutionsController";
import type { DiagnosticSeverity } from "../../DiagnosticsFeature/Types/types";
import { runTask } from "../../TaskExecutionFeature/Actions/RunTask";
import type { RunTaskAction } from "../../TaskExecutionFeature/Actions/RunTask";
import { renderControlPanel } from "../../ControlPanelFeature/AtomLinks/Panels";

export function mapStateToProps(state: State) {
  const tools = selectDevtools(selectDevtoolsReducer(state));
  const toolsWithDiagnostics = tools
    .map((devtool, devtoolIndex) => {
      const plans = selectPlansOfTool(
        selectPlansReducer(state),
        devtool.id,
      ).filter(plan => {
        return plan.pinned;
      });

      return plans.map((plan, planIndex) => {
        const taskID = selectPertinentTaskID(
          selectTasksOfPlan(selectTasksReducer(state), plan),
        );

        const diagnosticsForTask = taskID
          ? selectDiagnosticsOfTask(selectDiagnosticsReducer(state), taskID)
          : Map();

        const execution = taskID && ExecutionsController.getExecution(taskID);
        const notifier = execution ? execution.broker : null;

        const task = taskID
          ? selectTaskOfID(selectTasksReducer(state), taskID)
          : null;

        function _diagnosticCount(severity: DiagnosticSeverity) {
          return diagnosticsForTask.reduce(
            (count, diagnosticsForPath) =>
              count + diagnosticsForPath.get(severity, List()).count(),
            0,
          );
        }

        return {
          ...devtool,
          name: plan.name,
          state: selectStateOfPlan(selectTasksReducer(state), plan),
          errors: _diagnosticCount(1),
          warnings: _diagnosticCount(2),
          info: _diagnosticCount(3),
          // TODO - hints: _diagnosticCount(4),
          successes: _diagnosticCount(5),
          planColor: new ColorHash({ lightness: 0.75, saturation: 1 }).hex(
            devtool.id + plan.name,
          ),
          busy: task ? task.busy : false,
          legend: plan.name,
          index: devtoolIndex + planIndex,
          plan: plan,
          notifier,
        };
      });
    })
    .flatten()
    .toArray();
  return {
    tools: toolsWithDiagnostics,
  };
}

export function mapDispatchToProps(
  dispatch: (action: RunTaskAction) => any,
): {
  onToolDiagnosticsClick(
    devtool: DevToolWithDiagnosticsType,
    severity: DiagnosticSeverity,
  ): void,
  onToolLogsClick(devtool: DevToolWithDiagnosticsType): void,
  onToolSettingsClick(devtool: DevToolWithDiagnosticsType): void,
} {
  return {
    onToolSettingsClick: (devtool: DevToolWithDiagnosticsType) => {
      if (devtool.state === "running") {
        renderControlPanel(devtool.plan);
      } else {
        dispatch(runTask(devtool.plan, { type: "local" }));
        renderControlPanel(devtool.plan);
      }
    },
    onToolLogsClick: (devtool: DevToolWithDiagnosticsType) => {
      if (devtool.state === "running") {
        renderControlPanel(devtool.plan);
      } else {
        dispatch(runTask(devtool.plan, { type: "local" }));
        renderControlPanel(devtool.plan);
      }
    },
    onToolDiagnosticsClick: (
      devtool: DevToolWithDiagnosticsType,
      // eslint-disable-next-line no-unused-vars
      severity: DiagnosticSeverity,
    ) => {
      if (devtool.state === "running") {
        renderControlPanel(devtool.plan);
      } else {
        dispatch(runTask(devtool.plan, { type: "local" }));
        renderControlPanel(devtool.plan);
      }
    },
  };
}

export const Connecter = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(Connecter)(DevToolsWithDiagnostics);
