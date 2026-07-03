/**
 * lingshu ci <subcmd>
 *
 * 子命令:
 *   install       在当前项目安装 GitHub CI 一致性守护
 *                 workflow (.github/workflows/rules-consistency.yml)。
 *                 幂等：文件已存在则跳过；--force 覆盖。
 *
 * v0.3.2 起 CI 一致性守护改为可选设施——`init` 不再默认拷贝 .github/，
 * 用户如需 GitHub Actions 校验真源与产物一致性，运行 `lingshu ci install`
 * 显式加装。存量项目已装的 workflow 不受影响。
 */

import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { log, c } from '../utils/log.mjs';
import { isLingshuProject } from '../core/adapters.mjs';

const WORKFLOW_REL = '.github/workflows/rules-consistency.yml';

export default async function ci({ args, pkgRoot }) {
  const subcmd = args[0];
  const rest = args.slice(1);

  if (!subcmd || subcmd === '--help' || subcmd === '-h') {
    console.log(`
lingshu ci <subcmd>

子命令:
  install       安装 GitHub CI 一致性守护 workflow（幂等，可加 --force 覆盖）

示例:
  lingshu ci install
  lingshu ci install --force
`);
    return;
  }

  if (subcmd !== 'install') {
    throw new Error(`未知子命令: ci ${subcmd}（可用: install）`);
  }

  const { flags } = parseArgs(rest, { booleanFlags: ['force'] });
  const root = process.cwd();

  if (!isLingshuProject(root)) {
    throw new Error('当前目录不是灵枢项目（未找到 reference/rules/）');
  }

  const src = join(pkgRoot, 'templates/default', WORKFLOW_REL);
  const dst = join(root, WORKFLOW_REL);

  if (!existsSync(src)) {
    throw new Error(`模板中未找到 workflow 文件: ${WORKFLOW_REL}`);
  }

  if (existsSync(dst) && !flags.force) {
    log.warn(`已存在 ${WORKFLOW_REL}，跳过`);
    log.hint(`如需覆盖：${c.bold('lingshu ci install --force')}`);
    return;
  }

  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);

  log.ok(`已安装 GitHub CI 一致性守护 → ${WORKFLOW_REL}`);
  log.hint('workflow 在 PR/push 时校验 reference/rules/ 真源与 CLAUDE.md/AGENTS.md 产物一致性');
}
