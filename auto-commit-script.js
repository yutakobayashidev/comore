#! /usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";

// 簡単なログ関数
function log(message) {
    if (process.env.DEBUG_CLAUDE_CODE_HOOK) {
        console.log(`[DEBUG] ${message}`);
    }
}

/**
 * JSONLファイルを解析してClaude Codeセッション情報を抽出
 */
function analyzeClaudeCodeSession(lines) {
    log(`Analyzing ${lines.length} lines`);
    
    const entries = [];
    for (let i = 0; i < lines.length; i++) {
        try {
            const parsed = JSON.parse(lines[i]);
            entries.push(parsed);
        } catch (error) {
            log(`Failed to parse line ${i + 1}: ${error.message}`);
            // 無効な行はスキップして続行
            continue;
        }
    }
    
    if (entries.length === 0) {
        throw new Error('No valid entries found in transcript');
    }
    
    // セッション基本情報
    const firstEntry = entries[0];
    const lastEntry = entries[entries.length - 1];
    
    const sessionInfo = {
        sessionId: firstEntry.sessionId || 'unknown',
        startTime: new Date(firstEntry.timestamp || Date.now()),
        endTime: new Date(lastEntry.timestamp || Date.now()),
        workingDirectory: firstEntry.cwd || process.cwd(),
        version: firstEntry.version || 'unknown'
    };
    
    // エントリータイプ別の統計
    const stats = {
        user: 0,
        assistant: 0,
        system: 0
    };
    
    entries.forEach(entry => {
        if (stats.hasOwnProperty(entry.type)) {
            stats[entry.type]++;
        }
    });
    
    // ユーザーの最初のリクエストを取得
    const firstUserEntry = entries.find(entry => 
        entry.type === 'user' && 
        entry.message?.content && 
        typeof entry.message.content === 'string'
    );
    
    // 変更されたファイルを抽出
    const modifiedFiles = new Set();
    let toolCalls = 0;
    
    entries.forEach(entry => {
        if (entry.type === 'assistant' && entry.message?.content) {
            const content = entry.message.content;
            if (Array.isArray(content)) {
                content.forEach(block => {
                    if (block.type === 'tool_use') {
                        toolCalls++;
                        
                        // ファイル操作を検出
                        if (block.name === 'Edit' && block.input?.file_path) {
                            const fileName = path.basename(block.input.file_path);
                            modifiedFiles.add(fileName);
                        }
                    }
                });
            }
        }
        
        // システムメッセージからファイル変更を検出
        if (entry.type === 'system' && entry.content) {
            const content = entry.content;
            if (content.includes('has been updated') || content.includes('completed successfully')) {
                const filePathMatch = content.match(/\/[\w\/.-]+\.[\w]+/g);
                if (filePathMatch) {
                    filePathMatch.forEach(filePath => {
                        const fileName = path.basename(filePath);
                        modifiedFiles.add(fileName);
                    });
                }
            }
        }
    });
    
    const duration = Math.round((sessionInfo.endTime - sessionInfo.startTime) / 1000 / 60 * 10) / 10;
    
    return {
        sessionInfo,
        stats,
        firstUserRequest: firstUserEntry?.message?.content || '',
        modifiedFiles: Array.from(modifiedFiles),
        toolCalls,
        duration
    };
}

/**
 * コミットメッセージを生成
 */
function generateCommitMessage(analysis) {
    const { sessionInfo, stats, firstUserRequest, modifiedFiles, toolCalls, duration } = analysis;
    
    // メインタイトル
    let title = 'Claude Code: ';
    if (firstUserRequest) {
        if (firstUserRequest.length > 50) {
            title += firstUserRequest.substring(0, 47) + '...';
        } else {
            title += firstUserRequest;
        }
    } else {
        title += 'Automated code changes';
    }
    
    // 詳細情報
    const details = [
        '',
        `Claude Code Session: ${sessionInfo.sessionId.substring(0, 8)}`,
        `Timestamp: ${sessionInfo.startTime.toISOString().replace('T', ' ').substring(0, 19)}`,
        `Duration: ${duration} minutes`,
        '',
        'What changed:'
    ];
    
    // 変更されたファイルを追加
    if (modifiedFiles.length > 0) {
        modifiedFiles.forEach(file => {
            details.push(`• Modified: ${file}`);
        });
    } else {
        details.push('• No specific files detected in logs');
    }
    
    details.push('');
    details.push(`Activity: ${stats.user} user messages, ${stats.assistant} assistant responses, ${toolCalls} tool calls`);
    
    return title + '\n' + details.join('\n');
}

/**
 * Gitリポジトリかどうかをチェック
 */
function isGitRepository(cwd) {
    try {
        execFileSync('git', ['rev-parse', '--git-dir'], { 
            cwd, 
            stdio: 'pipe' 
        });
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * 変更があるかどうかをチェック
 */
function hasChanges(cwd) {
    try {
        const result = execFileSync('git', ['status', '--porcelain'], { 
            cwd, 
            encoding: 'utf8' 
        });
        return result.trim().length > 0;
    } catch (error) {
        return false;
    }
}

/**
 * 自動コミットを実行
 */
function performAutoCommit(cwd, commitMessage) {
    try {
        // すべての変更をステージング
        execFileSync('git', ['add', '.'], { cwd });
        
        // Claude用の設定でコミット実行（pre-commitフックをスキップ）
        execFileSync('git', [
            'commit', 
            '-m', commitMessage,
            '--author=Claude <noreply@anthropic.com>',
            '--no-verify'  // pre-commitフックをスキップ
        ], { 
            cwd,
            stdio: 'pipe',
            env: {
                ...process.env,
                GIT_COMMITTER_NAME: 'Claude',
                GIT_COMMITTER_EMAIL: 'noreply@anthropic.com'
            }
        });
        
        console.log('✅ Auto-commit successful');
        console.log('📝 Commit message:');
        console.log(commitMessage.split('\n')[0]);
        
    } catch (error) {
        console.log('❌ Auto-commit failed:', error.message);
        throw error;
    }
}

// メイン処理
try {
    log('Starting main process');
    
    // 標準入力からデータを読み取り
    let input;
    try {
        const inputData = readFileSync(process.stdin.fd, 'utf8');
        log(`Input data: ${inputData.substring(0, 100)}...`);
        input = JSON.parse(inputData);
    } catch (error) {
        log(`Failed to parse input: ${error.message}`);
        console.log('Failed to parse input data');
        process.exit(1);
    }
    
    if (!input.transcript_path) {
        log('No transcript path provided');
        console.log('No transcript path provided');
        process.exit(0);
    }

    const homeDir = os.homedir();
    let transcriptPath = input.transcript_path;
    
    // チルダ展開
    if (transcriptPath.startsWith('~/')) {
        transcriptPath = path.join(homeDir, transcriptPath.slice(2));
    }

    // セキュリティチェック
    const allowedBase = path.join(homeDir, '.claude', 'projects');
    const resolvedPath = path.resolve(transcriptPath);
    
    if (!resolvedPath.startsWith(allowedBase)) {
        log('Transcript path not in allowed directory');
        console.log('Transcript path not in allowed directory');
        process.exit(1);
    }

    if (!existsSync(resolvedPath)) {
        log('Transcript file does not exist');
        console.log('Hook execution failed: Transcript file does not exist');
        process.exit(0);
    }

    // トランスクリプトファイルを読み取り
    const fileContent = readFileSync(resolvedPath, "utf-8");
    const lines = fileContent
        .split("\n")
        .filter(line => line.trim());
        
    if (lines.length === 0) {
        log('Transcript file is empty');
        console.log('Hook execution failed: Transcript file is empty');
        process.exit(0);
    }

    // JSONLファイルを解析
    const analysis = analyzeClaudeCodeSession(lines);
    const workingDirectory = analysis.sessionInfo.workingDirectory;
    
    // Gitリポジトリチェック
    if (!isGitRepository(workingDirectory)) {
        log('Not a git repository');
        console.log('Not a git repository, skipping auto-commit');
        process.exit(0);
    }
    
    // 変更があるかチェック
    if (!hasChanges(workingDirectory)) {
        log('No changes detected');
        console.log('No changes detected, skipping auto-commit');
        process.exit(0);
    }
    
    // コミットメッセージ生成
    const commitMessage = generateCommitMessage(analysis);
    
    // 自動コミット実行
    performAutoCommit(workingDirectory, commitMessage);
    
    // デバッグ情報（必要に応じて）
    if (process.env.DEBUG_CLAUDE_CODE_HOOK) {
        console.log('\n📊 Session Analysis:');
        console.log(`- Duration: ${analysis.duration} minutes`);
        console.log(`- Modified files: ${analysis.modifiedFiles.length}`);
        console.log(`- Tool calls: ${analysis.toolCalls}`);
        console.log(`- Working directory: ${workingDirectory}`);
    }
    
    log('Main process completed successfully');

} catch (error) {
    log(`Main process failed: ${error.message}`);
    console.log('Hook execution failed:', error.message);
    if (process.env.DEBUG_CLAUDE_CODE_HOOK) {
        console.error(error);
    }
    process.exit(1);
}