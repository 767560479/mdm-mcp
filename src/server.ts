import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MdmConfig } from "./config.js";
import { registerTools } from "./tools/register.js";

export function createMcpServer(config: MdmConfig) {
	const server = new McpServer({
		name: "mdm-mcp",
		version: "0.1.0",
	});

	registerTools(server, config);

	return server;
}
