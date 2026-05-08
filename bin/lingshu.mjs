#!/usr/bin/env node
/**
 * 灵枢 CLI 入口
 *
 * 用法: lingshu <command> [options]
 *
 * 命令:
 *   init <name>       初始化新的灵枢项目
 *   sync              重新分发规则到本地 AI 工具
 *   doctor            架构健康检查
 *   tool <subcmd>     管理 AI 工具支持（list/baseline/personal）
 *   limb <subcmd>     管理肢体仓（list/add）
 *   --version, -v     显示版本
 *   --help, -h        显示帮助
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { log } from '../src/utils/log.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = resolve(__dirname, '..');

const pkg = JSON.parse(readFileSync(resolve(PKG_ROOT, 'package.json'), 'utf8'));

const HELP = `
${pkg.description}  v${pkg.version}

用法:
  lingshu <command> [options]

命令:
  init <name>          初始化新的灵枢项目（默认仅生成基线 AI 工具产物）
                       选项: --here, --remote=<url>, --tools=<list>, --limbs=<list>,
                             --all-tools（含 personal 工具产物），--no-git, --no-install-hooks
                       示例: lingshu init my-lingshu-app --tools=claude-code,codex

  sync                 重新分发规则到本地 AI 工具
                       默认: 同步 baseline + 已存在产物的 personal
                       选项: --check, --baseline, --all, --only=<tools>

  doctor               架构健康检查（物理结构 + SSoT 真源 + 一致性）

  tool <subcmd>        管理 AI 工具支持
                       子命令: list | baseline <tool> | personal <tool>

  limb <subcmd>        管理肢体仓
                       子命令:
                         list                       列出当前肢体仓
                         add <name> <git-url>       克隆远程仓
                         init <name>                创建空肢体（mkdir + git init）
                         adopt <name> <local-path>  纳入已有本地目录

  --version, -v        显示版本
  --help, -h           显示帮助

文档: https://github.com/imrui/lingshu-cli
`;

const COMMANDS = {
  init: () => import('../src/commands/init.mjs'),
  sync: () => import('../src/commands/sync.mjs'),
  doctor: () => import('../src/commands/doctor.mjs'),
  tool: () => import('../src/commands/tool.mjs'),
  limb: () => import('../src/commands/limb.mjs'),
};

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === '--help' || cmd === '-h') {
    console.log(HELP);
    process.exit(0);
  }

  if (cmd === '--version' || cmd === '-v') {
    console.log(`v${pkg.version}`);
    process.exit(0);
  }

  if (!COMMANDS[cmd]) {
    log.error(`未知命令: ${cmd}`);
    console.log('运行 `lingshu --help` 查看可用命令');
    process.exit(1);
  }

  try {
    const mod = await COMMANDS[cmd]();
    const handler = mod.default ?? mod[cmd];
    await handler({ args: args.slice(1), pkgRoot: PKG_ROOT });
  } catch (e) {
    log.error(e.message);
    if (process.env.LINGSHU_DEBUG) console.error(e.stack);
    process.exit(1);
  }
}

main();
