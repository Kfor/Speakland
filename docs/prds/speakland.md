# Speakland 启动链路与工程收敛冲刺

## Background
当前用户视角启动受阻：Expo 启动阶段出现 react-native-purchases 插件解析失败；工程内存在多目录/历史代码导致类型检查雪崩，影响持续开发。

## Target Users & Scenarios
- 移动端开发者：需要稳定启动与调试
- 产品/测试：需要最小旅程可验证

## User Flow
1. 拉代码并安装依赖
2. 启动 Expo（至少 web 可用）
3. 可进入主页面/登录入口并执行 smoke 验收

## Core Requirements
1. 修复 Expo 插件解析与版本兼容问题
2. 收敛 tsconfig 范围，降低非核心路径噪声
3. 建立最小用户旅程 smoke 验收清单

## Design / Constraints
- 优先保证启动成功
- 最小化改动范围，避免破坏已完成功能
- 失败项需给出明确下一步

## Out of Scope
- 全量类型零错误一次性清理
- 新业务功能扩展
