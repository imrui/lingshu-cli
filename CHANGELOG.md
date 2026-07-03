# 更新日志 (Changelog)

本项目的所有显著变更都记录于此。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.3.1] - 2026-07-03

> **主题：工作流瘦身（Slim Workflow）** —— 连自己写的规矩也开始做减法。

### 背景

v0.3 之后的用户反馈聚焦在同一件事：**AI 工作流约束过繁**。
`reference/rules/ai-behavior.md` 中的"强制存档（CRITICAL）"与"自动化归档守卫"
四件套（plans / tasks / walkthroughs / reports）与 Claude Code、Codex 的内置计划
能力高度重叠；证据是模板 6 个月来 `reference/management/` 零真实产物——流程本身
从未被落地。

### Changed（非 BREAKING）

- **`reference/rules/ai-behavior.md` 真源大瘦身**：删除"强制存档 (CRITICAL)"与
  "自动化归档守卫"两段；措辞由"必须 / CRITICAL"改为"建议 / 可选"。保留寻源、
  跨端同步、原子化三条软建议；交付规约（中文、Commit 格式、分支约束）保持硬约束。
- **"计划与追踪"改用通用措辞**：不再点名 `TaskCreate` / `Plan 模式`
  等 Claude Code 专属术语，改为"使用工具自身的规划机制"，兼容 Cursor / Codex /
  Trae / Qoder 等所有分发目标；从引用块提到正文与其它软建议并列。
- **`reference/rules/lingshu-core.md`**：
  - §2 Git 隔离规则中"允许追踪 `reference/management/`"改为
    "允许追踪 `reference/` 治理资产（含可选 `decisions/`）"。
  - **§4 Stack Standard 整段删除**——Python `uv --link-mode copy` / Node `npm`
    等技术栈偏好属模板作者视角，不进中枢真源；派生仓的技术栈约定应写在
    `reference/docs/` 下自主定义。规则真源保持技术中立。
- **模板骨架瘦身**：
  - `templates/default/reference/management/` 四子目录整体删除；
    新增 `templates/default/reference/decisions/README.md`（ADR 说明）。
  - `templates/default/reference/experience/` 整体删除——原示例内容
    （`pitfalls/*.md`、`prompts/*.md`）属模板作者积累的经验，派生仓拿到会
    分不清是自己的还是模板的；改为按需自建（呼应 `decisions/` 的"可选目录"模式）。
- **`reference/decisions/README.md` 技术中立化**：删除"灵枢的档案目录"
  "v0.3.1 引入，取代原 management 四件套"等模板作者视角落款，避免派生仓
  看到不属于自己的演进史；`upgrade` 命令内嵌的同版本 README 同步修正。
- **`reference/docs/README.md` 增加可选扩展建议**：列出 `prd/` / `tad/` /
  `api/` / `schema/` 等推荐子目录约定，供仓库承担"设计文档 + 编码过程"两职
  时按需自建；不预置骨架、不强制、不使用数字前缀。
- **`reference/README.md` 与模板 README**：目录说明去 experience/、去
  management 四件套；`docs/` 描述带上可扩张子目录的注脚。
- **`ai-behavior.md` §1 去掉"计划与追踪"软建议条**：属于"否定式历史包袱"
  ——只有从旧规则迁移来的仓库才有"曾经被要求 `.plan.md`"的背景，全新派生仓的
  开发者读到"**不再**要求…"会疑惑"我什么时候被要求过？"。AI 用不用自身规划
  能力它自己知道，不需要中枢真源"授权"。§1 至此仅剩寻源 / 跨端同步 / 原子化
  三条软建议。
- **CLI 模板 `README.md` 大瘦身为"派生仓骨架版"**：删除灵枢架构宣言、核心特性
  表、"若白知行出品"、`MIT © 2026 imrui` 版权段、"手动接入 / 项目变身"教程等
  仅对**初次访问灵枢仓库的人**有意义的内容——派生仓开发者已完成 init，这些
  是历史噪音。保留：项目结构、AI 工具矩阵、目录导航、命令速查、日常工作流、
  开发流程、三条核心约定。顶部改为项目名占位（`lingshu-template` → init 时
  替换）+ 一句话定位占位；底部保留一句技术出处脚注。
- **CLI 模板 `reference/manifesto-origin.md` 删除**：灵枢名称溯源（《黄帝内经》
  典故 + 三重架构隐喻）属**灵枢品牌资产**，派生仓在自己产品仓里看到"为什么
  有黄帝内经"会疑惑。本仓 `lingshu-template` 保留（作为主仓品牌介绍）。
- **CI 工作流注释中性化**：`.github/workflows/rules-consistency.yml`
  第 6 行硬编码 `v0.3 零侵入` 改为"通过 npx 调用全局 CLI"，去掉版本号。
- **规则真源 frontmatter 精简为仅 `order`**：5 字段（`order` / `name` /
  `description` / `globs` / `trigger`）缩到 1 字段。
  - `name` 引擎从未读取（sources 从文件名派生）——纯冗余；
  - `globs: **/*` 与 `trigger: always_on` 是 Cursor 默认值——占位样板；
  - `description` 仅对 Cursor UI 有意义，可由用户按需自加（逃生舱思路）；
  - `order` 控制多规则合并顺序，是引擎唯一必需字段，保留。
  副作用：Cursor `.mdc` 产物不再带 frontmatter（当规则真源只有保留字段时）。
  功能不减——Cursor 会按文件名展示、默认 `always_on`。
- **`upgrade` v0.2 → v0.3 迁移时也只注入 `order`**：不再迁入旧
  `.lingshu/config/adapters.mjs` 中的 cursor `description/globs/trigger`
  ——那些属"模板作者视角"的默认样板，从旧仓库带过来只会让新真源变脏。
- **smoke 测试**：`生成的 cursor 产物含规则文件自身的 frontmatter` 用例
  换语义为"order 是保留字段、不输出到 .mdc"；`upgrade v0.2 → v0.3 机械迁移`
  用例断言旧 description 不再迁入。测试数仍为 22（净变化 0）。

### Debranding（规则真源与产物去品牌自称）

派生仓 AI 每次读 CLAUDE.md 都会看到"# 灵枢 (LingShu) — Claude Code 项目指令"
和"# 灵枢架构核心准则"作为主标题，会误把架构名当项目名（"我在做灵枢项目吗？"）。
本次将品牌自称从**所有会进入派生仓文件系统的位置**移除，保留"中枢-肢体"作为
技术隐喻。

- **产物头部去品牌**：`registry.mjs` 的 `fileHeader` 从
  ``# 灵枢 (LingShu) — ${title}`` 改为 ``# ${title}``；CLAUDE.md/AGENTS.md
  主标题现分别为"Claude Code 项目指令" / "AI Agents 项目指令"，无品牌前缀。
- **规则真源标题脱敏**：
  - `lingshu-core.md`：`# 灵枢架构核心准则 (LingShu Core Principles)`
    → `# 架构核心准则`；正文 `本仓库遵循 **LingShu** 架构` 改为
    `本仓库采用"中枢-肢体"分层结构`。
  - `ai-behavior.md`：`# 🤖 灵枢智能体行为准则 (Agentic Workflow)`
    → `# AI 智能体行为准则`。
- **规则真源 emoji 去除**：🧠 / 💪 / 🚫 / ✅ / 🛡️ / 🤖 装饰性 emoji
  从两份规则真源移除（呼应 v0.2.1 "去 emoji" 决策，本轮才彻底贯彻到规则文件）。
- **"中枢-肢体" 技术隐喻保留**：作为分层结构的准确技术描述词
  （中枢仓 = 顶层父仓、肢体仓 = 嵌套子仓），不属品牌口号。
- **模板 `reference/README.md` 中性化**：从"灵枢架构 (LingShu Architecture)"
  + `> "中枢一动，全栈皆通。"` 改为纯目录说明"reference/ — 治理资产"。
- **模板 `_gitignore` 头注释脱敏**：`# 灵枢架构 (LingShu) 核心忽略规则`
  → `# 核心忽略规则`；`# 灵枢架构采用嵌套克隆模式` 去品牌自称；
  基线工具列表的 ✅ 装饰改为 `-`。
- **`hooks.mjs` post-merge 脚本头脱敏**：`# 灵枢 post-merge hook` →
  `# post-merge hook`；echo 消息 `检测到灵枢规则变更` → `检测到规则变更`。
- **CI workflow 去品牌**：`.github/workflows/rules-consistency.yml`
  头部注释 `# 灵枢架构 — CI 一致性守护` → `# CI 一致性守护`；job name
  `校验灵枢规则一致性` → `校验规则一致性`。
- **模板 `README.md` 底部脚注瘦身**：从
  `> _本仓由 [灵枢架构](https://github.com/imrui/lingshu-cli) 初始化..._`
  改为 `> _修改 reference/rules/ 真源后运行 lingshu sync 重新分发。_`——
  去掉品牌链接，只留纯技术说明。

**保留（合理自我标识，不进派生仓文件系统）**：
- CLI 命令输出的 `log.banner('灵枢项目初始化')` 等——用户主动装的 CLI 工具的
  自我标识，类似 `docker`/`git` 命令输出带工具名。
- `lingshu sync` / `lingshu doctor` 等命令名——技术必要引用。
- CLI 源码 JSDoc 与错误消息——不进派生仓文件系统。
- 本仓 `lingshu-template` 的 `reference/README.md` 与 `manifesto-origin.md`——
  本仓是灵枢主仓门面，保留品牌合理。

### Fixed（顺手修复的技术债）

- **`doctor.mjs` 目录检查列表过时**：仍检查已删除的
  `reference/management/{plans,tasks,walkthroughs,reports}/` 四子目录——
  本轮 v0.3.1 已删 management/，doctor 会全部报"缺失"，是 bug。
  重写检查逻辑为：
  - [1/3] 物理完整性：仅 `reference/rules` + `reference/docs` 必需；
    `reference/decisions/` 存在时提示（可选目录）。
  - [2/3] SSoT 真源：`ai-behavior.md` + `lingshu-core.md`。
  - [3/3] **基线产物**（取代原"灵枢宣言"检查）：`CLAUDE.md` + `AGENTS.md`；
    缺失只 warn（可由 `lingshu sync --baseline` 补齐）。
- **`doctor.mjs` 品牌宣言检查删除**：原 [3/3] `if (txt.includes('中枢一动，全栈皆通'))`
  依赖旧品牌口号存在于 `reference/README.md`——本轮模板已去该口号，此检查
  必然失败。改为基线产物检查后彻底解耦品牌。
- **CLI 仓 `README.md` 5 处过时描述修正**（非品牌问题，是随本轮改动的
  漂移债）：
  - Git 直装示例锁定版本 `v0.3.0` → `v0.3.1`；
  - `lingshu doctor` 描述从 "SSoT 真源 + 灵枢宣言" 改为
    "物理完整性 + SSoT 真源 + 基线产物"（与新 doctor 三步逻辑对齐）；
  - `lingshu upgrade` 迁移路径补充 v0.3.0 → v0.3.1 slim 说明；
  - 路线图删除 `archive 🚧 待规划`（已由 `reference/decisions/` ADR 取代）；
  - "smoke 测试（17 项）" → "smoke 测试（22 项）"。
- **本仓 `lingshu-template` 的 CI workflow 与 CLI 模板对齐**：
  本仓 `.github/workflows/rules-consistency.yml` 上轮遗漏同步，仍为
  `# 灵枢架构 — CI 一致性守护` + `校验灵枢规则一致性`。本轮同步为
  模板脱敏版，避免两份事实副本漂移。

### Added

- **`reference/decisions/`（ADR）**：架构决策记录目录，**可选**。仅记录架构级
  技术选型、数据库迁移、破坏性 API 变更、跨仓协议变更、事故复盘的决策链条；
  日常任务不写 ADR，走 Git commit + PR 描述即可。
- **`lingshu upgrade` v0.3.0 → v0.3.1 分支**：自动瘦身派生仓工作流。
  - 空的 `reference/management/{plans,tasks,walkthroughs,reports}/` 直接删除；
  - 含用户内容的子目录**保留** + 输出迁移建议；
  - 若 `reference/decisions/` 不存在则创建 + 写入 ADR README；
  - 规则真源仍含旧措辞（"自动化归档守卫" / "CRITICAL" / `reference/management/`）
    时**输出手动更新提示**，本命令不改写用户规则内容；
  - 支持 `--dry-run` 预览。
- smoke 测试 17 → 22（+5）：覆盖 slim 迁移全路径与幂等性。

### Migration

从 v0.3.0 升级到 v0.3.1：

```bash
npm i -g @ruobai/lingshu@latest
cd path/to/lingshu-project
lingshu upgrade --dry-run   # 预览
lingshu upgrade             # 执行
```

派生仓中已归档的自定义方案文件（`reference/management/plans/*.plan.md` 等）
**不会被删除**，只是输出建议，可自行决定是否迁至 `reference/decisions/`。

## [0.3.0] - 2026-05-31

> **主题：零侵入 (Zero-Intrusion)** —— CLI 即唯一引擎，派生仓只保留治理资产。

### ⚠️ BREAKING CHANGES

- **派生仓不再携带 `.lingshu/` 目录与 `package.json`**。同步引擎完全内置于 CLI，
  仓库只保留 `reference/` 治理资产与 AI 工具产物。
- **同步统一走 `lingshu sync`**，不再有 `npm run sync`。团队每位成员需各自
  `npm install -g @ruobai/lingshu` 一次；CI 改用 `npx -y @ruobai/lingshu`。
- **`tool` 命令重设计**：`baseline`/`personal` → `track`/`untrack`，直接编辑
  `.gitignore`（`.gitignore` 成为「入库 vs 忽略」的唯一真相）。

### Added

- **内置 adapter 注册表**（`src/core/registry.mjs`）：6 大工具开箱即用，零配置。
- **`lingshu upgrade`**：将存量项目迁移到零侵入结构。
  - v0.2.x → v0.3：删 `.lingshu/`、删/瘦身 `package.json`、把 cursor frontmatter
    迁入 `reference/rules/*.md`、改造 CI、重装 hooks、重生成基线产物。
  - 灵枢 1.0（无 `reference/rules/` 真源）：检测并给出手动迁移指引，不做有损迁移。
  - 支持 `--dry-run` 预览、`--force`。
- **`lingshu hooks install`**：为存量项目补装内置 git hooks。
- **零配置逃生舱**：可选 `reference/.lingshu.json` 声明自定义适配器 / 覆盖基线。
- **规则文件自带 frontmatter**：`reference/rules/*.md` 通过 `order` 控制合并顺序，
  cursor 的 `.mdc` frontmatter 直接读自规则文件本身。

### Changed

- 同步引擎（`src/core/adapters.mjs`）从「读项目内 `.lingshu/config/adapters.mjs`」
  改为「读内置注册表 + 约定发现 `reference/rules/*.md`」。
- `init` 不再写入 `package.json` / `adapters.mjs`；git hooks 改为 CLI 内联写入
  `.git/hooks/`（不再依赖 `postinstall`）。
- 模板瘦身：移除 `templates/default/` 内的 `.lingshu/`、`package.json` 及预置
  `CLAUDE.md`/`AGENTS.md`（改为 `init` 时生成）。
- 生成产物头部与规则真源中对旧引擎（`.lingshu/scripts` / `npm run sync`）的引用
  统一更新为 `lingshu sync`。
- smoke 测试扩充至 17 项，覆盖零侵入契约、`tool track/untrack`、`upgrade` 全路径。

## [0.2.6] - 2026-05-08

### Fixed

- `limb add/init/adopt` 成功后自动维护 `.gitignore`：非约定命名追加 `<name>/`，
  约定命名（被 `*-server/` 等通配覆盖）幂等跳过。

## [0.2.5] - 2026-05-08

### Fixed

- 修复派生项目缺失 `.gitignore`：npm publish 会把 `.gitignore` 当 `.npmignore`
  并自身排除。模板内改名为 `_gitignore`，`init` 时复原为 `.gitignore`。

## [0.2.4] - 2026-05-08

### Added

- `sync` 默认 auto 模式：仅同步 baseline + 已存在产物的 personal 工具。
- `limb init`（创建空肢体 + git init）与 `limb adopt`（纳入已有本地目录）。

## [0.2.3] - 2026-05-08

### Changed

- `init` 默认仅生成基线产物（baseline-only），新增 `--all-tools`。
- `init` 注入项目身份至 `package.json` 的 `description`。

## [0.2.2] - 2026-05-08

### Fixed

- 修复致命 bug：`copyTemplate` 用绝对路径匹配 `node_modules`，导致全局安装时
  整个模板树被误过滤为空。改为只看相对模板根的路径。

## [0.2.1] - 2026-05-08

### Changed

- 文档清理：去除 SyncBase 双品牌、夸大词与 🌀 图标。

## [0.2.0] - 2026-05-08

### Added

- 首次开源发布：GitHub + npm 公网 + MIT 协议。
- 核心命令 `init` / `sync` / `doctor` / `tool` / `limb`。
- 包名 `@ruobai/lingshu`（若白知行 npm scope）。

[0.3.1]: https://github.com/imrui/lingshu-cli/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/imrui/lingshu-cli/compare/v0.2.6...v0.3.0
[0.2.6]: https://github.com/imrui/lingshu-cli/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/imrui/lingshu-cli/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/imrui/lingshu-cli/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/imrui/lingshu-cli/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/imrui/lingshu-cli/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/imrui/lingshu-cli/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/imrui/lingshu-cli/releases/tag/v0.2.0
