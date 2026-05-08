# @ruobai/lingshu — 灵枢架构脚手架

[![npm version](https://img.shields.io/npm/v/@ruobai/lingshu)](https://www.npmjs.com/package/@ruobai/lingshu)
[![npm downloads](https://img.shields.io/npm/dm/@ruobai/lingshu)](https://www.npmjs.com/package/@ruobai/lingshu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node](https://img.shields.io/node/v/@ruobai/lingshu)](https://nodejs.org)

> AI 原生项目的一键初始化与日常运维工具｜若白知行出品

`@ruobai/lingshu` 是 [灵枢架构 (LingShu)](https://github.com/imrui/lingshu-template) 的官方命令行工具，把 7 步手动流程压缩为 1 条命令。

---

## 1 分钟上手

| 步骤 | 命令 |
|---|---|
| 安装 | `npm install -g @ruobai/lingshu` |
| 验证 | `lingshu --version` |
| 创建项目 | `lingshu init <name>` |
| 临时调用（不全装） | `npx @ruobai/lingshu init <name>` |

要求 Node ≥ 18。

---

## 安装

```bash
# 推荐：从 npm 公网安装
npm install -g @ruobai/lingshu

# 备用：Git+SSH 直装（离线环境/不走 npm 公网时）
npm install -g git+ssh://git@github.com/imrui/lingshu-cli.git

# 锁定版本
npm install -g git+ssh://git@github.com/imrui/lingshu-cli.git#v0.2.5
```

## 创建新项目

```bash
lingshu init my-lingshu-app \
  --remote=git@github.com:your-org/my-lingshu-app.git \
  --tools=claude-code,codex \
  --limbs="my-lingshu-app-server:git@github.com:your-org/my-lingshu-app-server.git,my-lingshu-app-ui:git@github.com:your-org/my-lingshu-app-ui.git"
```

> 把 `your-org` 替换为你的 GitHub 组织或用户名。

一条命令完成：拷贝模板 → 注入项目身份 → 配置 AI 工具基线 → 生成 `CLAUDE.md / AGENTS.md` → `git init` 与 remote → 安装 git hooks → 克隆肢体仓。

---

## 命令参考

### `lingshu init <name>`

| 选项 | 说明 |
|------|------|
| `<name>` | 项目目录名（位置参数） |
| `--here` | 在当前目录初始化（不创建子目录） |
| `--remote=<url>` | 设置 git remote origin |
| `--tools=<list>` | 基线工具列表（默认 `claude-code,codex`） |
| `--all-tools` | 同时生成 personal 工具产物（cursor / trae / qoder / antigravity）；默认不生成，留待开发者本地按需 `lingshu sync` |
| `--limbs=<list>` | 肢体仓 `name:url,name:url` 格式 |
| `--no-git` | 跳过 git init |
| `--no-install-hooks` | 跳过 git hooks 安装 |
| `--template=<path>` | 自定义模板路径 |

> 默认行为：init 仅生成入库的基线产物（`CLAUDE.md` / `AGENTS.md`）。其它 AI 工具（Cursor / Trae / Qoder / Antigravity）的本地产物，由开发者按需 `lingshu sync` 触发。这样首次 `git status` 干净、不污染仓库。

### `lingshu sync`

重新分发规则到本地 AI 工具。

**默认（无参数）= baseline + 已存在产物的 personal 工具**：第一次接入某 personal 工具时显式 `--only=<name>`，之后该工具的产物已存在，sync 默认会自动维护它。

| 选项 | 说明 |
|------|------|
| _(无参数)_ | baseline + 已激活的 personal（推荐日常用） |
| `--all` | 强制同步全部工具 |
| `--baseline` | 仅同步基线工具（CLAUDE.md / AGENTS.md） |
| `--only=<list>` | 仅同步指定工具（首次激活某工具时用） |
| `--check` | 仅校验（CI 模式，不写文件），与上面任一组合使用 |

### `lingshu doctor`

架构健康检查（物理结构 + SSoT 真源 + 灵枢宣言）。

### `lingshu tool <subcmd>`

| 子命令 | 说明 |
|--------|------|
| `list` | 列出所有适配器及状态 |
| `baseline <tool>` | 将工具改为基线（产物入库） |
| `personal <tool>` | 将工具改为个人（产物 gitignore） |

### `lingshu limb <subcmd>`

| 子命令 | 说明 |
|--------|------|
| `list` | 列出当前肢体仓 |
| `add <name> <git-url>` | 克隆远程仓库到 `<name>/` |
| `init <name>` | 创建空肢体目录 `<name>/` 并完成 `git init`（无 remote） |
| `adopt <name> <local-path>` | 把已有本地目录复制到 `<name>/` 纳入肢体管理 |

> 三个新增子命令覆盖了"远程未建好就先本地起"和"把现有目录纳入"等真实场景。`add` 仍然是远程克隆的快捷方式。

---

## 支持的 AI 工具

| 工具 | 适配器 | 默认角色 |
|------|--------|---------|
| Claude Code | `CLAUDE.md` | 基线 |
| Codex / Agents | `AGENTS.md` | 基线 |
| Cursor | `.cursor/rules/*.mdc` | 个人 |
| Trae | `.trae/rules/*.md` | 个人 |
| Qoder | `.qoder/rules/*.md` | 个人 |
| Antigravity | `.agent/rules/*.md` | 个人 |

新增工具：编辑生成项目的 `.lingshu/config/adapters.mjs` 即可。

---

## 设计原则

1. **零依赖**：纯 Node 内置模块，避免 `node_modules` 膨胀
2. **跨平台**：兼容 Win / macOS / Linux
3. **薄包装**：CLI 不做模板里 `.lingshu/scripts/` 已能做的事
4. **可演进**：模板可替换，适配器可扩展

---

## 路线图

| 命令 | 状态 |
|------|:---:|
| `init` | ✅ |
| `sync` | ✅ |
| `doctor` | ✅ |
| `tool` | ✅ |
| `limb` | ✅ |
| `archive` | 🚧 待规划 |
| `upgrade` | 🚧 待规划 |

---

## 开发与贡献

```bash
git clone git@github.com:imrui/lingshu-cli.git
cd lingshu-cli

npm test                       # 运行 5 个 smoke 测试
node bin/lingshu.mjs --help    # 本地试运行
npm link                       # 全局链接，方便调试
```

### 项目结构

```
@ruobai/lingshu/
├── bin/lingshu.mjs       # CLI 入口
├── src/                  # 子命令、适配器引擎、模板渲染、git 封装
├── templates/default/    # 默认模板（lingshu-template 当前快照）
└── tests/                # smoke 测试
```

### CI 流水线

| Job | 触发 | 作用 |
|-----|------|------|
| `test` | push / PR | smoke 测试 + CLI 启动检查 |
| `publish` | push tag `v*.*.*` | npm 发布（含 provenance） |

### 分支与发版

- 稳定分支 `master`，仅通过 PR 合并
- 功能分支 `feat/*`、修复分支 `fix/*`
- 发版：`npm version patch|minor|major` 自动 bump + tag，`git push --tags` 触发 CI 发布

---

## License

[MIT](./LICENSE) © 2026 imrui

> CLI 内嵌的模板（`templates/default/package.json`）`license` 字段保持 `UNLICENSED` 占位，由通过 `lingshu init` 派生的新项目作者自决。
