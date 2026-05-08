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

test('init 创建完整项目结构（默认 baseline-only）', () => {
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

  // 关键回归（v0.2.3）：默认不应生成 personal 工具的产物目录
  for (const personal of [
    '.cursor/rules/lingshu-core.mdc',
    '.trae/rules/lingshu-core.md',
    '.qoder/rules/lingshu-core.md',
    '.agent/rules/lingshu-core.md',
  ]) {
    assert.ok(
      !existsSync(join(proj, personal)),
      `默认不应生成 personal 工具产物: ${personal}（应当通过 lingshu sync 或 --all-tools 明确触发）`,
    );
  }

  // package.json：name 与 description 都应被注入项目身份
  const pkg = JSON.parse(readFileSync(join(proj, 'package.json'), 'utf8'));
  assert.equal(pkg.name, 'demo-lingshu', 'package.json name 应已替换');
  assert.equal(
    pkg.description,
    'demo-lingshu — 灵枢架构项目',
    'package.json description 应被重写为项目级描述',
  );

  // CLAUDE.md 不应再含 lingshu-template
  const claude = readFileSync(join(proj, 'CLAUDE.md'), 'utf8');
  assert.ok(!claude.includes('lingshu-template'), 'CLAUDE.md 不应残留模板名');
});

test('init --all-tools 仍可生成 personal 工具产物', () => {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });

  const r = runCli([
    'init', 'all-tools-test',
    '--all-tools', '--no-git', '--no-install-hooks',
  ]);
  assert.equal(r.status, 0);

  const proj = join(TMP, 'all-tools-test');
  for (const p of [
    'CLAUDE.md',
    'AGENTS.md',
    '.cursor/rules/lingshu-core.mdc',
    '.trae/rules/lingshu-core.md',
    '.qoder/rules/lingshu-core.md',
    '.agent/rules/lingshu-core.md',
  ]) {
    assert.ok(existsSync(join(proj, p)), `--all-tools 时应生成: ${p}`);
  }
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

test('sync 默认 auto：仅同步 baseline + 已存在产物的 personal（v0.2.4 行为）', () => {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });

  // init 默认 baseline-only，不会生成 personal 工具产物
  runCli(['init', 'auto-sync', '--no-git', '--no-install-hooks']);
  const proj = join(TMP, 'auto-sync');

  // 第一次跑 lingshu sync（默认 auto）→ 不应"主动激活" personal 工具
  let r = runCli(['sync'], { cwd: proj });
  assert.equal(r.status, 0);
  for (const personal of [
    '.cursor/rules/lingshu-core.mdc',
    '.trae/rules/lingshu-core.md',
  ]) {
    assert.ok(
      !existsSync(join(proj, personal)),
      `auto 模式不应主动创建未激活的 personal 工具产物: ${personal}`,
    );
  }

  // 显式 --only=cursor 激活一次 cursor
  r = runCli(['sync', '--only=cursor'], { cwd: proj });
  assert.equal(r.status, 0);
  assert.ok(
    existsSync(join(proj, '.cursor/rules/lingshu-core.mdc')),
    '--only=cursor 之后应当生成 .cursor 产物',
  );

  // 再次 lingshu sync（auto），由于 .cursor 已存在 → 应当自动维护它
  r = runCli(['sync'], { cwd: proj });
  assert.equal(r.status, 0);
  assert.ok(
    existsSync(join(proj, '.cursor/rules/lingshu-core.mdc')),
    'auto 模式应当持续维护已激活工具',
  );
  assert.ok(
    !existsSync(join(proj, '.trae/rules/lingshu-core.md')),
    '其它未激活工具仍不应被动激活',
  );
});

test('sync --all：显式同步所有工具', () => {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });

  runCli(['init', 'all-sync', '--no-git', '--no-install-hooks']);
  const proj = join(TMP, 'all-sync');

  const r = runCli(['sync', '--all'], { cwd: proj });
  assert.equal(r.status, 0);
  for (const p of [
    '.cursor/rules/lingshu-core.mdc',
    '.trae/rules/lingshu-core.md',
    '.qoder/rules/lingshu-core.md',
    '.agent/rules/lingshu-core.md',
  ]) {
    assert.ok(existsSync(join(proj, p)), `--all 时应生成: ${p}`);
  }
});

test('limb init：创建空肢体目录 + git init', () => {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });

  runCli(['init', 'with-limbs', '--no-git', '--no-install-hooks']);
  const proj = join(TMP, 'with-limbs');

  const r = runCli(['limb', 'init', 'fresh-server'], { cwd: proj });
  assert.equal(r.status, 0);
  assert.ok(existsSync(join(proj, 'fresh-server')), '空肢体目录应已创建');
  assert.ok(
    existsSync(join(proj, 'fresh-server/.git')),
    '应在新肢体目录下完成 git init',
  );
});

test('生成项目可独立通过 sync:check --baseline', () => {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });

  runCli(['init', 'check-proj', '--no-git', '--no-install-hooks']);
  const proj = join(TMP, 'check-proj');

  // init 默认 baseline-only，所以校验也限定 baseline
  const r = spawnSync(
    process.execPath,
    ['.lingshu/scripts/sync-rules.mjs', '--check', '--baseline'],
    { cwd: proj, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } },
  );
  if (r.status !== 0) {
    console.error('CHECK STDOUT:', r.stdout);
    console.error('CHECK STDERR:', r.stderr);
  }
  assert.equal(r.status, 0, '生成项目应通过 sync:check --baseline');
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
