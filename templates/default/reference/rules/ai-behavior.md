---
order: 2
name: ai-behavior
description: 灵枢智能体行为准则：Plan 模式存档、真理同步流与原子化交付
globs: **/*
trigger: always_on
---

# 🤖 灵枢智能体行为准则 (Agentic Workflow)

## 1. 思考模式：真理驱动 (Truth Driven)
在 **Ask 模式** 或 **Composer 模式** 中，遵循以下逻辑链：

1.  **🔍 寻源 (Locate Truth)**:
    - 遇到需求变更，**首先** 检查 `reference/docs/` 下的 API 契约、数据库 Schema 或 PRD。
    - 若文档未定义，先建议用户更新文档，而不是直接写代码。
    - **口号**: "逻辑不入中枢，代码不动分毫。"

2.  **📝 规划 (Planning)**:
    - 进入 Composer (Plan) 模式后，必须生成/更新 `.plan.md`。
    - **强制存档 (CRITICAL)**: 在执行代码修改前，必须将当前的 `.plan.md` 完整复制备份到 `reference/management/plans/` 目录下，并更新 `reference/management/tasks/` 中的执行清单。文件名格式建议：`YYYYMMDD-TaskName.md`。

3.  **⚡ 执行 (Execution)**:
    - **跨端同步**: 始终检查后端变更对前端的影响（如 API 字段变动），并主动提示同步修改。
    - **原子化**: 每次只处理一个具体的逻辑闭环，避免跨多个不相关的功能模块修改。

## 2. 自动化归档守卫 (Archival Guard)
每当一个任务进入 **Done** 状态，AI 必须强制执行以下同步操作：

1.  **方案固化**: 将最终修订的 `.plan.md` 完整备份至 `reference/management/plans/`。
2.  **存证生成**: 生成一份详尽的 `Walkthrough`，记录本次重构的逻辑决策、核心代码变更及验证结果，存放至 `reference/management/walkthroughs/`。
3.  **任务闭环**: 更新 `reference/management/tasks/` 中的执行记录，标注所有步骤已完成。
4.  **专项审计 (Conditional)**:
    - 若本次任务涉及 **数据库变更** (Schema/Migration)，必须在 `reference/management/reports/` 中生成一份 `Migration_Report`。
    - 文件命名标准: `YYYYMMDD_ID_TaskName.[plan|tasks|walkthrough|report].md`

## 3. 交付规约 (Delivery Protocol)

- **交互语言**: 始终使用 **简体中文** 进行对话回复。
- **Git 提交信息格式**:
  - **语言**: 必须使用 **简体中文** 描述变更。
  - **中枢仓**: `docs: <描述>`, `chore: <描述>`, `plan: <描述>`
    - *示例*: `docs: 更新发票 API 契约`
  - **肢体仓**: `<type>(<scope>): <描述>`
    - *示例*: `feat(storage): 实现文件生命周期管理`

- **分支管理**:
  - 开发工作必须在 `feat/*` 或 `refactor/*` 分支进行，严禁直推 `master/main`。

- **自我修正 (Self-Correction)**:
  - 如果用户指出代码与文档不符，**必须** 优先以文档（中枢真理）为准进行修正，或者询问用户是否需要反向更新文档。

---
