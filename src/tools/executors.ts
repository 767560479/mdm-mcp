import type { MdmConfig } from "../config.js";
import {
	resolveAuth,
	resolveMdmToken,
	type RequestHeaders,
} from "../auth.js";
import { mdmOptions } from "../mdm-options.js";
import { getAppMenuByToken, getMenuConfig } from "../services/app-menu.js";
import { getLabeledFormDatasByMenuNameByToken } from "../services/form-list.js";
import {
	getChildTableData,
	getFormConfigAndStatus,
	getFormConfigComponents,
	getFormData,
	getLabeledFormData,
	saveOrUpdateFormData,
} from "../services/form-config.js";
import {
	queryCustomTreeFather,
	queryFieldPage,
} from "../services/custom-tree.js";
import { getPositionsWithDetailsByPositionName } from "../services/position-personnel.js";

const VALID_OPERATION_CODES = new Set(["ADD", "EDIT"]);

export type ExecuteToolOptions = {
	headers?: RequestHeaders;
};

function parsePositiveInt(
	value: unknown,
	fieldName: string,
): number | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}
	const num = Number(value);
	if (!Number.isInteger(num) || num < 1) {
		throw new Error(`${fieldName} 必须是大于 0 的整数`);
	}
	return num;
}

function requireString(args: Record<string, unknown>, field: string): string {
	const value = args[field];
	if (typeof value !== "string" || !value) {
		throw new Error(`缺少 ${field}`);
	}
	return value;
}

export async function executeTool(
	config: MdmConfig,
	toolName: string,
	args: Record<string, unknown>,
	executeOptions: ExecuteToolOptions = {},
): Promise<unknown> {
	const opts = mdmOptions(config);
	const auth = resolveAuth(args, config, executeOptions.headers);
	const token = await resolveMdmToken(auth, config);

	switch (toolName) {
		case "mdm_app_menu":
			return getAppMenuByToken(token, opts);

		case "mdm_form_list": {
			const menuName = requireString(args, "menuName");
			const page = parsePositiveInt(args.page, "page") ?? 1;
			const pageSize = parsePositiveInt(args.pageSize, "pageSize") ?? 10;
			return getLabeledFormDatasByMenuNameByToken(token, menuName, {
				...opts,
				page,
				pageSize,
			});
		}

		case "mdm_form_detail": {
			const formId = requireString(args, "formId");
			const documentId = requireString(args, "documentId");
			return getLabeledFormData(token, formId, {
				...opts,
				documentId,
				tabId: args.tabId as string | undefined,
				menuId: args.menuId as string | undefined,
				formType: args.formType as string | undefined,
			});
		}

		case "mdm_form_data": {
			const formId = requireString(args, "formId");
			const documentId = requireString(args, "documentId");
			return getFormData(token, formId, documentId, {
				...opts,
				menuId: args.menuId as string | undefined,
				formType: args.formType as string | undefined,
			});
		}

		case "mdm_child_table_data": {
			const formId = requireString(args, "formId");
			const documentId = requireString(args, "documentId");
			const tableUuid = requireString(args, "tableUuid");
			return getChildTableData(
				token,
				formId,
				documentId,
				tableUuid,
				opts,
			);
		}

		case "mdm_form_config_status": {
			const formId = requireString(args, "formId");
			const tabId = (args.tabId as string | undefined) ?? "DEFAULT";
			return getFormConfigAndStatus(
				token,
				formId,
				args.documentId as string | undefined,
				{
					...opts,
					tabId,
					menuId: args.menuId as string | undefined,
					formType: args.formType as string | undefined,
					type: args.type as string | undefined,
				},
			);
		}

		case "mdm_form_config_components": {
			const formId = requireString(args, "formId");
			return getFormConfigComponents(token, formId, opts);
		}

		case "mdm_query_custom_tree_father": {
			const formId = requireString(args, "formId");
			const sourceFormId = requireString(args, "sourceFormId");
			const uuid = requireString(args, "uuid");
			return queryCustomTreeFather(token, {
				...opts,
				formId,
				sourceFormId,
				uuid,
			});
		}

		case "mdm_query_field_page": {
			const formId = requireString(args, "formId");
			const sourceFormId = requireString(args, "sourceFormId");
			const uuid = requireString(args, "uuid");
			const page = parsePositiveInt(args.page, "page");
			const pageSize = parsePositiveInt(args.pageSize, "pageSize");
			if (page === undefined || pageSize === undefined) {
				throw new Error("缺少 page 或 pageSize");
			}
			return queryFieldPage(token, {
				...opts,
				formId,
				sourceFormId,
				uuid,
				page,
				pageSize,
			});
		}

		case "mdm_save_or_update_form_data": {
			const formId = requireString(args, "formId");
			if (!args.data || typeof args.data !== "object") {
				throw new Error("缺少 data");
			}
			const operationCode = (args.operationCode as string | undefined) ?? "ADD";
			if (!VALID_OPERATION_CODES.has(operationCode)) {
				throw new Error('operationCode 必须是 "ADD" 或 "EDIT"');
			}
			if (operationCode === "EDIT" && !args.documentId) {
				throw new Error("EDIT 操作需要 documentId");
			}
			return saveOrUpdateFormData(
				token,
				formId,
				args.data as Record<string, unknown>,
				{
					...opts,
					operationCode,
					documentId: args.documentId as string | undefined,
					status: args.status as string | undefined,
					menuId: args.menuId as string | undefined,
					tableData: args.tableData as Record<string, unknown> | undefined,
				},
			);
		}

		case "mdm_query_form_and_function": {
			const menuId = requireString(args, "menuId");
			return getMenuConfig(token, menuId, opts);
		}

		case "mdm_position_personnel": {
			const positionName = requireString(args, "positionName");
			const page = parsePositiveInt(args.page, "page") ?? 1;
			const pageSize = parsePositiveInt(args.pageSize, "pageSize") ?? 10;
			return getPositionsWithDetailsByPositionName(token, positionName, {
				...opts,
				page,
				pageSize,
			});
		}

		default:
			throw new Error(`未知工具: ${toolName}`);
	}
}
