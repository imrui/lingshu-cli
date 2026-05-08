/**
 * Git 操作的极简封装（基于 child_process.spawnSync）
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function isGitRepo(dir) {
  return existsSync(join(dir, '.git'));
}

export function isGitAvailable() {
  const r = spawnSync('git', ['--version'], { stdio: 'ignore' });
  return r.status === 0;
}

/**
 * 在指定目录运行 git 命令；失败时抛错。
 */
export function git(args, { cwd = process.cwd(), silent = false } = {}) {
  const r = spawnSync('git', args, {
    cwd,
    stdio: silent ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    encoding: 'utf8',
  });
  if (r.status !== 0) {
    const msg = silent ? (r.stderr || r.stdout || '') : '';
    throw new Error(`git ${args.join(' ')} 失败 (exit ${r.status}): ${msg.trim()}`);
  }
  return (r.stdout ?? '').trim();
}

/** 安静运行，返回 { ok, stdout, stderr } */
export function gitSafe(args, { cwd = process.cwd() } = {}) {
  const r = spawnSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
  return {
    ok: r.status === 0,
    stdout: (r.stdout ?? '').trim(),
    stderr: (r.stderr ?? '').trim(),
  };
}

export function gitInit(dir, { branch = 'master' } = {}) {
  git(['init', '--initial-branch', branch], { cwd: dir, silent: true });
}

export function gitClone(url, target, { depth } = {}) {
  const args = ['clone'];
  if (depth) args.push('--depth', String(depth));
  args.push(url, target);
  git(args, { silent: false });
}
