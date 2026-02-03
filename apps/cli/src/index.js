#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import axios from "axios";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { io } from "socket.io-client";
import fs from "fs/promises";

// Load .env
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Use baseUrl but fallback to localhost:2001
const API_URL = (
  process.env.HALTEST_API_URL || "http://localhost:2001/api"
).replace(/\/$/, "");
const SOCKET_URL = API_URL.replace("/api", "");

const program = new Command();

program
  .name("haltest")
  .description("CLI for HAL-TEST automation framework")
  .version("1.0.0");

// --- STATUS COMMAND ---
program
  .command("status")
  .description("Check the status of the HAL-TEST server")
  .action(async () => {
    const spinner = ora("Connecting to HAL-TEST server...").start();
    try {
      const response = await axios.get(`${API_URL}/status`);
      spinner.succeed(chalk.green("HAL-TEST Server is ONLINE"));
      console.log(chalk.gray(`URL: ${API_URL}`));
      console.log(
        chalk.cyan(`Environment: ${response.data.environment || "N/A"}`),
      );
    } catch (error) {
      spinner.fail(chalk.red("HAL-TEST Server is OFFLINE"));
      console.error(chalk.gray(`Tried: ${API_URL}`));
      console.error(chalk.red(error.message));
    }
  });

// --- LIST COMMAND ---
program
  .command("list")
  .description("List all available flows")
  .action(async () => {
    const spinner = ora("Fetching flows...").start();
    try {
      const projectsRes = await axios.get(`${API_URL}/projects`);
      spinner.succeed(chalk.blue("Available Flows:"));

      projectsRes.data.forEach((project) => {
        console.log(
          `\n📂 Project: ${chalk.bold(project.name)} ${chalk.gray(`(${project.id})`)}`,
        );
        project.flows?.forEach((flow) => {
          console.log(
            `  - ${chalk.cyan(flow.name)} ${chalk.gray(`ID: ${flow.id}`)}`,
          );
        });
      });
    } catch (error) {
      spinner.fail(chalk.red("Failed to fetch flows"));
      console.error(chalk.red(error.message));
    }
  });

// --- RUN COMMAND ---
program
  .command("run <flowId>")
  .description("Execute a flow and stream real-time logs")
  .option("-p, --project <projectId>", "Project ID", "default-project-1")
  .option(
    "-h, --headed",
    "Run with visible browser (overrides headless)",
    false,
  )
  .option("-o, --output <path>", "Save execution report to file (JSON)")
  .action(async (flowId, options) => {
    const { project: projectId, headed, output } = options;

    console.log(
      chalk.bold.blue(`\n🚀 Initializing execution for flow: ${flowId}`),
    );
    const spinner = ora("Handshaking with server...").start();

    // 1. Connect to Socket for logs
    const socket = io(SOCKET_URL);
    let currentRunId = null;

    socket.on("connect", () => {
      spinner.text = "Connected to socket, waiting for execution start...";
    });

    socket.on("execution-log", (data) => {
      const time = chalk.gray(
        `[${new Date(data.timestamp).toLocaleTimeString()}]`,
      );
      const node = data.nodeId
        ? chalk.magenta(`[${data.nodeId.split("-")[0]}]`)
        : "";

      let msg = data.message;
      if (data.type === "error") msg = chalk.red(msg);
      else if (data.type === "success") msg = chalk.green(msg);
      else if (data.type === "warning") msg = chalk.yellow(msg);

      console.log(`${time} ${node} ${msg}`);
    });

    socket.on("execution-status", (data) => {
      if (data.status === "failed") {
        console.log(
          chalk.red(
            `\n❌ Node [${data.stepId}] failed: ${data.error || "Unknown error"}`,
          ),
        );
      }
    });

    // AUTO-TERMINATE LOGIC
    socket.on("flow-finished", async (data) => {
      if (data.runId !== currentRunId) return;

      console.log(chalk.bold("\n" + "=".repeat(40)));
      console.log(
        chalk.bold(`🏁 EXECUTION FINISHED: ${data.status.toUpperCase()}`),
      );
      console.log(chalk.bold("=".repeat(40) + "\n"));

      const reportSpinner = ora("Generating final report...").start();

      try {
        // Fetch full report from API
        const runRes = await axios.get(`${API_URL}/runs/${currentRunId}`);
        const runData = runRes.data.data;
        reportSpinner.succeed("Report generated");

        // Print summary table-like info
        console.log(chalk.cyan(`Run ID:    `) + runData.id);
        console.log(
          chalk.cyan(`Duration:  `) +
            `${(runData.duration_ms / 1000).toFixed(2)}s`,
        );
        console.log(chalk.cyan(`Steps:     `) + runData.steps?.length);

        const errors =
          runData.steps?.filter((s) => s.status === "failed") || [];
        if (errors.length > 0) {
          console.log(chalk.red(`Errors:    `) + errors.length);
          errors.forEach((e) => {
            console.log(
              chalk.red(`  ! [${e.node_id}] ${e.node_type}: ${e.error}`),
            );
          });
        } else {
          console.log(chalk.green(`Errors:    0`));
        }

        // Save to file if requested
        if (output) {
          await fs.writeFile(output, JSON.stringify(runData, null, 2));
          console.log(chalk.green(`\n💾 Report saved to: ${output}`));
        }
      } catch (err) {
        reportSpinner.fail("Failed to fetch run details");
        console.error(chalk.red(err.message));
      }

      socket.disconnect();
      process.exit(data.status === "completed" ? 0 : 1);
    });

    try {
      // 2. Trigger the run
      const response = await axios.post(`${API_URL}/runs/start`, {
        flowId,
        projectId,
        overrides: {
          headless: !headed,
        },
      });

      currentRunId = response.data.runId;
      spinner.succeed(
        chalk.green(`Execution started! Run ID: ${currentRunId}`),
      );
      console.log(chalk.gray("--- Streaming Logs ---\n"));
    } catch (error) {
      spinner.fail(chalk.red("Execution failed to start"));
      socket.disconnect();
      if (error.response) {
        const backendError =
          error.response.data.message ||
          error.response.data.error ||
          error.response.statusText;
        console.error(chalk.red(`Error: ${backendError}`));
      } else {
        console.error(chalk.red(error.message));
      }
      process.exit(1);
    }
  });

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
} else {
  program.parse();
}
