import type { MdmConfig } from "./config.js";
import { login } from "./services/login.js";
import { mdmOptions } from "./mdm-options.js";

export type AuthContext =
	| { token: string }
	| { account: string; userPwd: string };

export type RequestHeaders = Record<
	string,
	string | string[] | undefined
>;

function getHeader(
	headers: RequestHeaders | undefined,
	name: string,
): string | undefined {
	if (!headers) {
		return undefined;
	}
	const value = headers[name] ?? headers[name.toLowerCase()];
	if (typeof value === "string" && value) {
		return value;
	}
	if (Array.isArray(value) && value[0]) {
		return value[0];
	}
	return undefined;
}

export function resolveAuth(
	args: Record<string, unknown>,
	config: MdmConfig,
	headers?: RequestHeaders,
): AuthContext {
	const token =
		getHeader(headers, "token") ??
		getHeader(headers, "demdmtoken") ??
		(typeof args.token === "string" ? args.token : undefined) ??
		config.token;
	if (token) {
		return { token };
	}
	return { account: config.account, userPwd: config.pwd };
}

export async function resolveMdmToken(
	auth: AuthContext,
	config: MdmConfig,
): Promise<string> {
	if ("token" in auth) {
		return auth.token;
	}
	const { token } = await login(auth.account, auth.userPwd, mdmOptions(config));
	return token;
}
