/**
 * 模板渲染：拷贝模板目录 + 替换占位符
 */

import { cpSync, readFileSync, writeFileSync, statSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';

/** 拷贝模板目录到目标 */
export function copyTemplate(srcDir, dstDir) {
  if (!existsSync(srcDir)) throw new Error(`模板目录不存在: ${srcDir}`);
  cpSync(srcDir, dstDir, {
    recursive: true,
    filter: (src) => {
      // 跳过 .git/、node_modules/ 等
      const lower = src.toLowerCase();
      if (lower.includes('.git' + (process.platform === 'win32' ? '\\' : '/'))) return false;
      if (lower.endsWith('/.git') || lower.endsWith('\\.git')) return false;
      if (lower.includes('node_modules')) return false;
      if (lower.endsWith('.claude/settings.local.json')) return false;
      return true;
    },
  });
}

/**
 * 在目录树中递归替换占位符（仅文本文件）。
 * @param {string} root
 * @param {Record<string,string>} replacements - { 'lingshu-template': 'my-lingshu-app' }
 */
export function replacePlaceholders(root, replacements) {
  const TEXT_EXT = new Set([
    '.md', '.mdc', '.mjs', '.js', '.json', '.yaml', '.yml',
    '.txt', '.gitignore', '.sh', '',
  ]);

  function walk(dir) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (name === 'node_modules' || name === '.git') continue;
        walk(full);
      } else {
        const ext = extname(name);
        const isText = TEXT_EXT.has(ext) || name.startsWith('.');
        if (!isText) continue;
        let content = readFileSync(full, 'utf8');
        let changed = false;
        for (const [from, to] of Object.entries(replacements)) {
          if (content.includes(from)) {
            content = content.split(from).join(to);
            changed = true;
          }
        }
        if (changed) writeFileSync(full, content, 'utf8');
      }
    }
  }

  walk(resolve(root));
}
