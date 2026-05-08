# 避坑指南 002：Agent 浏览器模式的“死循环”陷阱

- **关联领域**: #Agent #Antigravity #Automation
- **适用 Agent**: Antigravity (Agent Mode)
- **创建日期**: 2026-01-16

---

## 1. 陷阱描述 (The Pitfall)

当 Antigravity 修改完 UI 代码后，会尝试以 Agent 模式启动浏览器预览。若此时前后端服务未启动或已崩溃，浏览器会陷入死循环刷新，Agent 不会自动检查终端服务状态。

## 2. 根因分析 (Root Cause)

Agent 模式下的浏览器组件与 IDE 终端组件存在“感知断层”。浏览器 Agent 认为访问失败是网络抖动或渲染问题，而不具备“检查服务器进程”的联想逻辑。

## 3. 灵枢解决方案 (Lingshu Solution)

- **硬性约束**: 所有的浏览器交互指令前，必须插入一步“终端服务存活校验”。
- **判断逻辑**: 使用 `curl` 或 `Invoke-WebRequest` 探测端口响应，而非等待页面超时报错。

---

**[架构师笔记]**: 不要让 Agent 在前台空转，必须让它先低头看一眼后台的命脉。
