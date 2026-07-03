/**
 * Git hooks 安装（零侵入）
 *
 * v0.3 起 hook 内容内置于 CLI，直接写入 .git/hooks/，
 * 派生仓不再携带 .lingshu/hooks/ 或 install-hooks 脚本。
 */

import { writeFileSync, chmodSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/** post-merge：git pull/merge 后若规则真源变更，自动用全局 CLI 重新分发 */
const POST_MERGE = `#!/bin/sh
# post-merge hook（由 lingshu 安装）
# git pull / merge 后，若 reference/rules/ 变更，自动重新分发规则到本地工具。

CHANGED=$(git diff HEAD@{1} HEAD --name-only 2>/dev/null)

if echo "$CHANGED" | grep -qE "^reference/rules/"; then
  echo "检测到规则变更，正在重新分发..."
  lingshu sync
fi
`;

const HOOKS = { 'post-merge': POST_MERGE };

/**
 * 把内置 hooks 写入 <projectRoot>/.git/hooks/。
 * @returns {{installed: string[], skipped: boolean}}
 */
export function installHooks(projectRoot) {
  const gitDir = join(projectRoot, '.git');
  if (!existsSync(gitDir)) return { installed: [], skipped: true };

  const hooksDir = join(gitDir, 'hooks');
  mkdirSync(hooksDir, { recursive: true });

  const installed = [];
  for (const [name, content] of Object.entries(HOOKS)) {
    const dst = join(hooksDir, name);
    writeFileSync(dst, content, 'utf8');
    try { chmodSync(dst, 0o755); } catch { /* Windows 下忽略权限错误 */ }
    installed.push(name);
  }
  return { installed, skipped: false };
}
