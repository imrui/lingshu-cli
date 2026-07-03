# Architectural Decision Records (ADR)

> 记录本仓库**架构级决策**的目录，**可选**——只在需要时创建条目。

## 何时写 ADR

- 架构级技术选型
- 数据库 Schema / Migration 决策
- 破坏性 API 变更
- 跨仓协议变更
- 事故复盘的关键决策链条

**日常任务不写 ADR**——决策链条走 Git commit message 与 PR 描述即可。

## 命名与格式

- 文件名：`ADR-NNNN-<slug>.md`（例：`ADR-0001-<slug>.md`）
- 编号连续递增，不跳号；被 Superseded 的条目保留原文件不删。
- 建议章节：**Context** / **Decision** / **Consequences** / **Alternatives**
- 参考：<https://adr.github.io/>

## 状态字段（frontmatter 建议）

```yaml
---
adr: 0001
title: <决策标题>
status: Accepted   # Proposed | Accepted | Superseded | Deprecated
date: YYYY-MM-DD
supersedes: null
superseded_by: null
---
```

## 与 Git / PR 的分工

- **一次编辑背后的"为什么"** → PR 描述
- **一个决策背后的"权衡"** → ADR（跨越多次编辑，可被后来的决策 Supersede）
