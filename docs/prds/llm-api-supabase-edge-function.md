# LLM API 代理：前端直连迁移到 Supabase Edge Function

## Background

当前项目中所有 LLM 调用（对话流式输出、语法反馈、剧情判定）都在前端通过 `EXPO_PUBLIC_*` 环境变量直接携带 API Key 请求 OpenRouter。这意味着：

1. **安全漏洞**：API Key 会被打包进客户端 bundle，反编译即可提取
2. **无法控制用量**：任何人拿到 Key 都能无限调用，产生费用
3. **无法上线**：这个架构不适合生产环境

需要将 LLM 调用迁移到 Supabase Edge Function，API Key 仅存在服务端。

## Target Users & Scenarios

- **用户**：Speakland 的所有玩家
- **场景**：用户在 RPG 对话中发送消息，触发 AI 回复（流式）、语法反馈（异步）、剧情判定（异步）
- **用户感知**：迁移后用户体验应完全不变——对话流式输出、反馈延迟、错误降级行为均保持一致

## User Flow

- **入口**：用户在学习场景页面（`app/scene/[id].tsx`）发送消息
- **期待**：AI 角色流式回复 + 异步语法反馈 + 异步剧情判定，行为与当前一致
- **退出**：无感知变化，用户不知道后端架构变了

## Core Requirements

### 1. Supabase Edge Function: `llm-proxy`

创建一个统一的 Edge Function `supabase/functions/llm-proxy/index.ts`，承担所有 LLM 请求的转发。

#### 认证
- 从请求 Header 中提取 `Authorization: Bearer <supabase_jwt>`
- 使用 Supabase Auth 验证 JWT，确认用户身份
- 未认证请求返回 401

#### 请求格式
前端传入：
```json
{
  "messages": [...],
  "stream": true/false,
  "temperature": 0.7,
  "max_tokens": 500,
  "response_format": { ... }
}
```

Edge Function 用服务端存储的 `LLM_API_KEY`、`LLM_API_ENDPOINT`、`LLM_MODEL` 向 OpenRouter 发起请求。

**前端不再传递 model、endpoint、apiKey。** 这些全部由服务端环境变量控制。

#### 流式响应
- 当 `stream: true` 时，Edge Function 以 `text/event-stream` 透传 OpenRouter 的 SSE 流
- Deno 原生支持 streaming response，直接 pipe 上游 ReadableStream

#### 非流式响应
- 当 `stream: false` 时，等待 OpenRouter 完整响应后返回 JSON

#### 环境变量（服务端 secrets）
- `LLM_API_KEY` — OpenRouter API Key
- `LLM_API_ENDPOINT` — `https://openrouter.ai/api/v1/chat/completions`
- `LLM_MODEL` — 默认模型 `openai/gpt-4o-mini`
- `SMART_ASSIST_MODEL` — 语法反馈用的模型（可选，默认同 LLM_MODEL）

通过 `supabase secrets set` 配置，不进入代码库。

### 2. 前端公共调用层: `lib/llmClient.ts`

三个服务（streaming chat、smart assist、state plot）都要做「构造请求 → 附加 JWT → 调 Edge Function」，抽取公共模块避免重复：

- `callLlmProxy(body: LlmProxyRequest): Promise<LlmResponse>` — 非流式，返回 JSON
- `streamLlmProxy(body: LlmProxyRequest, callbacks: StreamCallbacks, signal?: AbortSignal): Promise<void>` — 流式，走 SSE

内部逻辑：
- 从 `supabase.auth.getSession()` 获取 JWT
- 构造请求 URL：`${SUPABASE_URL}/functions/v1/llm-proxy`
- Header: `Authorization: Bearer ${jwt}`, `Content-Type: application/json`
- 无 session 时走 mock 降级（保持现有行为）

### 3. 改造现有服务文件

#### `lib/streamingLlm.ts`
- 移除 `EXPO_PUBLIC_LLM_*` 环境变量读取
- `streamChat()` 改为调用 `streamLlmProxy()`
- SSE 解析逻辑不变（上游格式透传）
- mock fallback 保留（未登录时用）

#### `services/smartAssistService.ts`
- 移除 `SmartAssistConfig` 中的 apiEndpoint / apiKey / model
- `getSmartAssist()` 改为调用 `callLlmProxy()`，传入 `stream: false` + `response_format`
- JSON 解析和验证逻辑不变
- mock fallback 保留

#### `services/statePlotService.ts`
- 移除直接 fetch 调用和环境变量读取
- `evaluateStatePlot()` 改为调用 `callLlmProxy()`
- 响应解析和验证逻辑不变
- mock fallback 保留

### 4. 环境变量清理

#### 移除（前端）
- `EXPO_PUBLIC_LLM_API_KEY`
- `EXPO_PUBLIC_LLM_API_ENDPOINT`
- `EXPO_PUBLIC_LLM_MODEL`
- `EXPO_PUBLIC_SMART_ASSIST_MODEL`

从 `speakland/.env`、`speakland/.env.example` 中删除。

#### 新增（服务端，通过 supabase secrets set）
- `LLM_API_KEY`
- `LLM_API_ENDPOINT`
- `LLM_MODEL`
- `SMART_ASSIST_MODEL`（可选）

### 5. 本地开发配置

- 本地 Supabase Edge Function 通过 `supabase secrets set` 或 `supabase/functions/.env` 注入 secrets
- `supabase start` 后 Edge Function 自动可用
- 前端仍通过 `EXPO_PUBLIC_SUPABASE_URL` 指向本地 Supabase（已有配置）

### 6. 数据落库完整性保障

迁移后，必须确保以下数据写入链路正常工作（这些链路不经过 llm-proxy，走的是 Supabase client 直连，但 LLM 响应数据需要正确流经新链路后才能写入）：

- **对话历史**（`dialogue_history` 表）：每轮用户消息和 AI 回复都通过 `dialogueService.saveDialogueMessage()` 写入。迁移后 `SceneContext.tsx` 中的调用链路不能断——流式回复完成后的 `saveDialogueMessage` 调用仍需正常执行。
- **游戏状态**（`game_states` 表）：`statePlotService` 的 LLM 调用改走 Edge Function 后，返回的 `StatePlotResult` 仍需正确解析并通过 `gameStateService` 写入 DB。
- **用户词本**（`user_word_books` 表）：词汇匹配链路不涉及 LLM，不受迁移影响，但需确认不被误改。

## Design / Constraints

- **Edge Function 无状态、无逻辑**：只做认证 + 转发，不改 prompt、不存数据
- **不引入新的数据库表或 RLS 策略**
- **Prompt 构建保持在前端**：前端对对话上下文有完整控制
- **错误处理保持现有模式**：smart-assist 和 state-plot 失败时静默降级，不阻塞对话流
- **已有 Edge Function 不受影响**：`transfer-account` 和 `revenuecat-webhook` 保持不变

## Out of Scope

- 用量限流 / Rate limiting
- 多模型路由（前端选模型）
- LLM 调用日志 / 监控
- 旧的 `lib/llm.ts`（legacy mock 文件）的清理——不在本次范围
