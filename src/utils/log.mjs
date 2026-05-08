/**
 * 终端输出工具：颜色 + 日志级别
 * 零依赖，纯 ANSI 转义码。
 */

const NO_COLOR = process.env.NO_COLOR || !process.stdout.isTTY;

const wrap = (code) => (s) => NO_COLOR ? String(s) : `\x1b[${code}m${s}\x1b[0m`;

export const c = {
  green:  wrap('32'),
  red:    wrap('31'),
  yellow: wrap('33'),
  cyan:   wrap('36'),
  blue:   wrap('34'),
  magenta:wrap('35'),
  dim:    wrap('2'),
  bold:   wrap('1'),
};

export const log = {
  info:    (m) => console.log(c.cyan('ℹ'), m),
  ok:      (m) => console.log(c.green('✓'), m),
  warn:    (m) => console.log(c.yellow('⚠'), m),
  error:   (m) => console.error(c.red('✗'), m),
  step:    (m) => console.log(c.bold(c.cyan(`\n▶ ${m}`))),
  hint:    (m) => console.log(c.dim(`  ${m}`)),
  blank:   () => console.log(''),
  banner:  (m) => console.log(c.cyan(c.bold(`\n${m}\n`))),
};
