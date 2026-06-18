const DEFAULT_BASE_URL = "http://47.92.222.148:30038";

const DEFAULT_BLACKLIST = [
	"FORM_STATIC_IMG",
	"FORM_STATIC_TEXT",
	"FORM_WIDGET_SPACE",
	"FORM_WIDGET_SPLIT",
	"FORM_OCR_IDENTIFY",
];

export const FORM_CONFIG_COMPONENTS_BLACKLIST = [
	"FORM_STATIC_IMG",
	"FORM_STATIC_TEXT",
	"FORM_WIDGET_SPACE",
	"FORM_WIDGET_SPLIT",
	"FORM_RICH_TEXT",
	"FORM_OTHER_TABLE_FIELD",
	"FORM_WIDGET_SON_TABLE",
];

const SAVE_OR_UPDATE_FORM_DATA_MENU_ID = "853987278391902208";

function buildFormReferer(baseUrl, tenantId, formId, options) {
	const formType = options.formType ?? "PROCESS_FORM";
	if (options.menuId) {
		return `${baseUrl}/demdm-test/${tenantId}/application/application-form/${encodeURIComponent(options.menuId)}?formId=${encodeURIComponent(formId)}&formType=${encodeURIComponent(formType)}`;
	}
	return `${baseUrl}/demdm-test/${tenantId}/application/application-form?formId=${encodeURIComponent(formId)}&formType=${encodeURIComponent(formType)}`;
}

function logFormDetail(step, data) {
	console.log(`[form-detail] ${step}`, JSON.stringify(data));
}

/**
 * @param {string} token - 登录后获得的 demdmtoken
 * @param {string} formId - 来自 getMenuConfig 返回的 formId
 * @param {{ baseUrl?: string, env?: { MDM_API_BASE_URL?: string, MDM_TENANT_ID?: string }, tenantId?: string, timezone?: string, menuId?: string, formType?: string, blackList?: string[], systemField?: boolean, flat?: boolean, businessField?: boolean, languageInfoFlag?: boolean, omitBusinessField?: boolean }} [options]
 * @returns {Promise<{ formId: string, businessComponents: object[], systemComponents: object[], message: string, tenantId: string }>}
 */
export async function getFormConfig(token, formId, options = {}) {
	if (!token || !formId) {
		throw new Error("token 和 formId 不能为空");
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

	const requestBody = {
		formId,
		blackList: options.blackList ?? DEFAULT_BLACKLIST,
		systemField: options.systemField ?? true,
		flat: options.flat ?? true,
	};
	if (!options.omitBusinessField) {
		requestBody.businessField = options.businessField ?? true;
	}
	if (options.languageInfoFlag !== undefined) {
		requestBody.languageInfoFlag = options.languageInfoFlag;
	}

	const response = await fetch(
		`${baseUrl}/demdm-api/front/form/config/getFormConfigComponents?timestamp=${timestamp}`,
		{
			method: "POST",
			headers: {
				Accept: "application/json, text/plain, */*",
				"Content-Type": "application/json;charset=UTF-8",
				Origin: baseUrl,
				demdmtoken: token,
				demdmtenantid: tenantId,
				timezone,
				Referer: buildFormReferer(baseUrl, tenantId, formId, options),
			},
			body: JSON.stringify(requestBody),
		},
	);

	if (!response.ok) {
		throw new Error(`查询列表页面配置失败: HTTP ${response.status}`);
	}

	const result = await response.json();

	if (result.code !== "ok") {
		throw new Error(result.message || "查询列表页面配置失败");
	}

	const data = result.data ?? {};

	return {
		formId: data.formId ?? formId,
		businessComponents: data.businessComponents ?? [],
		systemComponents: data.systemComponents ?? [],
		message: result.message,
		tenantId,
	};
}

/**
 * @param {string} token
 * @param {string} formId
 * @param {{ baseUrl?: string, env?: { MDM_API_BASE_URL?: string, MDM_TENANT_ID?: string }, tenantId?: string, timezone?: string, menuId?: string, formType?: string }} [options]
 * @returns {Promise<{ formId: string, businessComponents: object[], systemComponents: object[], message: string, tenantId: string }>}
 */
export async function getFormConfigComponents(token, formId, options = {}) {
	return getFormConfig(token, formId, {
		...options,
		blackList: FORM_CONFIG_COMPONENTS_BLACKLIST,
		systemField: true,
		flat: true,
		languageInfoFlag: false,
		omitBusinessField: true,
	});
}

/**
 * @param {string} token
 * @param {string} formId
 * @param {Record<string, unknown>} data
 * @param {{ baseUrl?: string, env?: { MDM_API_BASE_URL?: string, MDM_TENANT_ID?: string }, tenantId?: string, timezone?: string, operationCode?: string, documentId?: string, status?: string, menuId?: string, tableData?: Record<string, unknown> }} [options]
 * @returns {Promise<unknown>}
 */
export async function saveOrUpdateFormData(token, formId, data, options = {}) {
	if (!token || !formId) {
		throw new Error("token 和 formId 不能为空");
	}
	if (data === undefined || data === null || typeof data !== "object" || Array.isArray(data)) {
		throw new Error("data 必须是对象");
	}

	const operationCode = options.operationCode ?? "ADD";
	if (operationCode === "EDIT" && !options.documentId) {
		throw new Error("EDIT 操作需要 documentId");
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
		menuId: options.menuId ?? SAVE_OR_UPDATE_FORM_DATA_MENU_ID,
		formType: "PROCESS_FORM",
	};

	const requestBody = {
		buttonCode: "SUBMIT",
		buttonName: "提 交",
		formId,
		comment: "",
		attachmentIds: [],
		data,
		tableData: options.tableData ?? {},
		dataChange: {},
		childDataChange: {},
		desensitizationOpen: [],
		bomFatherData: {},
		bomChildData: [],
		operationCode,
		saveTempData: false,
		deleteTableDataIds: {},
	};
	if (operationCode === "EDIT") {
		requestBody.documentId = options.documentId;
		requestBody.status = options.status ?? "COMPLETED";
	}

	const response = await fetch(
		`${baseUrl}/demdm-api/front/form/config/saveOrUpdateFormData?timestamp=${timestamp}`,
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
			body: JSON.stringify(requestBody),
		},
	);

	if (!response.ok) {
		throw new Error(`保存表单数据失败: HTTP ${response.status}`);
	}

	const result = await response.json();

	if (result.code !== "ok") {
		throw new Error(result.message || "保存表单数据失败");
	}

	return result.data;
}

/**
 * @param {object[] | null | undefined} listPageViews
 * @returns {string}
 */
export function pickListPageTabId(listPageViews) {
	return listPageViews?.[0]?.tabId ?? "DEFAULT";
}

/**
 * @param {string} token
 * @param {string} formId
 * @param {{ baseUrl?: string, env?: { MDM_API_BASE_URL?: string, MDM_TENANT_ID?: string }, tenantId?: string, timezone?: string, menuId?: string, formType?: string }} [options]
 * @returns {Promise<{ formId: string, listPage: object | null, listPageViews: object[], tabId: string, message: string, tenantId: string }>}
 */
export async function getFormConfigListPage(token, formId, options = {}) {
	if (!token || !formId) {
		throw new Error("token 和 formId 不能为空");
	}

	if (!options.menuId) {
		throw new Error("menuId 不能为空");
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
	const params = new URLSearchParams({
		timestamp: String(timestamp),
		formId,
		menuId: options.menuId,
	});

	const response = await fetch(
		`${baseUrl}/demdm-api/front/form/config/getFormConfigListPage?${params}`,
		{
			method: "GET",
			headers: {
				Accept: "application/json, text/plain, */*",
				demdmtoken: token,
				demdmtenantid: tenantId,
				timezone,
				Referer: buildFormReferer(baseUrl, tenantId, formId, options),
			},
		},
	);

	if (!response.ok) {
		throw new Error(`查询列表页视图配置失败: HTTP ${response.status}`);
	}

	const result = await response.json();

	if (result.code !== "ok") {
		throw new Error(result.message || "查询列表页视图配置失败");
	}

	const data = result.data ?? {};
	const listPageViews = data.listPageViews ?? [];

	return {
		formId: data.formId ?? formId,
		listPage: data.listPage ?? null,
		listPageViews,
		tabId: pickListPageTabId(listPageViews),
		message: result.message,
		tenantId,
	};
}

/**
 * @param {string} token
 * @param {string} formId
 * @param {string} [documentId]
 * @param {{ baseUrl?: string, env?: { MDM_API_BASE_URL?: string, MDM_TENANT_ID?: string }, tenantId?: string, timezone?: string, menuId?: string, formType?: string, tabId?: string, type?: string }} [options]
 * @returns {Promise<{ formId: string, xdapFormConfig: object, formComponents: object[], componentStatusList: object[], message: string, tenantId: string }>}
 */
export async function getFormConfigAndStatus(
	token,
	formId,
	documentId,
	options = {},
) {
	if (!token || !formId) {
		throw new Error("token 和 formId 不能为空");
	}

	const type = options.type ?? (documentId ? "DETAIL_FORM" : "EDIT_FORM");
	if (type === "DETAIL_FORM" && !documentId) {
		throw new Error("DETAIL_FORM 类型需要 documentId");
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
	const tabId = options.tabId ?? "DEFAULT";
	const params = new URLSearchParams({
		timestamp: String(timestamp),
		tabId,
		formId,
		type,
		queryTempData: "false",
	});
	if (documentId) {
		params.set("documentId", documentId);
	}

	const referer = buildFormReferer(baseUrl, tenantId, formId, options);
	const url = `${baseUrl}/demdm-api/front/form/config/getFormConfigAndStatus?${params}`;
	logFormDetail("getFormConfigAndStatus", {
		method: "GET",
		url,
		query: Object.fromEntries(params),
		headers: {
			demdmtenantid: tenantId,
			timezone,
			Referer: referer,
		},
	});

	const response = await fetch(url, {
		method: "GET",
		headers: {
			Accept: "application/json, text/plain, */*",
			demdmtoken: token,
			demdmtenantid: tenantId,
			timezone,
			Referer: referer,
		},
	});

	if (!response.ok) {
		logFormDetail("getFormConfigAndStatus-error", {
			status: response.status,
			url,
		});
		throw new Error(`查询表单详情配置失败: HTTP ${response.status}`);
	}

	const result = await response.json();

	if (result.code !== "ok") {
		logFormDetail("getFormConfigAndStatus-error", {
			code: result.code,
			message: result.message,
			bizCode: result.bizCode,
			url,
		});
		throw new Error(result.message || "查询表单详情配置失败");
	}

	const data = result.data ?? {};
	const xdapFormConfig = data.xdapFormConfig ?? {};
	const formPage =
		xdapFormConfig.detailPage ??
		xdapFormConfig.editPage ??
		xdapFormConfig.addPage ??
		{};

	return {
		formId: xdapFormConfig.id ?? formId,
		xdapFormConfig,
		formComponents: formPage.formComponents ?? [],
		componentStatusList: data.componentStatusList ?? [],
		message: result.message,
		tenantId,
	};
}

/**
 * @param {string} token
 * @param {string} formId
 * @param {string} documentId
 * @param {{ baseUrl?: string, env?: { MDM_API_BASE_URL?: string, MDM_TENANT_ID?: string }, tenantId?: string, timezone?: string, menuId?: string, formType?: string }} [options]
 * @returns {Promise<{ formId: string, documentId: string, formName: string | null, status: string | null, dataStatus: object | null, data: object, message: string, tenantId: string }>}
 */
export async function getFormData(token, formId, documentId, options = {}) {
	if (!token || !formId || !documentId) {
		throw new Error("token、formId 和 documentId 不能为空");
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
	const params = new URLSearchParams({
		timestamp: String(timestamp),
		formId,
		documentId,
		queryTempData: "false",
		listDataDisplay: "true",
	});

	const referer = buildFormReferer(baseUrl, tenantId, formId, options);
	const url = `${baseUrl}/demdm-api/front/form/config/getFormData?${params}`;
	logFormDetail("getFormData", {
		method: "GET",
		url,
		query: Object.fromEntries(params),
		headers: {
			demdmtenantid: tenantId,
			timezone,
			Referer: referer,
		},
	});

	const response = await fetch(url, {
		method: "GET",
		headers: {
			Accept: "application/json, text/plain, */*",
			demdmtoken: token,
			demdmtenantid: tenantId,
			timezone,
			Referer: referer,
		},
	});

	if (!response.ok) {
		logFormDetail("getFormData-error", {
			status: response.status,
			url,
		});
		throw new Error(`查询表单详情数据失败: HTTP ${response.status}`);
	}

	const result = await response.json();

	if (result.code !== "ok") {
		logFormDetail("getFormData-error", {
			code: result.code,
			message: result.message,
			bizCode: result.bizCode,
			url,
		});
		throw new Error(result.message || "查询表单详情数据失败");
	}

	const data = result.data ?? {};

	return {
		formId: data.formId ?? formId,
		documentId: data.id ?? documentId,
		formName: data.formName ?? null,
		status: data.status ?? null,
		dataStatus: data.dataStatus ?? null,
		data: data.data ?? {},
		message: result.message,
		tenantId,
	};
}

/**
 * @param {string} token
 * @param {string} formId
 * @param {string} documentId
 * @param {string} tableUuid
 * @param {{ baseUrl?: string, env?: { MDM_API_BASE_URL?: string, MDM_TENANT_ID?: string }, tenantId?: string, timezone?: string, menuId?: string, formType?: string }} [options]
 * @returns {Promise<{ tableUuid: string, tableData: Record<string, object[]>, highlightData: Record<string, object[]>, message: string, tenantId: string }>}
 */
export async function getChildTableData(
	token,
	formId,
	documentId,
	tableUuid,
	options = {},
) {
	if (!token || !formId || !documentId || !tableUuid) {
		throw new Error("token、formId、documentId 和 tableUuid 不能为空");
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
	const referer = buildFormReferer(baseUrl, tenantId, formId, options);
	const url = `${baseUrl}/demdm-api/front/form/config/getChildTableData?timestamp=${timestamp}`;

	logFormDetail("getChildTableData", {
		method: "POST",
		url,
		tableUuid,
		formId,
		documentId,
	});

	const response = await fetch(url, {
		method: "POST",
		headers: {
			Accept: "application/json, text/plain, */*",
			"Content-Type": "application/json;charset=UTF-8",
			Origin: baseUrl,
			demdmtoken: token,
			demdmtenantid: tenantId,
			timezone,
			Referer: referer,
		},
		body: JSON.stringify({
			tableUuid,
			formId,
			documentId,
			queryTempData: false,
			orderList: [],
		}),
	});

	if (!response.ok) {
		logFormDetail("getChildTableData-error", {
			status: response.status,
			url,
			tableUuid,
		});
		throw new Error(`查询子表数据失败: HTTP ${response.status}`);
	}

	const result = await response.json();

	if (result.code !== "ok") {
		logFormDetail("getChildTableData-error", {
			code: result.code,
			message: result.message,
			bizCode: result.bizCode,
			tableUuid,
		});
		throw new Error(result.message || "查询子表数据失败");
	}

	const data = result.data ?? {};

	return {
		tableUuid,
		tableData: data.tableData ?? {},
		highlightData: data.highlightData ?? {},
		message: result.message,
		tenantId,
	};
}

async function resolveFormDatasOptions(token, formId, options = {}) {
	if (options.tabId || !options.menuId) {
		return options;
	}

	const listPage = await getFormConfigListPage(token, formId, options);
	return {
		...options,
		tabId: listPage.tabId,
	};
}

/**
 * @param {string} token - 登录后获得的 demdmtoken
 * @param {string} formId - 来自 getMenuConfig 返回的 formId
 * @param {{ baseUrl?: string, env?: { MDM_API_BASE_URL?: string, MDM_TENANT_ID?: string }, tenantId?: string, timezone?: string, menuId?: string, formType?: string, page?: number, pageSize?: number, tabId?: string, selectorFilterConditionList?: object[], customStorage?: boolean }} [options]
 * @returns {Promise<{ formId: string, count: number, result: object[], page: number, pageSize: number, message: string, tenantId: string }>}
 */
export async function getFormDatas(token, formId, options = {}) {
	if (!token || !formId) {
		throw new Error("token 和 formId 不能为空");
	}

	const tenantId = options.tenantId ?? options.env?.MDM_TENANT_ID;
	if (!tenantId) {
		throw new Error("无法获取 tenantId，请通过 options.tenantId 或 env.MDM_TENANT_ID 传入");
	}

	const resolvedOptions = await resolveFormDatasOptions(token, formId, options);

	const baseUrl = (
		options.baseUrl ??
		options.env?.MDM_API_BASE_URL ??
		DEFAULT_BASE_URL
	).replace(/\/$/, "");

	const timestamp = Date.now();
	const timezone = options.timezone ?? "+08:00";
	const page = options.page ?? 1;
	const pageSize = options.pageSize ?? 10;
	const selectorFilterConditionList = options.selectorFilterConditionList ?? [];

	const requestBody = {
		selectorFilterConditionList,
		page,
		pageSize,
		formId,
		tabId: resolvedOptions.tabId ?? "DEFAULT",
		pivotStatus: false,
		filterNode: null,
		orderList: [],
		queryFilterDto: null,
		queryTempData: false,
		listDataDisplay: true,
		documentIds: [],
		imageBase64: null,
		imageSuffix: null,
		imageMinScore: null,
	};

	if (options.customStorage === true) {
		requestBody.customStorage = true;
	}

	const response = await fetch(
		`${baseUrl}/demdm-api/front/form/config/getFormDatas?timestamp=${timestamp}`,
		{
			method: "POST",
			headers: {
				Accept: "application/json, text/plain, */*",
				"Content-Type": "application/json;charset=UTF-8",
				Origin: baseUrl,
				demdmtoken: token,
				demdmtenantid: tenantId,
				timezone,
				Referer: buildFormReferer(baseUrl, tenantId, formId, resolvedOptions),
			},
			body: JSON.stringify(requestBody),
		},
	);

	if (!response.ok) {
		throw new Error(`查询列表数据失败: HTTP ${response.status}`);
	}

	const result = await response.json();

	if (result.code !== "ok") {
		throw new Error(result.message || "查询列表数据失败");
	}

	const data = result.data ?? {};

	return {
		formId,
		count: data.count ?? 0,
		result: data.result ?? [],
		page,
		pageSize,
		message: result.message,
		tenantId,
	};
}

/**
 * @param {object[]} components
 * @returns {object[]}
 */
function collectSonTableComponents(components) {
	const result = [];

	const collect = (component) => {
		if (!component) return;
		if (component.componentType === "FORM_WIDGET_SON_TABLE") {
			result.push(component);
		}
		if (Array.isArray(component.children)) {
			for (const child of component.children) {
				collect(child);
			}
		}
	};

	for (const component of components) {
		collect(component);
	}

	return result;
}

function mapFieldValue(value) {
	if (
		value !== null &&
		typeof value === "object" &&
		!Array.isArray(value) &&
		typeof value.name === "string"
	) {
		return value.name;
	}
	if (Array.isArray(value)) {
		return value.map((item) => {
			if (
				item !== null &&
				typeof item === "object" &&
				typeof item.name === "string"
			) {
				return item.name;
			}
			return item;
		});
	}
	return value;
}

/**
 * @param {object[]} components
 * @returns {Record<string, string>}
 */
export function buildLabelMap(components) {
	const labelMap = {};

	const collect = (component) => {
		if (!component) return;
		const { uuid, label } = component;
		if (uuid && label) {
			labelMap[uuid] = label;
		}
		if (Array.isArray(component.tableColumn)) {
			for (const col of component.tableColumn) {
				collect(col);
			}
		}
		if (Array.isArray(component.children)) {
			for (const child of component.children) {
				collect(child);
			}
		}
	};

	for (const component of components) {
		collect(component);
	}

	return labelMap;
}

/**
 * @param {Record<string, unknown>} row
 * @param {Record<string, string>} labelMap
 * @returns {Record<string, unknown>}
 */
export function mapRowToLabels(row, labelMap) {
	const labeled = {};

	for (const [key, value] of Object.entries(row)) {
		const label = labelMap[key] ?? key;
		labeled[label] = mapFieldValue(value);
	}

	return labeled;
}

/**
 * @param {string} token
 * @param {string} formId
 * @param {{ baseUrl?: string, env?: { MDM_API_BASE_URL?: string, MDM_TENANT_ID?: string }, tenantId?: string, timezone?: string, menuId?: string, formType?: string, page?: number, pageSize?: number, tabId?: string, selectorFilterConditionList?: object[], customStorage?: boolean }} [options]
 * @returns {Promise<{ formId: string, tabId: string, count: number, result: object[], page: number, pageSize: number, message: string, tenantId: string }>}
 */
export async function getLabeledFormDatas(token, formId, options = {}) {
	const resolvedOptions = await resolveFormDatasOptions(token, formId, options);

	const [config, datas] = await Promise.all([
		getFormConfig(token, formId, resolvedOptions),
		getFormDatas(token, formId, resolvedOptions),
	]);

	const labelMap = buildLabelMap([
		...config.businessComponents,
		...config.systemComponents,
	]);

	return {
		formId: datas.formId,
		tabId: resolvedOptions.tabId ?? "DEFAULT",
		count: datas.count,
		page: datas.page,
		pageSize: datas.pageSize,
		tenantId: datas.tenantId,
		message: datas.message,
		result: datas.result.map((row) => mapRowToLabels(row, labelMap)),
	};
}

/**
 * @param {string} token
 * @param {string} formId
 * @param {{ baseUrl?: string, env?: { MDM_API_BASE_URL?: string, MDM_TENANT_ID?: string }, tenantId?: string, timezone?: string, menuId?: string, formType?: string, tabId?: string, documentId: string }} options
 * @returns {Promise<{ formId: string, documentId: string, formName: string | null, status: string | null, dataStatus: object | null, fields: object, childTables: object[], tenantId: string, message: string }>}
 */
export async function getLabeledFormData(token, formId, options = {}) {
	const documentId = options.documentId;
	if (!documentId) {
		throw new Error("documentId 不能为空");
	}

	logFormDetail("start", {
		formId,
		documentId,
		tabId: options.tabId ?? "DEFAULT",
		menuId: options.menuId ?? null,
		formType: options.formType ?? null,
		tenantId: options.tenantId ?? options.env?.MDM_TENANT_ID ?? null,
	});

	const [config, formData] = await Promise.all([
		getFormConfigAndStatus(token, formId, documentId, options),
		getFormData(token, formId, documentId, options),
	]);

	const labelMap = buildLabelMap(config.formComponents);
	const sonTableComponents = collectSonTableComponents(config.formComponents);

	const childTables = await Promise.all(
		sonTableComponents.map(async (component) => {
			const tableUuid = component.uuid;
			const childData = await getChildTableData(
				token,
				formId,
				documentId,
				tableUuid,
				options,
			);
			const childLabelMap = buildLabelMap([component]);
			const rows = childData.tableData[tableUuid] ?? [];

			return {
				tableUuid,
				label: component.label ?? tableUuid,
				rows: rows.map((row) => mapRowToLabels(row, childLabelMap)),
			};
		}),
	);

	logFormDetail("success", {
		formId: formData.formId,
		documentId: formData.documentId,
		formName: formData.formName,
		componentCount: config.formComponents.length,
		fieldCount: Object.keys(formData.data).length,
		childTableCount: childTables.length,
	});

	return {
		formId: formData.formId,
		documentId: formData.documentId,
		formName: formData.formName,
		status: formData.status,
		dataStatus: formData.dataStatus,
		fields: mapRowToLabels(formData.data, labelMap),
		childTables,
		tenantId: formData.tenantId,
		message: formData.message,
	};
}
