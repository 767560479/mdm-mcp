import { z } from "zod";

const DEFAULT_API_BASE_URL = "http://47.92.222.148:30038";
const DEFAULT_TENANT_ID = "779760045352058880";

const configSchema = z.object({
	account: z.string().min(1, "MDM_ACCOUNT 不能为空"),
	pwd: z.string().min(1, "MDM_PWD 不能为空"),
	apiBaseUrl: z.string().url().default(DEFAULT_API_BASE_URL),
	tenantId: z.string().min(1).default(DEFAULT_TENANT_ID),
	token: z.string().optional(),
	port: z.coerce.number().int().positive().default(3100),
});

export type MdmConfig = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): MdmConfig {
	return configSchema.parse({
		account: env.MDM_ACCOUNT,
		pwd: env.MDM_PWD,
		apiBaseUrl: env.MDM_API_BASE_URL ?? DEFAULT_API_BASE_URL,
		tenantId: env.MDM_TENANT_ID ?? DEFAULT_TENANT_ID,
		token: env.MDM_TOKEN || undefined,
		port: env.MDM_MCP_PORT ?? 3100,
	});
}

export function isHttpTransport(argv: string[] = process.argv): boolean {
	return (
		argv.includes("--http") ||
		process.env.MCP_TRANSPORT?.toLowerCase() === "http"
	);
}
