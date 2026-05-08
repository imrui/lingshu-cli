#!/usr/bin/env node
/**
 * 灵枢架构健康检查（跨平台）
 * 替代 .agent/workflows/self-audit.md 的 PowerShell 版本，可在 Windows / macOS / Linux 运行。
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../..');

const c = {
  green:  s => `\x1b[32m${s}\x1b[0m`,
  red:    s => `\x1b[31m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  cyan:   s => `\x1b[36m${s}\x1b[0m`,
  dim:    s => `\x1b[2m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`,
};

let errors = 0, warnings = 0;
const ok    = m => console.log(c.green(`  ✓ ${m}`));
const warn  = m => { console.log(c.yellow(`  ⚠ ${m}`)); warnings++; };
const fail  = m => { console.log(c.red  (`  ✗ ${m}`)); errors++; };

console.log(c.cyan(c.bold('\n🌀 灵枢架构健康检查\n')));

// 1. 物理完整性
console.log(c.cyan('[1/4] 物理完整性'));
const requiredDirs = [
  'reference/rules',
  'reference/docs',
  'reference/management/plans',
  'reference/management/tasks',
  'reference/management/walkthroughs',
  'reference/management/reports',
  '.lingshu/scripts',
  '.lingshu/config',
];
for (const d of requiredDirs) {
  if (existsSync(join(ROOT, d))) ok(d);
  else fail(`${d} 缺失`);
}

// 2. SSoT 真源
console.log(c.cyan('\n[2/4] SSoT 真源完整性'));
const ssotFiles = [
  'reference/rules/ai-behavior.md',
  'reference/rules/lingshu-core.md',
];
for (const f of ssotFiles) {
  if (existsSync(join(ROOT, f))) ok(f);
  else fail(`${f} 缺失`);
}

// 3. 灵枢宣言
console.log(c.cyan('\n[3/4] 灵枢宣言注入'));
const manifesto = join(ROOT, 'reference/README.md');
if (existsSync(manifesto)) {
  const txt = readFileSync(manifesto, 'utf8');
  if (txt.includes('中枢一动，全栈皆通')) ok('灵枢宣言已注入');
  else warn('reference/README.md 缺少核心宣言口号');
} else {
  fail('reference/README.md (灵枢宣言) 缺失');
}

// 4. 规则一致性提示
console.log(c.cyan('\n[4/4] 规则一致性'));
console.log(c.dim('  (调用 sync-rules --check 进行严格校验)'));
console.log(c.dim('  推荐执行: npm run sync:check\n'));

// 总结
if (errors === 0 && warnings === 0) {
  console.log(c.green(c.bold('✅ 灵枢架构健康度：优秀\n')));
} else if (errors === 0) {
  console.log(c.yellow(c.bold(`⚠️  通过，但有 ${warnings} 处提醒\n`)));
} else {
  console.log(c.red(c.bold(`❌ 失败：${errors} 处错误，${warnings} 处提醒\n`)));
  process.exit(1);
}
