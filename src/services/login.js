const DEFAULT_BASE_URL = "http://47.92.222.148:30038";

/**
 * @param {string} account
 * @param {string} userPwd - 已加密的密码密文
 * @param {{ baseUrl?: string, env?: { MDM_API_BASE_URL?: string } }} [options]
 * @returns {Promise<{ token: string, loginUser: object, message: string }>}
 */
export async function login(account, userPwd, options = {}) {
	if (!account || !userPwd) {
		throw new Error("account 和 userPwd 不能为空");
	}

	const baseUrl = (
		options.baseUrl ??
		options.env?.MDM_API_BASE_URL ??
		DEFAULT_BASE_URL
	).replace(/\/$/, "");

	const loginUrl = `${baseUrl}/demdm-api/system/login/account`;
	const loginBody = { account, userPwd };
	console.log(
		"[login] request",
		JSON.stringify({
			url: loginUrl,
			account,
			userPwdLength: userPwd?.length ?? 0,
		}),
	);

	const response = await fetch(loginUrl, {
		method: "POST",
		headers: {
			Accept: "application/json, text/plain, */*",
			"Content-Type": "application/json;charset=UTF-8",
			Origin: baseUrl,
			Referer: `${baseUrl}/demdm-test/account/login`,
		},
		body: JSON.stringify(loginBody),
	});

	if (!response.ok) {
		console.log(
			"[login] http-error",
			JSON.stringify({ status: response.status, url: loginUrl, account }),
		);
		throw new Error(`登录请求失败: HTTP ${response.status}`);
	}

	const result = await response.json();

	if (result.code !== "ok") {
		console.log(
			"[login] biz-error",
			JSON.stringify({
				code: result.code,
				message: result.message,
				bizCode: result.bizCode,
				account,
				userPwdLength: userPwd?.length ?? 0,
			}),
		);
		throw new Error(result.message || "登录失败");
	}

	const { token, loginUser } = result.data ?? {};

	if (!token) {
		throw new Error("登录响应缺少 token");
	}

	return {
		token,
		loginUser,
		message: result.message,
	};
}
