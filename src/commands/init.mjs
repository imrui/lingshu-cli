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

import { existsSync, mkdirSync, readdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs, parseList } from '../utils/args.mjs';
import { log, c } from '../utils/log.mjs';
import { copyTemplate, replacePlaceholders } from '../core/template.mjs';
import { distribute } from '../core/adapters.mjs';
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
  log.step('拷贝模板');
  if (!here) mkdirSync(targetDir, { recursive: true });
  copyTemplate(templatePath, targetDir);
  log.ok('模板已拷贝');

  // Step 2: 替换占位符 + 重写 package.json 关键字段
  log.step('注入项目身份');
  replacePlaceholders(targetDir, {
    'lingshu-template': finalName,
  });
  const pkgPath = join(targetDir, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      pkg.description = `${finalName} — 灵枢架构项目`;
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    } catch { /* 解析失败不阻断 init，作者后续手改即可 */ }
  }
  log.ok(`项目身份已注入: ${c.bold(finalName)}`);

  // Step 3: 配置基线工具（如有 --tools）
  if (opts.tools) {
    log.step('配置基线工具');
    const tools = parseList(opts.tools);
    const cfgPath = join(targetDir, '.lingshu/config/adapters.mjs');
    if (existsSync(cfgPath)) {
      let content = readFileSync(cfgPath, 'utf8');
      const re = /export const baseline = \[[^\]]*\];/;
      const replacement = `export const baseline = [${tools.map(t => `'${t}'`).join(', ')}];`;
      if (re.test(content)) {
        content = content.replace(re, replacement);
        writeFileSync(cfgPath, content, 'utf8');
        log.ok(`基线工具: ${tools.join(', ')}`);
      } else {
        log.warn('未在 adapters.mjs 中找到 baseline 配置，跳过');
      }
    }
  }

  // Step 4: 生成产物（默认仅 baseline，--all-tools 时包括 personal）
  const allTools = !!flags['all-tools'];
  log.step(allTools ? '生成所有工具产物' : '生成基线工具产物');
  const result = await distribute({
    projectRoot: targetDir,
    baselineOnly: !allTools,
  });
  log.ok(`已生成 ${result.written.length} 个产物文件`);
  for (const f of result.written) log.hint(`  ${f}`);
  if (!allTools) log.hint(`如需个人工具产物（cursor/trae/...），稍后跑 ${c.bold('lingshu sync')} 或加 ${c.bold('--all-tools')}`);

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

  // Step 6: 安装 git hooks
  if (!flags['no-install-hooks']) {
    log.step('安装 git hooks');
    const hooksScript = join(targetDir, '.lingshu/scripts/install-hooks.mjs');
    if (existsSync(hooksScript)) {
      const { spawnSync } = await import('node:child_process');
      const r = spawnSync(process.execPath, [hooksScript], { cwd: targetDir, stdio: 'inherit' });
      if (r.status !== 0) log.warn('install-hooks 退出码非 0');
    } else {
      log.warn('未找到 install-hooks.mjs，跳过');
    }
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
  console.log('  npm install            # 安装依赖（含 hooks 自动安装）');
  console.log('  npm run doctor         # 健康检查');
  console.log('  git push -u origin master   # 推送到远程（如已设置 remote）');
  log.blank();
}
