/**
 * lingshu limb <subcmd>
 *
 *   list                              列出当前所有肢体仓
 *   add   <name> <git-url>            克隆远程仓到 <name>/
 *   init  <name>                      在 <name>/ 创建空肢体（mkdir + git init，无 remote）
 *   adopt <name> <local-path>         把已有本地目录复制到 <name>/ 纳入肢体管理
 */

import { existsSync, readdirSync, statSync, mkdirSync, cpSync, readFileSync, appendFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { log, c } from '../utils/log.mjs';
import { gitClone, gitInit, isGitRepo, isGitAvailable } from '../core/git.mjs';

const LIMB_PATTERNS = [
  /-server$/, /-ui$/, /-web$/, /-app$/,
  /-backend$/, /-frontend$/, /-mobile$/,
];

function looksLikeLimb(name) {
  return LIMB_PATTERNS.some(re => re.test(name));
}

function warnIfNotLimbName(name) {
  if (!looksLikeLimb(name)) {
    log.warn(`目录名 "${name}" 不符合肢体仓命名约定（*-server / *-ui / *-app 等）`);
  }
}

/**
 * 判断目录名是否已被 .gitignore 中的某条规则匹配。
 * 仅支持 gitignore 子集：基本 glob (*, ?)、可选尾斜杠、以 # 开头注释。
 * 对 ! 取反规则保守不处理（视为不匹配）。
 */
function isIgnoredByPatterns(name, content) {
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('!')) continue;
    const pattern = line.replace(/\/$/, '');
    // 仅匹配相对项目根的目录名（不处理 a/b/c 多级路径）
    if (pattern.includes('/')) continue;
    const re = '^' + pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.') + '$';
    try {
      if (new RegExp(re).test(name)) return true;
    } catch { /* 非法 pattern 跳过 */ }
  }
  return false;
}

/** 若新增肢体仓未被现有 .gitignore 覆盖，追加一行 `<name>/`。 */
function ensureLimbIgnored(projectRoot, name) {
  const giPath = join(projectRoot, '.gitignore');
  if (!existsSync(giPath)) {
    log.hint(`项目无 .gitignore，建议创建并加入 "${name}/" 以避免误提交`);
    return;
  }
  const content = readFileSync(giPath, 'utf8');
  if (isIgnoredByPatterns(name, content)) {
    return; // 已被通配覆盖（如 *-server/）
  }
  const prefix = content.endsWith('\n') ? '' : '\n';
  appendFileSync(giPath, `${prefix}${name}/\n`);
  log.ok(`已在 .gitignore 追加 "${name}/"`);
}

export default async function limb({ args }) {
  const [sub, ...rest] = args;
  const root = process.cwd();

  if (!sub || sub === 'list') return list(root);
  if (sub === 'add')   return add(root, rest);
  if (sub === 'init')  return initLimb(root, rest);
  if (sub === 'adopt') return adopt(root, rest);

  log.error(`未知子命令: ${sub}`);
  log.hint('可用: list | add <name> <url> | init <name> | adopt <name> <path>');
  process.exit(1);
}

function list(root) {
  log.banner('肢体仓清单');
  const items = readdirSync(root)
    .filter(n => !n.startsWith('.') && statSync(join(root, n)).isDirectory())
    .filter(n => looksLikeLimb(n));

  if (items.length === 0) {
    log.hint('当前未发现肢体仓');
    log.hint('添加: lingshu limb add <name> <git-url>');
    return;
  }

  for (const name of items) {
    const fullPath = join(root, name);
    const isRepo = isGitRepo(fullPath);
    const tag = isRepo ? c.green('[repo]') : c.yellow('[dir] ');
    console.log(`  ${tag} ${c.bold(name)}`);
  }
  log.blank();
}

function add(root, [name, url]) {
  if (!name || !url) {
    log.error('用法: lingshu limb add <name> <git-url>');
    log.hint('如果只想创建空肢体: lingshu limb init <name>');
    log.hint('如果想纳入已有本地目录: lingshu limb adopt <name> <local-path>');
    process.exit(1);
  }
  warnIfNotLimbName(name);
  const target = join(root, name);
  if (existsSync(target)) {
    log.error(`目录已存在: ${name}`);
    process.exit(1);
  }
  log.banner(`克隆肢体仓: ${name}`);
  log.hint(`远程: ${url}`);
  gitClone(url, target);
  log.ok(`已克隆到 ${name}/`);
  ensureLimbIgnored(root, name);
}

function initLimb(root, [name]) {
  if (!name) {
    log.error('用法: lingshu limb init <name>');
    process.exit(1);
  }
  warnIfNotLimbName(name);
  const target = join(root, name);
  if (existsSync(target)) {
    log.error(`目录已存在: ${name}`);
    process.exit(1);
  }
  log.banner(`创建空肢体仓: ${name}`);
  mkdirSync(target, { recursive: true });
  if (isGitAvailable()) {
    try {
      gitInit(target);
      log.ok(`已创建 ${name}/ 并完成 git init`);
      log.hint(`后续可设置 remote: cd ${name} && git remote add origin <url>`);
    } catch (e) {
      log.warn(`git init 失败: ${e.message}`);
    }
  } else {
    log.warn('未检测到 git，仅创建目录（未初始化 git）');
  }
  ensureLimbIgnored(root, name);
}

function adopt(root, [name, path]) {
  if (!name || !path) {
    log.error('用法: lingshu limb adopt <name> <local-path>');
    process.exit(1);
  }
  warnIfNotLimbName(name);
  const src = resolve(path);
  const dst = join(root, name);
  if (!existsSync(src)) {
    log.error(`本地路径不存在: ${src}`);
    process.exit(1);
  }
  if (!statSync(src).isDirectory()) {
    log.error(`路径不是目录: ${src}`);
    process.exit(1);
  }
  if (existsSync(dst)) {
    log.error(`目录已存在: ${name}`);
    process.exit(1);
  }
  log.banner(`纳入肢体仓: ${name}`);
  log.hint(`从: ${src}`);
  cpSync(src, dst, { recursive: true });
  log.ok(`已复制到 ${name}/（原目录保留，可手动清理）`);
  if (isGitRepo(dst)) {
    log.hint('该目录已是 git 仓库');
  } else if (isGitAvailable()) {
    log.hint(`如需 git 化: cd ${name} && git init`);
  }
  ensureLimbIgnored(root, name);
}
