import { describe, it, expect } from "vitest";
import { resolveAuth } from "../src/auth.js";

const config = {
	account: "test-account",
	pwd: "test-pwd",
	apiBaseUrl: "http://example.com",
	tenantId: "tenant-1",
	token: "env-token",
	port: 3100,
};

describe("resolveAuth", () => {
	it("prefers token from request header", () => {
		const auth = resolveAuth({}, config, { token: "header-token" });
		expect(auth).toEqual({ token: "header-token" });
	});

	it("prefers demdmtoken header over args and env", () => {
		const auth = resolveAuth(
			{ token: "args-token" },
			config,
			{ demdmtoken: "header-demdmtoken" },
		);
		expect(auth).toEqual({ token: "header-demdmtoken" });
	});

	it("uses args.token when header is absent", () => {
		const auth = resolveAuth({ token: "args-token" }, config);
		expect(auth).toEqual({ token: "args-token" });
	});

	it("uses config.token when header and args are absent", () => {
		const auth = resolveAuth({}, config);
		expect(auth).toEqual({ token: "env-token" });
	});

	it("falls back to account and password when no token is available", () => {
		const auth = resolveAuth({}, { ...config, token: undefined });
		expect(auth).toEqual({
			account: "test-account",
			userPwd: "test-pwd",
		});
	});
});
