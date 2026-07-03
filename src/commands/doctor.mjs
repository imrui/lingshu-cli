/**
 * lingshu doctor
 *
 * 在当前灵枢项目目录执行健康检查。
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { log, c } from '../utils/log.mjs';

export default async function doctor() {
  const root = process.cwd();
  log.banner('架构健康检查');

  let errors = 0, warnings = 0;
  const ok    = m => console.log(c.green(`  ✓ ${m}`));
  const warn  = m => { console.log(c.yellow(`  ⚠ ${m}`)); warnings++; };
  const fail  = m => { console.log(c.red  (`  ✗ ${m}`)); errors++; };

  // 1. 物理完整性（必需目录）
  console.log(c.cyan('[1/4] 物理完整性'));
  const requiredDirs = [
    'reference/rules',
    'reference/docs',
  ];
  for (const d of requiredDirs) {
    if (existsSync(join(root, d))) ok(d);
    else fail(`${d} 缺失`);
  }
  // decisions/ 是可选目录，仅当存在时提示
  if (existsSync(join(root, 'reference/decisions'))) ok('reference/decisions（可选）');

  // 2. SSoT 真源
  console.log(c.cyan('\n[2/4] SSoT 真源'));
  const ssotFiles = [
    'reference/rules/ai-behavior.md',
    'reference/rules/lingshu-core.md',
  ];
  for (const f of ssotFiles) {
    if (existsSync(join(root, f))) ok(f);
    else fail(`${f} 缺失`);
  }

  // 3. 基线产物
  console.log(c.cyan('\n[3/4] 基线产物'));
  const baselineFiles = [
    'CLAUDE.md',
    'AGENTS.md',
  ];
  for (const f of baselineFiles) {
    if (existsSync(join(root, f))) ok(f);
    else warn(`${f} 缺失（可运行 lingshu sync --baseline 生成）`);
  }

  // 4. 可选设施
  console.log(c.cyan('\n[4/4] 可选设施'));
  if (existsSync(join(root, '.github/workflows/rules-consistency.yml'))) {
    ok('GitHub CI 一致性守护已安装');
  } else {
    console.log(c.dim('  · GitHub CI 一致性守护 未安装（可运行 `lingshu ci install` 加装）'));
  }

  log.blank();
  if (errors === 0 && warnings === 0) {
    log.ok('架构健康度：优秀');
  } else if (errors === 0) {
    log.warn(`通过，但有 ${warnings} 处提醒`);
  } else {
    log.error(`失败：${errors} 处错误，${warnings} 处提醒`);
    process.exit(1);
  }
  log.hint('严格规则一致性校验：lingshu sync --check');
  log.blank();
}
