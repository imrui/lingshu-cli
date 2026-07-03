/**
 * lingshu init <name> [options]
 *
 * 选项:
 *   --here              在当前目录初始化（不创建子目录）
 *   --remote=<url>      设置 git remote origin
 *   --tools=<list>      指定基线工具（默认 claude-code,codex）
 *   --limbs=<list>      逗号分隔的肢体仓: name:url,name:url
 *   --no-git            跳过 git init
 *   --no-install-hooks  跳过自动安装 git hooks
 *   --template=<path>   使用自定义模板路径（默认内置 default）
 */

import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs, parseList } from '../utils/args.mjs';
import { log, c } from '../utils/log.mjs';
import { copyTemplate, replacePlaceholders } from '../core/template.mjs';
import { distribute } from '../core/adapters.mjs';
import { installHooks } from '../core/hooks.mjs';
import { isGitAvailable, gitInit, git, gitClone } from '../core/git.mjs';

export default async function init({ args, pkgRoot }) {
  const { positionals, opts, flags } = parseArgs(args, {
    booleanFlags: ['here', 'no-git', 'no-install-hooks', 'all-tools'],
  });

  const projectName = positionals[0];
  const here = !!flags.here;

  if (!projectName && !here) {
    log.error('请提供项目名: lingshu init <name>');
    log.hint('或在当前目录初始化: lingshu init --here');
    process.exit(1);
  }

  const targetDir = here
    ? process.cwd()
    : resolve(process.cwd(), projectName);
  const finalName = projectName ?? targetDir.split(/[\\/]/).pop();

  // 预检
  if (here) {
    const items = readdirSync(targetDir).filter(n => n !== '.git' && !n.startsWith('.'));
    if (items.length > 0) {
      log.warn('当前目录非空，部分文件可能被覆盖');
    }
  } else if (existsSync(targetDir)) {
    throw new Error(`目录已存在: ${targetDir}`);
  }

  const templatePath = opts.template
    ? resolve(opts.template)
    : join(pkgRoot, 'templates/default');

  log.banner(`灵枢项目初始化：${c.bold(finalName)}`);
  log.hint(`目标目录: ${targetDir}`);
  log.hint(`模板路径: ${templatePath}`);

  // Step 1: 拷贝模板
  //   .github/ 从 v0.3.2 起改为可选设施，init 默认不装；用户按需 `lingshu ci install`
  log.step('拷贝模板');
  if (!here) mkdirSync(targetDir, { recursive: true });
  copyTemplate(templatePath, targetDir, { exclude: ['.github'] });

  // _gitignore → .gitignore：npm publish 会把 .gitignore 当 .npmignore 吞掉，
  // 模板内只能用 _gitignore 入包，init 时复原为真正的 .gitignore。
  const stowed = join(targetDir, '_gitignore');
  const real = join(targetDir, '.gitignore');
  if (existsSync(stowed)) {
    if (existsSync(real)) {
      // --here 时目标可能已有 .gitignore，保留用户版本仅清掉 _gitignore
      log.hint('目标已有 .gitignore，保留之，移除模板带的 _gitignore');
      rmSync(stowed);
    } else {
      renameSync(stowed, real);
    }
  }

  log.ok('模板已拷贝');

  // Step 2: 替换占位符（注入项目身份）
  log.step('注入项目身份');
  replacePlaceholders(targetDir, {
    'lingshu-template': finalName,
  });
  log.ok(`项目身份已注入: ${c.bold(finalName)}`);

  // Step 3: 生成产物
  //   默认 baseline-only（claude-code/codex）；--all-tools 含个人工具；--tools 指定集合
  const allTools = !!flags['all-tools'];
  const tools = opts.tools ? parseList(opts.tools) : undefined;
  log.step(tools ? `生成指定工具产物（${tools.join(', ')}）` : allTools ? '生成所有工具产物' : '生成基线工具产物');
  const result = distribute({
    projectRoot: targetDir,
    tools,
    baselineOnly: !tools && !allTools,
    all: !tools && allTools,
  });
  log.ok(`已生成 ${result.written.length} 个产物文件`);
  for (const f of result.written) log.hint(`  ${f}`);
  if (!allTools && !tools) log.hint(`如需个人工具产物（cursor/trae/...），稍后跑 ${c.bold('lingshu sync --only=<tool>')} 或加 ${c.bold('--all-tools')}`);

  // Step 5: git init
  if (!flags['no-git']) {
    log.step('初始化 git 仓库');
    if (!isGitAvailable()) {
      log.warn('未检测到 git，跳过 git init');
    } else {
      gitInit(targetDir);
      log.ok('git init 完成');
      if (opts.remote) {
        git(['remote', 'add', 'origin', opts.remote], { cwd: targetDir, silent: true });
        log.ok(`已设置 remote origin → ${opts.remote}`);
      }
    }
  }

  // Step 6: 安装 git hooks（内置，无需项目内脚本）
  if (!flags['no-install-hooks']) {
    log.step('安装 git hooks');
    const { installed, skipped } = installHooks(targetDir);
    if (skipped) log.warn('非 git 仓库，跳过 hooks 安装');
    else log.ok(`已安装 git hooks: ${installed.join(', ')}`);
  }

  // Step 7: 拉取肢体仓
  if (opts.limbs) {
    log.step('克隆肢体仓');
    const limbs = parseList(opts.limbs);
    for (const limb of limbs) {
      const [name, url] = limb.split(':').map(s => s.trim());
      if (!name || !url) {
        log.warn(`格式错误（应为 name:url）: ${limb}`);
        continue;
      }
      const limbPath = join(targetDir, name);
      try {
        log.hint(`  克隆 ${name} → ${url}`);
        gitClone(url, limbPath);
        log.ok(`  ${name}`);
      } catch (e) {
        log.error(`  ${name} 克隆失败: ${e.message}`);
      }
    }
  }

  // 完成
  log.blank();
  log.banner('初始化完成');
  console.log(c.dim('下一步:'));
  if (!here) console.log(`  cd ${finalName}`);
  console.log('  lingshu doctor              # 健康检查');
  console.log('  lingshu sync                # 重新分发规则到本地 AI 工具');
  console.log('  lingshu ci install          # 加装 GitHub CI 一致性守护（可选）');
  console.log('  git push -u origin master   # 推送到远程（如已设置 remote）');
  log.blank();
}
