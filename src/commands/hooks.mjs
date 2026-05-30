/**
 * lingshu hooks <subcmd>
 *
 *   install        在当前项目安装灵枢 git hooks（post-merge 自动同步）
 *
 * 供存量项目补装 hooks；init 时已自动安装。
 */

import { log } from '../utils/log.mjs';
import { installHooks } from '../core/hooks.mjs';
import { isLingshuProject } from '../core/adapters.mjs';

export default async function hooks({ args }) {
  const [sub = 'install'] = args;
  const root = process.cwd();

  if (sub !== 'install') {
    log.error(`未知子命令: ${sub}`);
    log.hint('可用: install');
    process.exit(1);
  }

  if (!isLingshuProject(root)) throw new Error('当前目录不是灵枢项目（未找到 reference/rules/）');

  const { installed, skipped } = installHooks(root);
  if (skipped) {
    log.warn('当前目录不是 git 仓库，跳过 hooks 安装');
    return;
  }
  log.ok(`已安装 git hooks: ${installed.join(', ')}`);
}
