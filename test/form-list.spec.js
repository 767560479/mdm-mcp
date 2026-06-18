import { describe, it, expect } from "vitest";
import {
	findMenusByName,
	isFormAccessError,
	pickBestMenuMatch,
	rankMenuMatches,
	resolveMenuByName,
} from "../src/services/form-list.js";

const sampleMenus = [
	{
		id: "781076218702233600",
		menuName: "基础数据",
		menuType: "GROUP",
		submenus: [
			{
				id: "780765508449370112",
				menuName: "物料分类",
				menuType: "MENU",
				functionId: "780765451968872448",
				submenus: null,
			},
		],
	},
	{
		id: "827568791054483456",
		menuName: "人员主数据",
		menuType: "MENU",
		functionId: "827568692542865408",
		submenus: null,
	},
	{
		id: "781455438192345088",
		menuName: "物料主数据",
		menuType: "MENU",
		functionId: "781455314099666945",
		submenus: null,
	},
];

const duplicateOrgPoolMenus = [
	{
		id: "831543961599377408",
		menuName: "组织池",
		menuType: "MENU",
		functionId: "831543884101222400",
		submenus: null,
	},
	{
		id: "853987278391902208",
		menuName: "组织池",
		menuType: "MENU",
		functionId: "853987086364082176",
		submenus: null,
	},
];

describe("findMenusByName", () => {
	it("matches menuName on top-level menu", () => {
		const matches = findMenusByName(sampleMenus, "人员主数据");
		expect(matches).toHaveLength(1);
		expect(matches[0].id).toBe("827568791054483456");
	});

	it("matches menuName in nested submenus", () => {
		const matches = findMenusByName(sampleMenus, "物料分类");
		expect(matches).toHaveLength(1);
		expect(matches[0].id).toBe("780765508449370112");
	});

	it("supports fuzzy contains match", () => {
		const matches = findMenusByName(sampleMenus, "人员");
		expect(matches).toHaveLength(1);
		expect(matches[0].menuName).toBe("人员主数据");
	});
});

describe("pickBestMenuMatch", () => {
	it("prefers exact match over longer contains match", () => {
		const matches = findMenusByName(sampleMenus, "物料");
		expect(matches.length).toBeGreaterThan(1);

		const best = pickBestMenuMatch(matches, "物料");
		expect(best.menuName).toBe("物料分类");
	});

	it("picks first menu when duplicate names match exactly", () => {
		const matches = findMenusByName(duplicateOrgPoolMenus, "组织池");
		expect(matches).toHaveLength(2);

		const best = pickBestMenuMatch(matches, "组织池");
		expect(best.id).toBe("831543961599377408");
	});
});

describe("resolveMenuByName", () => {
	it("returns best match instead of throwing when multiple menus match", () => {
		const result = resolveMenuByName(sampleMenus, "物料");
		expect(result.menuId).toBe("780765508449370112");
		expect(result.menuLabel).toBe("物料分类");
	});

	it("resolves duplicate org pool menus to the first match", () => {
		const result = resolveMenuByName(duplicateOrgPoolMenus, "组织池");
		expect(result.menuId).toBe("831543961599377408");
		expect(result.menuLabel).toBe("组织池");
	});
});

describe("rankMenuMatches", () => {
	it("keeps duplicate exact matches in tree order for fallback retry", () => {
		const ranked = rankMenuMatches(
			findMenusByName(duplicateOrgPoolMenus, "组织池"),
			"组织池",
		);
		expect(ranked.map((item) => item.id)).toEqual([
			"831543961599377408",
			"853987278391902208",
		]);
	});
});

describe("isFormAccessError", () => {
	it("detects permission related MDM errors", () => {
		expect(isFormAccessError("你没有查看该表单列表数据的权限")).toBe(true);
		expect(isFormAccessError("查询列表数据失败")).toBe(false);
	});
});
