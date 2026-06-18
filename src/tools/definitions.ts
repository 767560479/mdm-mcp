import { z } from "zod";
import type { ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js";

export type ToolDefinition = {
	name: string;
	description: string;
	inputSchema: ZodRawShapeCompat;
};

export const toolDefinitions: ToolDefinition[] = [
	{
		name: "mdm_app_menu",
		description: "获取应用菜单，返回 token 等信息，可缓存使用",
		inputSchema: {},
	},
	{
		name: "mdm_form_list",
		description: "获取某一个菜单列表数据",
		inputSchema: {
			menuName: z.string().describe("菜单名称"),
			page: z.number().int().min(1).optional().describe("页码，默认 1"),
			pageSize: z
				.number()
				.int()
				.min(1)
				.optional()
				.describe("每页条数，默认 10"),
		},
	},
	{
		name: "mdm_form_detail",
		description:
			"获取表单详情，返回中文字段名。聚合配置 + 子表 + 中文 label（getLabeledFormData）。",
		inputSchema: {
			formId: z.string().describe("表单 ID"),
			documentId: z.string().describe("单据 ID"),
			tabId: z.string().optional().describe("页签 ID"),
			menuId: z.string().optional().describe("菜单 ID"),
			formType: z.string().optional().describe("表单类型"),
		},
	},
	{
		name: "mdm_form_data",
		description:
			"获取单条表单数据明细，直接返回 getFormData 原始 uuid 字段（键为字段 UUID，未映射中文标签，不含子表聚合）。与 mdm_form_detail 的区别：mdm_form_detail 会聚合配置、子表数据并映射中文 label（getLabeledFormData）。",
		inputSchema: {
			formId: z.string().describe("表单 ID"),
			documentId: z.string().describe("单据 ID"),
			menuId: z.string().optional().describe("菜单 ID"),
			formType: z.string().optional().describe("表单类型"),
		},
	},
	{
		name: "mdm_child_table_data",
		description:
			"获取子表（明细表）行数据。在详情查看、新增、修改场景下，需要读取或填充子表明细时使用。当 formComponents 中存在 componentType 为 FORM_WIDGET_SON_TABLE 的组件时，应调用此工具；tableUuid 传入该组件的 uuid。",
		inputSchema: {
			formId: z.string().describe("表单 ID"),
			documentId: z.string().describe("单据 ID"),
			tableUuid: z
				.string()
				.describe(
					"子表 UUID，取自 formComponents 中 componentType 为 FORM_WIDGET_SON_TABLE 的组件的 uuid 字段",
				),
		},
	},
	{
		name: "mdm_form_config_status",
		description:
			"根据 formId 和 tabId 获取指定表单的完整配置，包括字段定义、字段类型、必填/只读/隐藏规则、下拉选项、数据选择器来源、字段联动规则、列表页查询与展示配置。可用于动态渲染表单、生成填单；新增数据、查询表单详情时均可使用，tabId 默认 DEFAULT。返回的 formComponents 中每个对象代表一个字段组件，包含字段含义、类型、属性、数据模型映射、下拉选项、数据选择器配置、校验规则和默认值等。调用表单新增、编辑、查询等接口前，应先用此工具解析字段结构，确定展示/必填/只读/隐藏字段、下拉可选值及与底层主数据模型字段的对应关系。",
		inputSchema: {
			formId: z.string().describe("表单 ID"),
			tabId: z
				.string()
				.optional()
				.describe("页签 ID，默认 DEFAULT"),
			documentId: z.string().optional().describe("单据 ID"),
			menuId: z.string().optional().describe("菜单 ID"),
			formType: z.string().optional().describe("表单类型"),
			type: z.string().optional().describe("查询类型"),
		},
	},
	{
		name: "mdm_form_config_components",
		description:
			"获取数据选择源表单的组件配置。填写表单时，若 formComponents 中存在 componentType 为 FORM_MODEL_DATA_SELECT 或 FORM_MODEL_DATA_SELECT_CUSTOM 的字段需要填写，应调用此工具获取源表单配置，为数据选择匹配字段名称。",
		inputSchema: {
			formId: z
				.string()
				.describe(
					"数据选择源表单 ID，取自 FORM_MODEL_DATA_SELECT / FORM_MODEL_DATA_SELECT_CUSTOM 组件 dataSource 中的 sourceFormId",
				),
		},
	},
	{
		name: "mdm_query_custom_tree_father",
		description:
			"查询自定义数据选择器可选数据。在新增或修改表单时，若 formComponents 中存在 componentType 为 FORM_MODEL_DATA_SELECT_CUSTOM 的字段需要填写，应调用此工具获取可选项。调用前须先通过 mdm_form_config_components 获取表单组件配置，从中定位数据选择字段、匹配字段名称，再填入 sourceFormId 与 uuid。",
		inputSchema: {
			formId: z.string().describe("当前正在新增或修改的表单 ID"),
			sourceFormId: z
				.string()
				.describe(
					"数据选择源表单 ID，取自 FORM_MODEL_DATA_SELECT_CUSTOM 组件 dataSource 中的 sourceFormId",
				),
			uuid: z
				.string()
				.describe(
					"数据选择字段 UUID，取自 mdm_form_config_components 返回的 formComponents 中对应 FORM_MODEL_DATA_SELECT_CUSTOM 组件的 uuid",
				),
		},
	},
	{
		name: "mdm_query_field_page",
		description:
			"分页查询数据选择器可选数据。在新增或修改表单时，若 formComponents 中存在 componentType 为 FORM_MODEL_DATA_SELECT 的字段需要填写，应调用此工具获取可选项。调用前须先通过 mdm_form_config_status 获取表单组件配置，从中定位数据选择字段、匹配字段名称，再填入 sourceFormId 与 uuid。",
		inputSchema: {
			formId: z.string().describe("当前正在新增或修改的表单 ID"),
			sourceFormId: z
				.string()
				.describe(
					"数据选择源表单 ID，取自 FORM_MODEL_DATA_SELECT 组件 dataSource 中的 sourceFormId",
				),
			uuid: z
				.string()
				.describe(
					"数据选择字段 UUID，取自 mdm_form_config_status 返回的 formComponents 中对应 FORM_MODEL_DATA_SELECT 组件的 uuid",
				),
			page: z.number().int().min(1).describe("页码"),
			pageSize: z.number().int().min(1).describe("每页条数"),
		},
	},
	{
		name: "mdm_save_or_update_form_data",
		description:
			"保存或更新表单数据。data 对象的键须为 mdm_form_config_status 返回的 formComponents 中的 uuid。",
		inputSchema: {
			formId: z.string().describe("表单 ID"),
			data: z
				.record(z.unknown())
				.describe(
					"表单字段数据，键为 mdm_form_config_status 返回的 formComponents 中各字段的 uuid",
				),
			operationCode: z
				.enum(["ADD", "EDIT"])
				.optional()
				.describe("操作类型，默认 ADD"),
			documentId: z
				.string()
				.optional()
				.describe("单据 ID（EDIT 时必填）"),
			status: z.string().optional().describe("状态"),
			menuId: z.string().optional().describe("菜单 ID"),
			tableData: z.record(z.unknown()).optional().describe("子表数据"),
		},
	},
	{
		name: "mdm_query_form_and_function",
		description: "按菜单 ID 获取表单 ID（formId）与方法 ID（functionId）",
		inputSchema: {
			menuId: z.string().describe("菜单 ID"),
		},
	},
	{
		name: "mdm_position_personnel",
		description:
			"分页查询指定岗位信息，并返回该岗位关联的人员列表及岗位档案数据。",
		inputSchema: {
			positionName: z.string().describe("岗位名称"),
			page: z.number().int().min(1).optional().describe("页码，默认 1"),
			pageSize: z
				.number()
				.int()
				.min(1)
				.optional()
				.describe("每页条数，默认 10"),
		},
	},
];
