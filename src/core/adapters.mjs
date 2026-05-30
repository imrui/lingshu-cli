/**
 * 适配器引擎（v0.3 零配置）
 *
 * 设计：纯逻辑层，不直接打印日志（由 commands 层负责）。
 *
 * 零配置约定（取代 v0.2 的 .lingshu/config/adapters.mjs）：
 *   1. adapter 定义来自内置注册表 src/core/registry.mjs
 *   2. SSoT 真源 = 约定发现 reference/rules/*.md（每个文件一个 source）
 *   3. directory 型适配器（cursor）的 frontmatter 来自规则文件自身的 frontmatter
 *   4. 合并顺序由规则文件 frontmatter 的 `order` 字段决定，缺省按文件名
 *   5. 逃生舱：存在 reference/.lingshu.json 时，可覆盖 adapters / baseline / sources
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ADAPTERS, DEFAULT_BASELINE } from './registry.mjs';

/** frontmatter 中仅供引擎使用、不输出到产物的保留字段 */
const RESERVED_META = new Set(['order']);

/** 判断目录是否为灵枢项目（约定：存在 reference/rules/） */
export function isLingshuProject(projectRoot) {
  return existsSync(join(projectRoot, 'reference/rules'));
}

/**
 * 解析项目的零配置视图：sources + adapters + baseline。
 * 不再依赖任何项目内配置文件；可选 reference/.lingshu.json 做覆盖。
 */
export function resolveProject(projectRoot) {
  if (!isLingshuProject(projectRoot)) {
    throw new Error('当前目录不是灵枢项目（未找到 reference/rules/）');
  }

  // 约定发现 reference/rules/*.md
  const rulesDir = join(projectRoot, 'reference/rules');
  const sources = readdirSync(rulesDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const name = f.replace(/\.md$/, '');
      const path = `reference/rules/${f}`;
      const { meta } = loadSource(projectRoot, path);
      const order = Number(meta.order ?? Number.POSITIVE_INFINITY);
      return { name, path, meta, order };
    })
    .sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name));

  let adapters = ADAPTERS;
  let baseline = DEFAULT_BASELINE;

  // 逃生舱：可选项目级覆盖（自定义工具 / 改基线）
  const overridePath = join(projectRoot, 'reference/.lingshu.json');
  if (existsSync(overridePath)) {
    try {
      const ov = JSON.parse(readFileSync(overridePath, 'utf8'));
      if (ov.adapters) adapters = { ...ADAPTERS, ...ov.adapters };
      if (Array.isArray(ov.baseline)) baseline = ov.baseline;
    } catch { /* 覆盖文件损坏不阻断，回退默认 */ }
  }

  return { sources, adapters, baseline };
}

/** 序列化 frontmatter（YAML 子集），跳过保留字段 */
function renderFrontmatter(meta) {
  if (!meta) return '';
  const entries = Object.entries(meta).filter(([k]) => !RESERVED_META.has(k));
  if (entries.length === 0) return '';
  const lines = ['---'];
  for (const [k, v] of entries) lines.push(`${k}: ${v}`);
  lines.push('---', '');
  return lines.join('\n');
}

/** 解析 frontmatter（YAML 子集：顶层 `key: value` 标量），保留插入顺序 */
function parseFrontmatter(raw) {
  const meta = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  return meta;
}

/** 读取 SSoT 文件，返回 { meta, body }（剥离 frontmatter，防止重复包裹） */
function loadSource(projectRoot, srcPath) {
  const full = join(projectRoot, srcPath);
  if (!existsSync(full)) throw new Error(`SSoT 文件缺失: ${srcPath}`);
  let content = readFileSync(full, 'utf8');
  let meta = {};
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (m) {
    meta = parseFrontmatter(m[1]);
    content = content.slice(m[0].length);
  }
  return { meta, body: content.replace(/^\s*\n+/, '') };
}

/**
 * 渲染单个适配器，返回产物列表。
 * @returns {Array<{to: string, content: string}>}
 */
export function renderAdapter({ projectRoot, cfg, sources, dryRun = false }) {
  const out = [];

  if (cfg.type === 'directory') {
    const targetDir = join(projectRoot, cfg.target);
    if (existsSync(targetDir) && !dryRun) {
      // 清理与 sources 同名的旧产物（保护用户自定义文件）
      for (const f of readdirSync(targetDir)) {
        const stem = f.replace(/\.(md|mdc)$/, '');
        if (sources.find((s) => s.name === stem)) {
          rmSync(join(targetDir, f));
        }
      }
    }
    for (const src of sources) {
      const { body } = loadSource(projectRoot, src.path);
      const fm = cfg.emitFrontmatter ? renderFrontmatter(src.meta) : '';
      const content = fm + body;
      const relTarget = cfg.target.replace(/\/?$/, '/') + src.name + cfg.extension;
      out.push({ to: relTarget, content });
    }
  } else if (cfg.type === 'file') {
    const parts = sources.map((src) => loadSource(projectRoot, src.path).body);
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
 *   4) 默认（auto）          — baseline 必装 + 已存在产物的其它工具
 *
 * @param {object} options
 * @param {string}   options.projectRoot
 * @param {string[]} [options.tools]
 * @param {boolean}  [options.baselineOnly]
 * @param {boolean}  [options.all]
 * @param {boolean}  [options.check]
 */
export function distribute({ projectRoot, tools, baselineOnly, all, check }) {
  const { sources, adapters, baseline } = resolveProject(projectRoot);

  let targets;
  if (tools) {
    targets = tools;
  } else if (baselineOnly) {
    targets = baseline;
  } else if (all) {
    targets = Object.keys(adapters);
  } else {
    // auto：baseline + 已存在产物的其它工具
    targets = Object.keys(adapters).filter((name) => {
      if (baseline.includes(name)) return true;
      const cfg = adapters[name];
      return existsSync(join(projectRoot, cfg.target));
    });
  }

  const result = { written: [], drifted: [], missing: [], processed: [] };

  for (const tool of targets) {
    const cfg = adapters[tool];
    if (!cfg) {
      result.processed.push({ tool, status: 'unknown' });
      continue;
    }
    const items = renderAdapter({ projectRoot, cfg, sources, dryRun: !!check });
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
