import { io } from 'socket.io-client';
import { InstaMedia } from './models';
import { getPublicReels } from './services/Instagram';
import { downloadMedia } from './services/UploadFileToS3';

const SERVER_URL = 'https://backpanel.datakhana.com';
const socket = io(SERVER_URL);

// دریافت جاب از سرور
socket.on('new_jobs_insta_reel', async (instamedia) => {
	console.log(`📩 Received job #${ job.id }:`, job);

	// شبیه‌سازی دانلود یا انجام تسک
	let mCount = instamedia.length;
	for (let i = 0; i < Math.ceil(mCount / 2); i++) {
		let tasks = [];

		let startMedia = instamedia[i];
		if (startMedia && startMedia.insta_code) {
			tasks.push(
				(async () => {
					if (!await InstaMedia.findOne({
						where: {
							insta_id: startMedia.id,
						},
					})) {
						console.log('start-media', startMedia.insta_code);
						await getPublicReels(startMedia.insta_code);
					}
				})(),
			);
		}

		let endMedia = instamedia[mCount - 1 - i];
		if (endMedia && endMedia !== startMedia && endMedia.insta_code) {
			tasks.push(
				(async () => {
					if (!await InstaMedia.findOne({
						where: {
							insta_id: endMedia.id,
						},
					})) {
						console.log('end-media', endMedia.insta_code);
						await getPublicReels(endMedia.insta_code);
					}
				})(),
			);
		}
		await Promise.all(tasks);
	}

	// اطلاع به سرور که کار انجام شد
	socket.emit('job_done', {jobId: job.id, status: 'done'});
});
socket.on('ping_server', () => {
	console.log(`📩 Received ping from server`);
	socket.emit('pong');
});
socket.on('download_file', async (data) => {
	try {
		console.log(`📩 Received ping from server`, data.data);
		for (let datum of data.data) {
			try {
				datum.media = await downloadMedia(datum.media);
				socket.emit('download_file', {data: datum, statusCode: 200, type: data.type});
			} catch (e) {
				socket.emit('download_file', {data: datum, statusCode: 400, error: e, type: data.type});
			}
		}
	} catch (e: any) {
		console.error(e.message);
	}
});

async function runJob(job: any) {
	console.log(`🚀 Running job #${ job.id }: ${ job.task }`);

	await new Promise(res => setTimeout(res, 2000)); // شبیه‌سازی زمان انجام کار
	console.log(`✅ Job #${ job.id } done!`);
}
