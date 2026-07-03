/**
 * lingshu upgrade [options]
 *
 *   --dry-run     仅打印将要执行的迁移动作，不写盘
 *   --force       即使检测到风险也继续（如 package.json 含业务依赖）
 *
 * 迁移路径：
 *   - v0.2.x → v0.3   零侵入结构（删 .lingshu、瘦 package.json、注入 frontmatter…）
 *   - v0.3.0 → v0.3.1 工作流瘦身（删 reference/management/ 四件套、建 decisions/）
 *
 * 灵枢 1.0（规则散落在产物、无 reference/rules 真源）无法无损自动迁移，仅给出手动指引。
 */

import { existsSync, readFileSync, writeFileSync, rmSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from '../utils/args.mjs';
import { log, c } from '../utils/log.mjs';
import { distribute, isLingshuProject } from '../core/adapters.mjs';
import { installHooks } from '../core/hooks.mjs';

/** 探测当前项目的灵枢结构版本 */
function detectVersion(root) {
  const hasEngine = existsSync(join(root, '.lingshu/config/adapters.mjs'));
  const hasRules = existsSync(join(root, 'reference/rules'));
  if (hasRules && !hasEngine) return 'v0.3';        // 已零侵入
  if (hasRules && hasEngine) return 'v0.2';          // 旧引擎 + 真源
  // 无 reference/rules：可能是 1.0（规则散落产物）或非灵枢项目
  const hasLegacyProducts = ['.cursor/rules', '.trae/rules', '.qoder/rules', '.agent/rules']
    .some((p) => existsSync(join(root, p)));
  if (hasLegacyProducts) return 'v1.0';
  return 'unknown';
}

/** 是否已带 frontmatter（以 --- 开头） */
function hasFrontmatter(content) {
  return /^---\r?\n/.test(content);
}

/** ADR 目录 README（内嵌，避免依赖模板路径；与模板保持一致，技术中立） */
function decisionsReadme() {
  return `# Architectural Decision Records (ADR)

> 记录本仓库**架构级决策**的目录，**可选**——只在需要时创建条目。

## 何时写 ADR

- 架构级技术选型
- 数据库 Schema / Migration 决策
- 破坏性 API 变更
- 跨仓协议变更
- 事故复盘的关键决策链条

**日常任务不写 ADR**——决策链条走 Git commit message 与 PR 描述即可。

## 命名与格式

- 文件名：\`ADR-NNNN-<slug>.md\`（例：\`ADR-0001-<slug>.md\`）
- 编号连续递增，不跳号；被 Superseded 的条目保留原文件不删。
- 建议章节：**Context** / **Decision** / **Consequences** / **Alternatives**
- 参考：<https://adr.github.io/>

## 状态字段（frontmatter 建议）

\`\`\`yaml
---
adr: 0001
title: <决策标题>
status: Accepted   # Proposed | Accepted | Superseded | Deprecated
date: YYYY-MM-DD
supersedes: null
superseded_by: null
---
\`\`\`

## 与 Git / PR 的分工

- **一次编辑背后的"为什么"** → PR 描述
- **一个决策背后的"权衡"** → ADR（跨越多次编辑，可被后来的决策 Supersede）
`;
}

/** v0.3 结构下是否需要 slim（工作流瘦身）迁移 */
function needsSlimMigration(root) {
  return existsSync(join(root, 'reference/management'))
      || !existsSync(join(root, 'reference/decisions'));
}

/** 判定 management/ 子目录是否可视为"空"（无内容或仅有 README.md/占位文件） */
function isSubdirEmpty(subPath) {
  if (!existsSync(subPath)) return true;
  const items = readdirSync(subPath).filter((f) => f !== 'README.md');
  return items.length === 0;
}

/**
 * 规划 v0.3.0 → v0.3.1 迁移动作。
 * 返回 { actions, warnings, willDelete, createDecisions, staleRules }
 */
function planSlimMigration(root) {
  const mgmtDir = join(root, 'reference/management');
  const decisionsDir = join(root, 'reference/decisions');
  const rulesDir = join(root, 'reference/rules');

  const actions = [];
  const warnings = [];
  const willDelete = [];
  let createDecisions = false;

  if (existsSync(mgmtDir)) {
    let allEmpty = true;
    const subs = readdirSync(mgmtDir);
    for (const sub of subs) {
      const subPath = join(mgmtDir, sub);
      if (isSubdirEmpty(subPath)) {
        actions.push(`删除空目录 reference/management/${sub}/`);
        willDelete.push(subPath);
      } else {
        allEmpty = false;
        warnings.push(
          `reference/management/${sub}/ 含用户内容，已保留；建议评估是否迁移至 reference/decisions/（ADR）`,
        );
      }
    }
    if (allEmpty) {
      actions.push('删除空的 reference/management/');
      willDelete.push(mgmtDir);
    }
  }

  if (!existsSync(decisionsDir)) {
    actions.push('新建 reference/decisions/README.md（ADR 说明）');
    createDecisions = true;
  }

  // 规则真源含旧措辞时给出手动指引（不改动，规则真源属项目自主内容）
  const staleRules = [];
  if (existsSync(rulesDir)) {
    for (const f of readdirSync(rulesDir).filter((n) => n.endsWith('.md'))) {
      const txt = readFileSync(join(rulesDir, f), 'utf8');
      if (
        txt.includes('自动化归档守卫')
        || txt.includes('强制存档 (CRITICAL)')
        || txt.includes('reference/management/')
      ) {
        staleRules.push(`reference/rules/${f}`);
      }
    }
  }

  return { actions, warnings, willDelete, createDecisions, staleRules };
}

/** 序列化 frontmatter（与引擎一致的 YAML 子集） */
function renderFrontmatter(meta) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(meta)) lines.push(`${k}: ${v}`);
  lines.push('---', '');
  return lines.join('\n');
}

export default async function upgrade({ args }) {
  const { flags } = parseArgs(args, { booleanFlags: ['dry-run', 'force'] });
  const dryRun = !!flags['dry-run'];
  const root = process.cwd();

  log.banner('灵枢项目升级（→ v0.3 零侵入）');

  const version = detectVersion(root);

  if (version === 'unknown') {
    throw new Error('当前目录不是灵枢项目（既无 reference/rules/，也无可识别的工具产物）');
  }

  if (version === 'v0.3') {
    // v0.3.0 → v0.3.1 工作流瘦身
    if (!needsSlimMigration(root)) {
      log.ok('当前已是 v0.3.1 零仪式结构，无需迁移');
      return;
    }
    log.hint(`检测到结构版本: ${c.bold('v0.3.0')}（含 reference/management/ 四件套）`);
    log.hint('将迁移到 v0.3.1（工作流瘦身：management → decisions/ADR）');
    log.blank();

    const plan = planSlimMigration(root);
    console.log(c.cyan('将执行以下迁移动作：'));
    for (const a of plan.actions) console.log(`  • ${a}`);
    log.blank();

    if (dryRun) {
      log.ok('dry-run：以上动作未执行');
      if (plan.warnings.length) { log.blank(); for (const w of plan.warnings) log.warn(w); }
      if (plan.staleRules.length) {
        log.blank();
        log.warn('以下规则真源仍含旧措辞（自动化归档守卫 / CRITICAL / reference/management/）：');
        for (const f of plan.staleRules) log.hint(`  - ${f}`);
        log.hint('  建议手动更新真源；本命令不改写用户规则内容。');
      }
      return;
    }

    for (const p of plan.willDelete) rmSync(p, { recursive: true, force: true });
    if (plan.createDecisions) {
      const decisionsDir = join(root, 'reference/decisions');
      mkdirSync(decisionsDir, { recursive: true });
      writeFileSync(join(decisionsDir, 'README.md'), decisionsReadme(), 'utf8');
    }

    log.blank();
    log.ok('迁移完成（v0.3.0 → v0.3.1，工作流瘦身）');
    if (plan.warnings.length) { log.blank(); for (const w of plan.warnings) log.warn(w); }
    if (plan.staleRules.length) {
      log.blank();
      log.warn('以下规则真源仍含旧措辞（自动化归档守卫 / CRITICAL / reference/management/）：');
      for (const f of plan.staleRules) log.hint(`  - ${f}`);
      log.hint('  建议手动更新真源；本命令不改写用户规则内容。');
    }
    return;
  }

  if (version === 'v1.0') {
    log.warn('检测到灵枢 1.0 结构（规则直接写在产物中，无 reference/rules/ 真源）');
    log.blank();
    log.hint('1.0 无单一真源，无法无损自动迁移。建议手动迁移：');
    log.hint('  1) 新建 reference/rules/lingshu-core.md 与 ai-behavior.md');
    log.hint('  2) 把 .cursor/rules/*.mdc（或 .agent/rules）的规则正文整理进上述真源');
    log.hint('  3) 删除散落的旧产物，运行 `lingshu sync --all` 由真源统一重生成');
    log.hint('  4) 完成后再次运行 `lingshu upgrade` 校验');
    process.exit(1);
  }

  // ===== v0.2 → v0.3 机械迁移 =====
  const actions = [];           // 待执行动作（用于 dry-run 展示）
  const warnings = [];

  // 1. 读取旧 adapters.mjs：取 sources 顺序 + cursor frontmatter + baseline
  const cfgPath = join(root, '.lingshu/config/adapters.mjs');
  let oldSources = [];
  let cursorFm = {};
  try {
    const mod = await import(pathToFileURL(cfgPath).href);
    oldSources = mod.sources ?? [];
    cursorFm = mod.adapters?.cursor?.frontmatter ?? {};
  } catch (e) {
    warnings.push(`读取旧 adapters.mjs 失败（将用默认 frontmatter）: ${e.message}`);
  }

  // 2. 为缺 frontmatter 的规则文件注入（仅 order，其余字段回归引擎默认；
  //    自 v0.3.1 起 frontmatter 精简为只含 order，旧 cursor 元信息不再迁入）
  const rulesDir = join(root, 'reference/rules');
  const ruleFiles = existsSync(rulesDir)
    ? readdirSync(rulesDir).filter((f) => f.endsWith('.md'))
    : [];
  const fmInjections = [];
  for (const file of ruleFiles) {
    const name = file.replace(/\.md$/, '');
    const full = join(rulesDir, file);
    const content = readFileSync(full, 'utf8');
    if (hasFrontmatter(content)) continue;
    const idx = oldSources.findIndex((s) => s.name === name);
    const meta = {
      order: idx >= 0 ? idx + 1 : 99,
    };
    fmInjections.push({ full, file, meta, body: content });
    actions.push(`注入 frontmatter → reference/rules/${file}`);
  }
  // cursorFm 在此路径下不再使用（旧字段 description/globs/trigger 由引擎默认承担）
  void cursorFm;

  // 3. 删除 .lingshu/
  actions.push('删除 .lingshu/');

  // 4. package.json：仅当是同步脚手架才删；含业务依赖则瘦身并保留
  const pkgPath = join(root, 'package.json');
  let pkgAction = null;
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      const isScaffold = typeof pkg.scripts?.sync === 'string'
        && pkg.scripts.sync.includes('.lingshu/scripts');
      const hasDeps = pkg.dependencies && Object.keys(pkg.dependencies).length > 0;
      const hasDevDeps = pkg.devDependencies && Object.keys(pkg.devDependencies).length > 0;
      if (isScaffold && !hasDeps && !hasDevDeps) {
        pkgAction = { type: 'delete' };
        actions.push('删除 package.json（纯同步脚手架）');
      } else if (isScaffold) {
        pkgAction = { type: 'trim', pkg };
        actions.push('瘦身 package.json（移除 lingshu 同步脚本，保留业务字段）');
        warnings.push('package.json 含业务依赖，已保留并仅移除 lingshu 脚本');
      } else {
        warnings.push('package.json 非灵枢脚手架，未改动（请自行确认）');
      }
    } catch {
      warnings.push('package.json 解析失败，未改动');
    }
  }

  // 5. CI 工作流改造
  const ciPath = join(root, '.github/workflows/rules-consistency.yml');
  let ciNew = null;
  if (existsSync(ciPath)) {
    const ci = readFileSync(ciPath, 'utf8');
    const patched = ci
      .replace(/node \.lingshu\/scripts\/sync-rules\.mjs --check --baseline/g, 'npx -y @ruobai/lingshu sync --check --baseline')
      .replace(/node \.lingshu\/scripts\/doctor\.mjs/g, 'npx -y @ruobai/lingshu doctor')
      .replace(/^[ \t]*-[ \t]*'\.lingshu\/\*\*'[ \t]*\r?\n/gm, '');
    if (patched !== ci) {
      ciNew = patched;
      actions.push('改造 .github/workflows/rules-consistency.yml（npx 调用全局 CLI）');
    }
  }

  // 6. 重装 hooks（覆盖旧的引用 .lingshu/scripts 的 post-merge）
  if (existsSync(join(root, '.git'))) actions.push('重装 git hooks（post-merge → lingshu sync）');

  // 7. 重生成基线产物
  actions.push('重新生成基线产物（lingshu sync --baseline）');

  // 8. 扫描规则正文/README 中遗留的旧引擎引用（仅告警，不改写）
  const staleRefs = [];
  for (const file of ruleFiles) {
    const txt = readFileSync(join(rulesDir, file), 'utf8');
    if (txt.includes('.lingshu/scripts') || txt.includes('npm run sync')) {
      staleRefs.push(`reference/rules/${file}`);
    }
  }
  if (existsSync(join(root, 'README.md'))) {
    const txt = readFileSync(join(root, 'README.md'), 'utf8');
    if (txt.includes('.lingshu/') || txt.includes('npm run sync')) staleRefs.push('README.md');
  }

  // ---- 展示 / 执行 ----
  log.hint(`检测到结构版本: ${c.bold('v0.2')}`);
  log.blank();
  console.log(c.cyan('将执行以下迁移动作：'));
  for (const a of actions) console.log(`  • ${a}`);
  log.blank();

  if (dryRun) {
    log.ok('dry-run：以上动作未执行');
    if (warnings.length) { log.blank(); for (const w of warnings) log.warn(w); }
    return;
  }

  // 执行
  for (const { full, meta, body } of fmInjections) {
    writeFileSync(full, renderFrontmatter(meta) + body, 'utf8');
  }
  rmSync(join(root, '.lingshu'), { recursive: true, force: true });
  if (pkgAction?.type === 'delete') {
    rmSync(pkgPath, { force: true });
  } else if (pkgAction?.type === 'trim') {
    const pkg = pkgAction.pkg;
    for (const k of ['sync', 'sync:check', 'sync:baseline', 'doctor', 'hooks:install', 'postinstall']) {
      delete pkg.scripts?.[k];
    }
    if (pkg.scripts && Object.keys(pkg.scripts).length === 0) delete pkg.scripts;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }
  if (ciNew !== null) writeFileSync(ciPath, ciNew, 'utf8');
  if (existsSync(join(root, '.git'))) installHooks(root);

  // 重生成产物（此时 .lingshu 已删除，引擎走零配置）
  if (!isLingshuProject(root)) {
    throw new Error('迁移后未找到 reference/rules/，请检查项目结构');
  }
  const result = distribute({ projectRoot: root, baselineOnly: true });

  log.blank();
  log.ok(`迁移完成（重生成 ${result.written.length} 个基线产物）`);
  if (warnings.length) { log.blank(); for (const w of warnings) log.warn(w); }
  if (staleRefs.length) {
    log.blank();
    log.warn('以下文件正文仍引用旧引擎（.lingshu/scripts 或 npm run sync），请手动更新：');
    for (const f of staleRefs) log.hint(`  - ${f}`);
  }
  log.blank();
  log.hint('建议运行 `lingshu doctor` 与 `lingshu sync --check --baseline` 校验');
}
