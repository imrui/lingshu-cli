/**
 * Smoke 测试：验证 init 命令能产出可用项目
 *
 * 运行: node --test tests/smoke.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync, readFileSync, cpSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = resolve(__dirname, '..');
const BIN = resolve(PKG_ROOT, 'bin/lingshu.mjs');
const TMP = resolve(PKG_ROOT, '.tmp-test');

function runCli(args, opts = {}) {
  return spawnSync(process.execPath, [BIN, ...args], {
    cwd: opts.cwd ?? TMP,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
}

test('CLI 帮助', () => {
  const r = runCli(['--help'], { cwd: PKG_ROOT });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /用法/);
  assert.match(r.stdout, /init/);
});

test('CLI 版本号', () => {
  const r = runCli(['--version'], { cwd: PKG_ROOT });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^v\d+\.\d+\.\d+/);
});

test('init 创建完整项目结构', () => {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });

  const r = runCli(['init', 'demo-lingshu', '--no-git', '--no-install-hooks']);
  if (r.status !== 0) {
    console.error('STDOUT:', r.stdout);
    console.error('STDERR:', r.stderr);
  }
  assert.equal(r.status, 0, '初始化退出码应为 0');

  const proj = join(TMP, 'demo-lingshu');
  // 关键路径存在
  for (const p of [
    '.lingshu/config/adapters.mjs',
    '.lingshu/scripts/sync-rules.mjs',
    'reference/rules/lingshu-core.md',
    'reference/rules/ai-behavior.md',
    'CLAUDE.md',
    'AGENTS.md',
    'package.json',
    '.gitignore',
    '.github/workflows/rules-consistency.yml',
  ]) {
    assert.ok(existsSync(join(proj, p)), `缺失: ${p}`);
  }

  // package.json 中的项目名应被替换
  const pkg = JSON.parse(readFileSync(join(proj, 'package.json'), 'utf8'));
  assert.equal(pkg.name, 'demo-lingshu', 'package.json 名称应已替换');

  // CLAUDE.md 不应再含 lingshu-template
  const claude = readFileSync(join(proj, 'CLAUDE.md'), 'utf8');
  assert.ok(!claude.includes('lingshu-template'), 'CLAUDE.md 不应残留模板名');
});

test('init --tools 修改基线列表', () => {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });

  const r = runCli([
    'init', 'baseline-test',
    '--tools=cursor,claude-code',
    '--no-git', '--no-install-hooks',
  ]);
  assert.equal(r.status, 0);

  const adapters = readFileSync(
    join(TMP, 'baseline-test/.lingshu/config/adapters.mjs'), 'utf8'
  );
  assert.match(adapters, /baseline = \['cursor', 'claude-code'\]/);
});

test('生成项目可独立通过 sync:check', () => {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });

  runCli(['init', 'check-proj', '--no-git', '--no-install-hooks']);
  const proj = join(TMP, 'check-proj');

  const r = spawnSync(
    process.execPath,
    ['.lingshu/scripts/sync-rules.mjs', '--check'],
    { cwd: proj, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } },
  );
  if (r.status !== 0) {
    console.error('CHECK STDOUT:', r.stdout);
    console.error('CHECK STDERR:', r.stderr);
  }
  assert.equal(r.status, 0, '生成项目应通过 sync:check');
});

test('源路径含 node_modules 时模板仍能正确拷贝（回归 v0.2.1 bug）', () => {
  // 模拟 npm 全局安装：模板源路径形如
  //   /usr/lib/node_modules/@ruobai/lingshu/templates/default
  // 之前 copyTemplate filter 误用绝对路径匹配 'node_modules'，
  // 导致整个模板树被全部过滤，最终生成空目录。
  if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });

  const fakeInstall = join(TMP, 'node_modules', '@ruobai', 'lingshu');
  const templateInGlobal = join(fakeInstall, 'templates', 'default');
  cpSync(join(PKG_ROOT, 'templates/default'), templateInGlobal, { recursive: true });
  assert.ok(
    existsSync(join(templateInGlobal, '.lingshu/config/adapters.mjs')),
    'fixture 准备失败：源路径下 .lingshu/config/adapters.mjs 应存在',
  );

  const r = runCli([
    'init', 'global-install-sim',
    `--template=${templateInGlobal}`,
    '--no-git', '--no-install-hooks',
  ]);
  if (r.status !== 0) {
    console.error('STDOUT:', r.stdout);
    console.error('STDERR:', r.stderr);
  }
  assert.equal(r.status, 0, '源路径含 node_modules 时 init 不应失败');

  const proj = join(TMP, 'global-install-sim');
  assert.ok(
    existsSync(join(proj, '.lingshu/config/adapters.mjs')),
    '回归断言：模板内的 .lingshu/ 必须被拷贝，不可因祖先路径含 node_modules 而过滤',
  );
});

test.after(() => {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true });
});
