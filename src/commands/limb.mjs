/**
 * lingshu limb <subcmd>
 *
 *   list                        列出当前所有肢体仓
 *   add <name> <git-url>        克隆肢体仓到 <name>/
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { log, c } from '../utils/log.mjs';
import { gitClone, isGitRepo } from '../core/git.mjs';

const LIMB_PATTERNS = [
  /-server$/, /-ui$/, /-web$/, /-app$/,
  /-backend$/, /-frontend$/, /-mobile$/,
];

function looksLikeLimb(name) {
  return LIMB_PATTERNS.some(re => re.test(name));
}

export default async function limb({ args }) {
  const [sub, ...rest] = args;
  const root = process.cwd();

  if (!sub || sub === 'list') return list(root);
  if (sub === 'add') return add(root, rest);

  log.error(`未知子命令: ${sub}`);
  log.hint('可用: list | add <name> <git-url>');
  process.exit(1);
}

function list(root) {
  log.banner('肢体仓清单');
  const items = readdirSync(root)
    .filter(n => !n.startsWith('.') && statSync(join(root, n)).isDirectory())
    .filter(n => looksLikeLimb(n));

  if (items.length === 0) {
    log.hint('当前未发现肢体仓');
    log.hint('添加: lingshu limb add <name> <git-url>');
    return;
  }

  for (const name of items) {
    const fullPath = join(root, name);
    const isRepo = isGitRepo(fullPath);
    const tag = isRepo ? c.green('[repo]') : c.yellow('[dir] ');
    console.log(`  ${tag} ${c.bold(name)}`);
  }
  log.blank();
}

function add(root, [name, url]) {
  if (!name || !url) {
    log.error('用法: lingshu limb add <name> <git-url>');
    process.exit(1);
  }
  if (!looksLikeLimb(name)) {
    log.warn(`目录名 "${name}" 不符合肢体仓命名约定（*-server / *-ui / *-app 等）`);
  }
  const target = join(root, name);
  if (existsSync(target)) {
    log.error(`目录已存在: ${name}`);
    process.exit(1);
  }
  log.banner(`克隆肢体仓: ${name}`);
  log.hint(`远程: ${url}`);
  gitClone(url, target);
  log.ok(`已克隆到 ${name}/`);
}
