import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
	ServerNotification,
	ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";
import type { MdmConfig } from "../config.js";
import type { RequestHeaders } from "../auth.js";
import { formatToolError, formatToolResult } from "../result.js";
import { toolDefinitions } from "./definitions.js";
import { executeTool } from "./executors.js";

type ToolHandlerExtra = RequestHandlerExtra<
	ServerRequest,
	ServerNotification
>;

function headersFromExtra(extra: ToolHandlerExtra): RequestHeaders | undefined {
	const headers = extra.requestInfo?.headers;
	if (!headers) {
		return undefined;
	}
	return headers as RequestHeaders;
}

export function registerTools(server: McpServer, config: MdmConfig) {
	for (const def of toolDefinitions) {
		server.registerTool(
			def.name,
			{
				description: def.description,
				inputSchema: def.inputSchema,
			},
			async (args: Record<string, unknown>, extra: ToolHandlerExtra) => {
				try {
					const data = await executeTool(config, def.name, args, {
						headers: headersFromExtra(extra),
					});
					return formatToolResult(data);
				} catch (error) {
					return formatToolError(error);
				}
			},
		);
	}
}

export { toolDefinitions };
