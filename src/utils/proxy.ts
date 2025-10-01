import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

export async function proxy(proxyConfig: any) {
	const {host, port, type, username, password} = proxyConfig;

	let proxyUrl = '';
	if (username && password) {
		proxyUrl = `${ type }://${ username }:${ password }@${ host }:${ port }`;
	} else {
		proxyUrl = `${ type }://${ host }:${ port }`;
	}

	if (type === 'socks5' || type === 'socks4') {
		return new SocksProxyAgent(proxyUrl);
	} else {
		return new HttpsProxyAgent(proxyUrl);
	}
}
