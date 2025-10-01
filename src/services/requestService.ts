import axios from 'axios';
import fs from 'fs';
import { proxy } from '../utils/proxy';

let lastAccountIndex = -1;

async function getNextAccount() {
	// دریافت همه اکانت‌های admin و enable
	let accounts = JSON.parse(await fs.readFileSync(__dirname + '/../../proxy-conf.json', 'utf8').toString());

	if (!accounts || accounts.length === 0) {
		return {};
	}

	// افزایش index و انتخاب اکانت بعدی به صورت گردشی
	lastAccountIndex = (lastAccountIndex + 1) % accounts.length;

	return accounts[lastAccountIndex];
}

export async function requestService(proxied: boolean, method: string, url: string, payload: any = {}, headers: any = {}, proxyDT: any = {}) {
	try {
		const config: any = {
			method,
			url,
			data: payload,
			withCredentials: true,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				...headers,
			},
		};
		if (proxied) {
			let prox = await getNextAccount();

			let proxyAgent = await proxy({
				host: prox.ip,
				port: prox.port,
				type: prox.type,
			});
			if (proxyAgent) {
				config.httpAgent = proxyAgent;
				config.httpsAgent = proxyAgent;
			}
		}
		let res = (await axios(config));
		if (res.status !== 200)
			console.log(res.status);
		return res.data;
	} catch (error: any) {
		return {success: false, error: error.message};
	}
}

export async function requestRedirect(proxied: boolean, method: string, url: string, payload: any = {}, headers: any = {}, proxyDT: any = {}) {
	try {
		const config: any = {
			method,
			url,
			data: payload,
			withCredentials: true,
			maxRedirects: 10,
			validateStatus: null, // همه وضعیت‌ها را قبول کن
			timeout: 10000,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				...headers,
			},
		};
		if (proxied) {
			let prox = await getNextAccount();

			let proxyAgent = await proxy({
				host: prox.ip,
				port: prox.port,
				type: prox.type,
			});
			if (proxyAgent) {
				config.httpAgent = proxyAgent;
				config.httpsAgent = proxyAgent;
			}
		}
		let response = (await axios(config));
		if (response.status !== 200)
			console.log(response.status);
		return response;
	} catch (error: any) {
		return {success: false, error: error.message};
	}
}

export async function requestServiceDownload(proxied: boolean, method: string, url: string, payload: any = {}, headers: any = {}) {
	try {
		const config: any = {
			method,
			url,
			data: payload,
			responseType: 'arraybuffer', // مهم: برای دریافت داده به صورت binary
			withCredentials: true,
			headers: {
				...headers,
			},
		};
		if (proxied) {
			let prox = await getNextAccount();
			let proxyAgent = await proxy({
				host: prox.ip,
				port: prox.port,
				type: prox.type,
			});
			if (proxyAgent) {
				config.httpAgent = proxyAgent;
				config.httpsAgent = proxyAgent;
			}
		}
		return (await axios(config));
	} catch (error: any) {
		return {success: false, error: error.message};
	}
}
