# ⚠️ 避坑指南：FastAPI 异步锁问题

**问题描述**: Cursor 在生成异步接口时，偶尔会忽略数据库连接池的释放。

**解决方案**:

- 在 `.cursor/rules/tech-stack-py.mdc` 中强制要求使用 `async with` 语法。
- 每次生成的代码必须包含单元测试以验证并发稳定性。
