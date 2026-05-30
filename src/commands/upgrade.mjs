/**
 * lingshu upgrade [options]
 *
 *   --dry-run     仅打印将要执行的迁移动作，不写盘
 *   --force       即使检测到风险也继续（如 package.json 含业务依赖）
 *
 * 将存量灵枢项目迁移到 v0.3 零侵入结构：
 *   - 删除 .lingshu/ 引擎目录
 *   - 删除/瘦身 package.json（仅当是同步脚手架）
 *   - 把原 adapters.mjs 中 cursor 的 frontmatter 迁入 reference/rules/*.md
 *   - 重装内置 git hooks、改造 CI、重生成基线产物
 *
 * 仅支持 v0.2.x → v0.3 的机械迁移；灵枢 1.0（规则散落在产物、无 reference/rules 真源）
 * 无法无损自动迁移，会给出明确指引。
 */

import { existsSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
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
    log.ok('当前已是 v0.3 零侵入结构，无需迁移');
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

  // 2. 为缺 frontmatter 的规则文件注入（order 按 sources 顺序，元数据取自旧 cursor 配置）
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
      name,
      description: cursorFm[name]?.description ?? `${name} 规则`,
      globs: cursorFm[name]?.globs ?? '**/*',
      trigger: cursorFm[name]?.trigger ?? 'always_on',
    };
    fmInjections.push({ full, file, meta, body: content });
    actions.push(`注入 frontmatter → reference/rules/${file}`);
  }

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
