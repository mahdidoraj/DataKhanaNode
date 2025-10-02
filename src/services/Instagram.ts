import { InstagramUtils } from './instagramUtils';
import { requestService } from './requestService';


export async function getPublicReels(id: any): Promise<any> {
	let data = {
		'client_previous_actor_id': '',
		'routing_namespace': 'igx_www$a$87a091182d5bd65bcb043a2888004e09',
		'__d': 'www',
		'__user': '0',
		'__a': '1',
		'__req': '10',
		'__hs': '20226.HYP:instagram_web_pkg.2.1...0',
		'__comet_req': '7',
		'lsd': 'AVqFwYCEVHw',
		'jazoest': '2111',
		'route_url': `/p/${ id }`,
	};
	let header: any = {
		'accept': '*/*',
		'accept-language': 'en-US,en;q=0.9',
		'content-type': 'application/x-www-form-urlencoded',
		'origin': 'https://www.instagram.com',
		'priority': 'u=1, i',
		'referer': `https://www.instagram.com/p/${ id }/`,
		'sec-ch-prefers-color-scheme': 'dark',
		'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
		'sec-ch-ua-full-version-list': '"Chromium";v="136.0.7103.114", "Google Chrome";v="136.0.7103.114", "Not.A/Brand";v="99.0.0.0"',
		'sec-ch-ua-mobile': '?0',
		'sec-ch-ua-model': '""',
		'sec-ch-ua-platform': '"macOS"',
		'sec-ch-ua-platform-version': '"13.7.5"',
		'sec-fetch-dest': 'empty',
		'sec-fetch-mode': 'cors',
		'sec-fetch-site': 'same-origin',
		'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
		'x-asbd-id': '359341',
		'x-fb-lsd': 'AVqFwYCEVHw',
		'x-ig-d': 'www',
		'Cookie': 'ig_did=489857C1-3A9B-4F94-BC17-DF2C655B51E0; csrftoken=sLZbAFeEg5c7q28DvaYlum; datr=_LopaDEm63KMtZ5a-V9CNqcf; ig_nrcb=1; mid=aCm6_AAEAAGs3jNcakwshUVKGvrp; ps_l=1; ps_n=1; wd=1269x802; csrftoken=sLZbAFeEg5c7q28DvaYlum; ig_did=AD244874-D20C-46E4-8563-AACFFC4AF530; ig_nrcb=1; mid=aCnIbgALAAEN_NZmm2gyUldISpn0',
	};
	let iutils = new InstagramUtils();
	let fetchedData = await requestService(true, 'post', `https://www.instagram.com/ajax/route-definition/`, data, header);
	let scrapedData: any = await iutils.convertPublicReelToJson(fetchedData);
	if (!(scrapedData && scrapedData.user && scrapedData.user.id))
		return {statusCode: 401, statusText: 'user not in post'};

	return scrapedData;
}

