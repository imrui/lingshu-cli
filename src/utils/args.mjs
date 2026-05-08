/**
 * 极简 CLI 参数解析
 *
 * 支持:
 *   --flag             → flags.flag = true
 *   --key=value        → opts.key = "value"
 *   --key value        → opts.key = "value"
 *   positional1 ...    → positionals = [...]
 */

export function parseArgs(args, { booleanFlags = [] } = {}) {
  const positionals = [];
  const opts = {};
  const flags = {};

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq >= 0) {
        const key = a.slice(2, eq);
        opts[key] = a.slice(eq + 1);
      } else {
        const key = a.slice(2);
        if (booleanFlags.includes(key)) {
          flags[key] = true;
        } else if (args[i + 1] && !args[i + 1].startsWith('--')) {
          opts[key] = args[++i];
        } else {
          flags[key] = true;
        }
      }
    } else if (a.startsWith('-') && a.length === 2) {
      flags[a.slice(1)] = true;
    } else {
      positionals.push(a);
    }
  }

  return { positionals, opts, flags };
}

/** 将 "a,b,c" 解析为 ["a","b","c"]，去空 */
export function parseList(value) {
  if (!value) return [];
  return String(value).split(',').map(s => s.trim()).filter(Boolean);
}
