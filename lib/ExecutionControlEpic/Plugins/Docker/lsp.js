/* eslint-disable */
const {
  createMessageConnection,
  StreamMessageReader,
  StreamMessageWriter
} = require("vscode-jsonrpc");
const {
  ConsoleLogError,
  ConsoleLogInformation
} = require("../../LanguageServerProtocolFeature/Types/standard");

const { spawn, exec } = require("child_process");
const process = require("process");
const StreamSplitter = require("stream-splitter");

const connection = createMessageConnection(
  new StreamMessageReader(process.stdin),
  new StreamMessageWriter(process.stdout)
);

let dockerCommandArgs;
if (command === "build") {
  dockerCommandArgs = ["-f", packagePath, "build", serviceName];
}
if (command === "start") {
  dockerCommandArgs = ["-f", packagePath, "up", serviceName];
}
if (command === "upload") {
  // TODO
  dockerCommandArgs = ["-f", packagePath, "push", serviceName];
}

const dockerProcess = spawn("docker-compose", dockerCommandArgs, {
  stderr: "pipe",
});
const lines = dockerProcess.stdout.pipe(StreamSplitter("\n"));

dockerProcess.on("error", err =>
  connection.sendNotification("window/logMessage", {
    type: ConsoleLogError,
    message: `Error running Docker: ${err}`,
  }),
);

lines.on("token", line =>
  connection.sendNotification("window/logMessage", {
    type: ConsoleLogInformation,
    message: line,
  }),
);

if (command === "start") {
  connection.onRequest("shutdown", () => {
    return new Promise(resolve =>
      exec(
        `docker-compose -f ${packagePath} stop ${serviceName}`,
        {},
        (err, stdout, stderr) => {
          resolve();
        },
      ),
    );
  });
}
