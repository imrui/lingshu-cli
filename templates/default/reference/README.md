# reference/ — 治理资产

本目录是仓库的**真源层**——业务契约、AI 规则、架构决策统一收敛于此，
代码作为文档的投影 (Projection)。

## 目录

- **`rules/`**：AI 规则真源。分发到 `CLAUDE.md`、`AGENTS.md` 等产物。
- **`docs/`**：真源文档。存储 PRD、API 契约、状态机定义；可按需扩张 `prd/`、`tad/` 等子目录（见 [docs/README.md](./docs/README.md)）。
- **`decisions/`**：架构决策记录 (ADR)，可选。仅记录架构级决策；日常任务走 Git commit 与 PR 描述。

---

> 修改 `rules/` 真源后运行 `lingshu sync` 重新分发。
