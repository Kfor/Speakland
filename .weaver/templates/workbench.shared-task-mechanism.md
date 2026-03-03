## 第一部分：与 Weaver Scheduler 协作指南

### 1) 协作总原则（强制）

- 默认交付策略：任务创建后由 Runner 继续自动交付（含 PR 与 merge）。
- 闭环优先：只要问题在逻辑上可由机器通过“读代码/改代码或配置/执行命令/重试验证”闭环，就必须自主处理。
- 最小复杂度：优先可维护、可验证、改动面最小的方案。
- 证据优先：结论和验收必须可被命令输出、日志或产物验证。
- 严禁手工编辑 `.weaver/tasks.yaml`；新增任务请用 `weaver task add`，状态/备注请用 `weaver task update`。
- 禁止后台运行——所有命令必须前台执行并在本轮返回结果。
- 单次 Workbench 调用必须前台完成：本轮决定要做的动作必须在本轮内完成，不创建"稍后再做"的占位。

### 2) Environment Bootstrap 与自救 Runbook（强制）

PRD 中以下两段必填，不可省略：

1. `## Environment Bootstrap`
- 核心判断：**一个新 agent 拿到这个 PRD，能否不问问题、从零完成环境搭建到开始跑测试？** 缺什么写什么，不缺不写。
- 必须包含可直接执行的命令，不要只写概念性描述。
- **端口分配**：若项目需要 dev server，必须指定非默认端口或说明端口选择策略。多项目并行开发时默认端口（3000、1420、5173、8080 等）大概率已被占据。推荐：在配置中固定一个项目专属端口，或写明启动前检查 + 动态分配的方法。

2. `## Failure Recovery Runbook`
- 核心判断：**当 agent 在关键链路上遇到失败时，能否靠这份 runbook 自救而不转 NEEDS_HUMAN？**
- 基于项目代码和文档推断高概率失败点，每条提供可前台执行、可复现、可验证的自救路径。

### 3) NEEDS_HUMAN 判断原则

**核心问题：这个阻塞是否只有人类能解除？**

能通过代码、配置、命令、公开文档解决的 → 不是 NEEDS_HUMAN，自主推进。
只有人类能提供的（私有凭证、付费审批、主观决策）→ NEEDS_HUMAN，写清需要谁提供什么。

### 4) 验收标准（强制）

- 不得为推进流程而降低验收标准。
- 核心判断：**如果实现是错误的，现有的验收测试能否发现？** 如果不能，测试不够。
- 验收标准中的每一项都必须有对应的、真实运行过的测试证据。无证据 = 未验收。
- 测试无法执行时，先按 runbook 自救；仅在证明"机器无法闭环"后才可转 `NEEDS_HUMAN`。

### 5) PRD 归档、任务创建、依赖声明

**任务拆分原则**：

拆任务时问自己：
- **这个任务能独立交付和验证吗？** — 如果任务 B 必须等任务 A 的代码才能开始，那就是依赖，必须显式声明。
- **Runner 拿到这个任务描述，能否不问问题就开工？** — 如果不能，说明描述不够具体。
- **验收标准是否可验证？** — "做得好"不是验收标准；"用户能从首页走完下单流程"是。

**创建规则**：
- 默认直接创建，不等待确认。创建前先输出标题、详细描述、验收预期、关键约束。
- Task Request 必须具体到可直接实现：目标、范围/边界、关键行为、主要约束、PRD 路径。
- `--acceptance` 必须写明用户可感知结果与验收证据要求。
- 长耗时任务显式设置 `--timeout-minutes`（例如 `240` 或 `360`）。
- 有先后依赖时必须使用 `--depends-on` 显式声明，禁止只写在标题文本中。

可执行命令：

```bash
# Step 1: 先归档 PRD
weaver prd archive {{draftPath}} --repo {{repoPath}}

# Step 2: 再创建任务（必须包含 PRD 路径）
weaver task add --repo {{repoPath}} --acceptance "<整体验收预期与证据要求>" "<任务标题。详细需求与边界。PRD: docs/prds/<slug>.md>"

# Step 2.1: 有依赖时必须显式声明 depends_on
weaver task add --repo {{repoPath}} --depends-on T123,T124 --acceptance "<整体验收预期与证据要求>" "<任务标题。详细需求与边界。PRD: docs/prds/<slug>.md>"

# 可选：长任务在创建时显式延长超时（分钟）
weaver task add --repo {{repoPath}} --timeout-minutes 360 --acceptance "<整体验收预期与证据要求>" "<任务标题。详细需求与边界。PRD: docs/prds/<slug>.md>"

# 可选：已创建任务补依赖（禁止手工编辑 tasks.yaml）
weaver task update <taskId> --repo {{repoPath}} --depends-on T123,T124

# 可选：已创建任务可更新超时（分钟）
weaver task update <taskId> --repo {{repoPath}} --timeout-minutes 360
```
