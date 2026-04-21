#!/usr/bin/env node

import { execSync } from "node:child_process";

const command = [
  "bunx",
  "turbo",
  "run",
  "build",
  "--dry=json",
  "--filter=@sidshub/web",
  "--filter=@sidshub/cms",
].join(" ");

const raw = execSync(command, {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

const startIndex = raw.indexOf("{");
if (startIndex === -1) {
  throw new Error("Unable to parse Turbo dry-run output.");
}

const payload = JSON.parse(raw.slice(startIndex));
const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];

const rows = tasks
  .filter((task) => task?.task === "build")
  .map((task) => {
    const taskId = task.taskId;
    const inputs = Object.keys(task.inputs ?? {});
    const taskEnv = task.resolvedTaskDefinition?.env ?? [];
    const inferredEnv = task.environmentVariables?.inferred?.env ?? [];

    return {
      taskId,
      inputCount: inputs.length,
      firstInputs: inputs.slice(0, 8),
      taskEnv,
      inferredEnv,
    };
  });

console.log(JSON.stringify({ command, taskCount: rows.length, rows }, null, 2));
