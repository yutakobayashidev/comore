#! /usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";

/**
 * Parse JSONL file and extract Claude Code session information
 */
function analyzeClaudeCodeSession(lines) {
  const entries = [];
  for (let i = 0; i < lines.length; i++) {
    try {
      const parsed = JSON.parse(lines[i]);
      entries.push(parsed);
    } catch {
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
        const filePathMatch = content.match(/\/[\w/.-]+\.[\w]+/g);
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
    `Claude Code Session: ${sessionInfo.sessionId}`,
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
  } catch {
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
  } catch {
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

    console.log("✅ Auto-commit successful");
    console.log(commitMessage.split("\n")[0]);
  } catch (error) {
    console.log("❌ Auto-commit failed:", error.message);
    throw error;
  }
}

// Main process
try {
  // Read data from standard input
  let input;
  try {
    const inputData = readFileSync(process.stdin.fd, "utf8");
    input = JSON.parse(inputData);
  } catch {
    process.exit(1);
  }

  if (!input.transcript_path) {
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
    process.exit(1);
  }

  if (!existsSync(resolvedPath)) {
    process.exit(0);
  }

  // Read transcript file
  const fileContent = readFileSync(resolvedPath, "utf-8");
  const lines = fileContent.split("\n").filter((line) => line.trim());

  if (lines.length === 0) {
    process.exit(0);
  }

  // Parse JSONL file
  const analysis = analyzeClaudeCodeSession(lines);
  const workingDirectory = analysis.sessionInfo.workingDirectory;

  // Git repository check
  if (!isGitRepository(workingDirectory)) {
    process.exit(0);
  }

  // Check for changes
  if (!hasChanges(workingDirectory)) {
    process.exit(0);
  }

  // Generate commit message
  const commitMessage = generateCommitMessage(analysis);

  // Execute auto-commit
  performAutoCommit(workingDirectory, commitMessage);

  // Auto-commit completed
} catch (err) {
  console.error("Auto-commit script failed:", err);
  process.exit(1);
}
