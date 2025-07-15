#! /usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";

// Simple logging function
function log(message) {
  if (process.env.DEBUG_CLAUDE_CODE_HOOK) {
    console.log(`[DEBUG] ${message}`);
  }
}

/**
 * Parse JSONL file and extract Claude Code session information
 */
function analyzeClaudeCodeSession(lines) {
  log(`Analyzing ${lines.length} lines from transcript`);

  const entries = [];
  for (let i = 0; i < lines.length; i++) {
    try {
      const parsed = JSON.parse(lines[i]);
      entries.push(parsed);
    } catch (error) {
      // Skip invalid lines and continue
      continue;
    }
  }

  if (entries.length === 0) {
    throw new Error("No valid entries found in transcript");
  }

  // Basic session information
  const firstEntry = entries[0];
  const lastEntry = entries[entries.length - 1];

  const sessionInfo = {
    sessionId: firstEntry.sessionId || "unknown",
    startTime: new Date(firstEntry.timestamp || Date.now()),
    endTime: new Date(lastEntry.timestamp || Date.now()),
    workingDirectory: firstEntry.cwd || process.cwd(),
    version: firstEntry.version || "unknown",
  };

  // Statistics by entry type
  const stats = {
    user: 0,
    assistant: 0,
    system: 0,
  };

  entries.forEach((entry) => {
    if (stats.hasOwnProperty(entry.type)) {
      stats[entry.type]++;
    }
  });

  // Get the first user request
  const firstUserEntry = entries.find(
    (entry) =>
      entry.type === "user" &&
      entry.message?.content &&
      typeof entry.message.content === "string",
  );

  // Extract modified files
  const modifiedFiles = new Set();
  let toolCalls = 0;

  entries.forEach((entry) => {
    if (entry.type === "assistant" && entry.message?.content) {
      const content = entry.message.content;
      if (Array.isArray(content)) {
        content.forEach((block) => {
          if (block.type === "tool_use") {
            toolCalls++;

            // Detect file operations
            if (block.name === "Edit" && block.input?.file_path) {
              const fileName = path.basename(block.input.file_path);
              modifiedFiles.add(fileName);
            }
          }
        });
      }
    }

    // Detect file changes from system messages
    if (entry.type === "system" && entry.content) {
      const content = entry.content;
      if (
        content.includes("has been updated") ||
        content.includes("completed successfully")
      ) {
        const filePathMatch = content.match(/\/[\w\/.-]+\.[\w]+/g);
        if (filePathMatch) {
          filePathMatch.forEach((filePath) => {
            const fileName = path.basename(filePath);
            modifiedFiles.add(fileName);
          });
        }
      }
    }
  });

  const duration =
    Math.round(
      ((sessionInfo.endTime - sessionInfo.startTime) / 1000 / 60) * 10,
    ) / 10;

  return {
    sessionInfo,
    stats,
    firstUserRequest: firstUserEntry?.message?.content || "",
    modifiedFiles: Array.from(modifiedFiles),
    toolCalls,
    duration,
  };
}

/**
 * Generate commit message
 */
function generateCommitMessage(analysis) {
  const {
    sessionInfo,
    stats,
    firstUserRequest,
    modifiedFiles,
    toolCalls,
    duration,
  } = analysis;

  // Main title
  let title = "Claude Code: ";
  if (firstUserRequest) {
    if (firstUserRequest.length > 50) {
      title += firstUserRequest.substring(0, 47) + "...";
    } else {
      title += firstUserRequest;
    }
  } else {
    title += "Automated code changes";
  }

  // Detailed information
  const details = [
    "",
    `Claude Code Session: ${sessionInfo.sessionId.substring(0, 8)}`,
    `Timestamp: ${sessionInfo.startTime.toISOString().replace("T", " ").substring(0, 19)}`,
    `Duration: ${duration} minutes`,
    "",
    "What changed:",
  ];

  // Add modified files
  if (modifiedFiles.length > 0) {
    modifiedFiles.forEach((file) => {
      details.push(`• Modified: ${file}`);
    });
  } else {
    details.push("• No specific files detected in logs");
  }

  details.push("");
  details.push(
    `Activity: ${stats.user} user messages, ${stats.assistant} assistant responses, ${toolCalls} tool calls`,
  );

  return title + "\n" + details.join("\n");
}

/**
 * Check if it's a Git repository
 */
function isGitRepository(cwd) {
  try {
    execFileSync("git", ["rev-parse", "--git-dir"], {
      cwd,
      stdio: "pipe",
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if there are changes
 */
function hasChanges(cwd) {
  try {
    const result = execFileSync("git", ["status", "--porcelain"], {
      cwd,
      encoding: "utf8",
    });
    return result.trim().length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Perform auto-commit
 */
function performAutoCommit(cwd, commitMessage) {
  try {
    // Stage all changes
    execFileSync("git", ["add", "."], { cwd });

    // Execute commit with Claude configuration (skip pre-commit hooks)
    execFileSync(
      "git",
      [
        "commit",
        "-m",
        commitMessage,
        "--author=Claude <noreply@anthropic.com>",
        "--no-verify", // Skip pre-commit hooks
      ],
      {
        cwd,
        stdio: "pipe",
        env: {
          ...process.env,
          GIT_COMMITTER_NAME: "Claude",
          GIT_COMMITTER_EMAIL: "noreply@anthropic.com",
        },
      },
    );

    if (!process.env.DEBUG_CLAUDE_CODE_HOOK) {
      console.log("✅ Auto-commit successful");
      console.log(commitMessage.split("\n")[0]);
    } else {
      log("Auto-commit completed successfully");
    }
  } catch (error) {
    if (!process.env.DEBUG_CLAUDE_CODE_HOOK) {
      console.log("❌ Auto-commit failed:", error.message);
    } else {
      log(`Auto-commit failed: ${error.message}`);
    }
    throw error;
  }
}

// Main process
try {
  log("Starting main process");

  // Read data from standard input
  let input;
  try {
    const inputData = readFileSync(process.stdin.fd, "utf8");
    input = JSON.parse(inputData);
    log("Input data parsed successfully");
  } catch (error) {
    if (process.env.DEBUG_CLAUDE_CODE_HOOK) {
      console.log(`[DEBUG] Failed to parse input: ${error.message}`);
    }
    process.exit(1);
  }

  if (!input.transcript_path) {
    log("No transcript path provided");
    process.exit(0);
  }

  const homeDir = os.homedir();
  let transcriptPath = input.transcript_path;

  // Tilde expansion
  if (transcriptPath.startsWith("~/")) {
    transcriptPath = path.join(homeDir, transcriptPath.slice(2));
  }

  // Security check
  const allowedBase = path.join(homeDir, ".claude", "projects");
  const resolvedPath = path.resolve(transcriptPath);

  if (!resolvedPath.startsWith(allowedBase)) {
    if (process.env.DEBUG_CLAUDE_CODE_HOOK) {
      console.log("[DEBUG] Transcript path not in allowed directory");
    }
    process.exit(1);
  }

  if (!existsSync(resolvedPath)) {
    log("Transcript file does not exist");
    process.exit(0);
  }

  // Read transcript file
  const fileContent = readFileSync(resolvedPath, "utf-8");
  const lines = fileContent.split("\n").filter((line) => line.trim());

  if (lines.length === 0) {
    log("Transcript file is empty");
    process.exit(0);
  }

  // Parse JSONL file
  const analysis = analyzeClaudeCodeSession(lines);
  const workingDirectory = analysis.sessionInfo.workingDirectory;

  // Git repository check
  if (!isGitRepository(workingDirectory)) {
    log("Not a git repository, skipping auto-commit");
    process.exit(0);
  }

  // Check for changes
  if (!hasChanges(workingDirectory)) {
    log("No changes detected, skipping auto-commit");
    process.exit(0);
  }

  // Generate commit message
  const commitMessage = generateCommitMessage(analysis);

  // Execute auto-commit
  performAutoCommit(workingDirectory, commitMessage);

  // Debug information (if needed)
  if (process.env.DEBUG_CLAUDE_CODE_HOOK) {
    console.log("\n📊 Session Analysis:");
    console.log(`- Duration: ${analysis.duration} minutes`);
    console.log(`- Modified files: ${analysis.modifiedFiles.length}`);
    console.log(`- Tool calls: ${analysis.toolCalls}`);
    console.log(`- Working directory: ${workingDirectory}`);
  }

  log("Main process completed successfully");
} catch (error) {
  if (process.env.DEBUG_CLAUDE_CODE_HOOK) {
    console.log(`[DEBUG] Hook execution failed: ${error.message}`);
    console.error(error);
  }
  process.exit(1);
}
