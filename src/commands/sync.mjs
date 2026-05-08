/**
 * lingshu sync [options]
 *
 * 在当前灵枢项目目录执行规则分发。
 * 等价于 npm run sync，但提供统一的 CLI 入口。
 */

import { parseArgs, parseList } from '../utils/args.mjs';
import { log, c } from '../utils/log.mjs';
import { distribute } from '../core/adapters.mjs';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export default async function sync({ args }) {
  const { opts, flags } = parseArgs(args, { booleanFlags: ['check', 'baseline'] });

  const projectRoot = process.cwd();
  if (!existsSync(join(projectRoot, '.lingshu/config/adapters.mjs'))) {
    throw new Error('当前目录不是灵枢项目（未找到 .lingshu/config/adapters.mjs）');
  }

  const tools = opts.only ? parseList(opts.only) : undefined;
  const result = await distribute({
    projectRoot,
    tools,
    baselineOnly: !!flags.baseline,
    check: !!flags.check,
  });

  log.banner(flags.check ? '一致性校验' : '规则分发');

  for (const p of result.processed) {
    if (p.status === 'unknown') {
      log.warn(`未知工具: ${p.tool}`);
      continue;
    }
    const tag = p.baseline ? c.green('[baseline]') : c.dim('[personal]');
    console.log(`${tag} ${c.bold(p.tool)}:`);
    for (const it of p.items) {
      const symbol = {
        ok:      c.green('✓'),
        written: c.green('✓'),
        drifted: c.red('✗'),
        missing: c.red('✗'),
      }[it.status] ?? '?';
      const status = it.status === 'drifted' ? c.red(' (漂移)') : it.status === 'missing' ? c.red(' (缺失)') : '';
      console.log(`    ${symbol} ${it.to}${status}`);
    }
  }

  log.blank();
  if (flags.check) {
    if (result.drifted.length === 0 && result.missing.length === 0) {
      log.ok('一致性校验通过');
    } else {
      log.error(`一致性校验失败（缺失 ${result.missing.length}，漂移 ${result.drifted.length}）`);
      log.hint('运行 `lingshu sync` 重新生成');
      process.exit(1);
    }
  } else {
    log.ok(`规则分发完成（共写入 ${result.written.length} 个文件）`);
  }
}
