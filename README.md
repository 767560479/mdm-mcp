# mdm-mcp

DEM MDM 的 MCP 服务：12 个 MCP Tools 直连 MDM 后端 API，供 Cursor / Agent 调用。

> `mdm-worker` 为遗留 REST 封装，**本 MCP 项目不依赖它**。

## 安装与构建

```bash
cd mdm-mcp
npm install
npm run build
npm test
```

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `MDM_ACCOUNT` | 是 | MDM 账号 |
| `MDM_PWD` | 是 | 已加密密文 |
| `MDM_API_BASE_URL` | 否 | MDM 后端地址，默认 `http://47.92.222.148:30038` |
| `MDM_TENANT_ID` | 否 | 租户 ID，默认 `779760045352058880` |
| `MDM_TOKEN` | 否 | 已有 `demdmtoken` 时可配置，跳过登录 |
| `MDM_MCP_PORT` | 否 | HTTP 模式端口，默认 `3100` |

## 运行模式

### stdio（默认，供 Cursor 使用）

```bash
npm start
```

### HTTP（Streamable HTTP，供远程客户端）

```bash
npm run start:http
```

服务地址：`http://localhost:3100/mcp`

### HTTP 鉴权（Token 优先）

全部 12 个工具统一支持 Token 优先鉴权，优先级如下：

1. 请求头 `token` 或 `demdmtoken`
2. 工具参数 `token`（未在 schema 暴露，保留兼容）
3. 环境变量 `MDM_TOKEN`
4. 环境变量 `MDM_ACCOUNT` + `MDM_PWD`（登录获取 token）

典型用法：先调用 `mdm_app_menu` 获取 token，后续 HTTP 请求在 Header 中携带同一 token，跳过重复登录：

```bash
curl -X POST http://localhost:3100/mcp \
  -H "Content-Type: application/json" \
  -H "token: <demdmtoken>" \
  -H "mcp-session-id: <session-id>" \
  -d '{ ... }'
```

stdio 模式（Cursor）无 HTTP 请求头，可使用 `MDM_TOKEN` 环境变量，或由 `mdm_app_menu` 返回的 token 通过上述回退链自动登录。

## Cursor 配置

在 Cursor 的 MCP 设置（`mcp.json`）中添加：

```json
{
  "mcpServers": {
    "mdm": {
      "command": "node",
      "args": ["D:/cloudflare/mdm-mcp-poc/mdm-mcp/dist/index.js"],
      "env": {
        "MDM_API_BASE_URL": "http://47.92.222.148:30038",
        "MDM_TENANT_ID": "779760045352058880",
        "MDM_ACCOUNT": "<your-account>",
        "MDM_PWD": "<encrypted-pwd>"
      }
    }
  }
}
```

请将 `args` 路径改为你本机实际路径。

## MCP 工具列表（12 个）

| Tool | 说明 |
|------|------|
| `mdm_app_menu` | 应用菜单树 |
| `mdm_form_list` | 按菜单名查表单列表（带标签） |
| `mdm_form_detail` | 表单详情（带标签） |
| `mdm_form_data` | 表单原始数据 |
| `mdm_child_table_data` | 子表数据 |
| `mdm_form_config_status` | 表单配置与状态 |
| `mdm_form_config_components` | 表单组件配置 |
| `mdm_query_custom_tree_father` | 自定义树父节点 |
| `mdm_query_field_page` | 关联字段分页 |
| `mdm_save_or_update_form_data` | 新增/编辑表单 |
| `mdm_query_form_and_function` | 菜单表单与功能 |
| `mdm_position_personnel` | 岗位人员查询 |

## 项目结构

```
src/
  services/     # MDM API 业务逻辑（自 mdm-worker 复制）
  tools/        # MCP tool 定义与执行
  auth.ts       # 鉴权（account/pwd 或 token）
  config.ts     # 环境变量
  index.ts      # 入口（stdio / HTTP）
```

## 开发

```bash
npm run dev        # stdio 调试
npm run dev:http   # HTTP 调试
```
