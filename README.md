# 🌀 @lingshu/cli — 灵枢架构脚手架

> AI 原生项目的一键初始化与日常运维工具。

`@lingshu/cli` 是 [灵枢架构 (LingShu)](https://github.com/imrui/lingshu-template) 的官方命令行工具，把 7 步手动流程压缩为 1 条命令。

---

## 🚀 快速开始

### 安装

```bash
# Git+SSH 直装（零配置，推荐）
npm install -g git+ssh://git@github.com/imrui/lingshu-cli.git
lingshu --version

# 或 npx 临时运行（不全局安装）
npx git+ssh://git@github.com/imrui/lingshu-cli.git init <name>
```

> 暂不发布到 npm 公网或 GitHub Packages；如需版本固定可用 `#v0.2.0` 锁定 tag：
> `npm i -g git+ssh://git@github.com/imrui/lingshu-cli.git#v0.2.0`

### 创建新项目

```bash
# 请将 your-org 替换为你的 GitHub 组织或用户名
lingshu init my-lingshu-app \
  --remote=git@github.com:your-org/my-lingshu-app.git \
  --tools=claude-code,codex \
  --limbs="my-lingshu-app-server:git@github.com:your-org/my-lingshu-app-server.git,my-lingshu-app-ui:git@github.com:your-org/my-lingshu-app-ui.git"
```

一条命令完成：
- ✅ 拷贝灵枢模板
- ✅ 注入项目身份（替换占位符）
- ✅ 配置基线 AI 工具
- ✅ 生成基线产物（CLAUDE.md / AGENTS.md）
- ✅ git init + 设置 remote
- ✅ 安装 git hooks
- ✅ 克隆肢体仓

---

## 📖 命令参考

### `lingshu init <name>`

初始化新项目。

| 选项 | 说明 |
|------|------|
| `<name>` | 项目目录名（位置参数） |
| `--here` | 在当前目录初始化（不创建子目录） |
| `--remote=<url>` | 设置 git remote origin |
| `--tools=<list>` | 基线工具列表（默认 `claude-code,codex`） |
| `--limbs=<list>` | 肢体仓 `name:url,name:url` 格式 |
| `--no-git` | 跳过 git init |
| `--no-install-hooks` | 跳过 git hooks 安装 |
| `--template=<path>` | 自定义模板路径 |

### `lingshu sync`

重新分发规则到本地 AI 工具。

| 选项 | 说明 |
|------|------|
| `--check` | 仅校验（CI 模式，不写文件） |
| `--baseline` | 仅同步基线工具 |
| `--only=<list>` | 仅同步指定工具 |

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
| `add <name> <git-url>` | 克隆新肢体仓 |

---

## 🤖 支持的 AI 工具

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

## 🏗️ 项目结构

```
@lingshu/cli/
├── bin/lingshu.mjs            # CLI 入口
├── src/
│   ├── commands/              # 5 个子命令实现
│   ├── core/                  # 适配器引擎、模板渲染、git 封装
│   └── utils/                 # 日志、参数解析
├── templates/default/         # 默认模板（即 lingshu-template 当前状态）
└── tests/smoke.test.mjs       # 端到端 smoke 测试
```

零依赖：纯 Node.js 内置模块，要求 Node >= 18。

---

## 🧪 开发

```bash
git clone git@github.com:imrui/lingshu-cli.git
cd lingshu-cli

npm test            # 运行 smoke 测试
node bin/lingshu.mjs --help   # 本地试运行
npm link            # 全局链接，方便调试
```

---

## 🔁 CI 流水线（GitHub Actions）

| Job | 触发 | 作用 |
|-----|------|------|
| `test:smoke` | 每次 push / PR | 运行 5 个 smoke 测试 |
| `test:cli-help` | 每次 push / PR | 验证 CLI 启动（version/help） |

### 分支策略

- **master**：稳定分支，仅通过 PR 合并
- **feat/***：功能分支
- **fix/***：修复分支
- 严禁直推 master（团队约定）

### 版本发布

通过 git tag 锁定版本（不发包）：

```bash
npm version patch              # 0.2.0 → 0.2.1，自动打 tag
git push origin master --tags  # 推送 tag

# 团队成员安装指定版本
npm i -g git+ssh://git@github.com/imrui/lingshu-cli.git#v0.2.1
```

---

## 📜 设计哲学

1. **零依赖**：纯 Node 内置模块，避免 `node_modules` 膨胀
2. **跨平台**：Win/macOS/Linux 等价行为
3. **薄包装**：CLI 不做模板里 `.lingshu/scripts/` 已能做的事
4. **可演进**：模板可替换，适配器可扩展

---

## 🛣️ 路线图

| 命令 | 状态 |
|------|:---:|
| `init` | ✅ |
| `sync` | ✅ |
| `doctor` | ✅ |
| `tool` | ✅ |
| `limb` | ✅ |
| `archive` | 🚧 P3 |
| `upgrade` | 🚧 待规划 |

---

## 📄 License

[MIT](./LICENSE) © 2026 imrui

> 注：CLI 内嵌的模板（`templates/default/`）`package.json` 中 `license` 字段保持 `UNLICENSED` 占位，由通过 `lingshu init` 派生的新项目作者自决。

---

**中枢一动，全栈皆通。**
