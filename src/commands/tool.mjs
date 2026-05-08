/**
 * lingshu tool <subcmd>
 *
 *   list                       列出所有适配器及其状态
 *   baseline <tool>            将工具标记为基线（产物入库）
 *   personal <tool>            将工具标记为个人（产物 gitignore）
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { log, c } from '../utils/log.mjs';
import { loadConfig } from '../core/adapters.mjs';

export default async function tool({ args }) {
  const [sub, name] = args;
  const root = process.cwd();
  const cfgPath = join(root, '.lingshu/config/adapters.mjs');
  if (!existsSync(cfgPath)) throw new Error('当前目录不是灵枢项目');

  if (!sub || sub === 'list') {
    return list(root);
  }

  if (!name) {
    log.error(`请提供工具名: lingshu tool ${sub} <tool>`);
    process.exit(1);
  }

  if (sub === 'baseline') return setBaseline(cfgPath, name, true);
  if (sub === 'personal') return setBaseline(cfgPath, name, false);

  log.error(`未知子命令: ${sub}`);
  log.hint('可用: list | baseline <tool> | personal <tool>');
  process.exit(1);
}

async function list(root) {
  const { adapters, baseline } = await loadConfig(root);
  log.banner('AI 工具支持矩阵');
  for (const [name, cfg] of Object.entries(adapters)) {
    const tag = baseline.includes(name) ? c.green('[baseline]') : c.dim('[personal]');
    const target = cfg.type === 'directory' ? cfg.target + '*' + cfg.extension : cfg.target;
    console.log(`  ${tag} ${c.bold(name.padEnd(14))} → ${c.dim(target)}`);
  }
  log.blank();
  log.hint('修改基线: lingshu tool baseline|personal <name>');
}

function setBaseline(cfgPath, name, makeBaseline) {
  let content = readFileSync(cfgPath, 'utf8');
  const re = /export const baseline = \[([^\]]*)\];/;
  const m = content.match(re);
  if (!m) throw new Error('未在 adapters.mjs 中找到 baseline 数组');

  const current = m[1].match(/'([^']+)'/g)?.map(s => s.slice(1, -1)) ?? [];
  let next = [...current];

  if (makeBaseline) {
    if (current.includes(name)) {
      log.info(`${name} 已在基线中`);
      return;
    }
    next.push(name);
  } else {
    if (!current.includes(name)) {
      log.info(`${name} 已是个人工具`);
      return;
    }
    next = current.filter(n => n !== name);
  }

  const newLine = `export const baseline = [${next.map(t => `'${t}'`).join(', ')}];`;
  content = content.replace(re, newLine);
  writeFileSync(cfgPath, content, 'utf8');

  log.ok(`${name} → ${makeBaseline ? c.green('baseline') : c.dim('personal')}`);
  log.hint('记得运行 `lingshu sync` 重新分发，并相应更新 .gitignore');
}
