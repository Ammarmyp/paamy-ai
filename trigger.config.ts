import "dotenv/config";
import { defineConfig } from "@trigger.dev/sdk";

const project = process.env.TRIGGER_PROJECT_REF;

if (!project) {
  throw new Error(
    "TRIGGER_PROJECT_REF is not set. Add it to your .env (see .env.example).",
  );
}

export default defineConfig({
  project,
  runtime: "node-24",
  logLevel: "log",
  // The max compute seconds a task is allowed to run. If the task run exceeds this duration, it will be stopped.
  // You can override this on an individual task.
  // See https://trigger.dev/docs/runs/max-duration
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./src/trigger"],
});
