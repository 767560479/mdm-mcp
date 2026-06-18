import { randomUUID } from "node:crypto";
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import type { MdmConfig } from "./config.js";
import { createMcpServer } from "./server.js";

export async function startHttpServer(config: MdmConfig) {
	const app = express();
	app.use(express.json());

	const transports = new Map<string, StreamableHTTPServerTransport>();

	const mcpPostHandler = async (
		req: express.Request,
		res: express.Response,
	) => {
		const sessionId = req.headers["mcp-session-id"] as string | undefined;
		let transport = sessionId ? transports.get(sessionId) : undefined;

		try {
			if (sessionId && transport) {
				await transport.handleRequest(req, res, req.body);
				return;
			}

			if (!sessionId && isInitializeRequest(req.body)) {
				transport = new StreamableHTTPServerTransport({
					sessionIdGenerator: () => randomUUID(),
					onsessioninitialized: (id) => {
						transports.set(id, transport!);
					},
				});

				transport.onclose = () => {
					const id = transport!.sessionId;
					if (id) {
						transports.delete(id);
					}
				};

				const server = createMcpServer(config);
				await server.connect(transport);
				await transport.handleRequest(req, res, req.body);
				return;
			}

			res.status(400).json({
				jsonrpc: "2.0",
				error: {
					code: -32000,
					message: "Bad Request: No valid session ID provided",
				},
				id: null,
			});
		} catch (error) {
			console.error("MCP POST error:", error);
			if (!res.headersSent) {
				res.status(500).json({
					jsonrpc: "2.0",
					error: { code: -32603, message: "Internal server error" },
					id: null,
				});
			}
		}
	};

	app.post("/mcp", mcpPostHandler);

	app.get("/mcp", async (req, res) => {
		const sessionId = req.headers["mcp-session-id"] as string | undefined;
		if (!sessionId) {
			res.status(400).send("Missing mcp-session-id header");
			return;
		}

		const transport = transports.get(sessionId);
		if (!transport) {
			res.status(404).send("Session not found");
			return;
		}

		await transport.handleRequest(req, res);
	});

	app.delete("/mcp", async (req, res) => {
		const sessionId = req.headers["mcp-session-id"] as string | undefined;
		if (!sessionId) {
			res.status(400).send("Missing mcp-session-id header");
			return;
		}

		const transport = transports.get(sessionId);
		if (!transport) {
			res.status(404).send("Session not found");
			return;
		}

		await transport.handleRequest(req, res);
	});

	app.listen(config.port, () => {
		console.error(
			`mdm-mcp HTTP server listening on http://localhost:${config.port}/mcp`,
		);
	});
}
