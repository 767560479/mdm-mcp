const DEFAULT_BASE_URL = "http://47.92.222.148:30038";

const QUERY_CUSTOM_TREE_FATHER_MENU_ID = "854025943507828736";

export const QUERY_CUSTOM_TREE_FATHER_DATA = {
	uiddbd38e295fe9ef61b570c4d1: [],
	uid22c0cd27cb906fcd1a75083a: [],
	uide2afc787b31f6eece8aa9ff3: [],
	uida69780f593d7dc42b459eeb3: [],
	uid459163df59f9720e6e2d0037: [],
	uid4e8cb1f84f26564b46f609b3: [],
	uid6c3d79b5a0a96a77d06e73e5: ["1"],
	uid3585377ffc7f4c0da1a1da9f: [],
};

function buildFormReferer(baseUrl, tenantId, formId, options) {
	const formType = options.formType ?? "PROCESS_FORM";
	if (options.menuId) {
		return `${baseUrl}/demdm-test/${tenantId}/application/application-form/${encodeURIComponent(options.menuId)}?formId=${encodeURIComponent(formId)}&formType=${encodeURIComponent(formType)}`;
	}
	return `${baseUrl}/demdm-test/${tenantId}/application/application-form?formId=${encodeURIComponent(formId)}&formType=${encodeURIComponent(formType)}`;
}

/**
 * @param {string} token
 * @param {{ formId: string, sourceFormId: string, uuid: string, baseUrl?: string, env?: { MDM_API_BASE_URL?: string, MDM_TENANT_ID?: string }, tenantId?: string, timezone?: string }} options
 * @returns {Promise<unknown>}
 */
export async function queryCustomTreeFather(token, options) {
	if (!token) {
		throw new Error("token 不能为空");
	}

	const { formId, sourceFormId, uuid } = options;
	if (!formId || !sourceFormId || !uuid) {
		throw new Error("formId、sourceFormId 和 uuid 不能为空");
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
	const refererOptions = {
		menuId: QUERY_CUSTOM_TREE_FATHER_MENU_ID,
		formType: "PROCESS_FORM",
	};

	const response = await fetch(
		`${baseUrl}/demdm-api/form/queryCustomTreeFather?timestamp=${timestamp}`,
		{
			method: "POST",
			headers: {
				Accept: "application/json, text/plain, */*",
				"Content-Type": "application/json;charset=UTF-8",
				Origin: baseUrl,
				demdmtoken: token,
				demdmtenantid: tenantId,
				timezone,
				Referer: buildFormReferer(baseUrl, tenantId, formId, refererOptions),
			},
			body: JSON.stringify({
				data: QUERY_CUSTOM_TREE_FATHER_DATA,
				uuid,
				sourceFormId,
				formId,
				controlType: "FULL_CONTROL",
				disableDataFilterFormRule: false,
			}),
		},
	);

	if (!response.ok) {
		throw new Error(`查询自定义树父节点失败: HTTP ${response.status}`);
	}

	const result = await response.json();

	if (result.code !== "ok") {
		throw new Error(result.message || "查询自定义树父节点失败");
	}

	return result.data;
}

/**
 * @param {string} token
 * @param {{ formId: string, sourceFormId: string, uuid: string, page: number, pageSize: number, baseUrl?: string, env?: { MDM_API_BASE_URL?: string, MDM_TENANT_ID?: string }, tenantId?: string, timezone?: string }} options
 * @returns {Promise<unknown>}
 */
export async function queryFieldPage(token, options) {
	if (!token) {
		throw new Error("token 不能为空");
	}

	const { formId, sourceFormId, uuid, page, pageSize } = options;
	if (!formId || !sourceFormId || !uuid) {
		throw new Error("formId、sourceFormId 和 uuid 不能为空");
	}
	if (!page || !pageSize) {
		throw new Error("page 和 pageSize 不能为空");
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
	const refererOptions = {
		menuId: QUERY_CUSTOM_TREE_FATHER_MENU_ID,
		formType: "PROCESS_FORM",
	};

	const response = await fetch(
		`${baseUrl}/demdm-api/form/queryFieldPage?timestamp=${timestamp}`,
		{
			method: "POST",
			headers: {
				Accept: "application/json, text/plain, */*",
				"Content-Type": "application/json;charset=UTF-8",
				Origin: baseUrl,
				demdmtoken: token,
				demdmtenantid: tenantId,
				timezone,
				Referer: buildFormReferer(baseUrl, tenantId, formId, refererOptions),
			},
			body: JSON.stringify({
				page,
				pageSize,
				orderList: [],
				controlType: "FULL_CONTROL",
				disableDataFilterFormRule: false,
				data: QUERY_CUSTOM_TREE_FATHER_DATA,
				uuid,
				sourceFormId,
				formId,
			}),
		},
	);

	if (!response.ok) {
		throw new Error(`查询字段分页数据失败: HTTP ${response.status}`);
	}

	const result = await response.json();

	if (result.code !== "ok") {
		throw new Error(result.message || "查询字段分页数据失败");
	}

	return result.data;
}
