# 避坑指南 001：全栈端口冲突与“禁止漂移”原则

- **关联领域**: #DevOps #Networking #Antigravity
- **适用 Agent**: Antigravity, Cursor, Trae, Qoder
- **创建日期**: 2026-01-16

---

## 1. 陷阱描述 (The Pitfall)
AI 在检测到默认端口（后端 5000, 前端 5173）被占用时，会**自动递增端口**（如尝试 5001 或 5174）以绕过错误，而不是解决冲突。

## 2. 负面影响 (Impact)
- **跨域失效**: 前端 Proxy 指向 5000，后端漂移到 5001 导致 API 请求全部失败。
- **孤儿进程堆积**: 端口占用通常是旧进程（Flask Reloader）未释放，逃避导致系统资源持续耗损。
- **环境一致性破坏**: 导致前后端链路无法对齐，浪费大量调试时间。

## 3. 根因分析 (Root Cause)
Agent 的默认决策树中，“启动成功”的权重高于“清理环境”。它不感知 Windows 11 下 Python/Node 进程树的复杂性，误以为旧进程已死。

## 4. 解决方案 (Lingshu Solution)

### 强制原则：端口归位 (Port Anchoring)
严禁任何形式的端口漂移。必须执行 **“检查 -> 强杀 -> 校验 -> 重启”** 的原子流。

### 避坑指令 (Windows 11):
- **后端 (5000)**: `taskkill /F /IM python.exe /T` (强制清理进程树)
- **前端 (5173)**: `taskkill /F /IM node.exe /T`
- **校验**: 必须执行 `netstat -ano | findstr :<PORT>` 确保输出为空后方可重新启动。

## 5. 规则同步 (Rules Sync)
该指南已固化至：
- `.agent/rules/network_guard.md`
- `.agent/workflows/service_reboot.md`

---
**[架构师笔记]**: 这是灵枢架构的第一块基石。以后凡是涉及环境重启，必须先调用此守卫逻辑。
