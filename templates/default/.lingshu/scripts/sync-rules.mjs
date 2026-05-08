#!/usr/bin/env node
/**
 * 灵枢规则分发脚本
 *
 * 用法：
 *   node .lingshu/scripts/sync-rules.mjs              # 分发到所有工具
 *   node .lingshu/scripts/sync-rules.mjs --check      # 仅校验，不写入（用于 CI）
 *   node .lingshu/scripts/sync-rules.mjs --only=cursor,codex   # 仅特定工具
 *   node .lingshu/scripts/sync-rules.mjs --baseline   # 仅基线工具
 *
 * 跨平台：纯 Node.js 内置模块，零依赖。
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { adapters, sources, baseline } from '../config/adapters.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../..');

const args = process.argv.slice(2);
const isCheck = args.includes('--check');
const onlyBaseline = args.includes('--baseline');
const onlyArg = args.find(a => a.startsWith('--only='));
const onlyTools = onlyArg ? onlyArg.slice('--only='.length).split(',').map(s => s.trim()).filter(Boolean) : null;

const c = {
  green:  s => `\x1b[32m${s}\x1b[0m`,
  red:    s => `\x1b[31m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  cyan:   s => `\x1b[36m${s}\x1b[0m`,
  dim:    s => `\x1b[2m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`,
};

/** 序列化 frontmatter（YAML 子集） */
function renderFrontmatter(meta) {
  if (!meta) return '';
  const lines = ['---'];
  for (const [k, v] of Object.entries(meta)) {
    lines.push(`${k}: ${v}`);
  }
  lines.push('---', '');
  return lines.join('\n');
}

/** 读取 SSoT 文件，剥除已有 frontmatter（防止重复包裹） */
function loadSource(srcPath) {
  const full = join(ROOT, srcPath);
  if (!existsSync(full)) {
    throw new Error(`SSoT 文件缺失: ${srcPath}`);
  }
  let content = readFileSync(full, 'utf8');
  if (content.startsWith('---\n') || content.startsWith('---\r\n')) {
    const m = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
    if (m) content = content.slice(m[0].length);
  }
  return content.replace(/^\s*\n+/, '');
}

/** 渲染单个适配器，返回 [{ to, content }] 列表 */
function renderAdapter(toolName, cfg) {
  const out = [];

  if (cfg.type === 'directory') {
    const targetDir = join(ROOT, cfg.target);

    // 清理与 sources 同名的旧产物（保护用户自定义文件）
    if (existsSync(targetDir)) {
      for (const f of readdirSync(targetDir)) {
        const stem = f.replace(/\.(md|mdc)$/, '');
        if (sources.find(s => s.name === stem)) {
          if (!isCheck) rmSync(join(targetDir, f));
        }
      }
    }

    for (const src of sources) {
      const body = loadSource(src.path);
      const fm = cfg.frontmatter?.[src.name];
      const content = (fm ? renderFrontmatter(fm) : '') + body;
      const relTarget = cfg.target.replace(/\/?$/, '/') + src.name + cfg.extension;
      out.push({ to: relTarget, content });
    }
  } else if (cfg.type === 'file') {
    const parts = sources.map(src => loadSource(src.path));
    const sep = cfg.separator ?? '\n\n---\n\n';
    const header = cfg.header ?? '';
    const body = (header ? header + sep : '') + parts.join(sep);
    out.push({ to: cfg.target, content: body });
  } else {
    throw new Error(`未知适配器类型: ${cfg.type}`);
  }

  return out;
}

function decideTargets() {
  if (onlyTools) return onlyTools;
  if (onlyBaseline) return baseline;
  return Object.keys(adapters);
}

function main() {
  const targets = decideTargets();
  let exitCode = 0;
  let writes = 0, drifts = 0, missing = 0;

  console.log(c.cyan(c.bold('\n🌀 灵枢规则分发')));
  console.log(c.dim(`   模式: ${isCheck ? 'CHECK（仅校验）' : 'SYNC（生成产物）'}`));
  console.log(c.dim(`   根目录: ${ROOT}`));
  console.log(c.dim(`   目标工具: ${targets.join(', ')}\n`));

  for (const tool of targets) {
    const cfg = adapters[tool];
    if (!cfg) {
      console.log(c.yellow(`  ⚠ 未知工具: ${tool}（跳过）`));
      continue;
    }

    const tag = baseline.includes(tool) ? c.green('[baseline]') : c.dim('[personal]');
    console.log(`${tag} ${c.bold(tool)}:`);

    try {
      const items = renderAdapter(tool, cfg);
      for (const { to, content } of items) {
        const fullTarget = join(ROOT, to);

        if (isCheck) {
          if (!existsSync(fullTarget)) {
            console.log(c.red(`    ✗ 缺失: ${to}`));
            missing++; exitCode = 1;
          } else {
            const existing = readFileSync(fullTarget, 'utf8');
            if (existing !== content) {
              console.log(c.red(`    ✗ 漂移: ${to}`));
              drifts++; exitCode = 1;
            } else {
              console.log(c.green(`    ✓ ${to}`));
            }
          }
        } else {
          mkdirSync(dirname(fullTarget), { recursive: true });
          writeFileSync(fullTarget, content, 'utf8');
          console.log(c.green(`    ✓ ${to}`));
          writes++;
        }
      }
    } catch (e) {
      console.log(c.red(`    ✗ 错误: ${e.message}`));
      exitCode = 1;
    }
  }

  console.log('');
  if (isCheck) {
    if (exitCode === 0) {
      console.log(c.green(c.bold('✅ 一致性校验通过\n')));
    } else {
      console.log(c.red(c.bold(`❌ 一致性校验失败（缺失 ${missing}，漂移 ${drifts}）`)));
      console.log(c.yellow('   请运行 `npm run sync` 重新生成，并提交基线工具产物。\n'));
    }
  } else {
    console.log(c.green(c.bold(`✅ 规则分发完成（共写入 ${writes} 个文件）\n`)));
  }

  process.exit(exitCode);
}

main();
