export class InstagramUtils {
	async convertPublicReelToJson(input: any) {
		try {
			let js = JSON.parse(input.replace('for (;;);', '[').replace('for (;;);', ',').replace('for (;;);', ',').replace('for (;;);', ',').replace('for (;;);', ',').replace('for (;;);', ',').replace(',{"__type":"last_response"}', ']'));
			let jg = await this.advancedRemover(js, [{'__type': 'first_response'}]);
			let kj = await this.advancedRemover(jg, [{'id': 'adp_PolarisRulingForMediaContentLoggedOutQueryRelayPreloader_*'}]);
			let nk = await this.resultResultData(kj);
			return nk;
		} catch (e) {
			return e;
		}
	}

	async advancedRemover(arr: any[], conditions: any[]) {
		try {
			return arr.filter(item => {
				return !conditions.some(condition => {
					const [key, pattern] = Object.entries(condition)[0];

					// اگر الگو شامل wildcard (*) باشد
					if (typeof pattern === 'string' && pattern.includes('*')) {
						const regexPattern = new RegExp(
							`^${ pattern.replace(/\*/g, '.*') }$`,
							'i',
						);
						return regexPattern.test(item[key]);
					}

					// تطابق دقیق برای سایر موارد
					return item[key] === pattern;
				});
			});
		} catch (error: any) {
			return error;
		}
	}

	async resultResultData(js: any[], loadInside = false) {
		try {
			let sk = js.map((res: any) => res.result.result.data).reduce((a, b) => {
				return {
					...a,
					...b,
				};
			});
			// return sk;
			if (!(sk && sk['xdt_api__v1__media__shortcode__web_info'] && sk['xdt_api__v1__media__shortcode__web_info'].items && sk['xdt_api__v1__media__shortcode__web_info'].items.length != 0))
				return {statusCode: 400, statusText: 'media shortcode not found'};
			let fk = sk['xdt_api__v1__media__shortcode__web_info'].items[0];
			// fk.comment = sk['xdt_api__v1__media__media_id__comments__connection']['edges'].map((result: any) => result['node']);
			// fk.related = [];
			// if (!loadInside) {
			// fk.related = sk['xdt_api__v1__profile_timeline']['items'].map((res: any) => res['code']);
			// }
			delete fk.video_dash_manifest;
			delete fk.organic_tracking_token;
			return fk;
		} catch (error: any) {
			return error;
		}
	}
}
