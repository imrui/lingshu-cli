/**
 * 肢体仓发现（核心层 · 供 sync / doctor / limb 共用）
 *
 * 约定：中枢根目录下、目录名符合 LIMB_PATTERNS 的子目录即肢体仓。
 * statSync 跟随符号链接——"嵌套克隆"与"平级目录 + 软链"两种布局都支持。
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { isGitRepo } from './git.mjs';

export const LIMB_PATTERNS = [
  /-server$/, /-ui$/, /-web$/, /-app$/,
  /-backend$/, /-frontend$/, /-mobile$/,
];

export function looksLikeLimb(name) {
  return LIMB_PATTERNS.some((re) => re.test(name));
}

/**
 * 列出中枢根目录下的肢体仓（按名字排序）。
 * @returns {Array<{name: string, path: string, isRepo: boolean}>}
 */
export function listLimbs(projectRoot) {
  if (!existsSync(projectRoot)) return [];
  return readdirSync(projectRoot)
    .filter((n) => !n.startsWith('.') && looksLikeLimb(n))
    .filter((n) => {
      try { return statSync(join(projectRoot, n)).isDirectory(); } catch { return false; }
    })
    .sort()
    .map((name) => {
      const path = join(projectRoot, name);
      return { name, path, isRepo: isGitRepo(path) };
    });
}
