// import * as cheerio from 'cheerio';

export function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function getRandomInt(max: number = 5) {
	return Math.floor(Math.random() * max);
}

export function getRandomIntMinMax(min: number, max: number) {
	const minCeiled = Math.ceil(min);
	const maxFloored = Math.floor(max);
	return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

export async function randomSleepHumanity() {
	return await sleep(await getRandomIntMinMax(500, 4000));
}

export async function convertCookiesToCookieString(cookies: any[]) {
	return cookies.map(cookie => `${ cookie.name }=${ cookie.value }`).join('; ');
}

// export async function getJsonScriptsFromHtml(html: string) {
// 	const $ = cheerio.load(html);
// 	const scripts = $(`script`);
// 	const jsonScripts: any[] = [];
// 	scripts.each((index: any, element: any) => {
// 		const script = $(element);
// 		const type = script.attr('type');
// 		const content = script.html();
// 		if ((type === 'application/json' || type === 'application/ld+json') && content) {
// 			if (content) {
// 				try {
// 					const jsonData = JSON.parse(content);
// 					jsonScripts.push(jsonData);
// 				} catch (error) {
// 					console.warn('Failed to parse JSON from script:', error);
// 				}
// 			}
// 		}
// 	});
//
// 	return jsonScripts;
// }

export function isJsonString(str: string) {
	try {
		JSON.parse(str);
		return true;
	} catch (error) {
		return false;
	}
}

// export async function getJsonLdScriptsFromHtml(html: string) {
// 	const $ = cheerio.load(html);
// 	const scripts = $('script[type="application/ld+json"]');
// 	const jsonLdScripts: any[] = [];
//
// 	scripts.each((index: any, element: any) => {
// 		const scriptContent = $(element).html();
// 		if (scriptContent) {
// 			try {
// 				const jsonData = JSON.parse(scriptContent);
// 				jsonLdScripts.push(jsonData);
// 			} catch (error) {
// 				console.warn('Failed to parse JSON-LD from script:', error);
// 			}
// 		}
// 	});
//
// 	return jsonLdScripts;
// }

export async function findValueByKey(obj: any, targetKey: string): Promise<any> {
	if (obj === null || typeof obj !== 'object') {
		return undefined;
	}

	// اگر کلید مورد نظر در این سطح وجود دارد
	if (obj.hasOwnProperty(targetKey)) {
		return obj[targetKey];
	}

	// جستجو در تمامی properties های آبجکت
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			const value = obj[key];

			if (typeof value === 'object' && value !== null) {
				const result = await findValueByKey(value, targetKey);
				if (result !== undefined) {
					return result;
				}
			}
		}
	}

	return undefined;
}

export async function findAllValuesByKey(obj: any, targetKey: string) {
	const results: any[] = [];

	// تابع بازگشتی داخلی
	const search = (currentObj: any) => {
		if (currentObj === null || typeof currentObj !== 'object') {
			return;
		}

		// اگر کلید مورد نظر در این سطح وجود دارد
		if (currentObj.hasOwnProperty(targetKey)) {
			results.push(currentObj[targetKey]);
		}

		// جستجو در تمامی properties های آبجکت
		for (const key in currentObj) {
			if (currentObj.hasOwnProperty(key)) {
				const value = currentObj[key];

				if (typeof value === 'object' && value !== null) {
					search(value);
				}
			}
		}
	};

	search(obj);
	return results;
}

export async function parseQuotedJson(str: string) {
	try {
		// حذف quotes از ابتدا و انتها
		const trimmed = str.trim();

		if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
			const withoutQuotes = trimmed.substring(1, trimmed.length - 1);
			return withoutQuotes;
			return JSON.parse(withoutQuotes);
		}

		// اگر quotes نداشت، مستقیماً parse کن
		return JSON.parse(trimmed);

	} catch (error) {
		console.error('Error parsing quoted JSON:', error);
		throw error;
	}
}

export async function extractMultipleJsonObjects(str: string) {
	const results: any[] = [];

	// پیدا کردن تمام آبجکت‌های بین { }
	const jsonCandidates = str.match(/\{[\s\S]*?\}(?=\s*\{|$)/g) || [];

	for (const candidate of jsonCandidates) {
		try {
			const jsonObj = JSON.parse(candidate);
			results.push(jsonObj);
		} catch (error) {
			// اگر parse نشد، سعی کن درستش کنی
			try {
				const fixed = await fixJsonString(candidate);
				const jsonObj = JSON.parse(fixed);
				results.push(jsonObj);
			} catch (innerError) {
				console.warn('Failed to parse candidate:', candidate);
			}
		}
	}

	return results;
}

export async function fixJsonString(str: string) {
	// حذف فضای اضافی
	let fixed = str.trim();

	// مطمئن شو که با { شروع و با } پایان می‌یابد
	if (!fixed.startsWith('{')) fixed = '{' + fixed;
	if (!fixed.endsWith('}')) fixed = fixed + '}';

	// درست کردن quotes برای keys
	fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');

	// درست کردن quotes برای string values
	fixed = fixed.replace(/(:\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*[,}])/g, '$1"$2"$3');

	return fixed;
}

export async function getMessage(message: string) {
	let getFile = await extractMultipleJsonObjects(message);

	let dataSinglePhotoMostBe = getFile.find((e: any) => {
		const jsonString = JSON.stringify(e);
		return jsonString.indexOf('CometMediaViewerContextSectionActionWrapper_media$defer$media-viewer-context-section') !== -1;
	});

	let SinglePhoto = await findValueByKey(dataSinglePhotoMostBe, 'message_preferred_body');
	return (SinglePhoto && SinglePhoto.text) ? SinglePhoto.text : '';
}
