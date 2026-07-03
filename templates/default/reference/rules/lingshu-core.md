---
order: 1
---
# 架构核心准则

## 1. 拓扑定义
本仓库采用"中枢-肢体"分层结构：

- **中枢仓 (The Brain)**：
  - **路径**：当前根目录 `./`
  - **职责**：定义真源（Reference）、规则（Rules）与架构决策（Decisions）。
  - **特征**：仅追踪文档与配置，不包含业务源代码。

- **肢体仓 (The Limbs)**：
  - **路径**：根目录下的具体工程子目录（通常命名为 `*-server`、`*-ui`、`*-mobile`、`*-web`）。
  - **职责**：承载具体的业务代码实现。
  - **识别规则**：AI 需自动扫描根目录，识别包含 `.git`（子模块 / 嵌套仓）或具体语言配置（如 `pyproject.toml`、`package.json`）的子文件夹作为"肢体"。

## 2. Git 物理隔离规则
由于采用嵌套仓库结构，必须严格遵守以下操作边界：

- **禁止根目录通配提交**：
  - **严禁**在根目录执行 `git add .` 或 `git commit -a`——这会导致肢体仓的代码被错误地纳入中枢仓版本控制。
  - 根目录 Git **仅允许**追踪：`reference/` 治理资产（真源规则、docs、可选 decisions/），以及 AI 工具基线产物（`CLAUDE.md`、`AGENTS.md`）。

- **肢体仓独立提交**：
  - 修改具体业务代码后，必须显式 `cd [limb-folder_name]/` 进入子目录。
  - 确认 `git status` 显示的是子仓库的状态后，再执行提交。

- **提交前自检**：
  - AI 在生成 Git 指令前，必须判断当前变更的文件路径。
  - 若路径属于 `*-server/` 或 `*-ui/`，必须输出 `cd` 指令作为前置操作。

## 3. 规则真源约束（SSoT）

- **真源唯一**：所有 AI 行为规则的真源位于 `reference/rules/`。
- **产物只读**：`.cursor/rules/`、`.trae/rules/`、`.qoder/rules/`、`.agent/rules/`、`CLAUDE.md`、`AGENTS.md` 均为**由 `lingshu sync` 自动生成的产物**，禁止手动编辑。
- **变更流程**：规则修改必须改动 `reference/rules/` 真源，再执行 `lingshu sync` 重新分发。
- **CI 保障**：GitHub Actions 会校验入库产物与真源的一致性，防止漂移。

---
