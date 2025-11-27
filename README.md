# Gemini Bridge

一个基于 Cloudflare Workers 的桥接服务，用于在受限地区访问 Google Gemini API。

## 功能特性

- ✅ 完全代理 Gemini API 请求
- ✅ 支持所有 Gemini API 端点（v1 和 v1beta）
- ✅ CORS 支持，可在浏览器中直接使用
- ✅ 灵活的 API Key 配置方式（请求头、查询参数、环境变量）
- ✅ 完善的错误处理和日志记录
- ✅ 基于 Cloudflare Workers，全球边缘节点加速
- ✅ 模块化代码架构，易于维护和扩展
- ✅ 完整的 TypeScript 类型支持

## 技术栈

- **TypeScript** - 类型安全的开发体验
- **Cloudflare Workers** - 边缘计算平台
- **Wrangler** - Cloudflare Workers 开发和部署工具

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API Key

**注意**: 根端点（`/`）不需要 API Key，可以直接访问获取服务信息。其他所有端点都需要提供 API Key。

有三种方式提供 Gemini API Key：

#### 方式 1: 环境变量（推荐用于生产环境）

创建 `.dev.vars` 文件用于本地开发：

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

**注意**: `.dev.vars` 文件已添加到 `.gitignore`，不会被提交到版本控制。

#### 方式 2: 请求头（推荐用于客户端）

在请求头中添加：

```
X-Goog-Api-Key: your_gemini_api_key_here
```

#### 方式 3: 查询参数

在 URL 中添加 `?key=your_gemini_api_key_here`

**优先级**: 请求头 > 查询参数 > 环境变量

### 3. 本地开发

```bash
npm run dev
```

Worker 将在 `http://localhost:8787` 启动。

### 4. 部署到 Cloudflare

#### 首次部署

1. 登录 Cloudflare：

   ```bash
   npx wrangler login
   ```

2. 设置生产环境 API Key（可选，如果使用环境变量方式）：

   ```bash
   npx wrangler secret put GEMINI_API_KEY
   ```

3. 部署：

   ```bash
   npm run deploy
   ```

部署成功后，你会得到一个类似 `gemini-bridge.your-subdomain.workers.dev` 的 URL。

## 使用方法

### 基本用法

代理服务会将所有请求转发到 `https://generativelanguage.googleapis.com`。

#### 示例 0: 访问根端点（无需 API Key）

```bash
curl "https://your-worker.workers.dev/"
```

返回 JSON 格式的服务使用说明和示例。

#### 示例 1: 列出可用模型

```bash
curl "https://your-worker.workers.dev/v1/models?key=YOUR_API_KEY"
```

或使用请求头：

```bash
curl -H "X-Goog-Api-Key: YOUR_API_KEY" \
  "https://your-worker.workers.dev/v1/models"
```

#### 示例 2: 生成内容（Chat Completions）

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: YOUR_API_KEY" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Hello, how are you?"
      }]
    }]
  }' \
  "https://your-worker.workers.dev/v1beta/models/gemini-flash-latest:generateContent"
```

#### 示例 3: 访问根端点（无需 API Key）

```bash
curl "https://your-worker.workers.dev/"
```

返回 JSON 格式的使用说明。

#### 示例 4: 在 JavaScript 中使用

```javascript
// 列出模型
const response = await fetch('https://your-worker.workers.dev/v1/models', {
  headers: {
    'X-Goog-Api-Key': 'YOUR_API_KEY'
  }
});

const data = await response.json();
console.log(data);

// 访问根端点（无需 API Key）
const rootResponse = await fetch('https://your-worker.workers.dev/');
const rootData = await rootResponse.json();
console.log(rootData);
```

### 支持的 API 端点

所有 Gemini API 端点都支持，包括：

- `/` - 根端点（信息页面，**无需 API Key**）
- `/v1/models` - 列出模型（需要 API Key）
- `/v1/models/{model}` - 获取模型信息（需要 API Key）
- `/v1beta/models/{model}:generateContent` - 生成内容（需要 API Key）
- `/v1beta/models/{model}:streamGenerateContent` - 流式生成内容（需要 API Key）
- `/v1beta/models/{model}:embedContent` - 生成嵌入（需要 API Key）
- 等等...

**注意**：

- 根端点（`/`）不需要 API Key，返回服务使用说明
- 其他所有端点都需要提供 API Key（通过请求头、查询参数或环境变量）

只需将原始 Gemini API URL 中的域名部分替换为你的 Worker URL 即可。

## 配置

### wrangler.toml

主要配置在 `wrangler.toml` 文件中：

- `name`: Worker 名称
- `compatibility_date`: 兼容性日期
- `cpu_time_limit`: CPU 时间限制（毫秒）

### 自定义路由（可选）

在 `wrangler.toml` 中配置自定义域名：

```toml
[env.production]
routes = [
  { pattern = "gemini-proxy.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

## 安全建议

1. **API Key 管理**:
   - 生产环境使用环境变量或请求头方式，避免在 URL 中暴露 API Key
   - 定期轮换 API Key

2. **访问控制**（可选扩展）:
   - 可以添加 IP 白名单
   - 可以添加请求频率限制
   - 可以添加 API Key 验证

3. **HTTPS**:
   - Cloudflare Workers 默认使用 HTTPS，确保传输安全

## 故障排除

### 常见问题

1. **401 Unauthorized**
   - 检查 API Key 是否正确
   - 确认 API Key 已正确传递（检查请求头或查询参数）

2. **CORS 错误**
   - 代理已配置 CORS 支持，如果仍有问题，检查浏览器控制台错误信息

3. **超时错误**
   - 检查 `cpu_time_limit` 配置
   - 考虑升级 Cloudflare Workers 计划

### 调试

查看 Worker 日志：

```bash
npx wrangler tail
```

## 开发

### 可用脚本

```bash
# 本地开发（启动开发服务器）
npm run dev

# 类型检查
npm run type-check

# 运行测试
npm run test:gemini

# 部署到 Cloudflare
npm run deploy
```

### 类型检查

```bash
npm run type-check
```

### 测试

#### 测试生产环境

部署到生产环境后，可以使用以下方法测试：

**方法 1: 使用 TypeScript 测试脚本（推荐）**

```bash
# 测试生产环境（替换为你的生产 URL 和 API Key）
PROXY_URL=https://gemini-bridge.happyluoding.workers.dev API_KEY=your_key npm run test:gemini
```

**方法 2: 使用 Shell 测试脚本**

```bash
# 测试生产环境
PROXY_URL=https://gemini-bridge.happyluoding.workers.dev API_KEY=your_key ./scripts/test-gemini.sh

# 或直接传递参数
./scripts/test-gemini.sh https://gemini-bridge.happyluoding.workers.dev your_api_key
```

**方法 3: 快速手动测试（使用 curl）**

```bash
# 1. 列出可用模型
curl "https://gemini-bridge.happyluoding.workers.dev/v1/models?key=YOUR_API_KEY"

# 2. 使用请求头传递 API Key
curl -H "X-Goog-Api-Key: YOUR_API_KEY" \
  "https://gemini-bridge.happyluoding.workers.dev/v1/models"

# 3. 生成内容
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: YOUR_API_KEY" \
  -d '{"contents":[{"parts":[{"text":"Hello!"}]}]}' \
  "https://gemini-bridge.happyluoding.workers.dev/v1beta/models/gemini-flash-latest:generateContent"

# 4. 测试根端点
curl "https://gemini-bridge.happyluoding.workers.dev/"

# 5. 查看实时日志（需要 wrangler CLI）
npx wrangler tail
```

#### 测试本地开发环境

项目提供了两种测试脚本用于本地开发：

#### TypeScript 测试脚本（推荐）

使用 TypeScript 测试脚本，提供详细的测试报告：

```bash
# 使用环境变量中的 API Key
npm run test:gemini

# 或指定自定义代理 URL 和 API Key
PROXY_URL=http://localhost:8787 API_KEY=your_key npm run test:gemini
```

#### Shell 测试脚本

使用 curl 的简单测试脚本：

```bash
# 使用环境变量
PROXY_URL=http://localhost:8787 API_KEY=your_key ./scripts/test-gemini.sh

# 或直接传递参数
./scripts/test-gemini.sh http://localhost:8787 your_api_key
```

测试脚本会测试以下功能：

- 列出可用模型（使用查询参数）
- 列出可用模型（使用请求头）
- 获取模型信息
- 生成内容（Chat Completions）
- CORS 预检请求
- 根端点

### 项目结构

```
gemini-bridge/
├── src/
│   ├── index.ts          # Worker 主入口，处理请求路由
│   ├── types.ts          # TypeScript 类型定义
│   ├── constants.ts      # 常量定义（API URL、CORS 配置等）
│   └── utils.ts          # 工具函数（API Key 获取、URL 构建、响应创建等）
├── scripts/
│   ├── test-gemini.ts    # TypeScript 测试脚本
│   └── test-gemini.sh    # Shell 测试脚本
├── wrangler.toml         # Cloudflare Workers 配置
├── package.json          # 项目依赖和脚本
├── tsconfig.json         # TypeScript 配置
└── README.md             # 使用说明
```

### 代码架构

项目采用模块化设计，代码组织清晰：

- **`src/index.ts`**: Worker 入口点，处理请求路由和错误处理
- **`src/types.ts`**: 集中管理所有 TypeScript 类型定义
- **`src/constants.ts`**: 集中管理常量（API 端点、CORS 配置、HTTP 方法等）
- **`src/utils.ts`**: 可复用的工具函数
  - API Key 获取（支持多种方式）
  - URL 构建和转换
  - 响应创建（错误响应、JSON 响应、代理响应）
  - 请求头处理

这种架构设计使得代码：

- 易于维护和扩展
- 便于单元测试
- 职责分离清晰
- 类型安全

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

