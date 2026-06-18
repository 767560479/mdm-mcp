import type { MdmConfig } from "./config.js";

export type MdmServiceEnv = {
	MDM_API_BASE_URL: string;
	MDM_TENANT_ID: string;
};

export type MdmServiceOptions = {
	env: MdmServiceEnv;
	tenantId: string;
	baseUrl: string;
};

export function mdmOptions(config: MdmConfig): MdmServiceOptions {
	return {
		env: {
			MDM_API_BASE_URL: config.apiBaseUrl,
			MDM_TENANT_ID: config.tenantId,
		},
		tenantId: config.tenantId,
		baseUrl: config.apiBaseUrl,
	};
}
