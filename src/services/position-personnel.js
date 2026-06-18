import {
	buildLabelMap,
	getFormConfig,
	getFormDatas,
	getLabeledFormData,
	mapRowToLabels,
} from "./form-config.js";

const FORM_ID = "6a2e5ba0652cb72b5dde25d7";
const MENU_ID = "854025943507828736";
const TAB_ID = "DEFAULT";
const FORM_TYPE = "PROCESS_FORM";
const POSITION_NAME_FIELD_UUID = "de802f6332492d7d4c16e535";

const SELECTOR_FILTER_TEMPLATE = [
	{
		uuid: "266a3d75813311d39187205f",
		componentType: "FORM_DOCUMENT_NUMBER",
		inputValue: [],
		conditionOption: "CONTAIN",
	},
	{
		uuid: POSITION_NAME_FIELD_UUID,
		componentType: "FORM_TEXT_INPUT",
		inputValue: [],
		conditionOption: "CONTAIN",
	},
	{
		uuid: "uiddbd38e295fe9ef61b570c4d1",
		componentType: "FORM_MODEL_DATA_SELECT_CUSTOM",
		inputValue: [],
		filterData: [],
		conditionOption: "CONTAIN",
	},
	{
		uuid: "uid7892c5d0dcfe7e9631a22775",
		componentType: "FORM_TEXT_INPUT",
		inputValue: [],
		conditionOption: "CONTAIN",
	},
	{
		uuid: "uid422ea52b302e0ad8577ef028",
		componentType: "FORM_TEXT_INPUT",
		inputValue: [],
		conditionOption: "CONTAIN",
	},
	{
		uuid: "uid22c0cd27cb906fcd1a75083a",
		componentType: "FORM_SELECT_INPUT",
		inputValue: [],
		conditionOption: "CONTAIN",
	},
	{
		uuid: "uide2afc787b31f6eece8aa9ff3",
		componentType: "FORM_SELECT_INPUT",
		inputValue: [],
		conditionOption: "CONTAIN",
	},
];

/**
 * @param {string} positionName
 * @returns {object[]}
 */
export function buildPositionNameFilter(positionName) {
	return SELECTOR_FILTER_TEMPLATE.map((item) => {
		if (item.uuid === POSITION_NAME_FIELD_UUID) {
			return { ...item, inputValue: [positionName] };
		}
		return item;
	});
}

function buildQueryOptions(positionName, options = {}) {
	const page = options.page ?? 1;
	const pageSize = options.pageSize ?? 10;

	return {
		...options,
		formId: FORM_ID,
		menuId: MENU_ID,
		tabId: TAB_ID,
		formType: FORM_TYPE,
		page,
		pageSize,
		customStorage: true,
		selectorFilterConditionList: buildPositionNameFilter(positionName),
	};
}

/**
 * @param {string} token
 * @param {string} positionName
 * @param {{ page?: number, pageSize?: number, env?: { MDM_API_BASE_URL?: string, MDM_TENANT_ID?: string }, tenantId?: string, baseUrl?: string, timezone?: string }} [options]
 * @returns {Promise<{ positionName: string, formId: string, menuId: string, count: number, page: number, pageSize: number, result: object[] }>}
 */
export async function getPositionsWithDetailsByPositionName(
	token,
	positionName,
	options = {},
) {
	if (!positionName?.trim()) {
		throw new Error("positionName 不能为空");
	}
	if (!token) {
		throw new Error("token 不能为空");
	}

	const trimmedName = positionName.trim();
	const queryOptions = buildQueryOptions(trimmedName, options);

	const [config, datas] = await Promise.all([
		getFormConfig(token, FORM_ID, queryOptions),
		getFormDatas(token, FORM_ID, queryOptions),
	]);

	const labelMap = buildLabelMap([
		...config.businessComponents,
		...config.systemComponents,
	]);

	const rows = datas.result.map((row) => {
		const documentId = row.documentId ?? row.id;
		return {
			documentId,
			listSummary: mapRowToLabels(row, labelMap),
		};
	});

	const details = await Promise.all(
		rows.map(({ documentId }) =>
			getLabeledFormData(token, FORM_ID, {
				...queryOptions,
				documentId,
			}),
		),
	);

	return {
		positionName: trimmedName,
		formId: FORM_ID,
		menuId: MENU_ID,
		count: datas.count,
		page: datas.page,
		pageSize: datas.pageSize,
		result: rows.map((row, index) => ({
			...row,
			detail: details[index],
		})),
	};
}
