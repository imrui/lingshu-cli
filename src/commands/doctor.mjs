/**
 * lingshu doctor
 *
 * 在当前灵枢项目目录执行健康检查。
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { log, c } from '../utils/log.mjs';

export default async function doctor() {
  const root = process.cwd();
  log.banner('灵枢架构健康检查');

  let errors = 0, warnings = 0;
  const ok    = m => console.log(c.green(`  ✓ ${m}`));
  const warn  = m => { console.log(c.yellow(`  ⚠ ${m}`)); warnings++; };
  const fail  = m => { console.log(c.red  (`  ✗ ${m}`)); errors++; };

  // 1. 物理完整性
  console.log(c.cyan('[1/3] 物理完整性'));
  const requiredDirs = [
    'reference/rules',
    'reference/docs',
    'reference/management/plans',
    'reference/management/tasks',
    'reference/management/walkthroughs',
    'reference/management/reports',
  ];
  for (const d of requiredDirs) {
    if (existsSync(join(root, d))) ok(d);
    else fail(`${d} 缺失`);
  }

  // 2. SSoT 真源
  console.log(c.cyan('\n[2/3] SSoT 真源'));
  const ssotFiles = [
    'reference/rules/ai-behavior.md',
    'reference/rules/lingshu-core.md',
  ];
  for (const f of ssotFiles) {
    if (existsSync(join(root, f))) ok(f);
    else fail(`${f} 缺失`);
  }

  // 3. 灵枢宣言
  console.log(c.cyan('\n[3/3] 灵枢宣言'));
  const manifesto = join(root, 'reference/README.md');
  if (existsSync(manifesto)) {
    const txt = readFileSync(manifesto, 'utf8');
    if (txt.includes('中枢一动，全栈皆通')) ok('灵枢宣言已注入');
    else warn('reference/README.md 缺少核心宣言口号');
  } else {
    fail('reference/README.md (灵枢宣言) 缺失');
  }

  log.blank();
  if (errors === 0 && warnings === 0) {
    log.ok('灵枢架构健康度：优秀');
  } else if (errors === 0) {
    log.warn(`通过，但有 ${warnings} 处提醒`);
  } else {
    log.error(`失败：${errors} 处错误，${warnings} 处提醒`);
    process.exit(1);
  }
  log.hint('严格规则一致性校验：lingshu sync --check');
  log.blank();
}
