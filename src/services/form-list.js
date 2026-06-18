import { getAppMenu, getAppMenuByToken, getMenuConfig } from "./app-menu.js";
import { getLabeledFormDatas } from "./form-config.js";

/**
 * @param {object} item
 * @returns {string}
 */
function getMenuLabel(item) {
	return (
		item.customName ??
		item.menuName ??
		item.name ??
		item.menuNameEn ??
		""
	).trim();
}

/**
 * @param {object[]} menus
 * @param {string} menuName
 * @returns {object[]}
 */
function findMenusByName(menus, menuName) {
	const keyword = menuName.trim();
	const matches = [];

	const walk = (items) => {
		for (const item of items ?? []) {
			const label = getMenuLabel(item);
			if (label.includes(keyword)) {
				matches.push(item);
			}
			if (item.submenus?.length) {
				walk(item.submenus);
			}
		}
	};

	walk(menus);
	return matches;
}

/**
 * @param {string} label
 * @param {string} keyword
 * @returns {number}
 */
function getMatchTier(label, keyword) {
	if (label === keyword) {
		return 0;
	}
	if (label.startsWith(keyword)) {
		return 1;
	}
	return 2;
}

/**
 * @param {object[]} matches
 * @param {string} keyword
 * @returns {object[]}
 */
function rankMenuMatches(matches, keyword) {
	const ranked = matches.map((item, index) => {
		const label = getMenuLabel(item);
		return {
			item,
			index,
			label,
			tier: getMatchTier(label, keyword),
			hasForm: item.menuType === "MENU" && !!item.functionId,
		};
	});

	ranked.sort(
		(a, b) =>
			a.tier - b.tier ||
			a.label.length - b.label.length ||
			(b.hasForm ? 1 : 0) - (a.hasForm ? 1 : 0) ||
			a.index - b.index,
	);

	return ranked.map((entry) => entry.item);
}

/**
 * @param {object[]} matches
 * @param {string} keyword
 * @returns {object}
 */
function pickBestMenuMatch(matches, keyword) {
	return rankMenuMatches(matches, keyword)[0];
}

/**
 * @param {string} message
 * @returns {boolean}
 */
function isFormAccessError(message) {
	return /权限|permission/i.test(message ?? "");
}

function summarizeMenu(item) {
	return {
		menuId: item.id,
		menuName: getMenuLabel(item),
		menuCode: item.menuCode ?? null,
		menuType: item.menuType ?? null,
		functionId: item.functionId ?? null,
	};
}

function logFormList(step, data) {
	console.log(`[form-list] ${step}`, JSON.stringify(data));
}

/**
 * @param {object[]} menus
 * @param {string} menuName
 * @returns {{ menuId: string, menuLabel: string }}
 */
function resolveMenuByName(menus, menuName) {
	const keyword = menuName.trim();
	const matches = findMenusByName(menus, keyword);

	if (matches.length === 0) {
		throw new Error(`未找到匹配的菜单: ${menuName}`);
	}

	const menu =
		matches.length === 1 ? matches[0] : pickBestMenuMatch(matches, keyword);

	return {
		menuId: menu.id,
		menuLabel: getMenuLabel(menu) || menuName,
	};
}

/**
 * @param {string} token
 * @param {string} tenantId
 * @param {object[]} menus
 * @param {string} menuName
 * @param {{ page?: number, pageSize?: number, env?: { MDM_API_BASE_URL?: string, MDM_TENANT_ID?: string }, tenantId?: string, baseUrl?: string, timezone?: string }} [options]
 * @returns {Promise<{ menuId: string, menuName: string, formId: string, tabId: string, count: number, page: number, pageSize: number, result: object[] }>}
 */
async function getLabeledFormDatasByMenuNameCore(
	token,
	tenantId,
	menus,
	menuName,
	options = {},
) {
	const page = options.page ?? 1;
	const pageSize = options.pageSize ?? 10;
	const keyword = menuName.trim();
	const matches = findMenusByName(menus, keyword);

	if (matches.length === 0) {
		throw new Error(`未找到匹配的菜单: ${menuName}`);
	}

	const candidates =
		matches.length === 1 ? matches : rankMenuMatches(matches, keyword);
	const resolvedTenantId = options.tenantId ?? tenantId;
	let lastError;

	logFormList("start", {
		menuName: keyword,
		page,
		pageSize,
		tenantId: resolvedTenantId,
		matchCount: matches.length,
		matches: matches.map(summarizeMenu),
		candidateOrder: candidates.map(summarizeMenu),
	});

	for (let i = 0; i < candidates.length; i++) {
		const menu = candidates[i];
		const menuId = menu.id;
		try {
			logFormList("try-menu", {
				attempt: i + 1,
				total: candidates.length,
				...summarizeMenu(menu),
			});

			const menuConfig = await getMenuConfig(token, menuId, {
				...options,
				tenantId: resolvedTenantId,
			});

			logFormList("menu-config", {
				menuId,
				formId: menuConfig.formId,
				formType: menuConfig.formType,
				functionId: menuConfig.functionId,
			});

			const labeled = await getLabeledFormDatas(token, menuConfig.formId, {
				...options,
				tenantId: resolvedTenantId,
				menuId,
				formType: menuConfig.formType,
				page,
				pageSize,
			});

			logFormList("success", {
				menuId,
				menuName: getMenuLabel(menu) || menuName,
				formId: labeled.formId,
				count: labeled.count,
				attempt: i + 1,
			});

			return {
				menuId,
				menuName: getMenuLabel(menu) || menuName,
				formId: labeled.formId,
				tabId: labeled.tabId,
				count: labeled.count,
				page: labeled.page,
				pageSize: labeled.pageSize,
				result: labeled.result,
			};
		} catch (err) {
			lastError = err;
			const willRetry =
				i < candidates.length - 1 && isFormAccessError(err.message);

			logFormList(willRetry ? "access-denied-retry" : "failed", {
				attempt: i + 1,
				total: candidates.length,
				menuId,
				error: err.message,
				willRetry,
			});

			if (willRetry) {
				continue;
			}
			throw err;
		}
	}

	logFormList("all-candidates-failed", {
		menuName: keyword,
		lastError: lastError?.message,
	});
	throw lastError;
}

/**
 * @param {string} token
 * @param {string} menuName
 * @param {{ page?: number, pageSize?: number, env?: { MDM_API_BASE_URL?: string, MDM_TENANT_ID?: string }, tenantId?: string, baseUrl?: string, timezone?: string }} [options]
 * @returns {Promise<{ menuId: string, menuName: string, formId: string, tabId: string, count: number, page: number, pageSize: number, result: object[] }>}
 */
export async function getLabeledFormDatasByMenuNameByToken(
	token,
	menuName,
	options = {},
) {
	if (!menuName?.trim()) {
		throw new Error("menuName 不能为空");
	}

	const { tenantId, menus } = await getAppMenuByToken(token, options);
	return getLabeledFormDatasByMenuNameCore(
		token,
		tenantId,
		menus,
		menuName,
		options,
	);
}

/**
 * @param {string} account
 * @param {string} userPwd
 * @param {string} menuName
 * @param {{ page?: number, pageSize?: number, env?: { MDM_API_BASE_URL?: string, MDM_TENANT_ID?: string }, tenantId?: string, baseUrl?: string, timezone?: string }} [options]
 * @returns {Promise<{ menuId: string, menuName: string, formId: string, tabId: string, count: number, page: number, pageSize: number, result: object[] }>}
 */
export async function getLabeledFormDatasByMenuName(
	account,
	userPwd,
	menuName,
	options = {},
) {
	if (!menuName?.trim()) {
		throw new Error("menuName 不能为空");
	}

	const { token, tenantId, menus } = await getAppMenu(account, userPwd, options);
	return getLabeledFormDatasByMenuNameCore(
		token,
		tenantId,
		menus,
		menuName,
		options,
	);
}

export {
	findMenusByName,
	getMenuLabel,
	pickBestMenuMatch,
	rankMenuMatches,
	resolveMenuByName,
	isFormAccessError,
};
