#!/usr/bin/env node
/**
 * 安装灵枢 Git Hooks（跨平台）
 *
 * 将 .lingshu/hooks/ 下的脚本复制到 .git/hooks/，并赋予执行权限。
 * 用法: node .lingshu/scripts/install-hooks.mjs
 */

import { copyFileSync, chmodSync, existsSync, readdirSync, mkdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../..');

const HOOKS_SRC = join(ROOT, '.lingshu/hooks');
const HOOKS_DST = join(ROOT, '.git/hooks');

if (!existsSync(join(ROOT, '.git'))) {
  console.log('ℹ️  跳过 hooks 安装：当前目录不是 git 仓库');
  process.exit(0);
}

if (!existsSync(HOOKS_SRC)) {
  console.log('ℹ️  跳过 hooks 安装：.lingshu/hooks/ 不存在');
  process.exit(0);
}

mkdirSync(HOOKS_DST, { recursive: true });

let installed = 0;
for (const hook of readdirSync(HOOKS_SRC)) {
  const src = join(HOOKS_SRC, hook);
  if (!statSync(src).isFile()) continue;
  const dst = join(HOOKS_DST, hook);
  copyFileSync(src, dst);
  try { chmodSync(dst, 0o755); } catch { /* Windows 下忽略权限错误 */ }
  console.log(`  ✓ 已安装 hook: ${hook}`);
  installed++;
}

console.log(`\n✅ 共安装 ${installed} 个 git hook\n`);
