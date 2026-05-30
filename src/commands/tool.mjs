/**
 * lingshu tool <subcmd>
 *
 *   list                列出所有内置 AI 工具及其 git 追踪状态
 *   track <tool>        让该工具产物入库（从 .gitignore 移除其忽略规则）
 *   untrack <tool>      让该工具产物不入库（向 .gitignore 追加其忽略规则）
 *
 * v0.3 起零配置：「入库 vs 忽略」的唯一真相就是 .gitignore 本身，
 * track/untrack 只增删 .gitignore，不再维护任何配置文件。
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { log, c } from '../utils/log.mjs';
import { ADAPTERS } from '../core/registry.mjs';
import { isLingshuProject } from '../core/adapters.mjs';

/** 工具产物在 .gitignore 中的归一化忽略路径（目录型带尾斜杠） */
function ignorePath(cfg) {
  return cfg.type === 'directory' ? cfg.target.replace(/\/?$/, '/') : cfg.target;
}

/** .gitignore 是否含与该忽略路径完全相等的一行（按行精确匹配） */
function hasIgnoreLine(content, path) {
  return content.split(/\r?\n/).some((l) => l.trim() === path);
}

export default async function tool({ args }) {
  const [sub, name] = args;
  const root = process.cwd();
  if (!isLingshuProject(root)) throw new Error('当前目录不是灵枢项目（未找到 reference/rules/）');

  if (!sub || sub === 'list') return list(root);

  if (sub === 'track' || sub === 'untrack') {
    if (!name) {
      log.error(`请提供工具名: lingshu tool ${sub} <tool>`);
      log.hint(`可用工具: ${Object.keys(ADAPTERS).join(', ')}`);
      process.exit(1);
    }
    return setTracked(root, name, sub === 'track');
  }

  log.error(`未知子命令: ${sub}`);
  log.hint('可用: list | track <tool> | untrack <tool>');
  process.exit(1);
}

function list(root) {
  const giPath = join(root, '.gitignore');
  const gi = existsSync(giPath) ? readFileSync(giPath, 'utf8') : '';
  log.banner('AI 工具支持矩阵');
  for (const [name, cfg] of Object.entries(ADAPTERS)) {
    const ignored = hasIgnoreLine(gi, ignorePath(cfg));
    const tag = ignored ? c.dim('[ignored]') : c.green('[tracked]');
    const target = cfg.type === 'directory' ? cfg.target + '*' + cfg.extension : cfg.target;
    console.log(`  ${tag} ${c.bold(name.padEnd(14))} → ${c.dim(target)}`);
  }
  log.blank();
  log.hint('入库: lingshu tool track <name>    忽略: lingshu tool untrack <name>');
}

function setTracked(root, name, makeTracked) {
  const cfg = ADAPTERS[name];
  if (!cfg) {
    log.error(`未知工具: ${name}`);
    log.hint(`可用工具: ${Object.keys(ADAPTERS).join(', ')}`);
    process.exit(1);
  }

  const giPath = join(root, '.gitignore');
  if (!existsSync(giPath)) {
    log.error('当前项目无 .gitignore，无法管理追踪状态');
    process.exit(1);
  }

  const path = ignorePath(cfg);
  let content = readFileSync(giPath, 'utf8');
  const already = hasIgnoreLine(content, path);

  if (makeTracked) {
    if (!already) {
      log.info(`${name} 已是入库状态（.gitignore 未忽略 ${path}）`);
      return;
    }
    // 移除该忽略行
    content = content
      .split(/\r?\n/)
      .filter((l) => l.trim() !== path)
      .join('\n');
    writeFileSync(giPath, content, 'utf8');
    log.ok(`${name} → ${c.green('tracked')}（已从 .gitignore 移除 ${path}）`);
  } else {
    if (already) {
      log.info(`${name} 已是忽略状态`);
      return;
    }
    const prefix = content.endsWith('\n') || content === '' ? '' : '\n';
    writeFileSync(giPath, content + prefix + path + '\n', 'utf8');
    log.ok(`${name} → ${c.dim('ignored')}（已向 .gitignore 追加 ${path}）`);
  }
  log.hint('记得运行 `lingshu sync` 重新生成产物');
}
