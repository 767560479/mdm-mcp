import { describe, it, expect, vi, afterEach } from "vitest";
import {
	queryCustomTreeFather,
	queryFieldPage,
	QUERY_CUSTOM_TREE_FATHER_DATA,
} from "../src/services/custom-tree.js";

describe("queryCustomTreeFather", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("sends fixed request body for data and control options", async () => {
		let requestBody;
		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url, init) => {
				requestBody = JSON.parse(init.body);
				return {
					ok: true,
					json: async () => ({
						code: "ok",
						message: "ok",
						data: { tree: [] },
					}),
				};
			}),
		);

		await queryCustomTreeFather("token", {
			tenantId: "tenant-1",
			formId: "6a2e5ba0652cb72b5dde25d7",
			sourceFormId: "6a2e3714652cb72b5dde13f9",
			uuid: "uiddbd38e295fe9ef61b570c4d1",
		});

		expect(requestBody).toEqual({
			data: QUERY_CUSTOM_TREE_FATHER_DATA,
			uuid: "uiddbd38e295fe9ef61b570c4d1",
			sourceFormId: "6a2e3714652cb72b5dde13f9",
			formId: "6a2e5ba0652cb72b5dde25d7",
			controlType: "FULL_CONTROL",
			disableDataFilterFormRule: false,
		});
	});
});

describe("queryFieldPage", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("sends fixed request body with page and pageSize from options", async () => {
		let requestBody;
		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url, init) => {
				requestBody = JSON.parse(init.body);
				return {
					ok: true,
					json: async () => ({
						code: "ok",
						message: "ok",
						data: { count: 0, result: [] },
					}),
				};
			}),
		);

		await queryFieldPage("token", {
			tenantId: "tenant-1",
			formId: "6a2e5ba0652cb72b5dde25d7",
			sourceFormId: "6a2e5ba0652cb72b5dde25d7",
			uuid: "uida69780f593d7dc42b459eeb3",
			page: 1,
			pageSize: 10,
		});

		expect(requestBody).toEqual({
			page: 1,
			pageSize: 10,
			orderList: [],
			controlType: "FULL_CONTROL",
			disableDataFilterFormRule: false,
			data: QUERY_CUSTOM_TREE_FATHER_DATA,
			uuid: "uida69780f593d7dc42b459eeb3",
			sourceFormId: "6a2e5ba0652cb72b5dde25d7",
			formId: "6a2e5ba0652cb72b5dde25d7",
		});
	});
});
