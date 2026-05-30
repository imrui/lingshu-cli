# 更新日志 (Changelog)

本项目的所有显著变更都记录于此。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

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

[0.3.0]: https://github.com/imrui/lingshu-cli/compare/v0.2.6...v0.3.0
[0.2.6]: https://github.com/imrui/lingshu-cli/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/imrui/lingshu-cli/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/imrui/lingshu-cli/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/imrui/lingshu-cli/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/imrui/lingshu-cli/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/imrui/lingshu-cli/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/imrui/lingshu-cli/releases/tag/v0.2.0
