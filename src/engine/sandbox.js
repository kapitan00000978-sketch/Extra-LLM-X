/**
 * Extra LLM X - Code Execution Sandbox Engine
 * Safely runs Python and JavaScript code snippets in isolated child processes
 * with execution timeouts and output buffer caps.
 */
import { spawn } from 'child_process';

export class CodeSandboxEngine {
  /**
   * Execute code snippet in a sandbox process
   * @param {Object} options
   * @param {'python'|'javascript'} options.language
   * @param {string} options.code
   * @param {number} [options.timeoutMs=5000]
   * @returns {Promise<{success: boolean, stdout: string, stderr: string, exitCode: number, durationMs: number}>}
   */
  static async execute({ language, code, timeoutMs = 5000 }) {
    const startTime = Date.now();

    if (!code || typeof code !== 'string') {
      return {
        success: false,
        stdout: '',
        stderr: 'Code snippet must be a non-empty string',
        exitCode: 1,
        durationMs: 0
      };
    }

    const lang = (language || 'javascript').toLowerCase();
    let command;
    let args;

    if (lang === 'python' || lang === 'py') {
      command = process.platform === 'win32' ? 'python' : 'python3';
      args = ['-c', code];
    } else if (lang === 'javascript' || lang === 'js' || lang === 'node') {
      command = 'node';
      args = ['-e', code];
    } else {
      return {
        success: false,
        stdout: '',
        stderr: `Unsupported sandbox language: ${language}. Supported: python, javascript`,
        exitCode: 1,
        durationMs: 0
      };
    }

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const proc = spawn(command, args, {
        windowsHide: true,
        timeout: timeoutMs
      });

      const timer = setTimeout(() => {
        timedOut = true;
        try { proc.kill('SIGKILL'); } catch { /* ignore */ }
      }, timeoutMs);

      proc.stdout.on('data', (chunk) => {
        if (stdout.length < 500000) {
          stdout += chunk.toString();
        }
      });

      proc.stderr.on('data', (chunk) => {
        if (stderr.length < 100000) {
          stderr += chunk.toString();
        }
      });

      proc.on('close', (code) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;
        if (timedOut) {
          resolve({
            success: false,
            stdout,
            stderr: `Execution timed out after ${timeoutMs}ms`,
            exitCode: -1,
            durationMs
          });
        } else {
          resolve({
            success: code === 0,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode: code ?? 0,
            durationMs
          });
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          success: false,
          stdout,
          stderr: `Process execution error: ${err.message}`,
          exitCode: 1,
          durationMs: Date.now() - startTime
        });
      });
    });
  }
}
