# @ruobai/lingshu — 灵枢架构脚手架

[![npm version](https://img.shields.io/npm/v/@ruobai/lingshu)](https://www.npmjs.com/package/@ruobai/lingshu)
[![npm downloads](https://img.shields.io/npm/dm/@ruobai/lingshu)](https://www.npmjs.com/package/@ruobai/lingshu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node](https://img.shields.io/node/v/@ruobai/lingshu)](https://nodejs.org)

> AI 原生项目的一键初始化与日常运维工具｜若白知行出品

`@ruobai/lingshu` 是 [灵枢架构 (LingShu)](https://github.com/imrui/lingshu-template) 的官方命令行工具，把 7 步手动流程压缩为 1 条命令。

> **v0.3 零侵入**：同步引擎完全内置于本 CLI，派生仓**不再携带** `.lingshu/` 目录与 `package.json`——只保留 `reference/` 治理资产与 AI 工具产物。存量项目可用 `lingshu upgrade` 一键迁移。

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
npm install -g git+ssh://git@github.com/imrui/lingshu-cli.git#v0.3.1
```

> 团队协作提示：v0.3 起派生仓不含 `package.json`，同步统一走全局 `lingshu sync`。**团队每位成员各全局安装一次**即可；CI 用 `npx -y @ruobai/lingshu` 临时调用。

## 创建新项目

```bash
lingshu init my-lingshu-app \
  --remote=git@github.com:your-org/my-lingshu-app.git \
  --tools=claude-code,codex \
  --limbs="my-lingshu-app-server:git@github.com:your-org/my-lingshu-app-server.git,my-lingshu-app-ui:git@github.com:your-org/my-lingshu-app-ui.git"
```

> 把 `your-org` 替换为你的 GitHub 组织或用户名。

一条命令完成：拷贝模板 → 注入项目身份 → 生成 `CLAUDE.md / AGENTS.md` → `git init` 与 remote → 安装 git hooks（内置写入 `.git/hooks/`）→ 克隆肢体仓。

---

## 命令参考

### `lingshu init <name>`

| 选项 | 说明 |
|------|------|
| `<name>` | 项目目录名（位置参数） |
| `--here` | 在当前目录初始化（不创建子目录） |
| `--remote=<url>` | 设置 git remote origin |
| `--tools=<list>` | 指定生成哪些工具的产物（默认基线 `claude-code,codex`） |
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

架构健康检查：物理完整性（`reference/rules` + `reference/docs`）+ SSoT 真源（`ai-behavior.md` + `lingshu-core.md`）+ 基线产物（`CLAUDE.md` + `AGENTS.md`）。

### `lingshu tool <subcmd>`

管理「某工具产物是否入 git」。v0.3 起 `.gitignore` 本身就是唯一真相，子命令直接增删它。

| 子命令 | 说明 |
|--------|------|
| `list` | 列出所有内置工具及其追踪状态（tracked / ignored） |
| `track <tool>` | 让该工具产物入库（从 `.gitignore` 移除其忽略规则） |
| `untrack <tool>` | 让该工具产物不入库（向 `.gitignore` 追加其忽略规则） |

### `lingshu limb <subcmd>`

| 子命令 | 说明 |
|--------|------|
| `list` | 列出当前肢体仓 |
| `add <name> <git-url>` | 克隆远程仓库到 `<name>/` |
| `init <name>` | 创建空肢体目录 `<name>/` 并完成 `git init`（无 remote） |
| `adopt <name> <local-path>` | 把已有本地目录复制到 `<name>/` 纳入肢体管理 |

> 三个子命令覆盖了"远程未建好就先本地起"和"把现有目录纳入"等真实场景。`add` 仍然是远程克隆的快捷方式。

### `lingshu hooks <subcmd>`

| 子命令 | 说明 |
|--------|------|
| `install` | 在当前项目安装内置 git hooks（`post-merge`：`git pull` 后自动 `lingshu sync`）。`init` 时已自动安装，本命令供存量项目补装 |

### `lingshu upgrade`

把存量项目迁移到 v0.3 零侵入结构。

| 选项 | 说明 |
|------|------|
| _(无参数)_ | 执行迁移 |
| `--dry-run` | 仅预览将执行的动作，不写盘 |
| `--force` | 即使检测到风险（如 `package.json` 含业务依赖）也继续 |

- **v0.2.x → v0.3**：删除 `.lingshu/`、删除/瘦身 `package.json`、把原 `adapters.mjs` 的 cursor frontmatter 迁入 `reference/rules/*.md`（v0.3.1 起仅注入 `order`）、改造 CI 为 `npx`、重装 hooks、重生成基线产物。
- **v0.3.0 → v0.3.1（工作流瘦身）**：删除空的 `reference/management/{plans,tasks,walkthroughs,reports}/`；含用户内容的子目录保留 + 输出迁移建议；新建 `reference/decisions/README.md`（ADR）；规则真源含旧措辞（`自动化归档守卫` / `CRITICAL` / `reference/management/`）时**输出手动更新提示**，本命令不改写用户规则内容。
- **灵枢 1.0**（规则散落在产物、无 `reference/rules/` 真源）：无法无损自动迁移，给出明确的手动迁移指引。

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

内置 6 大工具开箱即用，无需任何配置。若需接入未内置的工具，可在项目的 `reference/.lingshu.json` 声明自定义适配器（可选逃生舱）。

---

## 设计原则

1. **零依赖**：纯 Node 内置模块，避免 `node_modules` 膨胀
2. **跨平台**：兼容 Win / macOS / Linux
3. **零侵入**：同步引擎在 CLI 内，派生仓只留治理资产，不背引擎与 `package.json`
4. **可演进**：模板可替换，适配器内置可扩展

---

## 路线图

| 命令 | 状态 |
|------|:---:|
| `init` | ✅ |
| `sync` | ✅ |
| `doctor` | ✅ |
| `tool`（track/untrack） | ✅ |
| `limb` | ✅ |
| `hooks` | ✅ |
| `upgrade` | ✅（v0.2.x → v0.3、v0.3.0 → v0.3.1） |

---

## 开发与贡献

```bash
git clone git@github.com:imrui/lingshu-cli.git
cd lingshu-cli

npm test                       # 运行 smoke 测试（22 项）
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

> 本 CLI 以 MIT 协议开源。通过 `lingshu init` 派生的新项目不含任何脚手架 `package.json`，协议由项目作者自决。
