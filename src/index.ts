#!/usr/bin/env node
import "dotenv/config";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { isHttpTransport, loadConfig } from "./config.js";
import { startHttpServer } from "./http-server.js";
import { createMcpServer } from "./server.js";

async function main() {
	const config = loadConfig();

	if (isHttpTransport()) {
		await startHttpServer(config);
		return;
	}

	const server = createMcpServer(config);
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main().catch((error) => {
	console.error("mdm-mcp failed to start:", error);
	process.exit(1);
});
