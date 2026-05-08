# 灵枢架构 (LingShu Architecture)

> **"中枢一动，全栈皆通。"**

---

## 📜 灵枢宣言 (The Manifesto)

我们坚持 **Single Source of Truth** 原则。

在灵枢架构中，`reference/` 是所有微服务、前端组件、数据库与 AI Agents 的共同上游。

1.  **中枢权威性**：`reference/docs/` 定义业务真源；代码是文档的投影 (Projection)。
2.  **代码对齐**：代码与文档应保持一致；偏离时及时校正其中一方。
3.  **AI 原生**：本架构在设计上考虑 AI 上下文友好——人类在 `reference/` 中定义"意图"，AI 据此实现。

## 📂 目录结构

- **`docs/`**: **真源文档**。存储 PRD、API 契约、状态机定义。
- **`experience/`**: **经验沉淀**。存储 Pitfalls（避坑指南）和 Best Practices。
- **`management/`**: **动态治理层**。下设 `plans/`（战略方案）、`tasks/`（战术任务）、`walkthroughs/`（变更存证）与 `reports/`（审计报告）。

---

> [!NOTE]
> 本项目所有对话回复与 Git 提交信息须使用 **简体中文**。
