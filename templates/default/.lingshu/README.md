# 🌀 .lingshu/ — 项目元数据空间

> 本目录是 **灵枢架构** 的"项目内核"，独立于任何 AI 工具，承载项目级脚本与配置。

## 目录结构

```
.lingshu/
├── config/
│   └── adapters.mjs       # AI 工具适配清单（SSoT → 各工具产物的映射）
├── scripts/
│   ├── sync-rules.mjs     # 规则分发脚本（核心）
│   ├── doctor.mjs         # 架构健康检查
│   └── install-hooks.mjs  # 安装 git hooks
└── hooks/
    └── post-merge         # 拉取后自动同步规则
```

## 命名说明

`.lingshu/` 不是任何 AI 工具的目录（区别于 `.cursor/`、`.trae/`、`.qoder/`、`.agent/`），
而是 **灵枢架构自身** 的元数据空间，故名 `.lingshu`。

## 常用命令

```bash
npm run sync              # 分发规则到所有 AI 工具目录
npm run sync:check        # 仅校验一致性（用于 CI）
npm run sync -- --only=cursor,codex   # 仅同步指定工具
npm run sync -- --baseline            # 仅同步基线工具
npm run doctor            # 运行架构健康检查
npm run hooks:install     # 安装/更新 git hooks
```

## 工作原理

```
        ┌──────────────────────────────────┐
        │   reference/rules/ (SSoT 真源)    │
        │   ├── ai-behavior.md              │
        │   └── lingshu-core.md             │
        └─────────────┬────────────────────┘
                      │
                      │ sync-rules.mjs
                      │ (按 adapters.mjs 配置)
                      ▼
   ┌──────────────────┴──────────────────┐
   │           生成产物 (artifact)         │
   ├──────────────────────────────────────┤
   │ ✅ baseline (入库):                   │
   │    - CLAUDE.md   (Claude Code)       │
   │    - AGENTS.md   (Codex)             │
   │                                      │
   │ ❌ personal (gitignore):              │
   │    - .cursor/rules/                  │
   │    - .trae/rules/                    │
   │    - .qoder/rules/                   │
   │    - .agent/rules/                   │
   └──────────────────────────────────────┘
```

- **真源唯一**：所有规则改动只能在 `reference/rules/` 进行
- **基线工具入库**：保证团队成员克隆即用（无需先跑脚本）
- **个人偏好工具**：本地生成，不污染 git
- **CI 守护**：GitHub Actions 校验入库产物与真源的一致性
- **Hook 自动化**：`git pull` 后 post-merge 自动重新分发
