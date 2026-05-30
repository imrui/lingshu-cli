# 灵枢 | LingShu

> **中枢一动，全栈皆通。**
> *The Central Hub Acts, The Full-Stack Synchronizes.*

---

## 架构宣言 (Manifesto)

在 AI 原生工程时代，代码的生成速度已远超人类的维护速度。传统的开发模式正面临"逻辑碎片化"挑战。

**灵枢架构 (LingShu)** 提出一种全新的协同方式：**"逻辑收敛于中枢，执行弥散于全栈"**。
通过建立唯一的 **同步基座**，将产品的"逻辑灵魂"从"技术肢体"中抽离 —— 拨动"中枢"这根琴弦，让所有的执行端（AI Agents）产生同频共振。

👉 [**深入了解"灵枢"名称释义与设计哲学**](./reference/manifesto-origin.md)

---

## 核心特性

| 特性 | 说明 |
|------|------|
| 🧠 **中枢-肢体解耦** | 文档/规则集中于中枢仓，业务代码分散于嵌套肢体仓 |
| 📜 **规则 SSoT** | 所有 AI 行为规则统一写在 `reference/rules/`，避免多副本漂移 |
| 🤖 **多 AI 工具适配** | 一处定义，自动分发至 6 大主流 AI 编码工具 |
| 🪶 **零侵入** | 同步引擎在全局 CLI 内，仓库只留治理资产，无 `.lingshu/`、无 `package.json` |
| 🛡️ **CI 守护** | GitHub Actions 自动校验真源与产物的一致性 |
| ⚙️ **拉取自动重分发** | `git pull` 后 post-merge hook 自动重新分发规则 |

---

## AI 工具支持矩阵

| 工具 | 产物路径 | 是否入库 | 角色 |
|------|---------|:---:|------|
| **Claude Code** | `CLAUDE.md` | ✅ | **团队基线** |
| **Codex / 通用 Agents** | `AGENTS.md` | ✅ | **团队基线** |
| Cursor | `.cursor/rules/*.mdc` | ❌ | 个人偏好 |
| Trae | `.trae/rules/*.md` | ❌ | 个人偏好 |
| Qoder | `.qoder/rules/*.md` | ❌ | 个人偏好 |
| Antigravity | `.agent/rules/*.md` | ❌ | 个人偏好 |

> **是否入库由 `.gitignore` 决定**，可用 `lingshu tool track/untrack <工具>` 调整。
> 内置工具不满足需求时，可在 `reference/.lingshu.json` 声明自定义适配器（可选逃生舱）。

---

## 目录导航 (Project Structure)

```text
.
├── reference/                   # 真源 (Reference) — 中枢的全部资产
│   ├── rules/                   # AI 规则 SSoT
│   │   ├── lingshu-core.md      # 架构核心准则
│   │   └── ai-behavior.md       # 智能体行为准则
│   ├── docs/                    # 静态真理：PRD、契约、架构
│   ├── experience/              # 经验复利：高分 Prompt、避坑笔记
│   └── management/              # 动态治理
│       ├── plans/               # 战略：原始方案 (.plan.md)
│       ├── tasks/               # 战术：执行 Checklists
│       ├── walkthroughs/        # 存证：逻辑决策、代码演练
│       └── reports/             # 审计：汇总报告、数据库变更
│
├── CLAUDE.md                    # Claude Code 入口（基线，由 lingshu sync 生成）
├── AGENTS.md                    # Codex / 通用 Agents 入口（基线，由 lingshu sync 生成）
│
├── .cursor/  .trae/  .qoder/    # AI 工具规则目录（按需生成 / gitignore）
├── .agent/                      # Antigravity 规则目录
│
├── .github/workflows/           # GitHub Actions：CI 一致性守护
├── .gitignore                   # 灵枢版忽略规则（物理隔绝肢体仓 + 个人产物）
└── README.md
```

> 同步引擎不在仓库内，而在全局 CLI [@ruobai/lingshu](https://www.npmjs.com/package/@ruobai/lingshu)。仓库保持纯净的开发资产。

---

## 快速开始 (Getting Started)

### 推荐方式：使用 @ruobai/lingshu CLI（一条命令）

[@ruobai/lingshu](https://www.npmjs.com/package/@ruobai/lingshu) 是灵枢架构的官方脚手架（若白知行出品），把下方手动流程压缩为 1 条命令：

```bash
# 一次性安装（团队每位成员各装一次）
npm install -g @ruobai/lingshu

# 一键创建项目（请将 your-org 替换为你的 GitHub 组织或用户名）
lingshu init my-lingshu-app \
  --remote=git@github.com:your-org/my-lingshu-app.git \
  --tools=claude-code,codex \
  --limbs="my-lingshu-app-server:git@github.com:your-org/my-lingshu-app-server.git,my-lingshu-app-ui:git@github.com:your-org/my-lingshu-app-ui.git"
```

详见 [@ruobai/lingshu 安装与命令文档](https://github.com/imrui/lingshu-cli)。

### 手动接入（高级用户 / CLI 不可用时）

在 GitHub 上创建新空白仓库（如 `my-lingshu-app`），然后：

```bash
# 1. 拉取灵枢模版
mkdir my-lingshu-app && cd my-lingshu-app
git init --initial-branch=master
git remote add template git@github.com:imrui/lingshu-template.git
git pull template master

# 2. 推送到自己的远程仓库（请将 your-org 替换为你的 GitHub 组织或用户名）
git remote add origin git@github.com:your-org/my-lingshu-app.git
git push -u origin master

# 3. 嵌套拉取肢体仓（已在 .gitignore 中物理隔离）
git clone git@github.com:your-org/my-lingshu-app-server.git my-lingshu-app-server
git clone git@github.com:your-org/my-lingshu-app-ui.git my-lingshu-app-ui

# 4. 生成基线产物 + 安装 hooks（需先全局安装 @ruobai/lingshu）
lingshu sync --baseline                    # 分发规则到 CLAUDE.md / AGENTS.md
lingshu hooks install                      # 安装 git hooks
lingshu doctor                             # 架构健康检查
```

### 项目结构概览（接入后）

```text
my-lingshu-app/                 # [中枢仓] 逻辑定义与 AI 指令中心
├── my-lingshu-app-server/      # [肢体仓 A] 后端代码（嵌套子仓）
├── my-lingshu-app-ui/          # [肢体仓 B] 前端代码（嵌套子仓）
├── reference/                  # 真理之源
├── CLAUDE.md / AGENTS.md       # 基线 AI 指令
└── README.md                   # 项目指挥总纲
```

### 项目变身（替换占位符，仅手动接入需要）

模版含 `lingshu-template` 字样的占位符。接入后批量替换：

```bash
# Linux/macOS（或 Windows Git Bash）
grep -rl "lingshu-template" --exclude-dir=node_modules . | xargs sed -i 's/lingshu-template/my-lingshu-app/g'

# 或交给 AI 工具：
#   "请将仓库内所有文件中的 'lingshu-template' 替换为 'my-lingshu-app'"
```

替换后执行 `lingshu sync` 重新生成基线产物。

---

## 日常工作流

### 修改 AI 规则（核心流程）

```
       reference/rules/*.md      ← 编辑这里（唯一真源）
              ↓
         lingshu sync             ← 一键分发
              ↓
   ┌──────────┬──────────────┐
   ↓          ↓              ↓
 CLAUDE.md  AGENTS.md   .cursor/.trae/.qoder/.agent/rules/
 (入库)     (入库)      (本地，gitignore)
```

### 命令速查

| 命令 | 用途 |
|------|------|
| `lingshu sync` | 分发规则（baseline + 已激活的个人工具） |
| `lingshu sync --baseline` | 仅同步基线工具（CLAUDE.md / AGENTS.md） |
| `lingshu sync --all` | 同步所有工具 |
| `lingshu sync --only=cursor,codex` | 仅同步指定工具 |
| `lingshu sync --check` | 校验一致性（CI 用，不写文件） |
| `lingshu tool list` | 查看工具矩阵与入库状态 |
| `lingshu tool track/untrack <工具>` | 调整某工具产物是否入库 |
| `lingshu doctor` | 架构健康检查 |
| `lingshu hooks install` | 安装/重装 git hooks |

### 自动化机制

- ⚡ **`git pull` 后** → `post-merge` hook 检测 `reference/rules/` 变更，自动 `lingshu sync`
- 🛡️ **PR 提交时** → GitHub Actions 校验 baseline 产物一致性，漂移即拒绝合并

---

## 开发流程 (Core Workflow)

1. **定策 (Define)**：在 `reference/docs/` 修改功能逻辑或 API 协议
2. **对齐 (Align)**：若涉及 AI 行为规则，更新 `reference/rules/` 真源
3. **触动 (Trigger)**：唤醒 AI（Claude Code / Codex / Cursor），发出指令"请根据中枢文档同步更新肢体逻辑"
4. **皆通 (Sync)**：检查全栈代码逻辑闭环，并产出 `reference/management/walkthroughs/` 存证

---

## 三条核心约定 (Three Rules)

1. **文档先行**：禁止在没有更新中枢文档（`reference/docs/`）的情况下直接修改业务代码
2. **脑体解耦**：中枢仓严禁提交任何属于肢体仓（`*-server/`、`*-ui/` 等）的业务代码
3. **同频交付**：所有交付报告或技术存证必须记录在 `reference/management/walkthroughs/`，作为逻辑对齐的凭证

---

## License

[MIT](./LICENSE) © 2026 imrui

> 注：本仓库为架构模板。基于本模板派生的新项目可自行选择协议。
