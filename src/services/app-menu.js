import { login } from "./login.js";

const DEFAULT_BASE_URL = "http://47.92.222.148:30038";

/**
 * @param {string} token
 * @param {string} tenantId
 * @param {{ baseUrl?: string, env?: { MDM_API_BASE_URL?: string }, timezone?: string }} [options]
 * @returns {Promise<{ menus: object[], message: string }>}
 */
async function fetchAppMenu(token, tenantId, options = {}) {
	if (!token || !tenantId) {
		throw new Error("token 和 tenantId 不能为空");
	}

	const baseUrl = (
		options.baseUrl ??
		options.env?.MDM_API_BASE_URL ??
		DEFAULT_BASE_URL
	).replace(/\/$/, "");

	const timestamp = Date.now();
	const timezone = options.timezone ?? "+08:00";

	const response = await fetch(
		`${baseUrl}/demdm-api/menu/query/appMenu?timestamp=${timestamp}`,
		{
			method: "GET",
			headers: {
				Accept: "application/json, text/plain, */*",
				demdmtoken: token,
				demdmtenantid: tenantId,
				timezone,
				Referer: `${baseUrl}/demdm-test/${tenantId}/application?t=${timestamp}`,
			},
		},
	);

	if (!response.ok) {
		throw new Error(`查询应用菜单失败: HTTP ${response.status}`);
	}

	const result = await response.json();

	if (result.code !== "ok") {
		throw new Error(result.message || "查询应用菜单失败");
	}

	return {
		menus: result.data ?? [],
		message: result.message,
	};
}

/**
 * @param {string} token
 * @param {{ baseUrl?: string, env?: { MDM_API_BASE_URL?: string, MDM_TENANT_ID?: string }, tenantId?: string, timezone?: string }} [options]
 * @returns {Promise<{ menus: object[], message: string, token: string, tenantId: string }>}
 */
export async function getAppMenuByToken(token, options = {}) {
	if (!token) {
		throw new Error("token 不能为空");
	}

	const tenantId = options.tenantId ?? options.env?.MDM_TENANT_ID;
	if (!tenantId) {
		throw new Error("无法获取 tenantId，请通过 options.tenantId 或 env.MDM_TENANT_ID 传入");
	}

	const { menus, message } = await fetchAppMenu(token, tenantId, options);

	return {
		menus,
		message,
		token,
		tenantId,
	};
}

/**
 * @param {string} account
 * @param {string} userPwd - 已加密的密码密文
 * @param {{ baseUrl?: string, env?: { MDM_API_BASE_URL?: string }, tenantId?: string, timezone?: string }} [options]
 * @returns {Promise<{ menus: object[], message: string, token: string, tenantId: string }>}
 */
export async function getAppMenu(account, userPwd, options = {}) {
	const { token, loginUser } = await login(account, userPwd, options);

	const tenantId = options.tenantId ?? loginUser?.defaultTenantId;
	if (!tenantId) {
		throw new Error("无法获取 tenantId，请检查登录用户信息");
	}

	const { menus, message } = await fetchAppMenu(token, tenantId, options);

	return {
		menus,
		message,
		token,
		tenantId,
	};
}

/**
 * @param {string} token - 登录后获得的 demdmtoken
 * @param {string} menuId - 菜单项 id（来自 getAppMenu 返回的 menus）
 * @param {{ baseUrl?: string, env?: { MDM_API_BASE_URL?: string, MDM_TENANT_ID?: string }, tenantId?: string, timezone?: string }} [options]
 * @returns {Promise<{ formId: string, formType: string, functionId: string, functionType: string, customName: string | null, message: string, tenantId: string, menuId: string }>}
 */
export async function getMenuConfig(token, menuId, options = {}) {
	if (!token || !menuId) {
		throw new Error("token 和 menuId 不能为空");
	}

	const tenantId = options.tenantId ?? options.env?.MDM_TENANT_ID;
	if (!tenantId) {
		throw new Error("无法获取 tenantId，请通过 options.tenantId 或 env.MDM_TENANT_ID 传入");
	}

	const baseUrl = (
		options.baseUrl ??
		options.env?.MDM_API_BASE_URL ??
		DEFAULT_BASE_URL
	).replace(/\/$/, "");

	const timestamp = Date.now();
	const timezone = options.timezone ?? "+08:00";

	const response = await fetch(
		`${baseUrl}/demdm-api/menu/queryFormAndFunction?timestamp=${timestamp}&menuId=${encodeURIComponent(menuId)}`,
		{
			method: "GET",
			headers: {
				Accept: "application/json, text/plain, */*",
				demdmtoken: token,
				demdmtenantid: tenantId,
				timezone,
				Referer: `${baseUrl}/demdm-test/${tenantId}/application/data-clean?menuId=${encodeURIComponent(menuId)}`,
			},
		},
	);

	if (!response.ok) {
		throw new Error(`查询菜单配置失败: HTTP ${response.status}`);
	}

	const result = await response.json();

	if (result.code !== "ok") {
		throw new Error(result.message || "查询菜单配置失败");
	}

	const { formId, formType, functionId, functionType, customName } =
		result.data ?? {};

	if (!formId) {
		throw new Error("菜单配置响应缺少 formId");
	}

	return {
		formId,
		formType,
		functionId,
		functionType,
		customName,
		message: result.message,
		tenantId,
		menuId,
	};
}
