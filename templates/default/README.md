# lingshu-template

> _请将本行替换为项目一句话定位。_

---

## 项目结构

- **中枢仓**（当前根目录）：定义业务真源（`reference/docs/`）与 AI 规则（`reference/rules/`）。
- **肢体仓**（`*-server/` / `*-ui/` / `*-mobile/` / `*-web/` 等嵌套子目录）：承载业务代码，各自独立提交。

## AI 工具支持矩阵

| 工具 | 产物路径 | 是否入库 | 角色 |
|------|---------|:---:|------|
| **Claude Code** | `CLAUDE.md` | ✅ | **团队基线** |
| **Codex / 通用 Agents** | `AGENTS.md` | ✅ | **团队基线** |
| Cursor | `.cursor/rules/*.mdc` | ❌ | 个人偏好 |
| Trae | `.trae/rules/*.md` | ❌ | 个人偏好 |
| Qoder | `.qoder/rules/*.md` | ❌ | 个人偏好 |
| Antigravity | `.agent/rules/*.md` | ❌ | 个人偏好 |

> 是否入库由 `.gitignore` 决定，可用 `lingshu tool track/untrack <工具>` 调整。

---

## 目录导航

```text
.
├── reference/                   # 治理资产（中枢真源）
│   ├── rules/                   # AI 规则 SSoT
│   │   ├── lingshu-core.md      # 架构核心准则
│   │   └── ai-behavior.md       # 智能体行为准则
│   ├── docs/                    # 真源文档：PRD、契约、架构（可扩张 prd/、tad/）
│   └── decisions/               # ADR：架构决策记录（可选，仅架构级决策才写）
│
├── CLAUDE.md                    # Claude Code 入口（基线产物，由 lingshu sync 生成）
├── AGENTS.md                    # Codex / 通用 Agents 入口（基线产物）
│
├── .cursor/  .trae/  .qoder/    # AI 工具规则目录（按需生成 / gitignore）
├── .agent/                      # Antigravity 规则目录
│
├── .gitignore                   # 忽略规则（物理隔绝肢体仓 + 个人产物）
└── README.md

# 可选设施（默认不装，需运行 `lingshu ci install` 加装）
# └── .github/workflows/         # GitHub Actions CI 一致性守护
```

---

## 日常工作流

### 修改 AI 规则

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

- **`git pull` 后** → `post-merge` hook 检测 `reference/rules/` 变更，自动 `lingshu sync`
- **PR 提交时** → GitHub Actions 校验 baseline 产物一致性（可选，`lingshu ci install` 加装）

---

## 开发流程

1. **定策**：在 `reference/docs/` 修改功能逻辑或 API 协议
2. **对齐**：若涉及 AI 行为规则，更新 `reference/rules/` 真源
3. **触动**：唤醒 AI 工具，发出指令"请根据中枢文档同步更新肢体逻辑"
4. **皆通**：检查全栈代码逻辑闭环；架构级决策才写 `reference/decisions/`（ADR）

---

## 三条核心约定

1. **文档先行**：禁止在没有更新中枢文档（`reference/docs/`）的情况下直接修改业务代码
2. **脑体解耦**：中枢仓严禁提交任何属于肢体仓（`*-server/`、`*-ui/` 等）的业务代码
3. **同频交付**：日常任务走 Git commit + PR 描述；仅**架构级决策**记录到 `reference/decisions/`（ADR，可选）

---

> _修改 `reference/rules/` 真源后运行 `lingshu sync` 重新分发。_
