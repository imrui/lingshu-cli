/**
 * 适配器引擎：从 SSoT 真源生成各 AI 工具产物
 *
 * 设计：纯逻辑层，不直接打印日志（由 commands 层负责）。
 * 可在两种场景使用：
 *   1. 在已存在的灵枢项目目录中（运行时通过 import 该项目的 .lingshu/config/adapters.mjs）
 *   2. 在 init 阶段对模板渲染（配置作为参数传入）
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

/** 从指定项目根目录加载其 .lingshu/config/adapters.mjs */
export async function loadConfig(projectRoot) {
  const cfgPath = join(projectRoot, '.lingshu/config/adapters.mjs');
  if (!existsSync(cfgPath)) {
    throw new Error(`未找到 .lingshu/config/adapters.mjs（不是灵枢项目？）`);
  }
  const mod = await import(pathToFileURL(cfgPath).href);
  return { sources: mod.sources, adapters: mod.adapters, baseline: mod.baseline ?? [] };
}

function renderFrontmatter(meta) {
  if (!meta) return '';
  const lines = ['---'];
  for (const [k, v] of Object.entries(meta)) lines.push(`${k}: ${v}`);
  lines.push('---', '');
  return lines.join('\n');
}

function loadSource(projectRoot, srcPath) {
  const full = join(projectRoot, srcPath);
  if (!existsSync(full)) throw new Error(`SSoT 文件缺失: ${srcPath}`);
  let content = readFileSync(full, 'utf8');
  const m = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (m) content = content.slice(m[0].length);
  return content.replace(/^\s*\n+/, '');
}

/**
 * 渲染单个适配器，返回产物列表。
 * @returns {Array<{to: string, content: string}>}
 */
export function renderAdapter({ projectRoot, toolName, cfg, sources, dryRun = false }) {
  const out = [];

  if (cfg.type === 'directory') {
    const targetDir = join(projectRoot, cfg.target);
    if (existsSync(targetDir) && !dryRun) {
      for (const f of readdirSync(targetDir)) {
        const stem = f.replace(/\.(md|mdc)$/, '');
        if (sources.find(s => s.name === stem)) {
          rmSync(join(targetDir, f));
        }
      }
    }
    for (const src of sources) {
      const body = loadSource(projectRoot, src.path);
      const fm = cfg.frontmatter?.[src.name];
      const content = (fm ? renderFrontmatter(fm) : '') + body;
      const relTarget = cfg.target.replace(/\/?$/, '/') + src.name + cfg.extension;
      out.push({ to: relTarget, content });
    }
  } else if (cfg.type === 'file') {
    const parts = sources.map(src => loadSource(projectRoot, src.path));
    const sep = cfg.separator ?? '\n\n---\n\n';
    const header = cfg.header ?? '';
    const body = (header ? header + sep : '') + parts.join(sep);
    out.push({ to: cfg.target, content: body });
  } else {
    throw new Error(`未知适配器类型: ${cfg.type}`);
  }

  return out;
}

/**
 * 全量分发（写入磁盘）。
 *
 * 选取目标工具的优先级：
 *   1) tools 显式列表       — 完全按列表（--only=...）
 *   2) baselineOnly=true     — 仅 baseline（init / sync --baseline）
 *   3) all=true              — 所有 adapter（sync --all）
 *   4) 默认（auto）          — baseline 必装 + 已存在产物的 personal 工具
 *
 * 第 4 项是常态：用户首次想接入某个 personal 工具，请显式 `--only=<name>` 触发。
 * 之后该工具产物已存在，下次默认 sync 会自动维护它，不需要再传 --only。
 *
 * @param {object} options
 * @param {string}   options.projectRoot
 * @param {string[]} [options.tools]
 * @param {boolean}  [options.baselineOnly]
 * @param {boolean}  [options.all]
 * @param {boolean}  [options.check]
 */
export async function distribute({ projectRoot, tools, baselineOnly, all, check }) {
  const { sources, adapters, baseline } = await loadConfig(projectRoot);

  let targets;
  if (tools) {
    targets = tools;
  } else if (baselineOnly) {
    targets = baseline;
  } else if (all) {
    targets = Object.keys(adapters);
  } else {
    // auto：baseline + 已有产物的 personal
    targets = Object.keys(adapters).filter((name) => {
      if (baseline.includes(name)) return true;
      const cfg = adapters[name];
      const productPath = join(projectRoot, cfg.target);
      return existsSync(productPath);
    });
  }

  const result = { written: [], drifted: [], missing: [], processed: [] };

  for (const tool of targets) {
    const cfg = adapters[tool];
    if (!cfg) {
      result.processed.push({ tool, status: 'unknown' });
      continue;
    }
    const items = renderAdapter({ projectRoot, toolName: tool, cfg, sources, dryRun: !!check });
    const itemResults = [];
    for (const { to, content } of items) {
      const fullTarget = join(projectRoot, to);
      if (check) {
        if (!existsSync(fullTarget)) {
          result.missing.push(to);
          itemResults.push({ to, status: 'missing' });
        } else {
          const existing = readFileSync(fullTarget, 'utf8');
          if (existing !== content) {
            result.drifted.push(to);
            itemResults.push({ to, status: 'drifted' });
          } else {
            itemResults.push({ to, status: 'ok' });
          }
        }
      } else {
        mkdirSync(dirname(fullTarget), { recursive: true });
        writeFileSync(fullTarget, content, 'utf8');
        result.written.push(to);
        itemResults.push({ to, status: 'written' });
      }
    }
    result.processed.push({ tool, baseline: baseline.includes(tool), items: itemResults });
  }

  return result;
}
